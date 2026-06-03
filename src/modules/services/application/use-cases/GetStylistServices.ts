import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { StylistRepository } from '../../domain/repositories/StylistRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para obtener todos los servicios asignados a un estilista
 */
export class GetStylistServices {
  constructor(
    private stylistServiceRepository: StylistServiceRepository,
    private serviceRepository: ServiceRepository,
    private stylistRepository: StylistRepository,
  ) {}

  /**
   * Ejecuta la obtención de servicios del estilista
   * @param stylistId - ID único del estilista
   * @returns Promise con la lista de servicios asignados al estilista
   * @throws NotFoundError si el estilista no existe
   */
  async execute(stylistId: string): Promise<StylistServiceDto[]> {
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const assignments = await this.stylistServiceRepository.findByStylist(stylistId);
    return this.mapAssignmentsWithServiceInfo(assignments);
  }

  /**
   * Mapea asignaciones con información de servicios de forma eficiente
   * @param assignments - Lista de asignaciones a mapear
   * @returns Promise con la lista de DTOs
   */
  private async mapAssignmentsWithServiceInfo(assignments: StylistService[]): Promise<StylistServiceDto[]> {
    const serviceIds = [...new Set(assignments.map((a) => a.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => this.serviceRepository.findById(id)));
    const serviceMap = new Map(services.filter((s) => s !== null).map((s) => [s!.id, s!]));

    return assignments.map((assignment) => {
      const service = serviceMap.get(assignment.serviceId);
      if (!service) throw new Error(`Service not found for assignment ${assignment.serviceId}`);
      return this.mapToDto(assignment, service.name, service.description, service.duration, service.price);
    });
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
