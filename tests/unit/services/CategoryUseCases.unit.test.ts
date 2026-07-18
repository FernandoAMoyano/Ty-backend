import { CreateCategory } from '../../../src/modules/services/application/use-cases/CreateCategory';
import { UpdateCategory } from '../../../src/modules/services/application/use-cases/UpdateCategory';
import { GetCategoryById } from '../../../src/modules/services/application/use-cases/GetCategoryById';
import { GetAllCategories } from '../../../src/modules/services/application/use-cases/GetAllCategories';
import { GetActiveCategories } from '../../../src/modules/services/application/use-cases/GetActiveCategories';
import { ActivateCategory } from '../../../src/modules/services/application/use-cases/ActivateCategory';
import { DeactivateCategory } from '../../../src/modules/services/application/use-cases/DeactivateCategory';
import { DeleteCategory } from '../../../src/modules/services/application/use-cases/DeleteCategory';
import { ICategoryRepository } from '../../../src/modules/services/domain/repositories/ICategoryRepository';
import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';
import { BusinessRuleError } from '../../../src/shared/exceptions/BusinessRuleError';

describe('Category Use Cases', () => {
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockServiceRepository: any;

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

    mockServiceRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      findByCategory: jest.fn(),
      findActiveByCategoryId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
    };
  });

  describe('CreateCategory', () => {
    let createCategory: CreateCategory;

    beforeEach(() => {
      createCategory = new CreateCategory(mockCategoryRepository);
    });

    const validCreateDto = {
      name: 'Hair Services',
      description: 'Professional hair styling services',
    };

    // Debería crear la categoría exitosamente
    it('should create category successfully', async () => {
      const mockCategory = Category.create(validCreateDto.name, validCreateDto.description);
      mockCategoryRepository.existsByName.mockResolvedValue(false);
      mockCategoryRepository.save.mockResolvedValue(mockCategory);

      const result = await createCategory.execute(validCreateDto);

      expect(mockCategoryRepository.existsByName).toHaveBeenCalledWith(validCreateDto.name);
      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(validCreateDto.name);
      expect(result.description).toBe(validCreateDto.description);
    });

    // Debería lanzar ValidationError si el nombre está vacío
    it('should throw ValidationError for empty name', async () => {
      const invalidDto = { ...validCreateDto, name: '' };
      await expect(createCategory.execute(invalidDto)).rejects.toThrow(ValidationError);
    });

    // Debería lanzar ConflictError si el nombre ya existe
    it('should throw ConflictError if name already exists', async () => {
      mockCategoryRepository.existsByName.mockResolvedValue(true);
      await expect(createCategory.execute(validCreateDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('UpdateCategory', () => {
    let updateCategory: UpdateCategory;

    beforeEach(() => {
      updateCategory = new UpdateCategory(mockCategoryRepository);
    });

    const validUpdateDto = {
      name: 'Updated Hair Services',
      description: 'Updated description',
    };

    // Debería actualizar la categoría exitosamente
    it('should update category successfully', async () => {
      const existingCategory = Category.create('Hair Services', 'Original description');
      const updatedCategory = Category.create(validUpdateDto.name!, validUpdateDto.description);

      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.existsByName.mockResolvedValue(false);
      mockCategoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await updateCategory.execute('test-id', validUpdateDto);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.name).toBe(validUpdateDto.name);
    });

    // Debería lanzar NotFoundError si la categoría no existe
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(updateCategory.execute('non-existent-id', validUpdateDto)).rejects.toThrow(NotFoundError);
    });

    // Debería lanzar ConflictError si el nuevo nombre ya existe
    it('should throw ConflictError if new name already exists', async () => {
      const existingCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(existingCategory);
      mockCategoryRepository.existsByName.mockResolvedValue(true);
      await expect(updateCategory.execute('test-id', validUpdateDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('GetCategoryById', () => {
    let getCategoryById: GetCategoryById;

    beforeEach(() => {
      getCategoryById = new GetCategoryById(mockCategoryRepository);
    });

    // Debería devolver la categoría cuando existe
    it('should return category when found', async () => {
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await getCategoryById.execute('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result.id).toBe(mockCategory.id);
    });

    // Debería lanzar NotFoundError cuando la categoría no existe
    it('should throw NotFoundError when category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(getCategoryById.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('GetAllCategories', () => {
    let getAllCategories: GetAllCategories;

    beforeEach(() => {
      getAllCategories = new GetAllCategories(mockCategoryRepository);
    });

    // Debería devolver todas las categorías
    it('should return all categories', async () => {
      const mockCategories = [Category.create('Hair Services'), Category.create('Nail Services')];
      mockCategoryRepository.findAll.mockResolvedValue(mockCategories);

      const result = await getAllCategories.execute();

      expect(mockCategoryRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    // Debería excluir categorías inactivas por defecto (CAT-11: listado público)
    it('should exclude inactive categories by default (CAT-11)', async () => {
      const activeCategory = Category.create('Hair Services');
      const inactiveCategory = Category.create('Discontinued Services');
      inactiveCategory.deactivate();
      mockCategoryRepository.findAll.mockResolvedValue([activeCategory, inactiveCategory]);

      const result = await getAllCategories.execute();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hair Services');
    });

    // Debería incluir también las inactivas cuando includeInactive es true (CAT-11, uso administrativo)
    it('should include inactive categories when includeInactive is true (CAT-11)', async () => {
      const activeCategory = Category.create('Hair Services');
      const inactiveCategory = Category.create('Discontinued Services');
      inactiveCategory.deactivate();
      mockCategoryRepository.findAll.mockResolvedValue([activeCategory, inactiveCategory]);

      const result = await getAllCategories.execute(true);

      expect(result).toHaveLength(2);
    });
  });

  describe('GetActiveCategories', () => {
    let getActiveCategories: GetActiveCategories;

    beforeEach(() => {
      getActiveCategories = new GetActiveCategories(mockCategoryRepository);
    });

    // Debería devolver solo las categorías activas
    it('should return only active categories', async () => {
      const mockCategories = [Category.create('Hair Services'), Category.create('Nail Services')];
      mockCategoryRepository.findActive.mockResolvedValue(mockCategories);

      const result = await getActiveCategories.execute();

      expect(mockCategoryRepository.findActive).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('ActivateCategory', () => {
    let activateCategory: ActivateCategory;

    beforeEach(() => {
      activateCategory = new ActivateCategory(mockCategoryRepository);
    });

    // Debería activar la categoría exitosamente
    it('should activate category successfully', async () => {
      const category = Category.create('Hair Services');
      category.deactivate();

      mockCategoryRepository.findById.mockResolvedValue(category);
      mockCategoryRepository.update.mockResolvedValue(category);

      const result = await activateCategory.execute('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(true);
    });

    // Debería lanzar NotFoundError si la categoría no existe
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(activateCategory.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('DeactivateCategory', () => {
    let deactivateCategory: DeactivateCategory;

    beforeEach(() => {
      deactivateCategory = new DeactivateCategory(mockCategoryRepository);
    });

    // Debería desactivar la categoría exitosamente
    it('should deactivate category successfully', async () => {
      const category = Category.create('Hair Services');

      mockCategoryRepository.findById.mockResolvedValue(category);
      mockCategoryRepository.update.mockResolvedValue(category);

      const result = await deactivateCategory.execute('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.update).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });

  describe('DeleteCategory', () => {
    let deleteCategory: DeleteCategory;

    beforeEach(() => {
      deleteCategory = new DeleteCategory(mockCategoryRepository, mockServiceRepository);
    });

    // Debería eliminar la categoría exitosamente
    it('should delete category successfully', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(true);
      mockServiceRepository.findByCategory.mockResolvedValue([]);
      mockCategoryRepository.delete.mockResolvedValue();

      await deleteCategory.execute('test-id');

      expect(mockCategoryRepository.existsById).toHaveBeenCalledWith('test-id');
      expect(mockServiceRepository.findByCategory).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('test-id');
    });

    // Debería lanzar NotFoundError si la categoría no existe
    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(false);
      await expect(deleteCategory.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    // Debería lanzar BusinessRuleError si la categoría tiene servicios asociados
    it('should throw BusinessRuleError if category has associated services', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(true);
      mockServiceRepository.findByCategory.mockResolvedValue([{ id: 'service-1' }]);

      await expect(deleteCategory.execute('test-id')).rejects.toThrow(BusinessRuleError);
      expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
    });
  });
});
