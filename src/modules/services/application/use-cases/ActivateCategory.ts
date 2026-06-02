import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { CategoryDto } from '../dto/response/CategoryDto';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de uso para activar una categoría previamente desactivada
 */
export class ActivateCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Ejecuta la activación de una categoría
   * @param id - ID único de la categoría a activar
   * @returns Promise con los datos de la categoría activada
   * @throws NotFoundError si la categoría no existe
   */
  async execute(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.activate();
    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapToDto(updatedCategory);
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
