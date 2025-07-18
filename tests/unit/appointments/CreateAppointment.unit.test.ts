import { CreateAppointment } from '../../../src/modules/appointments/application/use-cases/CreateAppointment';
import { AppointmentRepository } from '../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { ScheduleRepository } from '../../../src/modules/appointments/domain/repositories/ScheduleRepository';
import { ServiceRepository } from '../../../src/modules/services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../src/modules/services/domain/repositories/StylistRepository';
import { UserRepository } from '../../../src/modules/auth/domain/repositories/User';
import { Appointment } from '../../../src/modules/appointments/domain/entities/Appointment';
import { AppointmentStatus } from '../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { Schedule, DayOfWeekEnum } from '../../../src/modules/appointments/domain/entities/Schedule';
import { Service } from '../../../src/modules/services/domain/entities/Service';
import { Stylist } from '../../../src/modules/services/domain/entities/Stylist';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { CreateAppointmentDto } from '../../../src/modules/appointments/application/dto/request/CreateAppointmentDto';
import { ValidationError } from '../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../src/shared/exceptions/NotFoundError';
import { ConflictError } from '../../../src/shared/exceptions/ConflictError';

describe('CreateAppointment Use Case', () => {
  let createAppointment: CreateAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockStylistRepository: jest.Mocked<StylistRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  // Usar una fecha específica que sabemos que es lunes Y está en el futuro
  const futureMonday = new Date('2025-12-22T10:00:00.000Z'); // 22 diciembre 2025 es lunes
  const validCreateDto: CreateAppointmentDto = {
    dateTime: futureMonday.toISOString(),
    clientId: 'client-id-123',
    stylistId: 'stylist-id-123',
    serviceIds: ['service-id-123'],
    duration: 60,
  };

  const validUserId = 'user-id-123';

  beforeEach(() => {
    // Mock repositories with all methods
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
    };

    mockAppointmentStatusRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      findTerminalStatuses: jest.fn(),
      findActiveStatuses: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
    };

    mockScheduleRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDayOfWeek: jest.fn(),
      findByHolidayId: jest.fn(),
      findRegularSchedule: jest.fn(),
      findHolidaySchedule: jest.fn(),
      findAvailableSchedulesForDay: jest.fn(),
      findScheduleByTimeSlot: jest.fn(),
      findConflictingSchedules: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
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

    mockStylistRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
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

    createAppointment = new CreateAppointment(
      mockAppointmentRepository,
      mockAppointmentStatusRepository,
      mockScheduleRepository,
      mockServiceRepository,
      mockStylistRepository,
      mockUserRepository,
    );
  });

  describe('execute', () => {
    it('should create appointment successfully', async () => {
      // Arrange
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 60, 15, 2500);
      const mockStatus = AppointmentStatus.create('Pendiente', 'Cita pendiente de confirmación');
      const mockSchedule = Schedule.create(DayOfWeekEnum.MONDAY, '09:00', '18:00');
      
      // Set IDs manually for mocked entities
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id-123', writable: false });
      Object.defineProperty(mockService, 'id', { value: 'service-id-123', writable: false });
      Object.defineProperty(mockStatus, 'id', { value: 'status-id-123', writable: false });
      Object.defineProperty(mockSchedule, 'id', { value: 'schedule-id-123', writable: false });

      const mockAppointment = Appointment.create(
        futureMonday,
        60,
        validUserId,
        validCreateDto.clientId,
        mockSchedule.id,
        mockStatus.id,
        validCreateDto.stylistId,
        validCreateDto.serviceIds,
      );

      // Mock repository responses
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([mockStatus]);
      mockScheduleRepository.findAll.mockResolvedValue([mockSchedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentRepository.save.mockResolvedValue(mockAppointment);

      // Act
      const result = await createAppointment.execute(validCreateDto, validUserId);

      // Assert
      expect(result).toBeDefined();
      expect(result.clientId).toBe(validCreateDto.clientId);
      expect(result.stylistId).toBe(validCreateDto.stylistId);
      expect(result.serviceIds).toEqual(validCreateDto.serviceIds);
      expect(result.duration).toBe(60);
      expect(mockAppointmentRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ValidationError if userId is empty', async () => {
      await expect(
        createAppointment.execute(validCreateDto, '')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if clientId is empty', async () => {
      const invalidDto = { ...validCreateDto, clientId: '' };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if dateTime is empty', async () => {
      const invalidDto = { ...validCreateDto, dateTime: '' };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if serviceIds is empty', async () => {
      const invalidDto = { ...validCreateDto, serviceIds: [] };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if appointment is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // ayer
      const invalidDto = { ...validCreateDto, dateTime: pastDate.toISOString() };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if appointment is more than 6 months in advance', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 7); // 7 meses en el futuro
      const invalidDto = { ...validCreateDto, dateTime: futureDate.toISOString() };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if client does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if stylist does not exist', async () => {
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(null);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if service does not exist', async () => {
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(null);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if pending status does not exist', async () => {
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 60, 15, 2500);
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([]);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if schedule does not exist', async () => {
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 60, 15, 2500);
      const mockStatus = AppointmentStatus.create('Pendiente', 'Cita pendiente de confirmación');
      
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([mockStatus]);
      mockScheduleRepository.findAll.mockResolvedValue([]);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if there are conflicting appointments', async () => {
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 60, 15, 2500);
      const conflictingAppointment = Appointment.create(
        futureMonday,
        60,
        'other-user-id',
        'other-client-id',
        'schedule-id',
        'status-id',
        validCreateDto.stylistId,
        ['service-id'],
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([conflictingAppointment]);
      
      await expect(
        createAppointment.execute(validCreateDto, validUserId)
      ).rejects.toThrow(ConflictError);
    });

    it('should calculate duration from services if not provided', async () => {
      const dtoWithoutDuration = { ...validCreateDto };
      delete dtoWithoutDuration.duration;
      
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 45, 15, 2500); // 45 minutos
      const mockStatus = AppointmentStatus.create('Pendiente', 'Cita pendiente de confirmación');
      const mockSchedule = Schedule.create(DayOfWeekEnum.MONDAY, '09:00', '18:00');
      
      // Set IDs manually for mocked entities
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id-123', writable: false });
      Object.defineProperty(mockService, 'id', { value: 'service-id-123', writable: false });
      Object.defineProperty(mockStatus, 'id', { value: 'status-id-123', writable: false });
      Object.defineProperty(mockSchedule, 'id', { value: 'schedule-id-123', writable: false });

      const mockAppointment = Appointment.create(
        futureMonday,
        45, // duración calculada del servicio
        validUserId,
        validCreateDto.clientId,
        mockSchedule.id,
        mockStatus.id,
        validCreateDto.stylistId,
        validCreateDto.serviceIds,
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([mockStatus]);
      mockScheduleRepository.findAll.mockResolvedValue([mockSchedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await createAppointment.execute(dtoWithoutDuration, validUserId);

      expect(result.duration).toBe(45);
    });

    it('should work without stylist (self-service appointment)', async () => {
      const dtoWithoutStylist = { ...validCreateDto };
      delete dtoWithoutStylist.stylistId;
      
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockService = Service.create('category-id', 'Hair Cut', 'Description', 60, 15, 2500);
      const mockStatus = AppointmentStatus.create('Pendiente', 'Cita pendiente de confirmación');
      const mockSchedule = Schedule.create(DayOfWeekEnum.MONDAY, '09:00', '18:00');
      
      // Set IDs manually for mocked entities
      Object.defineProperty(mockService, 'id', { value: 'service-id-123', writable: false });
      Object.defineProperty(mockStatus, 'id', { value: 'status-id-123', writable: false });
      Object.defineProperty(mockSchedule, 'id', { value: 'schedule-id-123', writable: false });

      const mockAppointment = Appointment.create(
        futureMonday,
        60,
        validUserId,
        validCreateDto.clientId,
        mockSchedule.id,
        mockStatus.id,
        undefined, // sin estilista
        validCreateDto.serviceIds,
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([mockStatus]);
      mockScheduleRepository.findAll.mockResolvedValue([mockSchedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await createAppointment.execute(dtoWithoutStylist, validUserId);

      expect(result.stylistId).toBeUndefined();
      expect(result.clientId).toBe(validCreateDto.clientId);
    });

    it('should throw ValidationError for invalid date format', async () => {
      const invalidDto = { ...validCreateDto, dateTime: 'invalid-date' };
      
      await expect(
        createAppointment.execute(invalidDto, validUserId)
      ).rejects.toThrow(ValidationError);
    });

    it('should use minimum duration of 15 minutes if calculated duration is less', async () => {
      const dtoWithoutDuration = { ...validCreateDto };
      delete dtoWithoutDuration.duration;
      
      const mockUser = User.create('role-id', 'Test User', 'test@example.com', '+1234567890', 'password');
      const mockStylist = Stylist.create('stylist-user-id');
      const mockService = Service.create('category-id', 'Quick Service', 'Description', 5, 0, 1000); // 5 minutos
      const mockStatus = AppointmentStatus.create('Pendiente', 'Cita pendiente de confirmación');
      const mockSchedule = Schedule.create(DayOfWeekEnum.MONDAY, '09:00', '18:00');
      
      // Set IDs manually for mocked entities
      Object.defineProperty(mockStylist, 'id', { value: 'stylist-id-123', writable: false });
      Object.defineProperty(mockService, 'id', { value: 'service-id-123', writable: false });
      Object.defineProperty(mockStatus, 'id', { value: 'status-id-123', writable: false });
      Object.defineProperty(mockSchedule, 'id', { value: 'schedule-id-123', writable: false });

      const mockAppointment = Appointment.create(
        futureMonday,
        15, // duración mínima aplicada
        validUserId,
        validCreateDto.clientId,
        mockSchedule.id,
        mockStatus.id,
        validCreateDto.stylistId,
        validCreateDto.serviceIds,
      );

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockStylistRepository.findById.mockResolvedValue(mockStylist);
      mockServiceRepository.findById.mockResolvedValue(mockService);
      mockAppointmentStatusRepository.findAll.mockResolvedValue([mockStatus]);
      mockScheduleRepository.findAll.mockResolvedValue([mockSchedule]);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
      mockAppointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await createAppointment.execute(dtoWithoutDuration, validUserId);

      expect(result.duration).toBe(15);
    });
  });
});
