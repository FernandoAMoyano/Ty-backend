import { StylistService } from '../entities/StylistService';

export interface StylistServiceRepository {
  findByStylistAndService(stylistId: string, serviceId: string): Promise<StylistService | null>;
  findByStylist(stylistId: string): Promise<StylistService[]>;
  findByService(serviceId: string): Promise<StylistService[]>;
  findActiveOfferings(stylistId: string): Promise<StylistService[]>;
  findStylistsOfferingService(serviceId: string): Promise<StylistService[]>;
  save(stylistService: StylistService): Promise<StylistService>;
  update(stylistService: StylistService): Promise<StylistService>;
  delete(stylistId: string, serviceId: string): Promise<void>;
  existsAssignment(stylistId: string, serviceId: string): Promise<boolean>;
}
