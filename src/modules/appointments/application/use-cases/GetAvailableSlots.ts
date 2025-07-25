import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { GetAvailableSlotsDto } from '../dto/request/GetAvailableSlotsDto';
import { DayAvailabilityDto, AvailableSlotDto } from '../dto/response/AvailableSlotDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { DayOfWeekEnum } from '../../domain/entities/Schedule';

/**
 * Caso de uso para obtener slots de tiempo disponibles para agendar citas
 * Calcula disponibilidad basada en horarios, citas existentes y duración requerida
 */
export class GetAvailableSlots {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private scheduleRepository: ScheduleRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para obtener slots disponibles
   * @param request - DTO con criterios de búsqueda (fecha, estilista, servicios, duración)
   * @returns Promise con la disponibilidad del día incluyendo todos los slots
   * @throws ValidationError si los datos de entrada no son válidos
   * @throws BusinessRuleError si la fecha no es válida para agendar citas
   */
  async execute(request: GetAvailableSlotsDto): Promise<DayAvailabilityDto> {
    // 1. Validar datos de entrada
    this.validateInput(request);

    // 2. Parsear y validar fecha
    const targetDate = this.parseAndValidateDate(request.date);

    // 3. Determinar duración (por defecto 30 minutos)
    const duration = request.duration || 30;

    // 4. Obtener día de la semana
    const dayOfWeek = this.getDayOfWeek(targetDate);

    // 5. Obtener horario laboral para el día
    const schedule = await this.getWorkingSchedule(dayOfWeek);

    // 6. Si no hay horario laboral, retornar día no laboral
    if (!schedule) {
      return this.createNonWorkingDayResponse(request.date, dayOfWeek);
    }

    // 7. Generar slots base según horario laboral
    const baseSlots = this.generateBaseSlots(schedule, duration);

    // 8. Obtener citas existentes para el día
    const existingAppointments = await this.getExistingAppointments(targetDate, request.stylistId);

    // 9. Calcular disponibilidad de cada slot
    const availableSlots = await this.calculateSlotAvailability(
      baseSlots,
      existingAppointments,
      targetDate,
      duration,
      request.stylistId,
    );

    // 10. Construir y retornar respuesta
    return this.buildDayAvailabilityResponse(request.date, dayOfWeek, schedule, availableSlots);
  }

  /**
   * Valida los datos de entrada del DTO
   * @param request - DTO de solicitud
   * @throws ValidationError si algún dato es inválido
   */
  private validateInput(request: GetAvailableSlotsDto): void {
    // Validar fecha requerida
    if (!request.date || request.date.trim().length === 0) {
      throw new ValidationError('Date is required');
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(request.date)) {
      throw new ValidationError('Date must be in YYYY-MM-DD format');
    }

    // Validar stylistId si se proporciona
    if (request.stylistId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(request.stylistId)) {
        throw new ValidationError('Stylist ID must be a valid UUID');
      }
    }

    // Validar serviceIds si se proporcionan
    if (request.serviceIds && request.serviceIds.length > 0) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      for (const serviceId of request.serviceIds) {
        if (!uuidRegex.test(serviceId)) {
          throw new ValidationError('All service IDs must be valid UUIDs');
        }
      }
    }

    // Validar duración si se proporciona
    if (request.duration !== undefined) {
      if (request.duration < 15) {
        throw new ValidationError('Minimum duration is 15 minutes');
      }
      if (request.duration > 480) {
        throw new ValidationError('Maximum duration is 8 hours (480 minutes)');
      }
      if (request.duration % 15 !== 0) {
        throw new ValidationError('Duration must be in 15-minute increments');
      }
    }
  }

  /**
   * Parsea y valida la fecha, asegurando que sea válida para agendar
   * @param dateString - Fecha en formato YYYY-MM-DD
   * @returns Objeto Date parseado
   * @throws BusinessRuleError si la fecha no es válida para agendar
   */
  private parseAndValidateDate(dateString: string): Date {
    const date = new Date(dateString + 'T00:00:00.000Z');

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid date provided');
    }

    // Verificar que no sea en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      throw new BusinessRuleError('Cannot check availability for past dates');
    }

    // Verificar que no sea más de 6 meses en el futuro
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    if (date > sixMonthsFromNow) {
      throw new BusinessRuleError('Cannot check availability more than 6 months in advance');
    }

    return date;
  }

  /**
   * Convierte un objeto Date al enum DayOfWeekEnum
   * @param date - Fecha a convertir
   * @returns Día de la semana como enum
   */
  private getDayOfWeek(date: Date): DayOfWeekEnum {
    const dayNames = [
      DayOfWeekEnum.SUNDAY,
      DayOfWeekEnum.MONDAY,
      DayOfWeekEnum.TUESDAY,
      DayOfWeekEnum.WEDNESDAY,
      DayOfWeekEnum.THURSDAY,
      DayOfWeekEnum.FRIDAY,
      DayOfWeekEnum.SATURDAY,
    ];

    return dayNames[date.getDay()];
  }

  /**
   * Obtiene el horario laboral para un día específico
   * @param dayOfWeek - Día de la semana
   * @returns Schedule si hay horario laboral, null si es día no laboral
   */
  private async getWorkingSchedule(dayOfWeek: DayOfWeekEnum) {
    // Buscar horario para el día específico
    const schedules = await this.scheduleRepository.findByDayOfWeek(dayOfWeek);

    // Por simplicidad, tomamos el primer horario disponible
    // En la implementación más compleja tenemos múltiples horarios por día
    return schedules.length > 0 ? schedules[0] : null;
  }

  /**
   * Crea respuesta para días no laborales
   * @param date - Fecha solicitada
   * @param dayOfWeek - Día de la semana
   * @returns DayAvailabilityDto para día no laboral
   */
  private createNonWorkingDayResponse(date: string, dayOfWeek: DayOfWeekEnum): DayAvailabilityDto {
    return {
      date,
      dayOfWeek: dayOfWeek.toString(),
      isWorkingDay: false,
      totalSlots: 0,
      availableSlots: 0,
      slots: [],
    };
  }

  /**
   * Genera slots base según el horario laboral y duración
   * @param schedule - Horario laboral del día
   * @param duration - Duración requerida en minutos
   * @returns Array de slots base con horarios
   */
  private generateBaseSlots(schedule: any, duration: number): string[] {
    return schedule.getAvailableSlots(duration);
  }

  /**
   * Obtiene citas existentes para la fecha especificada
   * @param date - Fecha objetivo
   * @param stylistId - ID del estilista (opcional)
   * @returns Array de citas existentes
   */
  private async getExistingAppointments(date: Date, stylistId?: string) {
    // Obtener todas las citas del día
    const appointments = await this.appointmentRepository.findByDate(date);

    // Filtrar por estilista si se especifica
    if (stylistId) {
      return appointments.filter((apt) => apt.stylistId === stylistId);
    }

    return appointments;
  }

  /**
   * Calcula la disponibilidad de cada slot considerando citas existentes
   * @param baseSlots - Slots base generados del horario
   * @param existingAppointments - Citas ya agendadas
   * @param targetDate - Fecha objetivo
   * @param duration - Duración requerida
   * @param stylistId - ID del estilista (opcional)
   * @returns Array de AvailableSlotDto con disponibilidad calculada
   */
  private async calculateSlotAvailability(
    baseSlots: string[],
    existingAppointments: any[],
    targetDate: Date,
    duration: number,
    stylistId?: string,
  ): Promise<AvailableSlotDto[]> {
    const availableSlots: AvailableSlotDto[] = [];

    for (const slotTime of baseSlots) {
      const slotDateTime = this.createSlotDateTime(targetDate, slotTime);
      const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000);

      // Verificar conflictos con citas existentes
      const conflict = this.checkForConflicts(slotDateTime, slotEndTime, existingAppointments);

      const slot: AvailableSlotDto = {
        time: slotTime,
        available: !conflict.hasConflict,
        duration,
        conflictReason: conflict.reason,
      };

      // Agregar información del estilista si se especifica
      if (stylistId) {
        slot.stylist = {
          id: stylistId,
          name: 'Estilista', // En implementación real, obtener del repositorio
          available: !conflict.hasConflict,
        };
      }

      availableSlots.push(slot);
    }

    return availableSlots;
  }

  /**
   * Crea un objeto DateTime combinando fecha y hora
   * @param date - Fecha base
   * @param time - Hora en formato HH:MM
   * @returns Objeto Date con fecha y hora combinadas
   */
  private createSlotDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    return slotDate;
  }

  /**
   * Verifica si hay conflictos de horario con citas existentes
   * @param slotStart - Inicio del slot a verificar
   * @param slotEnd - Fin del slot a verificar
   * @param appointments - Citas existentes
   * @returns Objeto con información de conflicto
   */
  private checkForConflicts(
    slotStart: Date,
    slotEnd: Date,
    appointments: any[],
  ): { hasConflict: boolean; reason?: string } {
    for (const appointment of appointments) {
      const appointmentStart = appointment.dateTime;
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);

      // Verificar solapamiento
      if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
        return {
          hasConflict: true,
          reason: `Conflicto con cita existente (${appointmentStart.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })})`,
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Construye la respuesta final con toda la información del día
   * @param date - Fecha solicitada
   * @param dayOfWeek - Día de la semana
   * @param schedule - Horario laboral
   * @param slots - Slots con disponibilidad calculada
   * @returns DayAvailabilityDto completo
   */
  private buildDayAvailabilityResponse(
    date: string,
    dayOfWeek: DayOfWeekEnum,
    schedule: any,
    slots: AvailableSlotDto[],
  ): DayAvailabilityDto {
    const availableCount = slots.filter((slot) => slot.available).length;

    return {
      date,
      dayOfWeek: dayOfWeek.toString(),
      isWorkingDay: true,
      totalSlots: slots.length,
      availableSlots: availableCount,
      slots,
      workingHours: {
        start: schedule.startTime,
        end: schedule.endTime,
      },
    };
  }
}
