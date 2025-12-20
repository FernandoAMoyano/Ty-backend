import { CreateAppointment } from '../../../../../src/modules/appointments/application/use-cases/CreateAppointment';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from '../../../../../src/modules/appointments/domain/repositories/ScheduleRepository';
import { ServiceRepository } from '../../../../../src/modules/services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../../../src/modules/services/domain/repositories/StylistRepository';
import { UserRepository } from '../../../../../src/modules/auth/domain/repositories/User';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { AppointmentStatus } from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { Schedule } from '../../../../../src/modules/appointments/domain/entities/Schedule';
import { Service } from '../../../../../src/modules/services/domain/entities/Service';
import { Stylist } from '../../../../../src/modules/services/domain/entities/Stylist';
import { User } from '../../../../../src/modules/auth/domain/entities/User';
import { CreateAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/CreateAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../../src/shared/exceptions/ConflictError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('CreateAppointment Use Case', () => {
  let useCase: CreateAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockStylistRepository: jest.Mocked<StylistRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  // Utilidades de fecha dinámicas y mantenibles
  const getNextMonday = (hoursFromNow: number = 48): Date => {
    const future = new Date();
    future.setHours(future.getHours() + hoursFromNow);
    
    // Ajustar al próximo lunes si no es lunes para garantizar día correcto
    while (future.getDay() !== 1) { // 1 = lunes
      future.setDate(future.getDate() + 1);
    }
    
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
    name: string = 'Pendiente',
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

  const createMockUser = (id: string = generateUuid(), role: string = 'client'): User => {
    return {
      id,
      email: `user${id.slice(-4)}@test.com`,
      name: `User ${id.slice(-4)}`,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      toPersistence: jest.fn(),
    } as unknown as User;
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
    const client = createMockUser(validClientId, 'client');
    const stylist = createMockStylist(validStylistId);
    const service = createMockService(validServiceId1, 60);
    const schedule = createMockSchedule('MONDAY');

    mockAppointmentStatusRepository.findAll.mockResolvedValue([pendingStatus]);
    mockUserRepository.findById.mockResolvedValue(client);
    mockStylistRepository.findById.mockResolvedValue(stylist);
    mockServiceRepository.findById.mockResolvedValue(service);
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

    // Mock de UserRepository
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    useCase = new CreateAppointment(
      mockAppointmentRepository,
      mockAppointmentStatusRepository,
      mockScheduleRepository,
      mockServiceRepository,
      mockStylistRepository,
      mockUserRepository,
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
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Client', validClientId),
      );
    });

    // Debería lanzar NotFoundError cuando el estilista no existe
    it('should throw NotFoundError when stylist does not exist', async () => {
      const client = createMockUser(validClientId);
      mockUserRepository.findById.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Stylist', validStylistId),
      );
    });

    // Debería lanzar NotFoundError cuando un servicio no existe
    it('should throw NotFoundError when service does not exist', async () => {
      const client = createMockUser(validClientId);
      const stylist = createMockStylist(validStylistId);

      mockUserRepository.findById.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(validCreateDto, validUserId)).rejects.toThrow(
        new NotFoundError('Service', validServiceId1),
      );
    });
  });

  describe('Conflict Detection', () => {
    // Debería lanzar ConflictError cuando hay citas en conflicto
    it('should throw ConflictError when there are conflicting appointments', async () => {
      const conflictingAppointment = createMockAppointment({ id: generateUuid() });
      const client = createMockUser(validClientId);
      const stylist = createMockStylist(validStylistId);
      const service = createMockService(validServiceId1);
      const pendingStatus = createMockAppointmentStatus('Pendiente');
      const schedule = createMockSchedule('MONDAY');

      mockUserRepository.findById.mockResolvedValue(client);
      mockStylistRepository.findById.mockResolvedValue(stylist);
      mockServiceRepository.findById.mockResolvedValue(service);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([pendingStatus]);
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

      expect(mockUserRepository.findById).toHaveBeenCalledWith(validClientId);
      expect(mockStylistRepository.findById).toHaveBeenCalledWith(validStylistId);
      expect(mockServiceRepository.findById).toHaveBeenCalledWith(validServiceId1);
      expect(mockAppointmentStatusRepository.findAll).toHaveBeenCalled();
      expect(mockScheduleRepository.findAll).toHaveBeenCalled();
      expect(mockAppointmentRepository.save).toHaveBeenCalled();
    });
  });
});
