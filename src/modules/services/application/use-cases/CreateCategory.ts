import { Category } from '../../domain/entities/Category';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { CreateCategoryDto } from '../dto/request/CreateCategoryDto';
import { CategoryDto } from '../dto/response/CategoryDto';

/**
 * Caso de uso para crear una nueva categoría en el sistema
 * Valida los datos de entrada, verifica unicidad del nombre y persiste la entidad
 */
export class CreateCategory {
  constructor(private categoryRepository: CategoryRepository) {}

  /**
   * Ejecuta la creación de una nueva categoría
   * @param createDto - Datos para crear la nueva categoría
   * @returns Promise con los datos de la categoría creada
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si ya existe una categoría con ese nombre
   */
  async execute(createDto: CreateCategoryDto): Promise<CategoryDto> {
    if (!createDto.name || createDto.name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    if (createDto.name.length > 100) {
      throw new ValidationError('Category name is too long (max 100 characters)');
    }

    if (createDto.description && createDto.description.length > 500) {
      throw new ValidationError('Category description is too long (max 500 characters)');
    }

    const existingCategory = await this.categoryRepository.existsByName(createDto.name);
    if (existingCategory) {
      throw new ConflictError(`Category with name '${createDto.name}' already exists`);
    }

    const category = Category.create(createDto.name.trim(), createDto.description?.trim());
    const savedCategory = await this.categoryRepository.save(category);

    return this.mapToDto(savedCategory);
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
