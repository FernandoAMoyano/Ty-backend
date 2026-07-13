import { Service } from '../../domain/entities/Service';
import { Category } from '../../domain/entities/Category';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { ServiceDto } from '../dto/response/ServiceDto';

/**
 * Caso de uso para obtener solo los servicios activos del sistema
 */
export class GetActiveServices {
  constructor(
    private serviceRepository: IServiceRepository,
    private categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Ejecuta la obtención de servicios activos
   * @returns Promise con la lista de servicios activos con información de categorías
   */
  async execute(): Promise<ServiceDto[]> {
    const services = await this.serviceRepository.findActive();
    return this.mapServicesWithCategories(services);
  }

  /**
   * Mapea una lista de servicios con sus categorías de forma eficiente
   * @param services - Lista de servicios a mapear
   * @returns Promise con la lista de DTOs de servicios
   */
  private async mapServicesWithCategories(services: Service[]): Promise<ServiceDto[]> {
    const categoryIds = [...new Set(services.map((s) => s.categoryId))];
    const categories = await Promise.all(
      categoryIds.map((id) => this.categoryRepository.findById(id)),
    );

    const categoryMap = new Map(
      categories.filter((cat) => cat !== null).map((cat) => [cat!.id, cat!]),
    );

    return services.map((service) => {
      const category = categoryMap.get(service.categoryId);
      if (!category) throw new Error(`Category not found for service ${service.id}`);
      return this.mapToDto(service, category);
    });
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
