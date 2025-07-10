import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Appointment {
  constructor(
    public id: string,
    public dateTime: Date,
    public duration: number, // en minutos
    public userId: string,
    public clientId: string,
    public scheduleId: string,
    public statusId: string,
    public stylistId?: string,
    public confirmedAt?: Date,
    public serviceIds: string[] = [],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(
    dateTime: Date,
    duration: number,
    userId: string,
    clientId: string,
    scheduleId: string,
    statusId: string,
    stylistId?: string,
    serviceIds: string[] = [],
  ): Appointment {
    return new Appointment(
      generateUuid(),
      dateTime,
      duration,
      userId,
      clientId,
      scheduleId,
      statusId,
      stylistId,
      undefined,
      serviceIds,
    );
  }

  static fromPersistence(
    id: string,
    dateTime: Date,
    duration: number,
    userId: string,
    clientId: string,
    scheduleId: string,
    statusId: string,
    stylistId?: string,
    confirmedAt?: Date,
    serviceIds: string[] = [],
    createdAt?: Date,
    updatedAt?: Date,
  ): Appointment {
    return new Appointment(
      id,
      dateTime,
      duration,
      userId,
      clientId,
      scheduleId,
      statusId,
      stylistId,
      confirmedAt,
      serviceIds,
      createdAt,
      updatedAt,
    );
  }

  private validate(): void {
    this.validateDateTime();
    this.validateDuration();
    this.validateRequiredFields();
  }

  private validateDateTime(): void {
    if (!this.dateTime) {
      throw new ValidationError('Appointment date and time is required');
    }

    if (this.dateTime < new Date()) {
      throw new ValidationError('Appointment cannot be scheduled in the past');
    }
  }

  private validateDuration(): void {
    if (!this.duration || this.duration <= 0) {
      throw new ValidationError('Duration must be greater than 0');
    }

    if (this.duration < 15) {
      throw new ValidationError('Minimum appointment duration is 15 minutes');
    }

    if (this.duration > 480) {
      // 8 horas
      throw new ValidationError('Maximum appointment duration is 8 hours');
    }

    if (this.duration % 15 !== 0) {
      throw new ValidationError('Duration must be in 15-minute increments');
    }
  }

  private validateRequiredFields(): void {
    const requiredFields = [
      { field: this.userId, name: 'userId' },
      { field: this.clientId, name: 'clientId' },
      { field: this.scheduleId, name: 'scheduleId' },
      { field: this.statusId, name: 'statusId' },
    ];

    for (const { field, name } of requiredFields) {
      if (!field || field.trim().length === 0) {
        throw new ValidationError(`${name} is required`);
      }
    }
  }

  // Métodos lógicos de negocios
  confirm(): void {
    if (this.confirmedAt) {
      throw new ValidationError('Appointment is already confirmed');
    }
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
  }

  reschedule(newDateTime: Date, newDuration?: number): void {
    if (newDateTime < new Date()) {
      throw new ValidationError('Cannot reschedule to a past date');
    }

    this.dateTime = newDateTime;
    if (newDuration) {
      this.duration = newDuration;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  addService(serviceId: string): void {
    if (!serviceId || serviceId.trim().length === 0) {
      throw new ValidationError('Service ID is required');
    }

    if (this.serviceIds.includes(serviceId)) {
      throw new ValidationError('Service is already added to this appointment');
    }

    this.serviceIds.push(serviceId);
    this.updatedAt = new Date();
  }

  removeService(serviceId: string): void {
    const index = this.serviceIds.indexOf(serviceId);
    if (index === -1) {
      throw new ValidationError('Service not found in this appointment');
    }

    this.serviceIds.splice(index, 1);
    this.updatedAt = new Date();
  }

  updateStylist(stylistId: string): void {
    if (!stylistId || stylistId.trim().length === 0) {
      throw new ValidationError('Stylist ID is required');
    }

    this.stylistId = stylistId;
    this.updatedAt = new Date();
  }

  updateDuration(newDuration: number): void {
    this.duration = newDuration;
    this.updatedAt = new Date();
    this.validateDuration();
  }

  // Métodos de consulta
  isConfirmed(): boolean {
    return this.confirmedAt !== undefined;
  }

  getEndTime(): Date {
    return new Date(this.dateTime.getTime() + this.duration * 60000);
  }

  isInPast(): boolean {
    return this.dateTime < new Date();
  }

  hasConflictWith(otherAppointment: Appointment): boolean {
    const thisStart = this.dateTime.getTime();
    const thisEnd = this.getEndTime().getTime();
    const otherStart = otherAppointment.dateTime.getTime();
    const otherEnd = otherAppointment.getEndTime().getTime();

    return !(thisEnd <= otherStart || thisStart >= otherEnd);
  }

  canBeModified(): boolean {
    // Se puede modificar si son al menos 24 horas en el futuro
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

    return this.dateTime > twentyFourHoursFromNow;
  }

  // Métodos de gestión de estado

  /**
   * Cambia el estado de la cita a un nuevo estado específico
   * @param newStatusId - ID del nuevo estado para la cita
   * @throws ValidationError si el ID del estado no es válido
   */
  changeStatus(newStatusId: string): void {
    this.validateStatusId(newStatusId);
    this.statusId = newStatusId;
    this.updatedAt = new Date();
  }

  // Métodos de transición específicos

  /**
   * Marca la cita como confirmada, estableciendo la fecha de confirmación y cambiando el estado
   * @param confirmedStatusId - ID del estado "confirmado"
   * @throws ValidationError si la cita ya está confirmada
   */
  markAsConfirmed(confirmedStatusId: string): void {
    this.confirm();
    this.changeStatus(confirmedStatusId);
  }

  /**
   * Marca la cita como cancelada cambiando su estado
   * @param cancelledStatusId - ID del estado "cancelado"
   */
  markAsCancelled(cancelledStatusId: string): void {
    this.changeStatus(cancelledStatusId);
  }

  /**
   * Marca la cita como completada cambiando su estado
   * @param completedStatusId - ID del estado "completado"
   */
  markAsCompleted(completedStatusId: string): void {
    this.changeStatus(completedStatusId);
  }

  /**
   * Marca la cita como en progreso cambiando su estado
   * @param inProgressStatusId - ID del estado "en progreso"
   */
  markAsInProgress(inProgressStatusId: string): void {
    this.changeStatus(inProgressStatusId);
  }

  /**
   * Marca la cita como no show (cliente no se presentó) cambiando su estado
   * @param noShowStatusId - ID del estado "no show"
   */
  markAsNoShow(noShowStatusId: string): void {
    this.changeStatus(noShowStatusId);
  }

  /**
   * Valida que el ID del estado sea válido y no esté vacío
   * @param statusId - ID del estado a validar
   * @throws ValidationError si el ID del estado es inválido o vacío
   */
  private validateStatusId(statusId: string): void {
    if (!statusId || statusId.trim().length === 0) {
      throw new ValidationError('Status ID is required');
    }
  }

  toPersistence() {
    return {
      id: this.id,
      dateTime: this.dateTime,
      duration: this.duration,
      userId: this.userId,
      clientId: this.clientId,
      scheduleId: this.scheduleId,
      statusId: this.statusId,
      stylistId: this.stylistId,
      confirmedAt: this.confirmedAt,
      serviceIds: this.serviceIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
