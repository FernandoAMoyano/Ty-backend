import { IScheduleRepository } from '../repositories/IScheduleRepository';
import { IHolidayRepository } from '../../../holidays/domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from '../../../holidays/domain/repositories/IScheduleExceptionRepository';
import { DayOfWeekEnum } from '../entities/Schedule';

/**
 * Resultado del cálculo de disponibilidad horaria para un día específico
 * `null` indica que el día está cerrado (no hay disponibilidad)
 */
export interface EffectiveSchedule {
  /** Hora de inicio del horario efectivo (formato HH:MM) */
  startTime: string;
  /** Hora de fin del horario efectivo (formato HH:MM) */
  endTime: string;
  /** Fuente que determinó el horario: 'exception', 'holiday' o 'regular' */
  source: 'exception' | 'regular';
}

/**
 * Servicio de dominio para determinar el horario efectivo de un día
 *
 * Implementa la lógica de prioridad:
 * 1. ScheduleException > 2. Holiday (cerrado) > 3. Schedule regular
 *
 * - Si hay una ScheduleException para la fecha, usa su horario especial
 * - Si es Holiday sin excepción, el día está cerrado (retorna null)
 * - Si no hay ni excepción ni feriado, usa el horario regular del día de la semana
 */
export class ScheduleAvailabilityService {
  constructor(
    private holidayRepository: IHolidayRepository,
    private scheduleExceptionRepository: IScheduleExceptionRepository,
    private scheduleRepository: IScheduleRepository,
  ) {}

  /**
   * Determina el horario efectivo para una fecha específica
   * @param date - Fecha a consultar
   * @returns EffectiveSchedule con el horario efectivo, o null si el día está cerrado
   */
  async getEffectiveSchedule(date: Date): Promise<EffectiveSchedule | null> {
    // 1. Prioridad máxima: ScheduleException
    const exception = await this.scheduleExceptionRepository.getExceptionForDate(date);

    if (exception) {
      return {
        startTime: exception.startTimeException,
        endTime: exception.endTimeException,
        source: 'exception',
      };
    }

    // 2. Segunda prioridad: Holiday (sin excepción = día cerrado)
    const isHoliday = await this.holidayRepository.isHoliday(date);

    if (isHoliday) {
      return null;
    }

    // 3. Fallback: horario regular del día de la semana
    const dayOfWeek = this.getDayOfWeek(date);
    const schedules = await this.scheduleRepository.findByDayOfWeek(dayOfWeek);

    if (schedules.length === 0) {
      // No hay horario regular para este día (ej: domingo sin horario configurado)
      return null;
    }

    const schedule = schedules[0];
    return {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      source: 'regular',
    };
  }

  /**
   * Verifica si un día está cerrado (feriado sin excepción o sin horario regular)
   * @param date - Fecha a consultar
   * @returns true si el día está cerrado
   */
  async isDayClosed(date: Date): Promise<boolean> {
    const effectiveSchedule = await this.getEffectiveSchedule(date);
    return effectiveSchedule === null;
  }

  /**
   * Convierte una fecha al enum DayOfWeekEnum
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
}
