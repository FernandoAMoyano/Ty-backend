export interface StylistServiceDto {
  stylistId: string;
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  baseDuration: number;
  basePrice: number;
  customPrice?: number;
  effectivePrice: number;
  formattedEffectivePrice: string;
  isOffering: boolean;
  hasCustomPrice: boolean;
  createdAt: Date;
  updatedAt: Date;
}
