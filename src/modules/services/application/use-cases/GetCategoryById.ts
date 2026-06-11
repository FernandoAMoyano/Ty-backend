import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { CategoryDto } from '../dto/response/CategoryDto';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de uso para obtener una categoría específica por su ID
 */
export class GetCategoryById {
  constructor(private categoryRepository: ICategoryRepository) {}

  /**
   * Ejecuta la búsqueda de una categoría por su ID
   * @param id - ID único de la categoría a buscar
   * @returns Promise con los datos de la categoría encontrada
   * @throws NotFoundError si la categoría no existe
   */
  async execute(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    return this.mapToDto(category);
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
