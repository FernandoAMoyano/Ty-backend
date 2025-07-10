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

  /**
   * Crea una nueva categoría en el sistema con validaciones completas
   * @param createDto - Datos para crear la nueva categoría
   * @returns Promise con los datos de la categoría creada
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si ya existe una categoría con ese nombre
   */
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

  /**
   * Actualiza una categoría existente con nuevos datos
   * @param id - ID único de la categoría a actualizar
   * @param updateDto - Datos parciales para actualizar la categoría
   * @returns Promise con los datos de la categoría actualizada
   * @throws NotFoundError si la categoría no existe
   * @throws ValidationError si los datos no son válidos
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
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

  /**
   * Obtiene una categoría específica por su ID único
   * @param id - ID único de la categoría a buscar
   * @returns Promise con los datos de la categoría encontrada
   * @throws NotFoundError si la categoría no existe
   */
  async getCategoryById(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    return this.mapCategoryToDto(category);
  }

  /**
   * Obtiene todas las categorías del sistema (activas e inactivas)
   * @returns Promise con la lista completa de categorías
   */
  async getAllCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findAll();
    return categories.map((category) => this.mapCategoryToDto(category));
  }

  /**
   * Obtiene solo las categorías que están activas
   * @returns Promise con la lista de categorías activas
   */
  async getActiveCategories(): Promise<CategoryDto[]> {
    const categories = await this.categoryRepository.findActive();
    return categories.map((category) => this.mapCategoryToDto(category));
  }

  /**
   * Activa una categoría previamente desactivada
   * @param id - ID único de la categoría a activar
   * @returns Promise con los datos de la categoría activada
   * @throws NotFoundError si la categoría no existe
   */
  async activateCategory(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.activate();
    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapCategoryToDto(updatedCategory);
  }

  /**
   * Desactiva una categoría sin eliminarla del sistema
   * @param id - ID único de la categoría a desactivar
   * @returns Promise con los datos de la categoría desactivada
   * @throws NotFoundError si la categoría no existe
   */
  async deactivateCategory(id: string): Promise<CategoryDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category', id);
    }

    category.deactivate();
    const updatedCategory = await this.categoryRepository.update(category);

    return this.mapCategoryToDto(updatedCategory);
  }

  /**
   * Elimina permanentemente una categoría del sistema
   * @param id - ID único de la categoría a eliminar
   * @throws NotFoundError si la categoría no existe
   */
  async deleteCategory(id: string): Promise<void> {
    const exists = await this.categoryRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('Category', id);
    }

    await this.categoryRepository.delete(id);
  }

  /**
   * Valida los datos de entrada para crear una nueva categoría
   * @param dto - Datos de creación a validar
   * @throws ValidationError si algún campo es inválido
   */
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

  /**
   * Valida los datos de entrada para actualizar una categoría
   * @param dto - Datos de actualización a validar
   * @throws ValidationError si algún campo es inválido
   */
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

  /**
   * Convierte una entidad Category a su representación DTO
   * @param category - Entidad de dominio a convertir
   * @returns Objeto DTO con los datos de la categoría
   */
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
