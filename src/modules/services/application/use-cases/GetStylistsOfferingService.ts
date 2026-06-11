import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para obtener los estilistas que están ofreciendo activamente un servicio
 */
export class GetStylistsOfferingService {
  constructor(
    private stylistServiceRepository: IStylistServiceRepository,
    private serviceRepository: IServiceRepository,
  ) {}

  /**
   * Ejecuta la obtención de estilistas que ofrecen el servicio
   * @param serviceId - ID único del servicio
   * @returns Promise con la lista de estilistas que están ofreciendo el servicio
   * @throws NotFoundError si el servicio no existe
   */
  async execute(serviceId: string): Promise<StylistServiceDto[]> {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findStylistsOfferingService(serviceId);
    return assignments.map((assignment) =>
      this.mapToDto(assignment, service.name, service.description, service.duration, service.price),
    );
  }

  /**
   * Convierte una entidad StylistService a su representación DTO
   */
  private mapToDto(stylistService: StylistService, serviceName: string, serviceDescription: string, baseDuration: number, basePrice: number): StylistServiceDto {
    return {
      stylistId: stylistService.stylistId,
      serviceId: stylistService.serviceId,
      serviceName,
      serviceDescription,
      baseDuration,
      basePrice,
      customPrice: stylistService.customPrice,
      effectivePrice: stylistService.getEffectivePrice(basePrice),
      formattedEffectivePrice: stylistService.getFormattedPrice(basePrice),
      isOffering: stylistService.isOffering,
      hasCustomPrice: stylistService.hasCustomPrice(),
      createdAt: stylistService.createdAt,
      updatedAt: stylistService.updatedAt,
    };
  }
}
