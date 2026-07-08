import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { UserRoleValidationService } from '../../../auth/domain/services/UserRoleValidationService';
import { RoleName } from '@prisma/client';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { AssignServiceDto } from '../dto/request/AssignServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';

/**
 * Caso de uso para asignar un servicio a un estilista con precio personalizado opcional
 */
export class AssignServiceToStylist {
  constructor(
    private stylistServiceRepository: IStylistServiceRepository,
    private serviceRepository: IServiceRepository,
    private userRoleValidationService: UserRoleValidationService,
  ) {}

  /**
   * Ejecuta la asignación de un servicio a un estilista
   * @param stylistId - ID del usuario estilista (User.id)
   * @param assignDto - Datos de la asignación incluyendo servicio y precio personalizado
   * @returns Promise con los datos de la asignación creada
   * @throws NotFoundError si el usuario estilista o servicio no existen
   * @throws BusinessRuleError si el usuario no tiene rol STYLIST
   * @throws ValidationError si los datos son inválidos
   * @throws ConflictError si el servicio ya está asignado al estilista
   */
  async execute(stylistId: string, assignDto: AssignServiceDto): Promise<StylistServiceDto> {
    if (!assignDto.serviceId || assignDto.serviceId.trim().length === 0) {
      throw new ValidationError('Service ID is required');
    }

    if (assignDto.customPrice !== undefined && assignDto.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }

    // Validar que el usuario existe y tiene rol STYLIST
    await this.userRoleValidationService.ensureUserHasRole(stylistId, RoleName.STYLIST);

    const service = await this.serviceRepository.findById(assignDto.serviceId);
    if (!service) {
      throw new NotFoundError('Service', assignDto.serviceId);
    }

    if (!service.isActive) {
      throw new BusinessRuleError('Cannot assign an inactive service to a stylist');
    }

    const existingAssignment = await this.stylistServiceRepository.existsAssignment(
      stylistId,
      assignDto.serviceId,
    );
    if (existingAssignment) {
      throw new ConflictError('Service is already assigned to this stylist');
    }

    const stylistService = StylistService.create(
      stylistId,
      assignDto.serviceId,
      assignDto.customPrice,
    );
    const savedAssignment = await this.stylistServiceRepository.save(stylistService);

    return this.mapToDto(
      savedAssignment,
      service.name,
      service.description,
      service.duration,
      service.price,
    );
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
