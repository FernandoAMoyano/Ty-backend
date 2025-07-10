import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { CreateServiceDto } from '../dto/request/CreateServiceDto';
import { ServiceDto } from '../dto/response/ServiceDto';
import { UpdateServiceDto } from '../dto/request/UpdateServiceDto';

export class ServiceManagementService {
  constructor(
    private serviceRepository: ServiceRepository,
    private categoryRepository: CategoryRepository,
  ) {}

  /**
   * Crea un nuevo servicio en el sistema con validaciones completas
   * @param createDto - Datos para crear el nuevo servicio
   * @returns Promise con los datos del servicio creado incluyendo información de categoría
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la categoría no existe
   * @throws ConflictError si ya existe un servicio con ese nombre
   */
  async createService(createDto: CreateServiceDto): Promise<ServiceDto> {
    // Validaciones
    this.validateCreateServiceDto(createDto);

    // Verificar que la categoría existe
    const category = await this.categoryRepository.findById(createDto.categoryId);
    if (!category) {
      throw new NotFoundError('Category', createDto.categoryId);
    }

    // Verificar que el nombre no exista
    const existingService = await this.serviceRepository.existsByName(createDto.name);
    if (existingService) {
      throw new ConflictError(`Service with name '${createDto.name}' already exists`);
    }

    // Crear servicio
    const service = Service.create(
      createDto.categoryId,
      createDto.name.trim(),
      createDto.description.trim(),
      createDto.duration,
      createDto.durationVariation,
      createDto.price,
    );

    // Guardar
    const savedService = await this.serviceRepository.save(service);

    return this.mapServiceToDto(savedService, category);
  }

  /**
   * Actualiza un servicio existente con nuevos datos
   * @param id - ID único del servicio a actualizar
   * @param updateDto - Datos parciales para actualizar el servicio
   * @returns Promise con los datos del servicio actualizado
   * @throws NotFoundError si el servicio o nueva categoría no existen
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  async updateService(id: string, updateDto: UpdateServiceDto): Promise<ServiceDto> {
    // Validaciones
    this.validateUpdateServiceDto(updateDto);

    // Verificar que el servicio existe
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    // Verificar categoría si se está cambiando
    let category;
    if (updateDto.categoryId && updateDto.categoryId !== service.categoryId) {
      category = await this.categoryRepository.findById(updateDto.categoryId);
      if (!category) {
        throw new NotFoundError('Category', updateDto.categoryId);
      }
    } else {
      category = await this.categoryRepository.findById(service.categoryId);
    }

    // Verificar nombre único si se está cambiando
    if (updateDto.name && updateDto.name !== service.name) {
      const existingService = await this.serviceRepository.existsByName(updateDto.name);
      if (existingService) {
        throw new ConflictError(`Service with name '${updateDto.name}' already exists`);
      }
    }

    // Actualizar servicio
    if (updateDto.categoryId) {
      service.updateCategory(updateDto.categoryId);
    }

    if (
      updateDto.name ||
      updateDto.description ||
      updateDto.duration !== undefined ||
      updateDto.durationVariation !== undefined ||
      updateDto.price !== undefined
    ) {
      service.updateDetails(
        updateDto.name ?? service.name,
        updateDto.description ?? service.description,
        updateDto.duration ?? service.duration,
        updateDto.durationVariation ?? service.durationVariation,
        updateDto.price ?? service.price,
      );
    }

    const updatedService = await this.serviceRepository.update(service);

    return this.mapServiceToDto(updatedService, category!);
  }

  /**
   * Obtiene un servicio específico por su ID único
   * @param id - ID único del servicio a buscar
   * @returns Promise con los datos del servicio encontrado incluyendo información de categoría
   * @throws NotFoundError si el servicio o su categoría no existen
   */
  async getServiceById(id: string): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    const category = await this.categoryRepository.findById(service.categoryId);
    if (!category) {
      throw new NotFoundError('Category', service.categoryId);
    }

    return this.mapServiceToDto(service, category);
  }

  /**
   * Obtiene todos los servicios del sistema (activos e inactivos)
   * @returns Promise con la lista completa de servicios con información de categorías
   */
  async getAllServices(): Promise<ServiceDto[]> {
    const services = await this.serviceRepository.findAll();
    return this.mapServicesWithCategories(services);
  }

  /**
   * Obtiene solo los servicios que están activos
   * @returns Promise con la lista de servicios activos con información de categorías
   */
  async getActiveServices(): Promise<ServiceDto[]> {
    const services = await this.serviceRepository.findActive();
    return this.mapServicesWithCategories(services);
  }

  /**
   * Obtiene todos los servicios de una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise con la lista de servicios de la categoría
   * @throws NotFoundError si la categoría no existe
   */
  async getServicesByCategory(categoryId: string): Promise<ServiceDto[]> {
    // Verificar que la categoría existe
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }

    const services = await this.serviceRepository.findByCategory(categoryId);
    return services.map((service) => this.mapServiceToDto(service, category));
  }

  /**
   * Obtiene solo los servicios activos de una categoría específica
   * @param categoryId - ID único de la categoría
   * @returns Promise con la lista de servicios activos de la categoría
   * @throws NotFoundError si la categoría no existe
   */
  async getActiveServicesByCategory(categoryId: string): Promise<ServiceDto[]> {
    // Verificar que la categoría existe
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }

    const services = await this.serviceRepository.findActiveByCategoryId(categoryId);
    return services.map((service) => this.mapServiceToDto(service, category));
  }

  /**
   * Activa un servicio previamente desactivado
   * @param id - ID único del servicio a activar
   * @returns Promise con los datos del servicio activado
   * @throws NotFoundError si el servicio no existe
   */
  async activateService(id: string): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    service.activate();
    const updatedService = await this.serviceRepository.update(service);

    const category = await this.categoryRepository.findById(service.categoryId);
    return this.mapServiceToDto(updatedService, category!);
  }

  /**
   * Desactiva un servicio sin eliminarlo del sistema
   * @param id - ID único del servicio a desactivar
   * @returns Promise con los datos del servicio desactivado
   * @throws NotFoundError si el servicio no existe
   */
  async deactivateService(id: string): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    service.deactivate();
    const updatedService = await this.serviceRepository.update(service);

    const category = await this.categoryRepository.findById(service.categoryId);
    return this.mapServiceToDto(updatedService, category!);
  }

  /**
   * Elimina permanentemente un servicio del sistema
   * @param id - ID único del servicio a eliminar
   * @throws NotFoundError si el servicio no existe
   */
  async deleteService(id: string): Promise<void> {
    const exists = await this.serviceRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Service', id);
    }

    await this.serviceRepository.delete(id);
  }

  /**
   * Mapea una lista de servicios con sus categorías correspondientes de forma eficiente
   * @param services - Lista de servicios a mapear
   * @returns Promise con la lista de DTOs de servicios con información de categorías
   */
  private async mapServicesWithCategories(services: Service[]): Promise<ServiceDto[]> {
    const categoryIds = [...new Set(services.map((service) => service.categoryId))];
    const categories = await Promise.all(
      categoryIds.map((id) => this.categoryRepository.findById(id)),
    );

    const categoryMap = new Map(
      categories.filter((cat) => cat !== null).map((cat) => [cat!.id, cat!]),
    );

    return services.map((service) => {
      const category = categoryMap.get(service.categoryId);
      if (!category) {
        throw new Error(`Category not found for service ${service.id}`);
      }
      return this.mapServiceToDto(service, category);
    });
  }

  /**
   * Valida los datos de entrada para crear un nuevo servicio
   * @param dto - Datos de creación a validar
   * @throws ValidationError si algún campo es inválido
   */
  private validateCreateServiceDto(dto: CreateServiceDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError('Service name is required');
    }

    if (dto.name.length > 150) {
      throw new ValidationError('Service name is too long (max 150 characters)');
    }

    if (!dto.description || dto.description.trim().length === 0) {
      throw new ValidationError('Service description is required');
    }

    if (dto.description.length > 1000) {
      throw new ValidationError('Service description is too long (max 1000 characters)');
    }

    if (!dto.categoryId || dto.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID is required');
    }

    if (dto.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (dto.duration > 600) {
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (dto.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    if (dto.durationVariation > dto.duration) {
      throw new ValidationError('Duration variation cannot exceed base duration');
    }

    if (dto.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }
  }

  /**
   * Valida los datos de entrada para actualizar un servicio
   * @param dto - Datos de actualización a validar
   * @throws ValidationError si algún campo es inválido
   */
  private validateUpdateServiceDto(dto: UpdateServiceDto): void {
    if (dto.name !== undefined && (!dto.name || dto.name.trim().length === 0)) {
      throw new ValidationError('Service name cannot be empty');
    }

    if (dto.name && dto.name.length > 150) {
      throw new ValidationError('Service name is too long (max 150 characters)');
    }

    if (
      dto.description !== undefined &&
      (!dto.description || dto.description.trim().length === 0)
    ) {
      throw new ValidationError('Service description cannot be empty');
    }

    if (dto.description && dto.description.length > 1000) {
      throw new ValidationError('Service description is too long (max 1000 characters)');
    }

    if (dto.categoryId !== undefined && (!dto.categoryId || dto.categoryId.trim().length === 0)) {
      throw new ValidationError('Category ID cannot be empty');
    }

    if (dto.duration !== undefined && dto.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (dto.duration !== undefined && dto.duration > 600) {
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (dto.durationVariation !== undefined && dto.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    // Validación cruzada: si se proporciona durationVariation, verificar contra duration
    if (dto.durationVariation !== undefined && dto.duration !== undefined) {
      if (dto.durationVariation > dto.duration) {
        throw new ValidationError('Duration variation cannot exceed base duration');
      }
    }

    if (dto.price !== undefined && dto.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }

    // Validar que al menos un campo esté presente para actualización
    const hasValidFields = Object.keys(dto).some(
      (key) => dto[key as keyof UpdateServiceDto] !== undefined,
    );

    if (!hasValidFields) {
      throw new ValidationError('At least one field must be provided for update');
    }
  }

  /**
   * Convierte una entidad Service a su representación DTO con información de categoría
   * @param service - Entidad de servicio a convertir
   * @param category - Entidad de categoría asociada
   * @returns Objeto DTO con los datos completos del servicio
   */
  private mapServiceToDto(service: Service, category: any): ServiceDto {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      durationVariation: service.durationVariation,
      minDuration: service.calculateMinDuration(),
      maxDuration: service.calculateMaxDuration(),
      price: service.price,
      formattedPrice: service.getFormattedPrice(),
      isActive: service.isActive,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}
