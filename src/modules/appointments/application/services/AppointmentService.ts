import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { DayOfWeekEnum } from '../../domain/entities/Schedule';

// Importación repositorios externos (de otros módulos)
import { ServiceRepository } from '../../../services/domain/repositories/ServiceRepository';
import { UserRepository } from '../../../auth/domain/repositories/User';

// DTOs
import { CreateAppointmentDto } from '../dto/request/CreateAppointmentDto';
import { UpdateAppointmentDto } from '../dto/request/UpdateAppointmentDto';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { AppointmentStatisticsSummaryDto } from '../dto/response/AppointmentStatisticsDto';

// Excepciones
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { DayOfWeekUtils } from '../../../../shared/utils/dayOfWeek';

export class AppointmentService {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private appointmentStatusRepository: AppointmentStatusRepository,
    private scheduleRepository: ScheduleRepository,
    private serviceRepository: ServiceRepository,
    private userRepository: UserRepository,
  ) {}

  async createAppointment(dto: CreateAppointmentDto, userId: string): Promise<AppointmentDto> {
    // Validaciones de entrada
    this.validateCreateAppointmentDto(dto);

    // Parsear fecha
    const dateTime = new Date(dto.dateTime);
    if (isNaN(dateTime.getTime())) {
      throw new ValidationError('Invalid dateTime format');
    }

    // Verificar que el cliente existe
    const client = await this.userRepository.findById(dto.clientId);
    if (!client) {
      throw new NotFoundError('Client', dto.clientId);
    }

    // Verificar que el estilista existe (si se proporciona)
    if (dto.stylistId) {
      const stylist = await this.userRepository.findById(dto.stylistId);
      if (!stylist) {
        throw new NotFoundError('Stylist', dto.stylistId);
      }
    }

    // Verificar que los servicios existen y calcular duración
    const totalDuration = await this.calculateTotalDuration(dto.serviceIds);
    const finalDuration = dto.duration || totalDuration;

    // Obtener horario correspondiente al día
    const dayOfWeek = this.getDayOfWeekFromDate(dateTime);
    const schedule = await this.findScheduleForDay(dayOfWeek);
    if (!schedule) {
      throw new ValidationError(`No working schedule found for ${dayOfWeek}`);
    }

    // Verificar que la hora está dentro del horario laboral
    const timeString = this.formatTimeFromDate(dateTime);
    if (!schedule.isWithinWorkingHours(timeString)) {
      throw new ValidationError(
        `Appointment time is outside working hours (${schedule.startTime} - ${schedule.endTime})`,
      );
    }

    // Detectar conflictos
    await this.checkForConflicts(dateTime, finalDuration, dto.stylistId);

    // Obtener estado inicial (PENDING)
    const pendingStatus = await this.appointmentStatusRepository.findByName('PENDING');
    if (!pendingStatus) {
      throw new ValidationError('PENDING status not found in system');
    }

    // Crear la cita
    const appointment = Appointment.create(
      dateTime,
      finalDuration,
      userId,
      dto.clientId,
      schedule.id,
      pendingStatus.id,
      dto.stylistId,
      dto.serviceIds,
    );

    // Guardar
    const savedAppointment = await this.appointmentRepository.save(appointment);

    return this.mapAppointmentToDto(savedAppointment);
  }

  async updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<AppointmentDto> {
    // Validaciones de entrada
    this.validateUpdateAppointmentDto(dto);

    // Verificar que la cita existe
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment', id);
    }

    // Verificar que se puede modificar
    if (!appointment.canBeModified()) {
      throw new ValidationError(
        'Appointment cannot be modified less than 24 hours before the scheduled time',
      );
    }

    // Si se cambia la fecha/hora, validar
    if (dto.dateTime) {
      const newDateTime = new Date(dto.dateTime);
      if (isNaN(newDateTime.getTime())) {
        throw new ValidationError('Invalid dateTime format');
      }

      // Verificar horario laboral para nueva fecha
      const dayOfWeek = this.getDayOfWeekFromDate(newDateTime);
      const schedule = await this.findScheduleForDay(dayOfWeek);
      if (!schedule) {
        throw new ValidationError(`No working schedule found for ${dayOfWeek}`);
      }

      const timeString = this.formatTimeFromDate(newDateTime);
      if (!schedule.isWithinWorkingHours(timeString)) {
        throw new ValidationError('New appointment time is outside working hours');
      }

      // Verificar conflictos para nueva fecha/hora
      const duration = dto.duration || appointment.duration;
      await this.checkForConflicts(
        newDateTime,
        duration,
        dto.stylistId || appointment.stylistId,
        id,
      );

      appointment.reschedule(newDateTime, dto.duration);
    }

    // Actualizar otros campos
    if (dto.stylistId && dto.stylistId !== appointment.stylistId) {
      const stylist = await this.userRepository.findById(dto.stylistId);
      if (!stylist) {
        throw new NotFoundError('Stylist', dto.stylistId);
      }
      appointment.updateStylist(dto.stylistId);
    }

    if (dto.serviceIds) {
      // Verificar que los servicios existen
      await this.validateServiceIds(dto.serviceIds);

      // Limpiar servicios actuales y agregar nuevos
      appointment.serviceIds.length = 0;
      dto.serviceIds.forEach((serviceId) => appointment.addService(serviceId));

      // Recalcular duración si no se especifica
      if (!dto.duration) {
        const newDuration = await this.calculateTotalDuration(dto.serviceIds);
        appointment.updateDuration(newDuration);
      }
    }

    if (dto.duration) {
      appointment.updateDuration(dto.duration);
    }

    // Guardar cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    return this.mapAppointmentToDto(updatedAppointment);
  }

  async confirmAppointment(id: string): Promise<AppointmentDto> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment', id);
    }

    if (appointment.isConfirmed()) {
      throw new ValidationError('Appointment is already confirmed');
    }

    // Cambiar estado a CONFIRMED
    const confirmedStatus = await this.appointmentStatusRepository.findByName('CONFIRMED');
    if (!confirmedStatus) {
      throw new ValidationError('CONFIRMED status not found in system');
    }

    // Marcar como confirmada (actualiza confirmedAt y statusId)
    appointment.markAsConfirmed(confirmedStatus.id);

    const updatedAppointment = await this.appointmentRepository.update(appointment);

    return this.mapAppointmentToDto(updatedAppointment);
  }

  async cancelAppointment(id: string, _reason?: string): Promise<AppointmentDto> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment', id);
    }

    // Verificar que se puede cancelar
    if (appointment.isInPast()) {
      throw new ValidationError('Cannot cancel past appointments');
    }

    // Cambiar estado a CANCELLED
    const cancelledStatus = await this.appointmentStatusRepository.findByName('CANCELLED');
    if (!cancelledStatus) {
      throw new ValidationError('CANCELLED status not found in system');
    }

    // Marcar como cancelada (actualiza statusId)
    appointment.markAsCancelled(cancelledStatus.id);

    const updatedAppointment = await this.appointmentRepository.update(appointment);

    return this.mapAppointmentToDto(updatedAppointment);
  }

  async getAppointmentById(id: string): Promise<AppointmentDto> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundError('Appointment', id);
    }

    return this.mapAppointmentToDto(appointment);
  }

  async getAppointmentsByClient(clientId: string): Promise<AppointmentDto[]> {
    const appointments = await this.appointmentRepository.findByClientId(clientId);
    return appointments.map((appointment) => this.mapAppointmentToDto(appointment));
  }

  async getAppointmentsByStylist(stylistId: string): Promise<AppointmentDto[]> {
    if (!stylistId) {
      throw new ValidationError('Stylist ID is required');
    }

    const appointments = await this.appointmentRepository.findByStylistId(stylistId);
    return appointments.map((appointment) => this.mapAppointmentToDto(appointment));
  }

  async getAppointmentsForDateRange(startDate: Date, endDate: Date): Promise<AppointmentDto[]> {
    if (startDate >= endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    const appointments = await this.appointmentRepository.findByDateRange(startDate, endDate);
    return appointments.map((appointment) => this.mapAppointmentToDto(appointment));
  }

  async deleteAppointment(id: string): Promise<void> {
    const exists = await this.appointmentRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Appointment', id);
    }

    await this.appointmentRepository.delete(id);
  }

  // Métodos de estadística y análisis

  async getAppointmentStatistics(): Promise<Record<string, number>> {
    // Obtener todos los estados disponibles
    const allStatuses = await this.appointmentStatusRepository.findAll();
    const statistics: Record<string, number> = {};

    // Para cada estado, contar las citas que tienen ese estado
    for (const status of allStatuses) {
      const count = await this.appointmentRepository.countByStatus(status.id);
      statistics[status.name] = count;
    }

    return statistics;
  }

  async getAppointmentStatisticsSummary(): Promise<AppointmentStatisticsSummaryDto> {
    const statistics = await this.getAppointmentStatistics();

    const pending = statistics['PENDING'] || 0;
    const confirmed = statistics['CONFIRMED'] || 0;
    const inProgress = statistics['IN_PROGRESS'] || 0;
    const completed = statistics['COMPLETED'] || 0;
    const cancelled = statistics['CANCELLED'] || 0;
    const noShow = statistics['NO_SHOW'] || 0;

    const total = pending + confirmed + inProgress + completed + cancelled + noShow;
    const completedAndFinished = completed + cancelled + noShow;
    const showedUp = completed + inProgress;
    const scheduled = confirmed + completed + inProgress + noShow;

    const completionRate = completedAndFinished > 0 ? (completed / completedAndFinished) * 100 : 0;
    const showRate = scheduled > 0 ? (showedUp / scheduled) * 100 : 0;

    return {
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      noShow,
      total,
      completionRate: Math.round(completionRate * 100) / 100, // 2 decimales
      showRate: Math.round(showRate * 100) / 100, // 2 decimales
    };
  }

  async getAppointmentStatisticsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    // Validar fechas
    if (startDate >= endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    // Obtener todas las citas en el rango de fechas
    const appointments = await this.appointmentRepository.findByDateRange(startDate, endDate);

    // Obtener todos los estados
    const allStatuses = await this.appointmentStatusRepository.findAll();
    const statistics: Record<string, number> = {};

    // Inicializar contadores
    allStatuses.forEach((status) => {
      statistics[status.name] = 0;
    });

    // Contar citas por estado
    for (const appointment of appointments) {
      const status = await this.appointmentStatusRepository.findById(appointment.statusId);
      if (status) {
        statistics[status.name]++;
      }
    }

    return statistics;
  }

  async getAppointmentStatisticsByStylist(stylistId: string): Promise<Record<string, number>> {
    if (!stylistId) {
      throw new ValidationError('Stylist ID is required');
    }

    // Verificar que el estilista existe
    const stylist = await this.userRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    // Obtener todas las citas del estilista
    const appointments = await this.appointmentRepository.findByStylistId(stylistId);

    // Obtener todos los estados
    const allStatuses = await this.appointmentStatusRepository.findAll();
    const statistics: Record<string, number> = {};

    // Inicializar contadores
    allStatuses.forEach((status) => {
      statistics[status.name] = 0;
    });

    // Contar citas por estado
    for (const appointment of appointments) {
      const status = await this.appointmentStatusRepository.findById(appointment.statusId);
      if (status) {
        statistics[status.name]++;
      }
    }

    return statistics;
  }

  async getAppointmentStatisticsByClient(clientId: string): Promise<Record<string, number>> {
    if (!clientId) {
      throw new ValidationError('Client ID is required');
    }

    // Verificar que el cliente existe
    const client = await this.userRepository.findById(clientId);
    if (!client) {
      throw new NotFoundError('Client', clientId);
    }

    // Obtener todas las citas del cliente
    const appointments = await this.appointmentRepository.findByClientId(clientId);

    // Obtener todos los estados
    const allStatuses = await this.appointmentStatusRepository.findAll();
    const statistics: Record<string, number> = {};

    // Inicializar contadores
    allStatuses.forEach((status) => {
      statistics[status.name] = 0;
    });

    // Contar citas por estado
    for (const appointment of appointments) {
      const status = await this.appointmentStatusRepository.findById(appointment.statusId);
      if (status) {
        statistics[status.name]++;
      }
    }

    return statistics;
  }

  // Métodos de validación privados

  private validateCreateAppointmentDto(dto: CreateAppointmentDto): void {
    if (!dto.dateTime) {
      throw new ValidationError('dateTime is required');
    }

    if (!dto.clientId) {
      throw new ValidationError('clientId is required');
    }

    if (!dto.serviceIds || dto.serviceIds.length === 0) {
      throw new ValidationError('At least one service is required');
    }

    if (dto.duration && dto.duration < 15) {
      throw new ValidationError('Minimum duration is 15 minutes');
    }
  }

  private validateUpdateAppointmentDto(dto: UpdateAppointmentDto): void {
    if (dto.duration && dto.duration < 15) {
      throw new ValidationError('Minimum duration is 15 minutes');
    }

    if (dto.serviceIds && dto.serviceIds.length === 0) {
      throw new ValidationError('At least one service is required if serviceIds is provided');
    }
  }

  private async validateServiceIds(serviceIds: string[]): Promise<void> {
    for (const serviceId of serviceIds) {
      const exists = await this.serviceRepository.existsById(serviceId);
      if (!exists) {
        throw new NotFoundError('Service', serviceId);
      }
    }
  }

  private async calculateTotalDuration(serviceIds: string[]): Promise<number> {
    let totalDuration = 0;

    for (const serviceId of serviceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Service', serviceId);
      }
      totalDuration += service.duration;
    }

    return totalDuration;
  }

  private async checkForConflicts(
    dateTime: Date,
    duration: number,
    stylistId?: string,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const conflicts = await this.appointmentRepository.findConflictingAppointments(
      dateTime,
      duration,
      stylistId,
      excludeAppointmentId,
    );

    if (conflicts.length > 0) {
      throw new ConflictError(
        `Appointment conflicts with existing appointment at ${dateTime.toISOString()}`,
      );
    }
  }

  private getDayOfWeekFromDate(date: Date): DayOfWeekEnum {
    return DayOfWeekUtils.fromDate(date);
  }

  private formatTimeFromDate(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  private async findScheduleForDay(dayOfWeek: DayOfWeekEnum): Promise<any> {
    const schedules = await this.scheduleRepository.findByDayOfWeek(dayOfWeek);
    return schedules.find((s) => !s.holidayId) || null; // Retorna horario regular (no feriado)
  }

  private mapAppointmentToDto(appointment: Appointment): AppointmentDto {
    return {
      id: appointment.id,
      dateTime: appointment.dateTime.toISOString(),
      duration: appointment.duration,
      confirmedAt: appointment.confirmedAt?.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      userId: appointment.userId,
      clientId: appointment.clientId,
      stylistId: appointment.stylistId,
      scheduleId: appointment.scheduleId,
      statusId: appointment.statusId,
      serviceIds: appointment.serviceIds,
    };
  }
}
