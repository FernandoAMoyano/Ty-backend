import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Stylist {
  constructor(
    public id: string,
    public userId: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(userId: string): Stylist {
    return new Stylist(generateUuid(), userId);
  }

  static fromPersistence(id: string, userId: string, createdAt?: Date, updatedAt?: Date): Stylist {
    return new Stylist(id, userId, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }

    if (!this.id || this.id.trim().length === 0) {
      throw new ValidationError('Stylist ID cannot be empty');
    }
  }

  updateInfo(): void {
    this.updatedAt = new Date();
    this.validate();
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
