import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { StylistWithServicesDto } from '../dto/response/StylistWithServicesDto';

/**
 * Caso de uso para obtener información completa de un estilista con todos sus servicios
 */
export class GetStylistWithServices {
  constructor(
    private stylistServiceRepository: IStylistServiceRepository,
    private serviceRepository: IServiceRepository,
    private userRepository: IUserRepository,
  ) {}

  /**
   * Ejecuta la obtención del estilista con sus servicios
   * @param stylistId - ID del usuario estilista (User.id)
   * @returns Promise con datos completos del estilista y sus servicios
   * @throws NotFoundError si el usuario no existe
   */
  async execute(stylistId: string): Promise<StylistWithServicesDto> {
    const user = await this.userRepository.findById(stylistId);
    if (!user) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const assignments = await this.stylistServiceRepository.findByStylist(stylistId);
    const services = await this.mapAssignmentsWithServiceInfo(assignments);

    return {
      stylistId: user.id,
      stylistName: user.name,
      stylistEmail: user.email,
      services,
      totalServicesOffered: services.filter((s) => s.isOffering).length,
    };
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
