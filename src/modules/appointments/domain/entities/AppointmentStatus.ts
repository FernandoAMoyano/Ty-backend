import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export enum AppointmentStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export class AppointmentStatus {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
  ) {
    this.validate();
  }

  static create(name: string, description?: string): AppointmentStatus {
    return new AppointmentStatus(generateUuid(), name, description);
  }

  static fromPersistence(
    id: string,
    name: string,
    description?: string,
  ): AppointmentStatus {
    return new AppointmentStatus(id, name, description);
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('AppointmentStatus name cannot be empty');
    }

    if (this.name.length > 50) {
      throw new ValidationError('AppointmentStatus name is too long (max 50 characters)');
    }

    if (this.description && this.description.length > 200) {
      throw new ValidationError('AppointmentStatus description is too long (max 200 characters)');
    }
  }

  updateInfo(name: string, description?: string): void {
    this.name = name.trim();
    this.description = description?.trim();
    this.validate();
  }

  isTerminalStatus(): boolean {
    return this.name === AppointmentStatusEnum.COMPLETED || 
           this.name === AppointmentStatusEnum.CANCELLED || 
           this.name === AppointmentStatusEnum.NO_SHOW;
  }

  canTransitionTo(newStatus: string): boolean {
    const transitions: Record<string, string[]> = {
      [AppointmentStatusEnum.PENDING]: [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.CANCELLED],
      [AppointmentStatusEnum.CONFIRMED]: [AppointmentStatusEnum.IN_PROGRESS, AppointmentStatusEnum.CANCELLED, AppointmentStatusEnum.NO_SHOW],
      [AppointmentStatusEnum.IN_PROGRESS]: [AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.CANCELLED],
      [AppointmentStatusEnum.COMPLETED]: [],
      [AppointmentStatusEnum.CANCELLED]: [],
      [AppointmentStatusEnum.NO_SHOW]: []
    };

    return transitions[this.name]?.includes(newStatus) || false;
  }

  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
    };
  }
}
