import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class StylistService {
  constructor(
    public stylistId: string,
    public serviceId: string,
    public customPrice?: number,
    public isOffering: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  static create(stylistId: string, serviceId: string, customPrice?: number): StylistService {
    return new StylistService(stylistId, serviceId, customPrice);
  }

  static fromPersistence(
    stylistId: string,
    serviceId: string,
    customPrice?: number,
    isOffering?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): StylistService {
    return new StylistService(stylistId, serviceId, customPrice, isOffering, createdAt, updatedAt);
  }

  private validate(): void {
    if (!this.stylistId || this.stylistId.trim().length === 0) {
      throw new ValidationError('Stylist ID cannot be empty');
    }

    if (!this.serviceId || this.serviceId.trim().length === 0) {
      throw new ValidationError('Service ID cannot be empty');
    }

    if (this.customPrice !== undefined && this.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }
  }

  updatePrice(newPrice?: number): void {
    if (newPrice !== undefined && newPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }
    this.customPrice = newPrice;
    this.updatedAt = new Date();
  }

  startOffering(): void {
    this.isOffering = true;
    this.updatedAt = new Date();
  }

  stopOffering(): void {
    this.isOffering = false;
    this.updatedAt = new Date();
  }

  getEffectivePrice(basePrice: number): number {
    return this.customPrice ?? basePrice;
  }

  getFormattedPrice(basePrice: number): string {
    return (this.getEffectivePrice(basePrice) / 100).toFixed(2);
  }

  hasCustomPrice(): boolean {
    return this.customPrice !== undefined && this.customPrice !== null;
  }

  toPersistence() {
    return {
      stylistId: this.stylistId,
      serviceId: this.serviceId,
      customPrice: this.customPrice,
      isOffering: this.isOffering,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
