import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Category {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(name: string, description?: string): Category {
    return new Category(generateUuid(), name, description);
  }

  static fromPersistence(
    id: string,
    name: string,
    description?: string,
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): Category {
    return new Category(id, name, description, isActive, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Category name cannot be empty');
    }

    if (this.name.length > 100) {
      throw new ValidationError('Category name is too long');
    }

    if (this.description && this.description.length > 500) {
      throw new ValidationError('Category description is too long');
    }
  }

  updateInfo(name: string, description?: string): void {
    this.name = name.trim();
    this.description = description?.trim();
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

  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
