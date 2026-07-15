import { Service } from '../../domain/entities/Service';
import { Category } from '../../domain/entities/Category';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ServiceDto } from '../dto/response/ServiceDto';

/**
 * Caso de uso para obtener todos los servicios de una categoría específica
 */
export class GetServicesByCategory {
  constructor(
    private serviceRepository: IServiceRepository,
    private categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Ejecuta la búsqueda de servicios por categoría
   * @param categoryId - ID único de la categoría
   * @returns Promise con la lista de servicios de la categoría
   * @throws NotFoundError si la categoría no existe
   */
  async execute(categoryId: string): Promise<ServiceDto[]> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }

    const services = await this.serviceRepository.findByCategory(categoryId);
    return services.map((service) => this.mapToDto(service, category));
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
