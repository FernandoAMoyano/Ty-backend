import { CreateService } from '../../../src/modules/services/application/use-cases/CreateService';
import { UpdateService } from '../../../src/modules/services/application/use-cases/UpdateService';
import { GetServiceById } from '../../../src/modules/services/application/use-cases/GetServiceById';
import { GetServicesByCategory } from '../../../src/modules/services/application/use-cases/GetServicesByCategory';
import { ActivateService } from '../../../src/modules/services/application/use-cases/ActivateService';
import { DeleteService } from '../../../src/modules/services/application/use-cases/DeleteService';
import { IServiceRepository } from '../../../src/modules/services/domain/repositories/IServiceRepository';
import { ICategoryRepository } from '../../../src/modules/services/domain/repositories/ICategoryRepository';
import { Service } from '../../../src/modules/services/domain/entities/Service';
import { Category } from '../../../src/modules/services/domain/entities/Category';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';
import { BusinessRuleError } from '../../../src/shared/exceptions/BusinessRuleError';
import { IAppointmentRepository } from '../../../src/modules/appointments/domain/repositories/IAppointmentRepository';

describe('Service Use Cases', () => {
  let mockServiceRepository: jest.Mocked<IServiceRepository>;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;

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
  });

  describe('CreateService', () => {
    let createService: CreateService;

    beforeEach(() => {
      createService = new CreateService(mockServiceRepository, mockCategoryRepository);
    });

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

      const result = await createService.execute(validCreateDto);

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(validCreateDto.categoryId);
      expect(mockServiceRepository.existsByName).toHaveBeenCalledWith(validCreateDto.name);
      expect(mockServiceRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(validCreateDto.name);
    });

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(createService.execute(validCreateDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if service name already exists', async () => {
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.existsByName.mockResolvedValue(true);
      await expect(createService.execute(validCreateDto)).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError for invalid duration variation', async () => {
      const invalidDto = { ...validCreateDto, durationVariation: 60 };
      const mockCategory = Category.create('Hair Services');
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.existsByName.mockResolvedValue(false);
      await expect(createService.execute(invalidDto)).rejects.toThrow(ValidationError);
    });
  });

  describe('GetServiceById', () => {
    let getServiceById: GetServiceById;

    beforeEach(() => {
      getServiceById = new GetServiceById(mockServiceRepository, mockCategoryRepository);
    });

    it('should return service with category when found', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await getServiceById.execute('service-id');

      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-id');
      expect(result.name).toBe('Hair Cut');
      expect(result.category).toBeDefined();
    });

    it('should throw NotFoundError when service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);
      await expect(getServiceById.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('GetServicesByCategory', () => {
    let getServicesByCategory: GetServicesByCategory;

    beforeEach(() => {
      getServicesByCategory = new GetServicesByCategory(mockServiceRepository, mockCategoryRepository);
    });

    it('should return services for existing category', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockServices = [
        Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500),
        Service.create('category-id', 'Hair Wash', 'Description', 30, 10, 1500),
      ];

      mockCategoryRepository.findById.mockResolvedValue(mockCategory);
      mockServiceRepository.findByCategory.mockResolvedValue(mockServices);

      const result = await getServicesByCategory.execute('category-id');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('category-id');
      expect(mockServiceRepository.findByCategory).toHaveBeenCalledWith('category-id');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if category not found', async () => {
      mockCategoryRepository.findById.mockResolvedValue(null);
      await expect(getServicesByCategory.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('ActivateService', () => {
    let activateService: ActivateService;

    beforeEach(() => {
      activateService = new ActivateService(mockServiceRepository, mockCategoryRepository);
    });

    it('should activate service successfully', async () => {
      const mockCategory = Category.create('Hair Services');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      mockService.deactivate();

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockServiceRepository.update.mockResolvedValue(mockService);
      mockCategoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await activateService.execute('service-id');

      expect(result.isActive).toBe(true);
    });
  });

  describe('DeleteService', () => {
    let deleteService: DeleteService;
    let mockAppointmentRepository: jest.Mocked<Pick<IAppointmentRepository, 'existsByServiceId'>>;

    beforeEach(() => {
      mockAppointmentRepository = {
        existsByServiceId: jest.fn(),
      };
      deleteService = new DeleteService(
        mockServiceRepository,
        mockAppointmentRepository as unknown as jest.Mocked<IAppointmentRepository>,
      );
    });

    it('should delete service successfully', async () => {
      mockServiceRepository.existsById.mockResolvedValue(true);
      mockAppointmentRepository.existsByServiceId.mockResolvedValue(false);
      mockServiceRepository.delete.mockResolvedValue();

      await deleteService.execute('service-id');

      expect(mockServiceRepository.existsById).toHaveBeenCalledWith('service-id');
      expect(mockAppointmentRepository.existsByServiceId).toHaveBeenCalledWith('service-id');
      expect(mockServiceRepository.delete).toHaveBeenCalledWith('service-id');
    });

    it('should throw NotFoundError if service not found', async () => {
      mockServiceRepository.existsById.mockResolvedValue(false);
      await expect(deleteService.execute('non-existent-id')).rejects.toThrow(NotFoundError);
    });

    // Debería rechazar el borrado si el servicio tiene citas históricas (F8)
    it('should reject deletion when service has historical appointments', async () => {
      mockServiceRepository.existsById.mockResolvedValue(true);
      mockAppointmentRepository.existsByServiceId.mockResolvedValue(true);

      await expect(deleteService.execute('service-id')).rejects.toThrow(BusinessRuleError);
      await expect(deleteService.execute('service-id')).rejects.toThrow(
        'Cannot delete service: it has associated appointments (use deactivate instead)',
      );
      expect(mockServiceRepository.delete).not.toHaveBeenCalled();
    });

    // Debería lanzar BusinessRuleError también para citas activas (mismo método cubre ambos casos)
    it('should throw BusinessRuleError if service has active appointments', async () => {
      mockServiceRepository.existsById.mockResolvedValue(true);
      mockAppointmentRepository.existsByServiceId.mockResolvedValue(true);

      await expect(deleteService.execute('service-id')).rejects.toThrow(BusinessRuleError);
      expect(mockServiceRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('UpdateService', () => {
    let updateService: UpdateService;

    beforeEach(() => {
      updateService = new UpdateService(mockServiceRepository, mockCategoryRepository);
    });

    it('should throw NotFoundError if service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);
      await expect(updateService.execute('non-existent-id', { name: 'New Name' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if no fields provided', async () => {
      await expect(updateService.execute('service-id', {})).rejects.toThrow(ValidationError);
    });
  });
});
