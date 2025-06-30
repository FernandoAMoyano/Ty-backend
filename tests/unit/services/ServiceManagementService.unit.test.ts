import { ServiceManagementService } from '../../../src/modules/services/application/services/ServiceManagementService';
import { ServiceRepository } from '../../../src/modules/services/domain/repositories/ServiceRepository';
import { CategoryRepository } from '../../../src/modules/services/domain/repositories/CategoryRepository';
import { Service } from '../../../src/modules/services/domain/entities/Service';
import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('ServiceManagementService', () => {
  let serviceManagementService: ServiceManagementService;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
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

    serviceManagementService = new ServiceManagementService(
      mockServiceRepository,
      mockCategoryRepository,
    );
  });

  describe('createService', () => {
    const validCreateDto = {
      categoryId: 'category-id',
      name: 'Hair Cut',
      description: 'Professional hair cutting',
      duration: 45,
      durationVariation: 15,
      price: 2500,
    };

    it('should create service successfully', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockService = Service.create(
        validCreateDto.categoryId,
        validCreateDto.name,
        validCreateDto.description,
        validCreateDto.duration,
        validCreateDto.durationVariation,
        validCreateDto.price,
      );

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.existsByName.mockResolvedValue(false);
      mockServiceRepository.save.mockResolvedValue(mockService);

      const result = await serviceManagementService.createService(validCreateDto);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(validCreateDto.categoryId);
      expect(mockServiceRepository.existsByName).toHaveBeenCalledWith(validCreateDto.name);
      expect(mockServiceRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(validCreateDto.name);
    });

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(serviceManagementService.createService(validCreateDto)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ConflictError if service name already exists', async () => {
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.existsByName.mockResolvedValue(true);

      await expect(serviceManagementService.createService(validCreateDto)).rejects.toThrow(
        ConflictError,
      );
    });

    it('should throw ValidationError for invalid duration variation', async () => {
      const invalidDto = { ...validCreateDto, durationVariation: 60 }; // > duration
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.existsByName.mockResolvedValue(false);

      await expect(serviceManagementService.createService(invalidDto)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('getServiceById', () => {
    it('should return service with category when found', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await serviceManagementService.getServiceById('service-id');

      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-id');
      expect(result.name).toBe('Hair Cut');
      expect(result.category).toBeDefined();
    });

    it('should throw NotFoundError when service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(serviceManagementService.getServiceById('non-existent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('getServicesByCategory', () => {
    it('should return services for existing category', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockServices = [
        Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500),
        Service.create('category-id', 'Hair Wash', 'Description', 30, 10, 1500),
      ];

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.findByCategory.mockResolvedValue(mockServices);

      const result = await serviceManagementService.getServicesByCategory('category-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-id');
      expect(mockServiceRepository.findByCategory).toHaveBeenCalledWith('category-id');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);

      await expect(
        serviceManagementService.getServicesByCategory('non-existent-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('activateService', () => {
    it('should activate service successfully', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      mockService.deactivate();

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockServiceRepository.update.mockResolvedValue(mockService);
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await serviceManagementService.activateService('service-id');

      expect(result.isActive).toBe(true);
    });
  });

  describe('deleteService', () => {
    it('should delete service successfully', async () => {
      mockServiceRepository.existsById.mockResolvedValue(true);
      mockServiceRepository.delete.mockResolvedValue();

      await serviceManagementService.deleteService('service-id');

      expect(mockServiceRepository.existsById).toHaveBeenCalledWith('service-id');
      expect(mockServiceRepository.delete).toHaveBeenCalledWith('service-id');
    });

    it('should throw NotFoundError if service not found', async () => {
      mockServiceRepository.existsById.mockResolvedValue(false);

      await expect(serviceManagementService.deleteService('non-existent-id')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
