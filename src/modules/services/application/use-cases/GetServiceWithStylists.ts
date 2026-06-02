import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { ServiceWithStylistsDto } from '../dto/response/ServiceWithStylistsDto';

/**
 * Caso de uso para obtener información completa de un servicio con todos sus estilistas
 */
export class GetServiceWithStylists {
  constructor(
    private stylistServiceRepository: StylistServiceRepository,
    private serviceRepository: ServiceRepository,
  ) {}

  /**
   * Ejecuta la obtención del servicio con sus estilistas
   * @param serviceId - ID único del servicio
   * @returns Promise con datos completos del servicio y sus estilistas
   * @throws NotFoundError si el servicio no existe
   */
  async execute(serviceId: string): Promise<ServiceWithStylistsDto> {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findByService(serviceId);
    const stylists = assignments.map((assignment) =>
      this.mapToDto(assignment, service.name, service.description, service.duration, service.price),
    );

    return {
      serviceId: service.id,
      serviceName: service.name,
      serviceDescription: service.description,
      baseDuration: service.duration,
      basePrice: service.price,
      stylists,
      totalStylistsOffering: stylists.filter((s) => s.isOffering).length,
    };
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
