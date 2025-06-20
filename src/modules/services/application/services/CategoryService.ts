import { Category } from '../../domain/entities/Category';
import { CategoryRepository } from '../../domain/repositories/CategoryRepository';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { CreateCategoryDto } from '../dto/request/CreateCategoryDto';
import { CategoryDto } from '../dto/response/CategoryDto';
import { UpdateCategoryDto } from '../dto/request/UpdateCategoryDto ';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async createCategory(createDto: CreateCategoryDto): Promise<CategoryDto> {
    // Validaciones
    this.validateCreateCategoryDto(createDto);

    // Verificar que el nombre no exista
    const existingCategory = await this.categoryRepository.existsByName(createDto.name);
    if (existingCategory) {
      throw new ConflictError(`Category with name '${createDto.name}' already exists`);
    }

    // Crear categoría
    const category = Category.create(createDto.name.trim(), createDto.description?.trim());

    // Guardar
    const savedCategory = await this.categoryRepository.save(category);

    return this.mapCategoryToDto(savedCategory);
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto): Promise<CategoryDto> {
    // Validaciones
    this.validateUpdateCategoryDto(updateDto);

    // Verificar que la categoría existe
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    // Verificar nombre único si se está cambiando
    if (updateDto.name && updateDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.existsByName(updateDto.name);
      if (existingCategory) {
        throw new ConflictError(`Category with name '${updateDto.name}' already exists`);
      }
    }

    // Actualizar
    category.updateInfo(
      updateDto.name ?? category.name,
      updateDto.description !== undefined ? updateDto.description : category.description,
    );

    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapCategoryToDto(updatedCategory);
  }

  async getCategoryById(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    return this.mapCategoryToDto(category);
  }

  async getAllCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.mapCategoryToDto(category));
  }

  async getActiveCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findActive();
    return categories.map((category) => this.mapCategoryToDto(category));
  }

  async activateCategory(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.activate();
    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapCategoryToDto(updatedCategory);
  }

  async deactivateCategory(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.deactivate();
    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapCategoryToDto(updatedCategory);
  }

  async deleteCategory(id: string): Promise<void> {
    const exists = await this.categoryRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Category', id);
    }

    await this.categoryRepository.delete(id);
  }

  private validateCreateCategoryDto(dto: CreateCategoryDto): void {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new ValidationError('Category name is required');
    }

    if (dto.name.length > 100) {
      throw new ValidationError('Category name is too long (max 100 characters)');
    }

    if (dto.description && dto.description.length > 500) {
      throw new ValidationError('Category description is too long (max 500 characters)');
    }
  }

  private validateUpdateCategoryDto(dto: UpdateCategoryDto): void {
    if (dto.name !== undefined && (!dto.name || dto.name.trim().length === 0)) {
      throw new ValidationError('Category name cannot be empty');
    }

    if (dto.name && dto.name.length > 100) {
      throw new ValidationError('Category name is too long (max 100 characters)');
    }

    if (dto.description && dto.description.length > 500) {
      throw new ValidationError('Category description is too long (max 500 characters)');
    }
  }

  private mapCategoryToDto(category: Category): CategoryDto {
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
