import { StylistServiceDto } from './StylistServiceDto';

export interface ServiceWithStylistsDto {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  baseDuration: number;
  basePrice: number;
  stylists: StylistServiceDto[];
  totalStylistsOffering: number;
}
