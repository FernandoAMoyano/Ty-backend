import { CategoryService } from '../../../src/modules/services/application/services/CategoryService';
import { CategoryRepository } from '../../../src/modules/services/domain/repositories/CategoryRepository';
import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    mockCategoryRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
    };

    categoryService = new CategoryService(mockCategoryRepository);
  });

  describe('createCategory', () => {
    const validCreateDto = {
      name: 'Hair Services',
      description: 'Professional hair styling services',
    };

    // Debería crear categoría exitosamente
    it('should create category successfully', async () => {
      const mockCategory = Category.create(validCreateDto.name, validCreateDto.description);
      mockCategoryRepository.existsByName.mockResolvedValue(false);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory(validCreateDto);

      expect(mockCategoryRepository.existsByName).toHaveBeenCalledWith(validCreateDto.name);
      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(validCreateDto.name);
      expect(result.description).toBe(validCreateDto.description);
    });

    // Debería lanzar ValidationError para nombre vacío
    it('should throw ValidationError for empty name', async () => {
      const invalidDto = { ...validCreateDto, name: '' };

      await expect(categoryService.createCategory(invalidDto)).rejects.toThrow(ValidationError);
    });

    // Debería lanzar ConflictError si el nombre ya existe
    it('should throw ConflictError if name already exists', async () => {
      mockCategoryRepository.existsByName.mockResolvedValue(true);

      await expect(categoryService.createCategory(validCreateDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateCategory', () => {
    const validUpdateDto = {
      name: 'Updated Hair Services',
      description: 'Updated description',
    };

    // Debería actualizar categoría exitosamente
    it('should update category successfully', async () => {
      const existingCategory = Category.create('Hair Services', 'Original description');
      const updatedCategory = Category.create(validUpdateDto.name!, validUpdateDto.description);

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.existsByName.mockResolvedValue(false);
      mockCategoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory('test-id', validUpdateDto);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.name).toBe(validUpdateDto.name);
    });

    // Debería lanzar NotFoundError si la categoría no se encuentra
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory('non-existent-id', validUpdateDto),
      ).rejects.toThrow(NotFoundError);
    });

    // Debería lanzar ConflictError si el nuevo nombre ya existe
    it('should throw ConflictError if new name already exists', async () => {
      const existingCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.existsByName.mockResolvedValue(true);

      await expect(categoryService.updateCategory('test-id', validUpdateDto)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('getCategoryById', () => {
    // Debería devolver categoría cuando se encuentra
    it('should return category when found', async () => {
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result.id).toBe(mockCategory.id);
    });

    // Debería lanzar NotFoundError cuando la categoría no se encuentra
    it('should throw NotFoundError when category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.getCategoryById('non-existent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getAllCategories', () => {
    // Debería devolver todas las categorías
    it('should return all categories', async () => {
      const mockCategories = [Category.create('Hair Services'), Category.create('Nail Services')];
      mockCategoryRepository.findAll.mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories();

      expect(mockCategoryRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getActiveCategories', () => {
    // Debería devolver solo las categorías activas
    it('should return only active categories', async () => {
      const mockCategories = [Category.create('Hair Services'), Category.create('Nail Services')];
      mockCategoryRepository.findActive.mockResolvedValue(mockCategories);

      const result = await categoryService.getActiveCategories();

      expect(mockCategoryRepository.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('activateCategory', () => {
    // Debería activar categoría exitosamente
    it('should activate category successfully', async () => {
      const category = Category.create('Hair Services');
      category.deactivate();

      mockCategoryRepository.findById.mockResolvedValue(category);
      mockCategoryRepository.update.mockResolvedValue(category);

      const result = await categoryService.activateCategory('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    //Debería lanzar NotFoundError si no se encuentra la categoría
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(categoryService.activateCategory('non-existent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('deactivateCategory', () => {
    // Debería desactivar categoría exitosamente
    it('should deactivate category successfully', async () => {
      const category = Category.create('Hair Services');

      mockCategoryRepository.findById.mockResolvedValue(category);
      mockCategoryRepository.update.mockResolvedValue(category);

      const result = await categoryService.deactivateCategory('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteCategory', () => {
    // Debería eliminar categoría exitosamente
    it('should delete category successfully', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(true);
      mockCategoryRepository.delete.mockResolvedValue();

      await categoryService.deleteCategory('test-id');

      expect(mockCategoryRepository.existsById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('test-id');
    });

    //Debería lanzar NotFoundError si no se encuentra la categoría
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(false);

      await expect(categoryService.deleteCategory('non-existent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
