import { Service } from '../../domain/entities/Service';
import { ServiceRepository } from '../../domain/repositories/ServiceRepository';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ServiceDto } from '../dto/response/ServiceDto';

/**
 * Caso de uso para desactivar un servicio sin eliminarlo del sistema
 */
export class DeactivateService {
  constructor(
    private serviceRepository: ServiceRepository,
    private categoryRepository: CategoryRepository,
  ) {}

  /**
   * Ejecuta la desactivación de un servicio
   * @param id - ID único del servicio a desactivar
   * @returns Promise con los datos del servicio desactivado
   * @throws NotFoundError si el servicio no existe
   */
  async execute(id: string): Promise<ServiceDto> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }

    service.deactivate();
    const updatedService = await this.serviceRepository.update(service);

    const category = await this.categoryRepository.findById(service.categoryId);
    return this.mapToDto(updatedService, category!);
  }

  /**
   * Convierte una entidad Service a su representación DTO con información de categoría
   * @param service - Entidad de servicio a convertir
   * @param category - Entidad de categoría asociada
   * @returns Objeto DTO con los datos completos del servicio
   */
  private mapToDto(service: Service, category: any): ServiceDto {
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
