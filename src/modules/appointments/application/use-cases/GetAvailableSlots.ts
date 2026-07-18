import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { ScheduleAvailabilityService } from '../../domain/services/ScheduleAvailabilityService';
import { IStylistServiceRepository } from '../../../services/domain/repositories/IStylistServiceRepository';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { GetAvailableSlotsDto } from '../dto/request/GetAvailableSlotsDto';
import { DayAvailabilityDto, AvailableSlotDto } from '../dto/response/AvailableSlotDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { DayOfWeekEnum } from '../../domain/entities/Schedule';
import { startOfDayUTC } from '../../../../shared/utils/dateOnly';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para obtener slots de tiempo disponibles para agendar citas
 * Calcula disponibilidad basada en horarios, citas existentes y duración requerida
 */
export class GetAvailableSlots {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private scheduleRepository: IScheduleRepository,
    private scheduleAvailabilityService: ScheduleAvailabilityService,
    private stylistServiceRepository: IStylistServiceRepository,
    private userRepository: IUserRepository,
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

    // 5. Obtener horario efectivo (prioridad: Exception > Holiday > Schedule regular)
    const effectiveSchedule =
      await this.scheduleAvailabilityService.getEffectiveSchedule(targetDate);

    // 6. Si el día está cerrado (feriado sin excepción o sin horario), retornar no laboral
    if (!effectiveSchedule) {
      return this.createNonWorkingDayResponse(request.date, dayOfWeek);
    }

    // 7. Generar slots base usando el horario efectivo
    const baseSlots = this.generateBaseSlotsFromTimes(
      effectiveSchedule.startTime,
      effectiveSchedule.endTime,
      duration,
    );

    // 8. Obtener citas existentes para el día
    const existingAppointments = await this.getExistingAppointments(targetDate, request.stylistId);

    // 9. Resolver nombre real del estilista si se especifica (SCH-20)
    const stylistName = request.stylistId
      ? await this.resolveStylistName(request.stylistId)
      : undefined;

    // 10. Determinar si hay al menos un estilista que ofrezca todos los servicios solicitados (SCH-14)
    const serviceFilterReason = await this.evaluateServiceFilter(
      request.serviceIds,
      request.stylistId,
    );

    // 11. Calcular disponibilidad de cada slot
    const availableSlots = await this.calculateSlotAvailability(
      baseSlots,
      existingAppointments,
      targetDate,
      duration,
      request.stylistId,
      stylistName,
      serviceFilterReason,
    );

    // 12. Construir y retornar respuesta con horario efectivo
    return this.buildDayAvailabilityResponse(
      request.date,
      dayOfWeek,
      { startTime: effectiveSchedule.startTime, endTime: effectiveSchedule.endTime },
      availableSlots,
    );
  }

  /**
   * Resuelve el nombre real del estilista desde el repositorio (SCH-20)
   * Si el usuario no existe (caso borde), retorna un fallback genérico en vez de fallar la consulta
   */
  private async resolveStylistName(stylistId: string): Promise<string> {
    const user = await this.userRepository.findById(stylistId);
    return user?.name ?? 'Unknown stylist';
  }

  /**
   * Evalúa si los `serviceIds` solicitados son ofrecidos por al menos un estilista
   * (o por el `stylistId` específico, si se proporciona). Implementa el filtro por
   * servicio prometido en la documentación (SCH-14).
   * @returns undefined si no aplica ningún filtro (no se pidieron serviceIds, o hay
   * al menos un estilista elegible); un motivo de no-disponibilidad en caso contrario
   */
  private async evaluateServiceFilter(
    serviceIds: string[] | undefined,
    stylistId: string | undefined,
  ): Promise<string | undefined> {
    if (!serviceIds || serviceIds.length === 0) {
      return undefined;
    }

    if (stylistId) {
      // Verificar que el estilista específico ofrezca TODOS los servicios solicitados
      for (const serviceId of serviceIds) {
        const assignment = await this.stylistServiceRepository.findByStylistAndService(
          stylistId,
          serviceId,
        );
        if (!assignment || !assignment.isOffering) {
          return 'Selected stylist does not offer the requested combination of services';
        }
      }
      return undefined;
    }

    // Sin stylistId: verificar que exista AL MENOS un estilista que ofrezca todos los servicios
    let eligibleStylistIds: Set<string> | undefined;
    for (const serviceId of serviceIds) {
      const offerings = await this.stylistServiceRepository.findStylistsOfferingService(serviceId);
      const offeringStylistIds: Set<string> = new Set(
        offerings.filter((o) => o.isOffering).map((o) => o.stylistId),
      );

      if (!eligibleStylistIds) {
        eligibleStylistIds = offeringStylistIds;
      } else {
        const intersection: Set<string> = new Set(
          [...eligibleStylistIds].filter((id) => offeringStylistIds.has(id)),
        );
        eligibleStylistIds = intersection;
      }

      if (eligibleStylistIds.size === 0) {
        return 'No stylist currently offers the requested combination of services';
      }
    }

    return undefined;
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
      try {
        assertValidUuid(request.stylistId, 'Stylist ID');
      } catch {
        throw new ValidationError('Stylist ID must be a valid UUID');
      }
    }

    // Validar serviceIds si se proporcionan
    if (request.serviceIds && request.serviceIds.length > 0) {
      for (const serviceId of request.serviceIds) {
        try {
          assertValidUuid(serviceId, 'Service ID');
        } catch {
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

    // Verificar que no sea en el pasado (comparación en UTC)
    const today = startOfDayUTC(new Date());

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
   * Genera slots base a partir de horarios explícitos (startTime/endTime)
   * @param startTime - Hora de inicio (HH:MM)
   * @param endTime - Hora de fin (HH:MM)
   * @param duration - Duración de cada slot en minutos
   * @returns Array de slots en formato HH:MM
   */
  private generateBaseSlotsFromTimes(
    startTime: string,
    endTime: string,
    duration: number,
  ): string[] {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    const slots: string[] = [];
    for (let time = startMinutes; time + duration <= endMinutes; time += 15) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    return slots;
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
    existingAppointments: Appointment[],
    targetDate: Date,
    duration: number,
    stylistId?: string,
    stylistName?: string,
    serviceFilterReason?: string,
  ): Promise<AvailableSlotDto[]> {
    const availableSlots: AvailableSlotDto[] = [];

    for (const slotTime of baseSlots) {
      const slotDateTime = this.createSlotDateTime(targetDate, slotTime);
      const slotEndTime = new Date(slotDateTime.getTime() + duration * 60000);

      // Verificar conflictos con citas existentes
      const conflict = this.checkForConflicts(slotDateTime, slotEndTime, existingAppointments);

      // El filtro por servicio (SCH-14) tiene prioridad como motivo si aplica
      const isAvailable = !conflict.hasConflict && !serviceFilterReason;
      const reason = serviceFilterReason ?? conflict.reason;

      const slot: AvailableSlotDto = {
        time: slotTime,
        available: isAvailable,
        duration,
        conflictReason: reason,
      };

      // Agregar información del estilista si se especifica (SCH-20: nombre real, no placeholder)
      if (stylistId) {
        slot.stylist = {
          id: stylistId,
          name: stylistName ?? 'Unknown stylist',
          available: isAvailable,
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
    slotDate.setUTCHours(hours, minutes, 0, 0);
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
    appointments: Appointment[],
  ): { hasConflict: boolean; reason?: string } {
    for (const appointment of appointments) {
      const appointmentStart = appointment.dateTime;
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);

      // Verificar solapamiento
      if (slotStart < appointmentEnd && slotEnd > appointmentStart) {
        return {
          hasConflict: true,
          reason: `Conflict with existing appointment at ${appointmentStart.toLocaleTimeString(
            'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
            },
          )}`,
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
    schedule: { startTime: string; endTime: string },
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
