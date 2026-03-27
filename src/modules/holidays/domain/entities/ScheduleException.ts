/**
 * Interface para las propiedades de la excepción de horario
 */
export interface ScheduleExceptionProps {
  id: string;
  exceptionDate: Date;
  startTimeException: string;
  endTimeException: string;
  reason: string | null;
  holidayId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad ScheduleException
 * @description Representa una modificación puntual del horario regular
 * (cierre temprano, apertura especial, horario reducido, etc.)
 */
export class ScheduleException {
  private readonly _id: string;
  private _exceptionDate: Date;
  private _startTimeException: string;
  private _endTimeException: string;
  private _reason: string | null;
  private _holidayId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ScheduleExceptionProps) {
    this._id = props.id;
    this._exceptionDate = props.exceptionDate;
    this._startTimeException = props.startTimeException;
    this._endTimeException = props.endTimeException;
    this._reason = props.reason;
    this._holidayId = props.holidayId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get exceptionDate(): Date {
    return this._exceptionDate;
  }

  get startTimeException(): string {
    return this._startTimeException;
  }

  get endTimeException(): string {
    return this._endTimeException;
  }

  get reason(): string | null {
    return this._reason;
  }

  get holidayId(): string | null {
    return this._holidayId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Verifica si la excepción está asociada a un feriado
   */
  get isHolidayRelated(): boolean {
    return this._holidayId !== null;
  }

  /**
   * Verifica si la excepción es para una fecha específica
   * @param date - Fecha a comparar
   */
  isOnDate(date: Date): boolean {
    return (
      this._exceptionDate.getFullYear() === date.getFullYear() &&
      this._exceptionDate.getMonth() === date.getMonth() &&
      this._exceptionDate.getDate() === date.getDate()
    );
  }

  /**
   * Verifica si la excepción ya pasó
   */
  get isPast(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exceptionDate = new Date(this._exceptionDate);
    exceptionDate.setHours(0, 0, 0, 0);
    return exceptionDate < today;
  }

  /**
   * Verifica si la excepción es hoy
   */
  get isToday(): boolean {
    const today = new Date();
    return this.isOnDate(today);
  }

  /**
   * Verifica si la excepción es futura
   */
  get isFuture(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exceptionDate = new Date(this._exceptionDate);
    exceptionDate.setHours(0, 0, 0, 0);
    return exceptionDate > today;
  }

  /**
   * Calcula la duración de la excepción en minutos
   */
  get durationInMinutes(): number {
    const [startHour, startMin] = this._startTimeException.split(':').map(Number);
    const [endHour, endMin] = this._endTimeException.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
  }

  /**
   * Actualiza los horarios de la excepción
   * @param startTime - Nueva hora de inicio (HH:MM)
   * @param endTime - Nueva hora de fin (HH:MM)
   */
  updateTimes(startTime: string, endTime: string): void {
    this.validateTimeFormat(startTime);
    this.validateTimeFormat(endTime);
    this.validateTimeRange(startTime, endTime);

    this._startTimeException = startTime;
    this._endTimeException = endTime;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza la fecha de la excepción
   * @param date - Nueva fecha
   */
  updateDate(date: Date): void {
    this._exceptionDate = date;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza la razón de la excepción
   * @param reason - Nueva razón
   */
  updateReason(reason: string | null): void {
    this._reason = reason ? reason.trim() : null;
    this._updatedAt = new Date();
  }

  /**
   * Asocia la excepción a un feriado
   * @param holidayId - ID del feriado
   */
  associateToHoliday(holidayId: string): void {
    this._holidayId = holidayId;
    this._updatedAt = new Date();
  }

  /**
   * Desasocia la excepción de cualquier feriado
   */
  disassociateFromHoliday(): void {
    this._holidayId = null;
    this._updatedAt = new Date();
  }

  /**
   * Valida el formato de hora (HH:MM)
   * @private
   */
  private validateTimeFormat(time: string): void {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Formato de hora inválido: ${time}. Use HH:MM`);
    }
  }

  /**
   * Valida que la hora de fin sea posterior a la de inicio
   * @private
   */
  private validateTimeRange(startTime: string, endTime: string): void {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  toObject(): ScheduleExceptionProps {
    return {
      id: this._id,
      exceptionDate: this._exceptionDate,
      startTimeException: this._startTimeException,
      endTimeException: this._endTimeException,
      reason: this._reason,
      holidayId: this._holidayId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * Factory method para crear una nueva excepción de horario
   * @param id - ID único
   * @param exceptionDate - Fecha de la excepción
   * @param startTimeException - Hora de inicio (HH:MM)
   * @param endTimeException - Hora de fin (HH:MM)
   * @param reason - Razón opcional
   * @param holidayId - ID del feriado asociado (opcional)
   */
  static create(
    id: string,
    exceptionDate: Date,
    startTimeException: string,
    endTimeException: string,
    reason?: string | null,
    holidayId?: string | null,
  ): ScheduleException {
    const exception = new ScheduleException({
      id,
      exceptionDate,
      startTimeException,
      endTimeException,
      reason: reason ? reason.trim() : null,
      holidayId: holidayId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Validar formato y rango de horas
    exception.updateTimes(startTimeException, endTimeException);

    return exception;
  }
}
