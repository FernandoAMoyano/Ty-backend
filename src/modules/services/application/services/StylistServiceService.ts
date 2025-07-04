import { StylistService } from '../../domain/entities/StylistService';
import { StylistServiceRepository } from '../../domain/repositories/StylistServiceRepository';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { StylistRepository } from '../../domain/repositories/StylistRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { UserRepository } from '../../../auth/domain/repositories/User';
import { AssignServiceDto } from '../dto/request/AssignServiceDto';
import { StylistServiceDto } from '../dto/response/StylistServiceDto';
import { UpdateStylistServiceDto } from '../dto/request/UpdateStylistServiceDto';
import { StylistWithServicesDto } from '../dto/response/StylistWithServicesDto';
import { ServiceWithStylistsDto } from '../dto/response/ServiceWithStylistsDto';

export class StylistServiceService {
  constructor(
    private stylistServiceRepository: StylistServiceRepository,
    private serviceRepository: ServiceRepository,
    private userRepository: UserRepository,
    private stylistRepository: StylistRepository,
  ) {}

  async assignServiceToStylist(
    stylistId: string,
    assignDto: AssignServiceDto,
  ): Promise<StylistServiceDto> {
    // Validaciones
    this.validateAssignServiceDto(assignDto);

    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    // Verificar que el usuario asociado es estilista
    const user = await this.userRepository.findById(stylist.userId);
    if (!user) {
      throw new NotFoundError('User', stylist.userId);
    }

    //Mapear roleId a roleName para comparación correcta
    const roleMapping: Record<string, string> = {
      '4b39b668-2515-4f5c-b032-e71e9c5f401c': 'ADMIN',
      'd1a51d7a-848b-47a7-9941-2a69956e2a7c': 'CLIENT',
      'e63bf333-e3eb-4ed2-bde3-a2e1ffbbe255': 'STYLIST',
    };

    const roleName = roleMapping[user.roleId];
    if (!roleName || roleName !== 'STYLIST') {
      throw new ValidationError('User is not a stylist');
    }

    // Verificar que el servicio existe
    const service = await this.serviceRepository.findById(assignDto.serviceId);
    if (!service) {
      throw new NotFoundError('Service', assignDto.serviceId);
    }

    // Verificar que no existe la asignación
    const existingAssignment = await this.stylistServiceRepository.existsAssignment(
      stylistId,
      assignDto.serviceId,
    );
    if (existingAssignment) {
      throw new ConflictError('Service is already assigned to this stylist');
    }

    // Crear la asignación
    const stylistService = StylistService.create(
      stylistId,
      assignDto.serviceId,
      assignDto.customPrice,
    );

    // Guardar
    const savedAssignment = await this.stylistServiceRepository.save(stylistService);

    return this.mapStylistServiceToDto(
      savedAssignment,
      service.name,
      service.description,
      service.duration,
      service.price,
    );
  }

  async getStylistServices(stylistId: string): Promise<StylistServiceDto[]> {
    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const assignments = await this.stylistServiceRepository.findByStylist(stylistId);
    return this.mapAssignmentsWithServiceInfo(assignments);
  }

  async getActiveOfferings(stylistId: string): Promise<StylistServiceDto[]> {
    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    const assignments = await this.stylistServiceRepository.findActiveOfferings(stylistId);
    return this.mapAssignmentsWithServiceInfo(assignments);
  }

  async getStylistWithServices(stylistId: string): Promise<StylistWithServicesDto> {
    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findById(stylistId);
    if (!stylist) {
      throw new NotFoundError('Stylist', stylistId);
    }

    // Obtener información del usuario asociado
    const user = await this.userRepository.findById(stylist.userId);
    if (!user) {
      throw new NotFoundError('User', stylist.userId);
    }

    const assignments = await this.stylistServiceRepository.findByStylist(stylistId);
    const services = await this.mapAssignmentsWithServiceInfo(assignments);

    return {
      stylistId: stylist.id,
      stylistName: user.name,
      stylistEmail: user.email,
      services,
      totalServicesOffered: services.filter((s) => s.isOffering).length,
    };
  }

  async updateStylistService(
    stylistId: string,
    serviceId: string,
    updateDto: UpdateStylistServiceDto,
  ): Promise<StylistServiceDto> {
    // Validaciones
    this.validateUpdateStylistServiceDto(updateDto);

    // Verificar que existe la asignación
    const stylistService = await this.stylistServiceRepository.findByStylistAndService(
      stylistId,
      serviceId,
    );
    if (!stylistService) {
      throw new NotFoundError('Stylist service assignment', `${stylistId}-${serviceId}`);
    }

    // Obtener información del servicio
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    // Actualizar
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

    return this.mapStylistServiceToDto(
      updatedAssignment,
      service.name,
      service.description,
      service.duration,
      service.price,
    );
  }

  async removeServiceFromStylist(stylistId: string, serviceId: string): Promise<void> {
    // Verificar que existe la asignación
    const exists = await this.stylistServiceRepository.existsAssignment(stylistId, serviceId);
    if (!exists) {
      throw new NotFoundError('Stylist service assignment', `${stylistId}-${serviceId}`);
    }

    await this.stylistServiceRepository.delete(stylistId, serviceId);
  }

  async getServiceStylists(serviceId: string): Promise<StylistServiceDto[]> {
    // Verificar que el servicio existe
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findByService(serviceId);
    return assignments.map((assignment) =>
      this.mapStylistServiceToDto(
        assignment,
        service.name,
        service.description,
        service.duration,
        service.price,
      ),
    );
  }

  async getStylistsOfferingService(serviceId: string): Promise<StylistServiceDto[]> {
    // Verificar que el servicio existe
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findStylistsOfferingService(serviceId);
    return assignments.map((assignment) =>
      this.mapStylistServiceToDto(
        assignment,
        service.name,
        service.description,
        service.duration,
        service.price,
      ),
    );
  }

  async getServiceWithStylists(serviceId: string): Promise<ServiceWithStylistsDto> {
    // Verificar que el servicio existe
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundError('Service', serviceId);
    }

    const assignments = await this.stylistServiceRepository.findByService(serviceId);
    const stylists = assignments.map((assignment) =>
      this.mapStylistServiceToDto(
        assignment,
        service.name,
        service.description,
        service.duration,
        service.price,
      ),
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

  private async mapAssignmentsWithServiceInfo(
    assignments: StylistService[],
  ): Promise<StylistServiceDto[]> {
    const serviceIds = [...new Set(assignments.map((a) => a.serviceId))];
    const services = await Promise.all(serviceIds.map((id) => this.serviceRepository.findById(id)));

    const serviceMap = new Map(
      services.filter((service) => service !== null).map((service) => [service!.id, service!]),
    );

    return assignments.map((assignment) => {
      const service = serviceMap.get(assignment.serviceId);
      if (!service) {
        throw new Error(`Service not found for assignment ${assignment.serviceId}`);
      }
      return this.mapStylistServiceToDto(
        assignment,
        service.name,
        service.description,
        service.duration,
        service.price,
      );
    });
  }

  private validateAssignServiceDto(dto: AssignServiceDto): void {
    if (!dto.serviceId || dto.serviceId.trim().length === 0) {
      throw new ValidationError('Service ID is required');
    }

    if (dto.customPrice !== undefined && dto.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }
  }

  private validateUpdateStylistServiceDto(dto: UpdateStylistServiceDto): void {
    if (dto.customPrice !== undefined && dto.customPrice < 0) {
      throw new ValidationError('Custom price cannot be negative');
    }

    if (Object.keys(dto).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }
  }

  private mapStylistServiceToDto(
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
