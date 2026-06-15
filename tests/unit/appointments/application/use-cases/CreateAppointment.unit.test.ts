import { CreateAppointment } from '../../../../../src/modules/appointments/application/use-cases/CreateAppointment';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from '../../../../../src/modules/appointments/domain/repositories/ScheduleRepository';
import { ServiceRepository } from '../../../../../src/modules/services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../../../src/modules/services/domain/repositories/StylistRepository';
import { IStylistServiceRepository } from '../../../../../src/modules/services/domain/repositories/IStylistServiceRepository';
import { ClientRepository } from '../../../../../src/modules/auth/domain/repositories/Client';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { AppointmentStatus } from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { Schedule } from '../../../../../src/modules/appointments/domain/entities/Schedule';
import { Service } from '../../../../../src/modules/services/domain/entities/Service';
import { Stylist } from '../../../../../src/modules/services/domain/entities/Stylist';
import { Client } from '../../../../../src/modules/auth/domain/entities/Client';
import { CreateAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/CreateAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../../src/shared/exceptions/ConflictError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('CreateAppointment Use Case', () => {
  let useCase: CreateAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockStylistRepository: jest.Mocked<StylistRepository>;
  let mockStylistServiceRepository: jest.Mocked<IStylistServiceRepository>;
  let mockClientRepository: jest.Mocked<ClientRepository>;

  // Utilidades de fecha dinámicas y mantenibles
  const getNextMonday = (hoursFromNow: number = 48): Date => {
    const future = new Date();
    future.setHours(future.getHours() + hoursFromNow);
    
    // Ajustar al próximo lunes si no es lunes para garantizar día correcto
    while (future.getDay() !== 1) { // 1 = lunes
      future.setDate(future.getDate() + 1);
    }

    // Fijar hora dentro del horario laboral del mock schedule (09:00-18:00)
    future.setHours(10, 0, 0, 0);
    
    return future;
  };

  const getFutureDate = (hoursFromNow: number = 48): Date => {
    return getNextMonday(hoursFromNow);
  };

  const getFutureISOString = (hoursFromNow: number = 48): string => {
    return getFutureDate(hoursFromNow).toISOString();
  };

  const getPastDate = (hoursAgo: number = 1): Date => {
    const past = new Date();
    past.setHours(past.getHours() - hoursAgo);
    return past;
  };

  // IDs válidos para tests
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validStylistId = generateUuid();
  const validServiceId1 = generateUuid();
  const validScheduleId = generateUuid();
  const validPendingStatusId = generateUuid();

  // DTOs base para tests usando fechas dinámicas
  const validCreateDto: CreateAppointmentDto = {
    dateTime: getFutureISOString(48),
    clientId: validClientId,
    stylistId: validStylistId,
    serviceIds: [validServiceId1],
    notes: 'Test appointment',
  };

  const minimalCreateDto: CreateAppointmentDto = {
    dateTime: getFutureISOString(72),
    clientId: validClientId,
    serviceIds: [validServiceId1],
  };

  // Factory methods para crear mocks
  const createMockAppointment = (overrides: any = {}): Appointment => {
    const baseData = {
      id: generateUuid(),
      dateTime: getFutureDate(48), // Fecha dinámica futura (48 horas desde ahora)
      duration: 60,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validPendingStatusId,
      stylistId: validStylistId,
      serviceIds: [validServiceId1],
      confirmedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    return new Appointment(
      baseData.id,
      baseData.dateTime,
      baseData.duration,
      baseData.userId,
      baseData.clientId,
      baseData.scheduleId,
      baseData.statusId,
      baseData.stylistId,
      baseData.confirmedAt,
      baseData.serviceIds,
      baseData.createdAt,
      baseData.updatedAt,
    );
  };

  const createMockAppointmentStatus = (
    name: string = 'PENDING',
    id: string = validPendingStatusId,
  ): AppointmentStatus => {
    return new AppointmentStatus(id, name, `Status: ${name}`);
  };

  const createMockService = (id: string = generateUuid(), duration: number = 60): Service => {
    const categoryId = generateUuid();
    return {
      id,
      categoryId,
      name: `Service ${id.slice(-4)}`,
      description: 'Mock service description',
      duration,
      durationVariation: 15,
      price: 10000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updateDetails: jest.fn(),
      updateCategory: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      calculateMinDuration: jest.fn().mockReturnValue(duration - 15),
      calculateMaxDuration: jest.fn().mockReturnValue(duration + 15),
      getFormattedPrice: jest.fn().mockReturnValue('100.00'),
      toPersistence: jest.fn(),
    } as unknown as Service;
  };

  const createMockStylist = (id: string = generateUuid()): Stylist => {
    return {
      id,
      userId: generateUuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updateInfo: jest.fn(),
      toPersistence: jest.fn(),
    } as unknown as Stylist;
  };

  const createMockClient = (id: string = validClientId, userId: string = generateUuid()): Client => {
    return {
      id,
      userId,
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updatePreferences: jest.fn(),
      toPersistence: jest.fn(),
    } as unknown as Client;
  };

  const createMockSchedule = (
    dayOfWeek: string = 'MONDAY',
    id: string = validScheduleId,
  ): Schedule => {
    return {
      id,
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updateHours: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      isWithinHours: jest.fn().mockReturnValue(true),
      toPersistence: jest.fn(),
    } as unknown as Schedule;
  };

  // Helper para configurar mocks exitosos básicos
  const setupBasicSuccessfulMocks = (appointment: Appointment = createMockAppointment()) => {
    const pendingStatus = createMockAppointmentStatus('Pendiente');
    const client = createMockClient(validClientId);
    const stylist = createMockStylist(validStylistId);
    const service = createMockService(validServiceId1, 60);
    const schedule = createMockSchedule('MONDAY');
    const stylistService = { stylistId: validStylistId, serviceId: validServiceId1, isOffering: true, customPrice: null, createdAt: new Date(), updatedAt: new Date() };

    mockAppointmentStatusRepository.findByName.mockResolvedValue(pendingStatus);
    mockClientRepository.findByUserId.mockResolvedValue(client);
    mockStylistRepository.findById.mockResolvedValue(stylist);
    mockServiceRepository.findById.mockResolvedValue(service);
    mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(stylistService as any);
    mockScheduleRepository.findAll.mockResolvedValue([schedule]);
    mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
    mockAppointmentRepository.save.mockResolvedValue(appointment);
  };

  beforeEach(() => {
    // Mock de AppointmentRepository
    mockAppointmentRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      findByClientId: jest.fn(),
      findByStylistId: jest.fn(),
      findByUserId: jest.fn(),
      findByStatusId: jest.fn(),
      findByDateRange: jest.fn(),
      findByClientAndDateRange: jest.fn(),
      findByStylistAndDateRange: jest.fn(),
      findConflictingAppointments: jest.fn(),
      findByScheduleId: jest.fn(),
      findByDate: jest.fn(),
      countByStatus: jest.fn(),
      countByDateRange: jest.fn(),
      findUpcomingAppointments: jest.fn(),
      findPendingConfirmation: jest.fn(),
    } as unknown as jest.Mocked<AppointmentRepository>;

    // Mock de AppointmentStatusRepository
    mockAppointmentStatusRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      findTerminalStatuses: jest.fn(),
      findActiveStatuses: jest.fn(),
    } as unknown as jest.Mocked<AppointmentStatusRepository>;

    // Mock de ScheduleRepository
    mockScheduleRepository = {
      findById: jest.fn(),
      findByDayOfWeek: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
    } as unknown as jest.Mocked<ScheduleRepository>;

    // Mock de ServiceRepository
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
    } as unknown as jest.Mocked<ServiceRepository>;

    // Mock de StylistRepository
    mockStylistRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
    } as unknown as jest.Mocked<StylistRepository>;

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
    } as unknown as jest.Mocked<IStylistServiceRepository>;

    // Mock de ClientRepository
    mockClientRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByUserId: jest.fn(),
    } as unknown as jest.Mocked<ClientRepository>;

    useCase = new CreateAppointment(
      mockAppointmentRepository,
      mockAppointmentStatusRepository,
      mockScheduleRepository,
      mockServiceRepository,
      mockStylistRepository,
      mockStylistServiceRepository,
      mockClientRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería crear cita exitosamente con todos los datos
    it('should create appointment successfully with complete data', async () => {
      const appointment = createMockAppointment({
        userId: validUserId,
        clientId: validClientId,
        stylistId: validStylistId,
      });

      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validCreateDto, validUserId);

      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(appointment.id);
      expect(result.clientId).toBe(validClientId);
      expect(result.stylistId).toBe(validStylistId);
    });

    // Debería crear cita exitosamente con datos mínimos
    it('should create appointment successfully with minimal data', async () => {
      const appointment = createMockAppointment({
        userId: validUserId,
        clientId: validClientId,
        stylistId: null,
      });

      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(minimalCreateDto, validUserId);

      expect(mockAppointmentRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(appointment.id);
      expect(result.clientId).toBe(validClientId);
    });

    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      const appointment = createMockAppointment();
      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validCreateDto, validUserId);

      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
      expect(result.confirmedAt).toBeUndefined();
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para userId vacío
    it('should throw error for empty userId', async () => {
      await expect(useCase.execute(validCreateDto, '')).rejects.toThrow(
        new ValidationError('User ID is required'),
      );
    });

    // Debería lanzar error para clientId vacío
    it('should throw error for empty clientId', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validCreateDto,
        clientId: '',
      };

      await expect(useCase.execute(invalidDto, validUserId)).rejects.toThrow(
        new ValidationError('Client ID is required'),
      );
    });

    // Debería lanzar error para dateTime vacío
    it('should throw error for empty dateTime', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validCreateDto,
        dateTime: '',
      };

      await expect(useCase.execute(invalidDto, validUserId)).rejects.toThrow(
        new ValidationError('Appointment date and time is required'),
      );
    });

    // Debería lanzar error para serviceIds vacío
    it('should throw error for empty serviceIds', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validCreateDto,
        serviceIds: [],
      };

      await expect(useCase.execute(invalidDto, validUserId)).rejects.toThrow(
        new ValidationError('At least one service must be selected'),
      );
    });

    // Debería lanzar error para formato de fecha inválido
    it('should throw error for invalid date format', async () => {
      const invalidDto: CreateAppointmentDto = {
        ...validCreateDto,
        dateTime: 'invalid-date-format',
      };

      await expect(useCase.execute(invalidDto, validUserId)).rejects.toThrow(
        new ValidationError('Invalid date format'),
      );
    });

    // Debería lanzar error para fecha en el pasado
    it('should throw error for past date', async () => {
      const pastDto: CreateAppointmentDto = {
        ...validCreateDto,
        dateTime: getPastDate(1).toISOString(),
      };

      await expect(useCase.execute(pastDto, validUserId)).rejects.toThrow(
        new ValidationError('Appointment cannot be scheduled in the past'),
      );
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError cuando el cliente no existe
    it('should throw NotFoundError when client does not exist', async () => {
      mockClientRepository.findByUserId.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Client', validClientId),
      );
    });

    // Debería encontrar cliente por userId (clientId del DTO siempre es User.id)
    it('should find client by userId', async () => {
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);
      const service = createMockService(validServiceId1);
      const pendingStatus = createMockAppointmentStatus('PENDING');
      const schedule = createMockSchedule('MONDAY');
      const appointment = createMockAppointment();

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(service);
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(
        { stylistId: validStylistId, serviceId: validServiceId1, isOffering: true } as any,
      );
      mockAppointmentStatusRepository.findByName.mockResolvedValue(pendingStatus);
      mockScheduleRepository.findAll.mockResolvedValue([schedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentRepository.save.mockResolvedValue(appointment);

      const result = await useCase.execute(validCreateDto, validUserId);

      expect(mockClientRepository.findByUserId).toHaveBeenCalledWith(validClientId);
      expect(mockClientRepository.findById).not.toHaveBeenCalled();
      expect(result.id).toBe(appointment.id);
    });

    // Debería lanzar NotFoundError cuando el estilista no existe
    it('should throw NotFoundError when stylist does not exist', async () => {
      const client = createMockClient(validClientId);
      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Stylist', validStylistId),
      );
    });

    // Debería lanzar NotFoundError cuando un servicio no existe
    it('should throw NotFoundError when service does not exist', async () => {
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Service', validServiceId1),
      );
    });

    // Debería lanzar BusinessRuleError cuando un servicio no está activo
    it('should throw BusinessRuleError when service is not active', async () => {
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);
      const inactiveService = createMockService(validServiceId1, 60);
      (inactiveService as any).isActive = false;

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(inactiveService);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        BusinessRuleError,
      );
    });

    // Debería lanzar BusinessRuleError cuando el estilista no tiene asignado el servicio
    it('should throw BusinessRuleError when stylist does not offer service', async () => {
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);
      const service = createMockService(validServiceId1, 60);

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(service);
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        BusinessRuleError,
      );
    });

    // Debería lanzar BusinessRuleError cuando el estilista no está ofreciendo el servicio actualmente
    it('should throw BusinessRuleError when stylist is not currently offering service', async () => {
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);
      const service = createMockService(validServiceId1, 60);
      const notOfferingAssignment = { stylistId: validStylistId, serviceId: validServiceId1, isOffering: false };

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(service);
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(notOfferingAssignment as any);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        BusinessRuleError,
      );
    });
  });

  describe('Working Hours Validation', () => {
    // Debería lanzar BusinessRuleError cuando la cita empieza antes del horario laboral
    it('should throw BusinessRuleError when appointment starts before working hours', async () => {
      const earlyDate = getNextMonday(48);
      earlyDate.setHours(7, 0, 0, 0); // 7:00 AM, antes de 09:00

      const earlyDto: CreateAppointmentDto = {
        ...validCreateDto,
        dateTime: earlyDate.toISOString(),
      };

      const appointment = createMockAppointment();
      setupBasicSuccessfulMocks(appointment);

      await expect(useCase.execute(earlyDto, validUserId)).rejects.toThrow(
        BusinessRuleError,
      );
    });

    // Debería lanzar BusinessRuleError cuando la cita termina después del horario laboral
    it('should throw BusinessRuleError when appointment ends after working hours', async () => {
      const lateDate = getNextMonday(48);
      lateDate.setHours(17, 30, 0, 0); // 17:30, una cita de 60 min terminaría a las 18:30

      const lateDto: CreateAppointmentDto = {
        ...validCreateDto,
        dateTime: lateDate.toISOString(),
        duration: 60,
      };

      const appointment = createMockAppointment();
      setupBasicSuccessfulMocks(appointment);

      await expect(useCase.execute(lateDto, validUserId)).rejects.toThrow(
        BusinessRuleError,
      );
    });
  });

  describe('Conflict Detection', () => {
    // Debería lanzar ConflictError cuando hay citas en conflicto
    it('should throw ConflictError when there are conflicting appointments', async () => {
      const conflictingAppointment = createMockAppointment({ id: generateUuid() });
      const client = createMockClient(validClientId);
      const stylist = createMockStylist(validStylistId);
      const service = createMockService(validServiceId1);
      const pendingStatus = createMockAppointmentStatus('PENDING');
      const schedule = createMockSchedule('MONDAY');

      mockClientRepository.findByUserId.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(service);
      mockStylistServiceRepository.findByStylistAndService.mockResolvedValue(
        { stylistId: validStylistId, serviceId: validServiceId1, isOffering: true } as any,
      );
      mockAppointmentStatusRepository.findByName.mockResolvedValue(pendingStatus);
      mockScheduleRepository.findAll.mockResolvedValue([schedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([
        conflictingAppointment,
      ]);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new ConflictError('There are conflicting appointments at this time'),
      );
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar todos los repositorios con parámetros correctos
    it('should call all repositories with correct parameters', async () => {
      const appointment = createMockAppointment();
      setupBasicSuccessfulMocks(appointment);

      await useCase.execute(validCreateDto, validUserId);

      expect(mockClientRepository.findByUserId).toHaveBeenCalledWith(validClientId);
      expect(mockStylistRepository.findById).toHaveBeenCalledWith(validStylistId);
      expect(mockServiceRepository.findById).toHaveBeenCalledWith(validServiceId1);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith('PENDING');
      expect(mockScheduleRepository.findAll).toHaveBeenCalled();
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
    });
  });
});
