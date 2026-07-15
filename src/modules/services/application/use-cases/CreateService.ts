import { Service } from '../../domain/entities/Service';
import { Category } from '../../domain/entities/Category';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { CreateServiceDto } from '../dto/request/CreateServiceDto';
import { ServiceDto } from '../dto/response/ServiceDto';

/**
 * Caso de uso para crear un nuevo servicio en el sistema
 * Valida datos, verifica existencia de categoría y unicidad del nombre
 */
export class CreateService {
  constructor(
    private serviceRepository: IServiceRepository,
    private categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Ejecuta la creación de un nuevo servicio
   * @param createDto - Datos para crear el nuevo servicio
   * @returns Promise con los datos del servicio creado incluyendo información de categoría
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la categoría no existe
   * @throws ConflictError si ya existe un servicio con ese nombre
   */
  async execute(createDto: CreateServiceDto): Promise<ServiceDto> {
    if (!createDto.name || createDto.name.trim().length === 0) {
      throw new ValidationError('Service name is required');
    }

    if (createDto.name.length > 150) {
      throw new ValidationError('Service name is too long (max 150 characters)');
    }

    if (!createDto.description || createDto.description.trim().length === 0) {
      throw new ValidationError('Service description is required');
    }

    if (createDto.description.length > 1000) {
      throw new ValidationError('Service description is too long (max 1000 characters)');
    }

    if (!createDto.categoryId || createDto.categoryId.trim().length === 0) {
      throw new ValidationError('Category ID is required');
    }

    if (createDto.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (createDto.duration > 600) {
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (createDto.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    if (createDto.durationVariation > createDto.duration) {
      throw new ValidationError('Duration variation cannot exceed base duration');
    }

    if (createDto.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }

    const category = await this.categoryRepository.findById(createDto.categoryId);
    if (!category) {
      throw new NotFoundError('Category', createDto.categoryId);
    }

    const existingService = await this.serviceRepository.existsByName(createDto.name);
    if (existingService) {
      throw new ConflictError(`Service with name '${createDto.name}' already exists`);
    }

    const service = Service.create(
      createDto.categoryId,
      createDto.name.trim(),
      createDto.description.trim(),
      createDto.duration,
      createDto.durationVariation,
      createDto.price,
    );

    const savedService = await this.serviceRepository.save(service);

    return this.mapToDto(savedService, category);
  }

  /**
   * Convierte una entidad Service a su representación DTO con información de categoría
   * @param service - Entidad de servicio a convertir
   * @param category - Entidad de categoría asociada
   * @returns Objeto DTO con los datos completos del servicio
   */
  private mapToDto(service: Service, category: Category): ServiceDto {
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
