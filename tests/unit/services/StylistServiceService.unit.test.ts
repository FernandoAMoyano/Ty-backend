import { StylistServiceService } from '../../../src/modules/services/application/services/StylistServiceService';
import { StylistServiceRepository } from '../../../src/modules/services/domain/repositories/StylistServiceRepository';
import { ServiceRepository } from '../../../src/modules/services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../src/modules/services/domain/repositories/StylistRepository';
import { UserRepository } from '../../../src/modules/auth/domain/repositories/User';
import { StylistService } from '../../../src/modules/services/domain/entities/StylistService';
import { Service } from '../../../src/modules/services/domain/entities/Service';
import { Stylist } from '../../../src/modules/services/domain/entities/Stylist';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('StylistServiceService', () => {
  let stylistServiceService: StylistServiceService;
  let mockStylistServiceRepository: jest.Mocked<StylistServiceRepository>;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockStylistRepository: jest.Mocked<StylistRepository>;

  beforeEach(() => {
    mockStylistServiceRepository = {
      findByStylistAndService: jest.fn(),
      findByStylist: jest.fn(),
      findByService: jest.fn(),
      findActiveOfferings: jest.fn(),
      findStylistsOfferingService: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsAssignment: jest.fn(),
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

    mockUserRepository = {
      findById: jest.fn(),
      findByIdWithRole: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithRole: jest.fn(),
      findAll: jest.fn(),
      findByRole: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByEmail: jest.fn(),
    };

    mockStylistRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
    };

    stylistServiceService = new StylistServiceService(
      mockStylistServiceRepository,
      mockServiceRepository,
      mockUserRepository,
      mockStylistRepository,
    );
  });

  describe('assignServiceToStylist', () => {
    const assignDto = {
      serviceId: 'service-id',
      customPrice: 3000,
    };

    it('should assign service to stylist successfully', async () => {
      const mockStylist = Stylist.create('user-id');
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id', writable: false });

      const mockUserWithRole = {
        id: 'user-id',
        roleId: 'stylist-role-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password',
        isActive: true,
        role: {
          id: 'stylist-role-id',
          name: 'STYLIST',
          description: 'Estilista que ofrece servicios'
        }
      };
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      const mockStylistService = StylistService.create('stylist-id', 'service-id', 3000);

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(false);
      mockStylistServiceRepository.save.mockResolvedValue(mockStylistService);

      const result = await stylistServiceService.assignServiceToStylist('stylist-id', assignDto);

      expect(mockStylistRepository.findById).toHaveBeenCalledWith('stylist-id');
      expect(mockUserRepository.findByIdWithRole).toHaveBeenCalledWith('user-id');
      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockStylistServiceRepository.existsAssignment).toHaveBeenCalledWith(
        'stylist-id',
        'service-id',
      );
      expect(mockStylistServiceRepository.save).toHaveBeenCalled();
      expect(result.stylistId).toBe('stylist-id');
      expect(result.serviceId).toBe('service-id');
    });

    it('should throw NotFoundError if stylist not found', async () => {
      mockStylistRepository.findById.mockResolvedValue(null);

      await expect(
        stylistServiceService.assignServiceToStylist('non-existent-stylist', assignDto),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if service not found', async () => {
      const mockStylist = Stylist.create('user-id');
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id', writable: false });

      const mockUserWithRole = {
        id: 'user-id',
        roleId: 'stylist-role-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password',
        isActive: true,
        role: {
          id: 'stylist-role-id',
          name: 'STYLIST',
          description: 'Estilista que ofrece servicios'
        }
      };

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(
        stylistServiceService.assignServiceToStylist('stylist-id', assignDto),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if user is not a stylist', async () => {
      const mockStylist = Stylist.create('user-id');
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id', writable: false });

      const mockUserWithRole = {
        id: 'user-id',
        roleId: 'client-role-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password',
        isActive: true,
        role: {
          id: 'client-role-id',
          name: 'CLIENT',
          description: 'Cliente que puede agendar citas'
        }
      };

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);

      await expect(
        stylistServiceService.assignServiceToStylist('stylist-id', assignDto),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if assignment already exists', async () => {
      const mockStylist = Stylist.create('user-id');
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id', writable: false });

      const mockUserWithRole = {
        id: 'user-id',
        roleId: 'stylist-role-id',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        password: 'password',
        isActive: true,
        role: {
          id: 'stylist-role-id',
          name: 'STYLIST',
          description: 'Estilista que ofrece servicios'
        }
      };
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(true);

      await expect(
        stylistServiceService.assignServiceToStylist('stylist-id', assignDto),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getStylistServices', () => {
    it('should return stylist services successfully', async () => {
      const mockStylist = Stylist.create('user-id');
      const mockStylistServices = [
        StylistService.create('stylist-id', 'service-1', 3000),
        StylistService.create('stylist-id', 'service-2', 2500),
      ];
      const mockServices = [
        Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500),
        Service.create('category-id', 'Hair Wash', 'Description', 30, 10, 1500),
      ];

      Object.defineProperty(mockServices[0], 'id', { value: 'service-1', writable: false });
      Object.defineProperty(mockServices[1], 'id', { value: 'service-2', writable: false });

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockStylistServiceRepository.findByStylist.mockResolvedValue(mockStylistServices);

      // Mock para que findById retorne los servicios correctos según el serviceId
      mockServiceRepository.findById.mockImplementation((serviceId: string) => {
        if (serviceId === 'service-1') return Promise.resolve(mockServices[0]);
        if (serviceId === 'service-2') return Promise.resolve(mockServices[1]);
        return Promise.resolve(null);
      });

      const result = await stylistServiceService.getStylistServices('stylist-id');

      expect(mockStylistRepository.findById).toHaveBeenCalledWith('stylist-id');
      expect(mockStylistServiceRepository.findByStylist).toHaveBeenCalledWith('stylist-id');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if stylist not found', async () => {
      mockStylistRepository.findById.mockResolvedValue(null);

      await expect(
        stylistServiceService.getStylistServices('non-existent-stylist'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateStylistService', () => {
    const updateDto = {
      customPrice: 3500,
      isOffering: false,
    };

    it('should update stylist service successfully', async () => {
      const mockStylistService = StylistService.create('stylist-id', 'service-id', 3000);
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(mockStylistService);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.update.mockResolvedValue(mockStylistService);

      const result = await stylistServiceService.updateStylistService(
        'stylist-id',
        'service-id',
        updateDto,
      );

      expect(mockStylistServiceRepository.findByStylistAndService).toHaveBeenCalledWith(
        'stylist-id',
        'service-id',
      );
      expect(mockStylistServiceRepository.update).toHaveBeenCalled();
      expect(result.customPrice).toBe(3500);
      expect(result.isOffering).toBe(false);
    });

    it('should throw NotFoundError if assignment not found', async () => {
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(null);

      await expect(
        stylistServiceService.updateStylistService('stylist-id', 'service-id', updateDto),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('removeServiceFromStylist', () => {
    it('should remove service from stylist successfully', async () => {
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(true);
      mockStylistServiceRepository.delete.mockResolvedValue();

      await stylistServiceService.removeServiceFromStylist('stylist-id', 'service-id');

      expect(mockStylistServiceRepository.existsAssignment).toHaveBeenCalledWith(
        'stylist-id',
        'service-id',
      );
      expect(mockStylistServiceRepository.delete).toHaveBeenCalledWith('stylist-id', 'service-id');
    });

    it('should throw NotFoundError if assignment not found', async () => {
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(false);

      await expect(
        stylistServiceService.removeServiceFromStylist('stylist-id', 'service-id'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStylistsOfferingService', () => {
    it('should return stylists offering service successfully', async () => {
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      const mockStylistServices = [
        StylistService.create('stylist-1', 'service-id', 3000),
        StylistService.create('stylist-2', 'service-id', 2800),
      ];

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.findStylistsOfferingService.mockResolvedValue(
        mockStylistServices,
      );

      const result = await stylistServiceService.getStylistsOfferingService('service-id');

      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockStylistServiceRepository.findStylistsOfferingService).toHaveBeenCalledWith(
        'service-id',
      );
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(
        stylistServiceService.getStylistsOfferingService('non-existent-service'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStylistWithServices', () => {
    it('should return stylist with services successfully', async () => {
      const mockStylist = Stylist.create('user-id');
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id', writable: false });

      const mockUser = User.create(
        'STYLIST', // roleId
        'Test User', // name
        'test@example.com', // email
        '+1234567890', // phone
        'password', // password
      );
      const mockStylistServices = [StylistService.create('stylist-id', 'service-1', 3000)];
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      Object.defineProperty(mockService, 'id', { value: 'service-1', writable: false });

      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistServiceRepository.findByStylist.mockResolvedValue(mockStylistServices);

      // Mock específico para el servicio
      mockServiceRepository.findById.mockImplementation((serviceId: string) => {
        if (serviceId === 'service-1') return Promise.resolve(mockService);
        return Promise.resolve(null);
      });

      const result = await stylistServiceService.getStylistWithServices('stylist-id');

      expect(result.stylistId).toBe('stylist-id');
      expect(result.stylistName).toBe('Test User');
      expect(result.stylistEmail).toBe('test@example.com');
      expect(result.services).toHaveLength(1);
      expect(result.totalServicesOffered).toBe(1);
    });
  });

  describe('getServiceWithStylists', () => {
    it('should return service with stylists successfully', async () => {
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      Object.defineProperty(mockService, 'id', { value: 'service-id', writable: false });

      const mockStylistServices = [
        StylistService.create('stylist-1', 'service-id', 3000),
        StylistService.create('stylist-2', 'service-id', 2800),
      ];

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.findByService.mockResolvedValue(mockStylistServices);

      const result = await stylistServiceService.getServiceWithStylists('service-id');

      expect(result.serviceId).toBe('service-id');
      expect(result.serviceName).toBe('Hair Cut');
      expect(result.stylists).toHaveLength(2);
      expect(result.totalStylistsOffering).toBe(2);
    });
  });
});
