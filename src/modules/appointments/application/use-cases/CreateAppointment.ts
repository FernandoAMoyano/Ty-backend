import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../domain/repositories/IAppointmentStatusRepository';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { IServiceRepository } from '../../../services/domain/repositories/IServiceRepository';
import { IStylistServiceRepository } from '../../../services/domain/repositories/IStylistServiceRepository';
import { UserRoleValidationService } from '../../../auth/domain/services/UserRoleValidationService';
import { RoleName } from '@prisma/client';
import { CreateAppointmentDto } from '../dto/request/CreateAppointmentDto';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { ScheduleAvailabilityService } from '../../domain/services/ScheduleAvailabilityService';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';

/**
 * Caso de uso para crear una nueva cita en el sistema
 * Maneja todas las validaciones de negocio y coordinación entre servicios
 */
export class CreateAppointment {
  /** Máximo de citas activas por cliente por día */
  private static readonly MAX_DAILY_APPOINTMENTS = 3;

  constructor(
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
    private scheduleRepository: IScheduleRepository,
    private serviceRepository: IServiceRepository,
    private stylistServiceRepository: IStylistServiceRepository,
    private scheduleAvailabilityService: ScheduleAvailabilityService,
    private userRoleValidationService: UserRoleValidationService,
  ) {}

  /**
   * Valida que la cita completa (inicio + duración) esté dentro del horario laboral del día
   * @param dateTimeStr - Fecha y hora de la cita en formato ISO string
   * @param duration - Duración total de la cita en minutos
   * @param schedule - Horario laboral del día
   * @throws BusinessRuleError si la cita está fuera del horario laboral
   */
  private validateWorkingHours(dateTimeStr: string, duration: number, schedule: any): void {
    // Se usa el eje UTC para las horas, alineado con GetAvailableSlots.createSlotDateTime
    // (Schedule.startTime/endTime se interpretan como horas UTC del día consultado).
    const appointmentDate = new Date(dateTimeStr);
    const appointmentHours = appointmentDate.getUTCHours();
    const appointmentMinutes = appointmentDate.getUTCMinutes();

    // Convertir horarios a minutos desde medianoche para comparación
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const appointmentStartInMinutes = appointmentHours * 60 + appointmentMinutes;
    const appointmentEndInMinutes = appointmentStartInMinutes + duration;
    const scheduleStartInMinutes = startH * 60 + startM;
    const scheduleEndInMinutes = endH * 60 + endM;

    if (appointmentStartInMinutes < scheduleStartInMinutes) {
      throw new BusinessRuleError(
        `Appointment starts before working hours (${schedule.startTime})`,
      );
    }

    if (appointmentEndInMinutes > scheduleEndInMinutes) {
      throw new BusinessRuleError(
        `Appointment ends after working hours (${schedule.endTime})`,
      );
    }
  }

  /**
   * Ejecuta el caso de uso para crear una nueva cita
   * @param createDto - Datos de la cita a crear
   * @param userId - ID del usuario que está creando la cita
   * @returns Promise con el DTO de la cita creada
   * @throws ValidationError si los datos son inválidos
   * @throws NotFoundError si alguna entidad relacionada no existe
   * @throws ConflictError si hay conflictos de horario
   */
  async execute(createDto: CreateAppointmentDto, userId: string): Promise<AppointmentDto> {
    // 1. Validar datos básicos
    await this.validateBasicData(createDto, userId);

    // 2. Validar que todas las entidades relacionadas existen
    await this.validateRelatedEntities(createDto);

    // 3. Calcular duración total si no se proporciona
    const totalDuration = await this.calculateTotalDuration(createDto);

    // 4. Obtener horario efectivo del día (prioridad: Exception > Holiday > Regular)
    const effectiveSchedule = await this.scheduleAvailabilityService.getEffectiveSchedule(
      new Date(createDto.dateTime),
    );

    // 5. Validar que el día no esté cerrado (feriado sin excepción o sin horario)
    if (!effectiveSchedule) {
      throw new BusinessRuleError(
        'The salon is closed on the selected date (holiday or no schedule available)',
      );
    }

    // 6. Validar que la cita esté dentro del horario efectivo del día
    this.validateWorkingHours(createDto.dateTime, totalDuration, effectiveSchedule);

    // 7. Obtener schedule regular para el scheduleId de la cita
    const schedule = await this.getAppropriateSchedule(createDto.dateTime);

    // 8. Validar disponibilidad y conflictos
    await this.validateAvailability(createDto, totalDuration);

    // 9. Validar límite diario de citas por cliente
    await this.validateDailyAppointmentLimit(createDto.clientId, createDto.dateTime);

    // 10. Obtener estado inicial (pendiente)
    const pendingStatus = await this.getPendingStatus();

    // 11. Crear la entidad de cita
    const appointment = Appointment.create(
      new Date(createDto.dateTime),
      totalDuration,
      userId,
      createDto.clientId,
      schedule.id,
      pendingStatus.id,
      createDto.stylistId,
      createDto.serviceIds,
    );

    // 12. Guardar en repositorio
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // 13. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(savedAppointment);
  }

  /**
   * Valida los datos básicos de entrada
   * @param createDto - Datos de la cita
   * @param userId - ID del usuario creador
   * @throws ValidationError si los datos son inválidos
   */
  private async validateBasicData(createDto: CreateAppointmentDto, userId: string): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (!createDto.clientId || createDto.clientId.trim().length === 0) {
      throw new ValidationError('Client ID is required');
    }

    if (!createDto.dateTime || createDto.dateTime.trim().length === 0) {
      throw new ValidationError('Appointment date and time is required');
    }

    if (!createDto.serviceIds || createDto.serviceIds.length === 0) {
      throw new ValidationError('At least one service must be selected');
    }

    // Validar formato de fecha
    const appointmentDate = new Date(createDto.dateTime);
    if (isNaN(appointmentDate.getTime())) {
      throw new ValidationError('Invalid date format');
    }

    // Validar que la fecha no sea en el pasado
    if (appointmentDate < new Date()) {
      throw new ValidationError('Appointment cannot be scheduled in the past');
    }

    // Validar que la fecha no sea más de 6 meses en el futuro
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (appointmentDate > sixMonthsFromNow) {
      throw new ValidationError('Appointment cannot be scheduled more than 6 months in advance');
    }
  }

  /**
   * Valida que todas las entidades relacionadas existen
   * @param createDto - Datos de la cita
   * @throws NotFoundError si alguna entidad no existe
   * @throws BusinessRuleError si un servicio está inactivo o el estilista no lo ofrece
   */
  private async validateRelatedEntities(createDto: CreateAppointmentDto): Promise<void> {
    // Validar que el cliente existe y tiene rol CLIENT
    // Cierra el gap historico: a diferencia de stylistId, clientId nunca se validaba
    // en la capa de aplicacion (solo la FK de Prisma a nivel de base de datos)
    await this.userRoleValidationService.ensureUserHasRole(createDto.clientId, RoleName.CLIENT);

    // Validar que el estilista existe (si se proporciona)
    // stylistId en el DTO es User.id; StylistService.stylistId también almacena User.id
    if (createDto.stylistId) {
      await this.userRoleValidationService.ensureUserHasRole(createDto.stylistId, RoleName.STYLIST);
    }

    // Validar que todos los servicios existen y están activos
    for (const serviceId of createDto.serviceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Service', serviceId);
      }
      if (!service.isActive) {
        throw new BusinessRuleError(`Service '${service.name}' is not currently active`);
      }
    }

    // Validar que el estilista ofrezca los servicios seleccionados (si se especifica estilista)
    // StylistService.stylistId = User.id, por lo que usamos createDto.stylistId directamente
    if (createDto.stylistId) {
      for (const serviceId of createDto.serviceIds) {
        const assignment = await this.stylistServiceRepository.findByStylistAndService(
          createDto.stylistId,
          serviceId,
        );
        if (!assignment) {
          throw new BusinessRuleError('Stylist does not offer one of the selected services');
        }
        if (!assignment.isOffering) {
          throw new BusinessRuleError('Stylist is not currently offering one of the selected services');
        }
      }
    }

    return;
  }

  /**
   * Calcula la duración total de la cita basada en los servicios seleccionados
   * @param createDto - Datos de la cita
   * @returns Promise con la duración total en minutos
   */
  private async calculateTotalDuration(createDto: CreateAppointmentDto): Promise<number> {
    // Si se proporciona duración explícita, usarla
    if (createDto.duration && createDto.duration > 0) {
      return createDto.duration;
    }

    // Calcular duración basada en servicios
    let totalDuration = 0;
    for (const serviceId of createDto.serviceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (service) {
        totalDuration += service.duration;
      }
    }

    // Asegurar duración mínima de 15 minutos
    return Math.max(totalDuration, 15);
  }

  /**
   * Valida la disponibilidad de horario y detecta conflictos
   * @param createDto - Datos de la cita
   * @param duration - Duración total de la cita
   * @throws ConflictError si hay conflictos de horario
   */
  private async validateAvailability(createDto: CreateAppointmentDto, duration: number): Promise<void> {
    const appointmentDate = new Date(createDto.dateTime);

    // Verificar conflictos con otras citas
    const conflictingAppointments = await this.appointmentRepository.findConflictingAppointments(
      appointmentDate,
      duration,
      createDto.stylistId,
    );

    if (conflictingAppointments.length > 0) {
      throw new ConflictError('There are conflicting appointments at this time');
    }
  }

  /**
   * Valida que el cliente no exceda el límite diario de citas activas
   * Solo cuenta citas no canceladas (PENDING, CONFIRMED, COMPLETED)
   * @param clientId - ID del usuario cliente (User.id)
   * @param dateTimeStr - Fecha y hora de la cita en formato ISO string
   * @throws BusinessRuleError si el cliente alcanzó el límite diario
   */
  private async validateDailyAppointmentLimit(clientId: string, dateTimeStr: string): Promise<void> {
    const appointmentDate = new Date(dateTimeStr);

    // Obtener inicio y fin del día
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar citas del cliente en ese día
    const existingAppointments = await this.appointmentRepository.findByClientAndDateRange(
      clientId,
      startOfDay,
      endOfDay,
    );

    // Obtener estado CANCELLED para excluirlo del conteo
    const cancelledStatus = await this.appointmentStatusRepository.findByName('CANCELLED');

    // Contar solo citas activas (no canceladas)
    const activeAppointments = cancelledStatus
      ? existingAppointments.filter(a => a.statusId !== cancelledStatus.id)
      : existingAppointments;

    if (activeAppointments.length >= CreateAppointment.MAX_DAILY_APPOINTMENTS) {
      throw new BusinessRuleError(
        `Maximum of ${CreateAppointment.MAX_DAILY_APPOINTMENTS} appointments per day has been reached`,
      );
    }
  }

  /**
   * Obtiene el estado "PENDING" por defecto para nuevas citas
   * @returns Promise con el estado pendiente
   * @throws NotFoundError si no se encuentra el estado
   */
  private async getPendingStatus() {
    const pendingStatus = await this.appointmentStatusRepository.findByName('PENDING');

    if (!pendingStatus) {
      throw new NotFoundError('AppointmentStatus', 'PENDING');
    }

    return pendingStatus;
  }

  /**
   * Obtiene el horario apropiado para la fecha de la cita
   * @param dateTimeStr - Fecha y hora de la cita en formato string
   * @returns Promise con el horario apropiado
   * @throws NotFoundError si no se encuentra horario apropiado
   */
  private async getAppropriateSchedule(dateTimeStr: string) {
    const appointmentDate = new Date(dateTimeStr);
    const dayOfWeek = this.getDayOfWeek(appointmentDate);

    // Buscar horario para el día de la semana
    const schedules = await this.scheduleRepository.findAll();
    const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

    if (!schedule) {
      throw new NotFoundError('Schedule', dayOfWeek);
    }

    return schedule;
  }

  /**
   * Convierte una fecha a nombre del día de la semana en formato enum
   * @param date - Fecha a convertir
   * @returns Nombre del día de la semana
   */
  private getDayOfWeek(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  /**
   * Mapea una entidad Appointment a su DTO de respuesta
   * @param appointment - Entidad de cita
   * @returns DTO de cita
   */
  private mapToAppointmentDto(appointment: Appointment): AppointmentDto {
    return {
      id: appointment.id,
      dateTime: appointment.dateTime.toISOString(),
      duration: appointment.duration,
      confirmedAt: appointment.confirmedAt?.toISOString(),
      cancellationReason: appointment.cancellationReason,
      cancelledBy: appointment.cancelledBy,
      confirmationNotes: appointment.confirmationNotes,
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
