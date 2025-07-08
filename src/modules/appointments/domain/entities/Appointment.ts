import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Appointment {
  constructor(
    public id: string,
    public dateTime: Date,
    public duration: number, // in minutes
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
