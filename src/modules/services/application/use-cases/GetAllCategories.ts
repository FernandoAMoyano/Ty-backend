import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { CategoryDto } from '../dto/response/CategoryDto';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de uso para obtener las categorías del sistema
 * @description Endpoint público (GET /categories). Por defecto excluye las
 * categorías inactivas (CAT-11), ya que este es el listado público — usar
 * `includeInactive: true` para obtener también las inactivas (uso administrativo)
 */
export class GetAllCategories {
  constructor(private categoryRepository: ICategoryRepository) {}

  /**
   * Ejecuta la obtención de categorías
   * @param includeInactive - Si es true, incluye también las categorías inactivas.
   * Por defecto false (solo activas, ver CAT-11)
   * @returns Promise con la lista de categorías
   */
  async execute(includeInactive = false): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findAll();
    const filtered = includeInactive ? categories : categories.filter((c) => c.isActive);
    return filtered.map((category) => this.mapToDto(category));
  }

  /**
   * Convierte una entidad Category a su representación DTO
   * @param category - Entidad de dominio a convertir
   * @returns Objeto DTO con los datos de la categoría
   */
  private mapToDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
