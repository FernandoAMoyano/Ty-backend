import { AssignServiceToStylist } from '../../../src/modules/services/application/use-cases/AssignServiceToStylist';
import { UpdateStylistService } from '../../../src/modules/services/application/use-cases/UpdateStylistService';
import { RemoveServiceFromStylist } from '../../../src/modules/services/application/use-cases/RemoveServiceFromStylist';
import { GetStylistServices } from '../../../src/modules/services/application/use-cases/GetStylistServices';
import { GetStylistsOfferingService } from '../../../src/modules/services/application/use-cases/GetStylistsOfferingService';
import { GetStylistWithServices } from '../../../src/modules/services/application/use-cases/GetStylistWithServices';
import { GetServiceWithStylists } from '../../../src/modules/services/application/use-cases/GetServiceWithStylists';
import { IStylistServiceRepository } from '../../../src/modules/services/domain/repositories/IStylistServiceRepository';
import { IServiceRepository } from '../../../src/modules/services/domain/repositories/IServiceRepository';
import { IUserRepository } from '../../../src/modules/auth/domain/repositories/IUserRepository';
import { StylistService } from '../../../src/modules/services/domain/entities/StylistService';
import { Service } from '../../../src/modules/services/domain/entities/Service';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';
import { BusinessRuleError } from '../../../src/shared/exceptions/BusinessRuleError';

describe('StylistService Use Cases', () => {
  let mockStylistServiceRepository: jest.Mocked<IStylistServiceRepository>;
  let mockServiceRepository: jest.Mocked<IServiceRepository>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

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
  });

  describe('AssignServiceToStylist', () => {
    let assignServiceToStylist: AssignServiceToStylist;

    beforeEach(() => {
      assignServiceToStylist = new AssignServiceToStylist(
        mockStylistServiceRepository,
        mockServiceRepository,
        mockUserRepository,
      );
    });

    const assignDto = { serviceId: 'service-id', customPrice: 3000 };

    it('should assign service to stylist successfully', async () => {
      const mockUserWithRole = {
        id: 'stylist-id', roleId: 'stylist-role-id', name: 'Test User',
        email: 'test@example.com', phone: '+1234567890', password: 'password',
        isActive: true, role: { id: 'stylist-role-id', name: 'STYLIST', description: 'Estilista' },
      };
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      const mockStylistService = StylistService.create('stylist-id', 'service-id', 3000);

      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(false);
      mockStylistServiceRepository.save.mockResolvedValue(mockStylistService);

      const result = await assignServiceToStylist.execute('stylist-id', assignDto);

      expect(mockUserRepository.findByIdWithRole).toHaveBeenCalledWith('stylist-id');
      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockStylistServiceRepository.existsAssignment).toHaveBeenCalledWith('stylist-id', 'service-id');
      expect(mockStylistServiceRepository.save).toHaveBeenCalled();
      expect(result.stylistId).toBe('stylist-id');
      expect(result.serviceId).toBe('service-id');
    });

    it('should throw NotFoundError if stylist not found', async () => {
      mockUserRepository.findByIdWithRole.mockResolvedValue(null);
      await expect(assignServiceToStylist.execute('non-existent-stylist', assignDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if service not found', async () => {
      const mockUserWithRole = {
        id: 'stylist-id', roleId: 'stylist-role-id', name: 'Test User',
        email: 'test@example.com', phone: '+1234567890', password: 'password',
        isActive: true, role: { id: 'stylist-role-id', name: 'STYLIST', description: 'Estilista' },
      };
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(null);
      await expect(assignServiceToStylist.execute('stylist-id', assignDto)).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessRuleError if service is inactive', async () => {
      const mockUserWithRole = {
        id: 'stylist-id', roleId: 'stylist-role-id', name: 'Test User',
        email: 'test@example.com', phone: '+1234567890', password: 'password',
        isActive: true, role: { id: 'stylist-role-id', name: 'STYLIST', description: 'Estilista' },
      };
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      mockService.deactivate();

      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(mockService);

      await expect(assignServiceToStylist.execute('stylist-id', assignDto)).rejects.toThrow(BusinessRuleError);
    });

    it('should throw ValidationError if user is not a stylist', async () => {
      const mockUserWithRole = {
        id: 'stylist-id', roleId: 'client-role-id', name: 'Test User',
        email: 'test@example.com', phone: '+1234567890', password: 'password',
        isActive: true, role: { id: 'client-role-id', name: 'CLIENT', description: 'Cliente' },
      };
      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      await expect(assignServiceToStylist.execute('stylist-id', assignDto)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if assignment already exists', async () => {
      const mockUserWithRole = {
        id: 'stylist-id', roleId: 'stylist-role-id', name: 'Test User',
        email: 'test@example.com', phone: '+1234567890', password: 'password',
        isActive: true, role: { id: 'stylist-role-id', name: 'STYLIST', description: 'Estilista' },
      };
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockUserRepository.findByIdWithRole.mockResolvedValue(mockUserWithRole);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(true);

      await expect(assignServiceToStylist.execute('stylist-id', assignDto)).rejects.toThrow(ConflictError);
    });
  });

  describe('GetStylistServices', () => {
    let getStylistServices: GetStylistServices;

    beforeEach(() => {
      getStylistServices = new GetStylistServices(
        mockStylistServiceRepository,
        mockServiceRepository,
        mockUserRepository,
      );
    });

    it('should return stylist services successfully', async () => {
      const mockUser = { id: 'stylist-id', name: 'Test User', email: 'test@test.com' };
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

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockStylistServiceRepository.findByStylist.mockResolvedValue(mockStylistServices);
      mockServiceRepository.findById.mockImplementation((serviceId: string) => {
        if (serviceId === 'service-1') return Promise.resolve(mockServices[0]);
        if (serviceId === 'service-2') return Promise.resolve(mockServices[1]);
        return Promise.resolve(null);
      });

      const result = await getStylistServices.execute('stylist-id');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('stylist-id');
      expect(mockStylistServiceRepository.findByStylist).toHaveBeenCalledWith('stylist-id');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if stylist not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      await expect(getStylistServices.execute('non-existent-stylist')).rejects.toThrow(NotFoundError);
    });
  });

  describe('UpdateStylistService', () => {
    let updateStylistService: UpdateStylistService;

    beforeEach(() => {
      updateStylistService = new UpdateStylistService(
        mockStylistServiceRepository,
        mockServiceRepository,
      );
    });

    const updateDto = { customPrice: 3500, isOffering: false };

    it('should update stylist service successfully', async () => {
      const mockStylistService = StylistService.create('stylist-id', 'service-id', 3000);
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);

      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(mockStylistService);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.update.mockResolvedValue(mockStylistService);

      const result = await updateStylistService.execute('stylist-id', 'service-id', updateDto);

      expect(mockStylistServiceRepository.findByStylistAndService).toHaveBeenCalledWith('stylist-id', 'service-id');
      expect(mockStylistServiceRepository.update).toHaveBeenCalled();
      expect(result.customPrice).toBe(3500);
      expect(result.isOffering).toBe(false);
    });

    it('should throw NotFoundError if assignment not found', async () => {
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(null);
      await expect(updateStylistService.execute('stylist-id', 'service-id', updateDto)).rejects.toThrow(NotFoundError);
    });
  });

  describe('RemoveServiceFromStylist', () => {
    let removeServiceFromStylist: RemoveServiceFromStylist;

    beforeEach(() => {
      removeServiceFromStylist = new RemoveServiceFromStylist(mockStylistServiceRepository);
    });

    it('should remove service from stylist successfully', async () => {
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(true);
      mockStylistServiceRepository.delete.mockResolvedValue();

      await removeServiceFromStylist.execute('stylist-id', 'service-id');

      expect(mockStylistServiceRepository.existsAssignment).toHaveBeenCalledWith('stylist-id', 'service-id');
      expect(mockStylistServiceRepository.delete).toHaveBeenCalledWith('stylist-id', 'service-id');
    });

    it('should throw NotFoundError if assignment not found', async () => {
      mockStylistServiceRepository.existsAssignment.mockResolvedValue(false);
      await expect(removeServiceFromStylist.execute('stylist-id', 'service-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('GetStylistsOfferingService', () => {
    let getStylistsOfferingService: GetStylistsOfferingService;

    beforeEach(() => {
      getStylistsOfferingService = new GetStylistsOfferingService(
        mockStylistServiceRepository,
        mockServiceRepository,
      );
    });

    it('should return stylists offering service successfully', async () => {
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      const mockStylistServices = [
        StylistService.create('stylist-1', 'service-id', 3000),
        StylistService.create('stylist-2', 'service-id', 2800),
      ];

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.findStylistsOfferingService.mockResolvedValue(mockStylistServices);

      const result = await getStylistsOfferingService.execute('service-id');

      expect(mockServiceRepository.findById).toHaveBeenCalledWith('service-id');
      expect(mockStylistServiceRepository.findStylistsOfferingService).toHaveBeenCalledWith('service-id');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundError if service not found', async () => {
      mockServiceRepository.findById.mockResolvedValue(null);
      await expect(getStylistsOfferingService.execute('non-existent-service')).rejects.toThrow(NotFoundError);
    });
  });

  describe('GetStylistWithServices', () => {
    let getStylistWithServices: GetStylistWithServices;

    beforeEach(() => {
      getStylistWithServices = new GetStylistWithServices(
        mockStylistServiceRepository,
        mockServiceRepository,
        mockUserRepository,
      );
    });

    it('should return stylist with services successfully', async () => {
      const mockUser = { id: 'stylist-id', name: 'Test User', email: 'test@example.com' };
      const mockStylistServices = [StylistService.create('stylist-id', 'service-1', 3000)];
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      Object.defineProperty(mockService, 'id', { value: 'service-1', writable: false });

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockStylistServiceRepository.findByStylist.mockResolvedValue(mockStylistServices);
      mockServiceRepository.findById.mockImplementation((serviceId: string) => {
        if (serviceId === 'service-1') return Promise.resolve(mockService);
        return Promise.resolve(null);
      });

      const result = await getStylistWithServices.execute('stylist-id');

      expect(result.stylistId).toBe('stylist-id');
      expect(result.stylistName).toBe('Test User');
      expect(result.stylistEmail).toBe('test@example.com');
      expect(result.services).toHaveLength(1);
      expect(result.totalServicesOffered).toBe(1);
    });
  });

  describe('GetServiceWithStylists', () => {
    let getServiceWithStylists: GetServiceWithStylists;

    beforeEach(() => {
      getServiceWithStylists = new GetServiceWithStylists(
        mockStylistServiceRepository,
        mockServiceRepository,
      );
    });

    it('should return service with stylists successfully', async () => {
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500);
      Object.defineProperty(mockService, 'id', { value: 'service-id', writable: false });

      const mockStylistServices = [
        StylistService.create('stylist-1', 'service-id', 3000),
        StylistService.create('stylist-2', 'service-id', 2800),
      ];

      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockStylistServiceRepository.findByService.mockResolvedValue(mockStylistServices);

      const result = await getServiceWithStylists.execute('service-id');

      expect(result.serviceId).toBe('service-id');
      expect(result.serviceName).toBe('Hair Cut');
      expect(result.stylists).toHaveLength(2);
      expect(result.totalStylistsOffering).toBe(2);
    });
  });
});
