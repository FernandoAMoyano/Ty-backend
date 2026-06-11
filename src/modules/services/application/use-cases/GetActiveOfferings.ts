import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IStylistRepository } from '../../domain/repositories/IStylistRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para obtener solo los servicios que el estilista está ofreciendo activamente
 */
export class GetActiveOfferings {
  constructor(
    private stylistServiceRepository: IStylistServiceRepository,
    private serviceRepository: IServiceRepository,
    private stylistRepository: IStylistRepository,
  ) {}

  /**
   * Ejecuta la obtención de ofertas activas del estilista
   * @param stylistId - ID único del estilista
   * @returns Promise con la lista de servicios que el estilista está ofreciendo
   * @throws NotFoundError si el estilista no existe
   */
  async execute(stylistId: string): Promise<StylistServiceDto[]> {
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const assignments = await this.stylistServiceRepository.findActiveOfferings(stylistId);
    return this.mapAssignmentsWithServiceInfo(assignments);
  }

  /**
   * Mapea asignaciones con información de servicios de forma eficiente
   */
  private async mapAssignmentsWithServiceInfo(
    assignments: StylistService[],
  ): Promise<StylistServiceDto[]> {
    const serviceIds = [...new Set(assignments.map((a) => a.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => this.serviceRepository.findById(id)));
    const serviceMap = new Map(services.filter((s) => s !== null).map((s) => [s!.id, s!]));

    return assignments.map((assignment) => {
      const service = serviceMap.get(assignment.serviceId);
      if (!service) throw new Error(`Service not found for assignment ${assignment.serviceId}`);
      return this.mapToDto(
        assignment,
        service.name,
        service.description,
        service.duration,
        service.price,
      );
    });
  }

  /**
   * Convierte una entidad StylistService a su representación DTO
   */
  private mapToDto(
    stylistService: StylistService,
    serviceName: string,
    serviceDescription: string,
    baseDuration: number,
    basePrice: number,
  ): StylistServiceDto {
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
