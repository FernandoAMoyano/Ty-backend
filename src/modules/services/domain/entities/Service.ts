import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Service {
  constructor(
    public id: string,
    public categoryId: string,
    public name: string,
    public description: string,
    public duration: number,
    public durationVariation: number,
    public price: number,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(
    categoryId: string,
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
  ): Service {
    return new Service(
      generateUuid(),
      categoryId,
      name,
      description,
      duration,
      durationVariation,
      price,
    );
  }

  static fromPersistence(
    id: string,
    categoryId: string,
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): Service {
    return new Service(
      id,
      categoryId,
      name,
      description,
      duration,
      durationVariation,
      price,
      isActive,
      createdAt,
      updatedAt,
    );
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Service name cannot be empty');
    }

    if (this.name.length > 150) {
      throw new ValidationError('Service name is too long');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new ValidationError('Service description cannot be empty');
    }

    if (this.description.length > 1000) {
      throw new ValidationError('Service description is too long');
    }

    if (this.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (this.duration > 600) {
      // 10 horas máximo
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (this.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    if (this.durationVariation > this.duration) {
      throw new ValidationError('Duration variation cannot exceed base duration');
    }

    if (this.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }

    if (!this.categoryId || this.categoryId.trim().length === 0) {
      throw new ValidationError('Service must have a category');
    }
  }

  updateDetails(
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
  ): void {
    this.name = name.trim();
    this.description = description.trim();
    this.duration = duration;
    this.durationVariation = durationVariation;
    this.price = price;
    this.updatedAt = new Date();
    this.validate();
  }

  updateCategory(categoryId: string): void {
    this.categoryId = categoryId;
    this.updatedAt = new Date();
    this.validate();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  calculateMinDuration(): number {
    return Math.max(0, this.duration - this.durationVariation);
  }

  calculateMaxDuration(): number {
    return this.duration + this.durationVariation;
  }

  getFormattedPrice(): string {
    return (this.price / 100).toFixed(2);
  }

  toPersistence() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      name: this.name,
      description: this.description,
      duration: this.duration,
      durationVariation: this.durationVariation,
      price: this.price,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
