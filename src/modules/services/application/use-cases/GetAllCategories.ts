import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { CategoryDto } from '../dto/response/CategoryDto';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de uso para obtener todas las categorías del sistema
 */
export class GetAllCategories {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Ejecuta la obtención de todas las categorías
   * @returns Promise con la lista completa de categorías
   */
  async execute(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.mapToDto(category));
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
