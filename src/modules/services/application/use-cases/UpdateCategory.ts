import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { UpdateCategoryDto } from '../dto/request/UpdateCategoryDto';
import { CategoryDto } from '../dto/response/CategoryDto';
import { Category } from '../../domain/entities/Category';

/**
 * Caso de uso para actualizar una categoría existente
 * Valida los datos de entrada, verifica unicidad del nombre y actualiza la entidad
 */
export class UpdateCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Ejecuta la actualización de una categoría existente
   * @param id - ID único de la categoría a actualizar
   * @param updateDto - Datos parciales para actualizar la categoría
   * @returns Promise con los datos de la categoría actualizada
   * @throws NotFoundError si la categoría no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  async execute(id: string, updateDto: UpdateCategoryDto): Promise<CategoryDto> {
    if (updateDto.name !== undefined && (!updateDto.name || updateDto.name.trim().length === 0)) {
      throw new ValidationError('Category name cannot be empty');
    }

    if (updateDto.name && updateDto.name.length > 100) {
      throw new ValidationError('Category name is too long (max 100 characters)');
    }

    if (updateDto.description && updateDto.description.length > 500) {
      throw new ValidationError('Category description is too long (max 500 characters)');
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    if (updateDto.name && updateDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.existsByName(updateDto.name);
      if (existingCategory) {
        throw new ConflictError(`Category with name '${updateDto.name}' already exists`);
      }
    }

    category.updateInfo(
      updateDto.name ?? category.name,
      updateDto.description !== undefined ? updateDto.description : category.description,
    );

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
