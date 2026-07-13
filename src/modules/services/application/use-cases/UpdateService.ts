import { Service } from '../../domain/entities/Service';
import { Category } from '../../domain/entities/Category';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { UpdateServiceDto } from '../dto/request/UpdateServiceDto';
import { ServiceDto } from '../dto/response/ServiceDto';

/**
 * Caso de uso para actualizar un servicio existente
 * Valida datos, verifica existencia de categoría y unicidad del nombre
 */
export class UpdateService {
  constructor(
    private serviceRepository: IServiceRepository,
    private categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Ejecuta la actualización de un servicio existente
   * @param id - ID único del servicio a actualizar
   * @param updateDto - Datos parciales para actualizar el servicio
   * @returns Promise con los datos del servicio actualizado
   * @throws NotFoundError si el servicio o nueva categoría no existen
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  async execute(id: string, updateDto: UpdateServiceDto): Promise<ServiceDto> {
    if (updateDto.name !== undefined && (!updateDto.name || updateDto.name.trim().length === 0)) {
      throw new ValidationError('Service name cannot be empty');
    }

    if (updateDto.name && updateDto.name.length > 150) {
      throw new ValidationError('Service name is too long (max 150 characters)');
    }

    if (
      updateDto.description !== undefined &&
      (!updateDto.description || updateDto.description.trim().length === 0)
    ) {
      throw new ValidationError('Service description cannot be empty');
    }

    if (updateDto.description && updateDto.description.length > 1000) {
      throw new ValidationError('Service description is too long (max 1000 characters)');
    }

    if (updateDto.duration !== undefined && updateDto.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (updateDto.duration !== undefined && updateDto.duration > 600) {
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (updateDto.durationVariation !== undefined && updateDto.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    if (updateDto.durationVariation !== undefined && updateDto.duration !== undefined) {
      if (updateDto.durationVariation > updateDto.duration) {
        throw new ValidationError('Duration variation cannot exceed base duration');
      }
    }

    if (updateDto.price !== undefined && updateDto.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }

    const hasValidFields = Object.keys(updateDto).some(
      (key) => updateDto[key as keyof UpdateServiceDto] !== undefined,
    );

    if (!hasValidFields) {
      throw new ValidationError('At least one field must be provided for update');
    }

    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    let category;
    if (updateDto.categoryId && updateDto.categoryId !== service.categoryId) {
      category = await this.categoryRepository.findById(updateDto.categoryId);
      if (!category) {
        throw new NotFoundError('Category', updateDto.categoryId);
      }
    } else {
      category = await this.categoryRepository.findById(service.categoryId);
    }

    if (updateDto.name && updateDto.name !== service.name) {
      const existingService = await this.serviceRepository.existsByName(updateDto.name);
      if (existingService) {
        throw new ConflictError(`Service with name '${updateDto.name}' already exists`);
      }
    }

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

    return this.mapToDto(updatedService, category!);
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
