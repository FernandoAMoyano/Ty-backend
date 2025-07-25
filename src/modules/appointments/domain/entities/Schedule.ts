import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Enumeración de días de la semana
 */
export enum DayOfWeekEnum {
  /** Lunes */
  MONDAY = 'MONDAY',
  /** Martes */
  TUESDAY = 'TUESDAY',
  /** Miércoles */
  WEDNESDAY = 'WEDNESDAY',
  /** Jueves */
  THURSDAY = 'THURSDAY',
  /** Viernes */
  FRIDAY = 'FRIDAY',
  /** Sábado */
  SATURDAY = 'SATURDAY',
  /** Domingo */
  SUNDAY = 'SUNDAY',
}

export class Schedule {
  constructor(
    public id: string,
    public dayOfWeek: DayOfWeekEnum,
    public startTime: string, // Formato: "HH:MM"
    public endTime: string, // Formato: "HH:MM"
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public holidayId?: string,
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de horario con validaciones automáticas
   * @param dayOfWeek - Día de la semana para el horario
   * @param startTime - Hora de inicio en formato HH:MM
   * @param endTime - Hora de fin en formato HH:MM
   * @param holidayId - ID del feriado asociado (opcional, para horarios especiales)
   * @returns Nueva instancia de Schedule
   * @throws ValidationError si los datos no son válidos
   */
  static create(
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    holidayId?: string,
  ): Schedule {
    return new Schedule(
      generateUuid(),
      dayOfWeek,
      startTime,
      endTime,
      new Date(),
      new Date(),
      holidayId,
    );
  }

  /**
   * Reconstruye una instancia de horario desde datos de persistencia
   * @param id - ID único del horario
   * @param dayOfWeek - Día de la semana
   * @param startTime - Hora de inicio
   * @param endTime - Hora de fin
   * @param createdAt - Fecha de creación
   * @param updatedAt - Fecha de última actualización
   * @param holidayId - ID del feriado (opcional)
   * @returns Instancia de Schedule desde persistencia
   */
  static fromPersistence(
    id: string,
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    createdAt: Date,
    updatedAt: Date,
    holidayId?: string,
  ): Schedule {
    return new Schedule(id, dayOfWeek, startTime, endTime, createdAt, updatedAt, holidayId);
  }

  /**
   * Ejecuta todas las validaciones necesarias para el horario
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    this.validateTimeFormat(this.startTime, 'Start time');
    this.validateTimeFormat(this.endTime, 'End time');
    this.validateTimeRange();
  }

  /**
   * Valida que el formato de hora sea correcto (HH:MM)
   * @param time - Hora a validar
   * @param fieldName - Nombre del campo para mensajes de error
   * @throws ValidationError si el formato no es válido
   */
  private validateTimeFormat(time: string, fieldName: string): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new ValidationError(`${fieldName} must be in HH:mm format`);
    }
  }

  /**
   * Valida que el rango de tiempo sea lógico y suficiente
   * @throws ValidationError si el rango de tiempo no es válido
   */
  private validateTimeRange(): void {
    const start = this.timeToMinutes(this.startTime);
    const end = this.timeToMinutes(this.endTime);

    if (start >= end) {
      throw new ValidationError('Start time must be before end time');
    }

    if (end - start < 30) {
      throw new ValidationError('Schedule must be at least 30 minutes long');
    }
  }

  /**
   * Convierte una hora en formato HH:MM a minutos desde medianoche
   * @param time - Hora en formato HH:MM
   * @returns Número de minutos desde las 00:00
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Actualiza los horarios de inicio y fin del schedule
   * @param startTime - Nueva hora de inicio en formato HH:MM
   * @param endTime - Nueva hora de fin en formato HH:MM
   * @throws ValidationError si los nuevos horarios no son válidos
   */
  updateSchedule(startTime: string, endTime: string): void {
    this.startTime = startTime;
    this.endTime = endTime;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Calcula la duración total del horario en minutos
   * @returns Duración en minutos entre hora de inicio y fin
   */
  getDurationInMinutes(): number {
    return this.timeToMinutes(this.endTime) - this.timeToMinutes(this.startTime);
  }

  /**
   * Verifica si una hora específica está dentro del horario laboral
   * @param time - Hora a verificar en formato HH:MM
   * @returns true si la hora está dentro del horario, false en caso contrario
   */
  isWithinWorkingHours(time: string): boolean {
    const timeInMinutes = this.timeToMinutes(time);
    const startInMinutes = this.timeToMinutes(this.startTime);
    const endInMinutes = this.timeToMinutes(this.endTime);

    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  }

  /**
   * Genera una lista de horarios disponibles divididos en slots de duración específica
   * @param slotDuration - Duración de cada slot en minutos (por defecto 30)
   * @returns Array de strings con horarios disponibles en formato HH:MM
   */
  getAvailableSlots(slotDuration: number = 30): string[] {
    const slots: string[] = [];
    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);

    for (
      let current = startMinutes;
      current + slotDuration <= endMinutes;
      current += slotDuration
    ) {
      const hours = Math.floor(current / 60);
      const minutes = current % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }

    return slots;
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades del horario
   */
  toPersistence() {
    return {
      id: this.id,
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      holidayId: this.holidayId,
    };
  }
}
