import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';
import { UpdateStylistServiceDto } from '../dto/request/UpdateStylistServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para actualizar una asignación de servicio a estilista
 * Permite modificar precio personalizado y estado de oferta
 */
export class UpdateStylistService {
  constructor(
    private stylistServiceRepository: IStylistServiceRepository,
    private serviceRepository: IServiceRepository,
  ) {}

  /**
   * Ejecuta la actualización de una asignación estilista-servicio
   * @param stylistId - ID único del estilista
   * @param serviceId - ID único del servicio
   * @param updateDto - Datos de actualización
   * @returns Promise con los datos de la asignación actualizada
   * @throws NotFoundError si la asignación o el servicio no existen
   * @throws ValidationError si los datos son inválidos
   * @throws ForbiddenError si un STYLIST intenta operar sobre otro estilista
   */
  async execute(
    stylistId: string,
    serviceId: string,
    updateDto: UpdateStylistServiceDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<StylistServiceDto> {
    if (updateDto.customPrice !== undefined && updateDto.customPrice !== null && updateDto.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }

    if (Object.keys(updateDto).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    if (requesterRole !== 'ADMIN' && stylistId !== requesterId) {
      throw new ForbiddenError('You can only manage your own service assignments');
    }

    const stylistService = await this.stylistServiceRepository.findByStylistAndService(
      stylistId,
      serviceId,
    );
    if (!stylistService) {
      throw new NotFoundError('Stylist service assignment', `${stylistId}-${serviceId}`);
    }

    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    if (updateDto.customPrice !== undefined) {
      stylistService.updatePrice(updateDto.customPrice);
    }

    if (updateDto.isOffering !== undefined) {
      if (updateDto.isOffering) {
        stylistService.startOffering();
      } else {
        stylistService.stopOffering();
      }
    }

    const updatedAssignment = await this.stylistServiceRepository.update(stylistService);

    return this.mapToDto(
      updatedAssignment,
      service.name,
      service.description,
      service.duration,
      service.price,
    );
  }

  /**
   * Convierte una entidad StylistService a su representación DTO
   * @param stylistService - Entidad de asignación a convertir
   * @param serviceName - Nombre del servicio asociado
   * @param serviceDescription - Descripción del servicio asociado
   * @param baseDuration - Duración base del servicio
   * @param basePrice - Precio base del servicio
   * @returns Objeto DTO con los datos completos de la asignación
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
