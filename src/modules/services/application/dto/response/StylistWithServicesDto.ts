import { StylistServiceDto } from './StylistServiceDto';

export interface StylistWithServicesDto {
  stylistId: string;
  stylistName: string;
  stylistEmail: string;
  services: StylistServiceDto[];
  totalServicesOffered: number;
}
