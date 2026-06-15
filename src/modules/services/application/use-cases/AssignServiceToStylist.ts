import { StylistService } from '../../domain/entities/StylistService';
import { IStylistServiceRepository } from '../../domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { IStylistRepository } from '../../domain/repositories/IStylistRepository';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
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
    private userRepository: IUserRepository,
    private stylistRepository: IStylistRepository,
  ) {}

  /**
   * Ejecuta la asignación de un servicio a un estilista
   * @param stylistId - ID único del estilista
   * @param assignDto - Datos de la asignación incluyendo servicio y precio personalizado
   * @returns Promise con los datos de la asignación creada
   * @throws NotFoundError si el estilista, usuario o servicio no existen
   * @throws ValidationError si el usuario no es estilista o los datos son inválidos
   * @throws ConflictError si el servicio ya está asignado al estilista
   */
  async execute(stylistId: string, assignDto: AssignServiceDto): Promise<StylistServiceDto> {
    if (!assignDto.serviceId || assignDto.serviceId.trim().length === 0) {
      throw new ValidationError('Service ID is required');
    }

    if (assignDto.customPrice !== undefined && assignDto.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }

    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const userWithRole = await this.userRepository.findByIdWithRole(stylist.userId);
    if (!userWithRole) {
      throw new NotFoundError('User', stylist.userId);
    }

    if (!userWithRole.role || userWithRole.role.name !== 'STYLIST') {
      throw new ValidationError('User is not a stylist');
    }

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
