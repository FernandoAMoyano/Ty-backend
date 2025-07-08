import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class Schedule {
  constructor(
    public id: string,
    public dayOfWeek: DayOfWeekEnum,
    public startTime: string, // Formato: "HH: MM"
    public endTime: string, // Formato: "HH: MM"
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public holidayId?: string,
  ) {
    this.validate();
  }

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

  private validate(): void {
    this.validateTimeFormat(this.startTime, 'Start time');
    this.validateTimeFormat(this.endTime, 'End time');
    this.validateTimeRange();
  }

  private validateTimeFormat(time: string, fieldName: string): void {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new ValidationError(`${fieldName} must be in HH:mm format`);
    }
  }

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

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  updateSchedule(startTime: string, endTime: string): void {
    this.startTime = startTime;
    this.endTime = endTime;
    this.updatedAt = new Date();
    this.validate();
  }

  getDurationInMinutes(): number {
    return this.timeToMinutes(this.endTime) - this.timeToMinutes(this.startTime);
  }

  isWithinWorkingHours(time: string): boolean {
    const timeInMinutes = this.timeToMinutes(time);
    const startInMinutes = this.timeToMinutes(this.startTime);
    const endInMinutes = this.timeToMinutes(this.endTime);

    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  }

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
