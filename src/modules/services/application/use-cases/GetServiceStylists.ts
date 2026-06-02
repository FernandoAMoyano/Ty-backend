import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para obtener todos los estilistas que pueden realizar un servicio específico
 */
export class GetServiceStylists {
  constructor(
    private stylistServiceRepository: StylistServiceRepository,
    private serviceRepository: ServiceRepository,
  ) {}

  /**
   * Ejecuta la obtención de estilistas por servicio
   * @param serviceId - ID único del servicio
   * @returns Promise con la lista de estilistas que tienen asignado el servicio
   * @throws NotFoundError si el servicio no existe
   */
  async execute(serviceId: string): Promise<StylistServiceDto[]> {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findByService(serviceId);
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
