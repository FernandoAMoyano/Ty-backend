import { UpdateStylistServiceDto } from '../dto/request/UpdateStylistServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Use Case para gestionar la oferta de servicios de un estilista
 *  maneja precios personalizados + estado de oferta + validaciones de negocio
 */
export class ManageStylistServiceOffering {
  constructor(private stylistServiceService: StylistServiceService) {}

  async updateOffering(
    stylistId: string,
    serviceId: string,
    updateDto: UpdateStylistServiceDto,
  ): Promise<StylistServiceDto> {
    return await this.stylistServiceService.updateStylistService(stylistId, serviceId, updateDto);
  }

  async stopOffering(stylistId: string, serviceId: string): Promise<void> {
    return await this.stylistServiceService.removeServiceFromStylist(stylistId, serviceId);
  }

  async startOffering(stylistId: string, serviceId: string): Promise<StylistServiceDto> {
    return await this.stylistServiceService.updateStylistService(stylistId, serviceId, {
      isOffering: true,
    });
  }
}
