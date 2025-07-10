import { UpdateStylistServiceDto } from '../dto/request/UpdateStylistServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { StylistServiceService } from '../services/StylistServiceService';

/**
 * Caso de uso para gestionar la oferta de servicios de un estilista
 * Maneja precios personalizados, estado de oferta y validaciones de negocio
 */
export class ManageStylistServiceOffering {
  constructor(private stylistServiceService: StylistServiceService) {}

  /**
   * Actualiza la configuración de oferta de un servicio para un estilista
   * Permite modificar precio personalizado y estado de oferta
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @param updateDto - Datos de actualización (precio y/o estado de oferta)
   * @returns Promise con los datos actualizados de la asignación
   * @throws NotFoundError si la asignación no existe
   * @throws ValidationError si los datos son inválidos
   */
  async updateOffering(
    stylistId: string,
    serviceId: string,
    updateDto: UpdateStylistServiceDto,
  ): Promise<StylistServiceDto> {
    return await this.stylistServiceService.updateStylistService(stylistId, serviceId, updateDto);
  }

  /**
   * Elimina completamente la asignación de un servicio de un estilista
   * El estilista ya no podrá ofrecer este servicio
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @throws NotFoundError si la asignación no existe
   */
  async stopOffering(stylistId: string, serviceId: string): Promise<void> {
    return await this.stylistServiceService.removeServiceFromStylist(stylistId, serviceId);
  }

  /**
   * Activa la oferta de un servicio para un estilista
   * El servicio debe estar previamente asignado al estilista
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @returns Promise con los datos actualizados de la asignación
   * @throws NotFoundError si la asignación no existe
   */
  async startOffering(stylistId: string, serviceId: string): Promise<StylistServiceDto> {
    return await this.stylistServiceService.updateStylistService(stylistId, serviceId, {
      isOffering: true,
    });
  }
}
