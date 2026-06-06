import { CreateCategory } from '../../../src/modules/services/application/use-cases/CreateCategory';
import { UpdateCategory } from '../../../src/modules/services/application/use-cases/UpdateCategory';
import { GetCategoryById } from '../../../src/modules/services/application/use-cases/GetCategoryById';
import { GetAllCategories } from '../../../src/modules/services/application/use-cases/GetAllCategories';
import { GetActiveCategories } from '../../../src/modules/services/application/use-cases/GetActiveCategories';
import { ActivateCategory } from '../../../src/modules/services/application/use-cases/ActivateCategory';
import { DeactivateCategory } from '../../../src/modules/services/application/use-cases/DeactivateCategory';
import { DeleteCategory } from '../../../src/modules/services/application/use-cases/DeleteCategory';
import { CategoryRepository } from '../../../src/modules/services/domain/repositories/CategoryRepository';
import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('Category Use Cases', () => {
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

    it('should throw ValidationError for empty name', async () => {
      const invalidDto = { ...validCreateDto, name: '' };
      await expect(createCategory.execute(invalidDto)).rejects.toThrow(ValidationError);
    });

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

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(updateCategory.execute('non-existent-id', validUpdateDto)).rejects.toThrow(NotFoundError);
    });

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

    it('should return category when found', async () => {
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await getCategoryById.execute('test-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result.id).toBe(mockCategory.id);
    });

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

    it('should return all categories', async () => {
      const mockCategories = [Category.create('Hair Services'), Category.create('Nail Services')];
      mockCategoryRepository.findAll.mockResolvedValue(mockCategories);

      const result = await getAllCategories.execute();

      expect(mockCategoryRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('GetActiveCategories', () => {
    let getActiveCategories: GetActiveCategories;

    beforeEach(() => {
      getActiveCategories = new GetActiveCategories(mockCategoryRepository);
    });

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
      deleteCategory = new DeleteCategory(mockCategoryRepository);
    });

    it('should delete category successfully', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(true);
      mockCategoryRepository.delete.mockResolvedValue();

      await deleteCategory.execute('test-id');

      expect(mockCategoryRepository.existsById).toHaveBeenCalledWith('test-id');
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('test-id');
    });

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.existsById.mockResolvedValue(false);
      await expect(deleteCategory.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });
});
