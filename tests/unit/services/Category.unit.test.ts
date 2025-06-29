import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';

describe('Category Entity', () => {
  describe('Creation', () => {
    it('should create a category with valid data', () => {
      const category = Category.create('Hair Services', 'Professional hair styling services');

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Hair Services');
      expect(category.description).toBe('Professional hair styling services');
      expect(category.isActive).toBe(true);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a category without description', () => {
      const category = Category.create('Hair Services');

      expect(category.name).toBe('Hair Services');
      expect(category.description).toBeUndefined();
      expect(category.isActive).toBe(true);
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        Category.create('');
      }).toThrow(ValidationError);
    });

    it('should throw error if name is too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => {
        Category.create(longName);
      }).toThrow(ValidationError);
    });

    it('should throw error if description is too long', () => {
      const longDescription = 'a'.repeat(501);
      expect(() => {
        Category.create('Valid Name', longDescription);
      }).toThrow(ValidationError);
    });
  });

  describe('Updates', () => {
    let category: Category;

    beforeEach(() => {
      category = Category.create('Hair Services', 'Original description');
    });

    it('should update category info', async () => {
      const originalUpdatedAt = category.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 1));

      category.updateInfo('Updated Hair Services', 'Updated description');

      expect(category.name).toBe('Updated Hair Services');
      expect(category.description).toBe('Updated description');
      expect(category.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should activate category', () => {
      category.deactivate();
      expect(category.isActive).toBe(false);

      category.activate();
      expect(category.isActive).toBe(true);
    });

    it('should deactivate category', () => {
      expect(category.isActive).toBe(true);

      category.deactivate();
      expect(category.isActive).toBe(false);
    });
  });

  describe('fromPersistence', () => {
    it('should create category from persistence data', () => {
      const date = new Date();
      const category = Category.fromPersistence(
        'test-id',
        'Hair Services',
        'Description',
        true,
        date,
        date,
      );

      expect(category.id).toBe('test-id');
      expect(category.name).toBe('Hair Services');
      expect(category.description).toBe('Description');
      expect(category.isActive).toBe(true);
      expect(category.createdAt).toBe(date);
      expect(category.updatedAt).toBe(date);
    });
  });
});
