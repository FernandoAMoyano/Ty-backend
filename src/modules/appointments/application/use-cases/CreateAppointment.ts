import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { ServiceRepository } from '../../../services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../services/domain/repositories/StylistRepository';
import { UserRepository } from '../../../auth/domain/repositories/User';
import { CreateAppointmentDto } from '../dto/request/CreateAppointmentDto';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';

/**
 * Caso de uso para crear una nueva cita en el sistema
 * Maneja todas las validaciones de negocio y coordinación entre servicios
 */
export class CreateAppointment {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private appointmentStatusRepository: AppointmentStatusRepository,
    private scheduleRepository: ScheduleRepository,
    private serviceRepository: ServiceRepository,
    private stylistRepository: StylistRepository,
    private userRepository: UserRepository,
  ) {}

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

    // 4. Validar disponibilidad y conflictos
    await this.validateAvailability(createDto, totalDuration);

    // 5. Obtener estado inicial (pendiente)
    const pendingStatus = await this.getPendingStatus();

    // 6. Obtener horario apropiado
    const schedule = await this.getAppropriateSchedule(createDto.dateTime);

    // 7. Crear la entidad de cita
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

    // 8. Guardar en repositorio
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // 9. Mapear a DTO de respuesta
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
   */
  private async validateRelatedEntities(createDto: CreateAppointmentDto): Promise<void> {
    // Validar que el cliente existe
    const client = await this.userRepository.findById(createDto.clientId);
    if (!client) {
      throw new NotFoundError('Client', createDto.clientId);
    }

    // Validar que el estilista existe (si se proporciona)
    if (createDto.stylistId) {
      const stylist = await this.stylistRepository.findById(createDto.stylistId);
      if (!stylist) {
        throw new NotFoundError('Stylist', createDto.stylistId);
      }
    }

    // Validar que todos los servicios existen
    for (const serviceId of createDto.serviceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Service', serviceId);
      }
    }
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

    // TODO: Validar horarios de trabajo del estilista
    // TODO: Validar días festivos
    // TODO: Validar horarios de la tienda
  }

  /**
   * Obtiene el estado \"pendiente\" por defecto para nuevas citas
   * @returns Promise con el estado pendiente
   * @throws NotFoundError si no se encuentra el estado
   */
  private async getPendingStatus() {
    // Buscar estado por nombre \"Pendiente\"
    const statuses = await this.appointmentStatusRepository.findAll();
    const pendingStatus = statuses.find(status => status.name === 'Pendiente');
    
    if (!pendingStatus) {
      throw new NotFoundError('AppointmentStatus', 'Pendiente');
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
