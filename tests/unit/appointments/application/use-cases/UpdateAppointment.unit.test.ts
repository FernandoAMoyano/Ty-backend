import { UpdateAppointment } from '../../../../../src/modules/appointments/application/use-cases/UpdateAppointment';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { ServiceRepository } from '../../../../../src/modules/services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../../../src/modules/services/domain/repositories/StylistRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { Service } from '../../../../../src/modules/services/domain/entities/Service';
import { Stylist } from '../../../../../src/modules/services/domain/entities/Stylist';
import { UpdateAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/UpdateAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { ConflictError } from '../../../../../src/shared/exceptions/ConflictError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('UpdateAppointment Use Case', () => {
  let useCase: UpdateAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;
  let mockServiceRepository: jest.Mocked<ServiceRepository>;
  let mockStylistRepository: jest.Mocked<StylistRepository>;

  const getFutureDate = (hoursFromNow: number = 48): Date => {
    const future = new Date();
    future.setHours(future.getHours() + hoursFromNow);
    return future;
  };

  const getFutureISOString = (hoursFromNow: number = 48): string => {
    return getFutureDate(hoursFromNow).toISOString();
  };

  // IDs válidos
  const validAppointmentId = generateUuid();
  const validRequesterId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validStylistId = generateUuid();
  const validNewStylistId = generateUuid();
  const validScheduleId = generateUuid();
  const validConfirmedStatusId = generateUuid();
  const validServiceId1 = generateUuid();
  const validNewServiceId = generateUuid();

  const minimalUpdateDto: UpdateAppointmentDto = { notes: 'Minor update' };

  const createMockAppointment = (overrides: any = {}): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(48),
      duration: 60,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validConfirmedStatusId,
      stylistId: validStylistId,
      serviceIds: [validServiceId1],
      confirmedAt: new Date(),
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
    name: string,
    id: string = generateUuid(),
  ): AppointmentStatus => {
    return new AppointmentStatus(id, name, `Status: ${name}`);
  };

  const createMockService = (id: string = generateUuid()): Service => {
    const categoryId = generateUuid();
    return {
      id,
      categoryId,
      name: `Service ${id.slice(-4)}`,
      description: 'Mock service description',
      duration: 60,
      durationVariation: 15,
      price: 10000, // En centavos como requiere la entidad
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      validate: jest.fn(),
      updateDetails: jest.fn(),
      updateCategory: jest.fn(),
      activate: jest.fn(),
      deactivate: jest.fn(),
      calculateMinDuration: jest.fn().mockReturnValue(45),
      calculateMaxDuration: jest.fn().mockReturnValue(75),
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

  const setupBasicSuccessfulMocks = (appointment: Appointment) => {
    const confirmedStatus = createMockAppointmentStatus(
      AppointmentStatusEnum.CONFIRMED,
      validConfirmedStatusId,
    );
    mockAppointmentRepository.findById.mockResolvedValue(appointment);
    mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);
    mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([]);
    mockAppointmentRepository.update.mockResolvedValue(appointment);
  };

  beforeEach(() => {
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
      findByName: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      existsByName: jest.fn(),
      findTerminalStatuses: jest.fn(),
      findActiveStatuses: jest.fn(),
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
    } as unknown as jest.Mocked<ServiceRepository>;

    mockStylistRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
    } as unknown as jest.Mocked<StylistRepository>;

    useCase = new UpdateAppointment(
      mockAppointmentRepository,
      mockAppointmentStatusRepository,
      mockServiceRepository,
      mockStylistRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería actualizar cita exitosamente con datos completos
    it('should update appointment successfully with complete data', async () => {
      const completeUpdateDto: UpdateAppointmentDto = {
        dateTime: getFutureISOString(72),
        duration: 90,
        stylistId: validNewStylistId,
        serviceIds: [validNewServiceId],
        notes: 'Updated due to client request',
        reason: 'Client preferred different time',
        notifyClient: true,
      };

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      jest.spyOn(appointment, 'isConfirmed').mockReturnValue(true);

      setupBasicSuccessfulMocks(appointment);
      mockStylistRepository.findById.mockResolvedValue(createMockStylist(validNewStylistId));
      mockServiceRepository.findById.mockResolvedValue(createMockService(validNewServiceId));

      const result = await useCase.execute(validAppointmentId, completeUpdateDto, validRequesterId);

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(result.id).toBe(appointment.id);
    });

    // Debería actualizar cita exitosamente con cambios mínimos
    it('should update appointment successfully with minimal changes', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId);

      expect(result.id).toBe(appointment.id);
      expect(mockStylistRepository.findById).not.toHaveBeenCalled();
      expect(mockServiceRepository.findById).not.toHaveBeenCalled();
    });

    // Debería permitir actualización por el estilista asignado
    it('should allow update by assigned stylist', async () => {
      const appointment = createMockAppointment({
        stylistId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId);
      expect(result.id).toBe(appointment.id);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para appointmentId vacío
    it('should throw error for empty appointmentId', async () => {
      await expect(useCase.execute('', minimalUpdateDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );
    });

    // Debería lanzar error para appointmentId con formato UUID inválido
    it('should throw error for invalid appointmentId UUID format', async () => {
      await expect(
        useCase.execute('invalid-uuid', minimalUpdateDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Appointment ID must be a valid UUID'));
    });

    // Debería lanzar error si no se proporcionan campos para actualizar
    it('should throw error if no fields provided for update', async () => {
      const emptyDto: UpdateAppointmentDto = {};
      await expect(useCase.execute(validAppointmentId, emptyDto, validRequesterId)).rejects.toThrow(
        new ValidationError('At least one field must be provided for update'),
      );
    });

    // Debería lanzar error para fecha en el pasado
    it('should throw error for past dateTime', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const pastDateDto: UpdateAppointmentDto = { dateTime: pastDate.toISOString() };

      await expect(
        useCase.execute(validAppointmentId, pastDateDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Appointment cannot be rescheduled to the past'));
    });

    // Debería lanzar error para valores de duración inválidos
    it('should throw error for invalid duration values', async () => {
      const testCases = [
        { duration: 0, expectedError: 'Duration must be greater than 0' },
        { duration: 10, expectedError: 'Minimum appointment duration is 15 minutes' },
        { duration: 500, expectedError: 'Maximum appointment duration is 8 hours' },
        { duration: 22, expectedError: 'Duration must be in 15-minute increments' },
      ];

      for (const testCase of testCases) {
        const invalidDurationDto: UpdateAppointmentDto = { duration: testCase.duration };
        await expect(
          useCase.execute(validAppointmentId, invalidDurationDto, validRequesterId),
        ).rejects.toThrow(new ValidationError(testCase.expectedError));
      }
    });

    // Debería lanzar error para notas demasiado largas
    it('should throw error for notes too long', async () => {
      const longNotesDto: UpdateAppointmentDto = { notes: 'x'.repeat(501) };
      await expect(
        useCase.execute(validAppointmentId, longNotesDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Notes cannot exceed 500 characters'));
    });
  });

  describe('Business Rules Validation', () => {
    // Debería lanzar BusinessRuleError para usuario sin permisos
    it('should throw BusinessRuleError for user without permissions', async () => {
      const unauthorizedUserId = generateUuid();
      const appointment = createMockAppointment({ userId: validUserId, stylistId: validStylistId });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      await expect(
        useCase.execute(validAppointmentId, minimalUpdateDto, unauthorizedUserId),
      ).rejects.toThrow(
        new BusinessRuleError('You do not have permission to update this appointment'),
      );
    });

    // Debería lanzar BusinessRuleError para citas con estados terminales
    it('should throw BusinessRuleError for terminal status appointments', async () => {
      const terminalStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

      for (const statusName of terminalStatuses) {
        const statusId = generateUuid();
        const appointment = createMockAppointment({ userId: validRequesterId, statusId });
        const terminalStatus = createMockAppointmentStatus(statusName, statusId);

        mockAppointmentRepository.findById.mockResolvedValue(appointment);
        mockAppointmentStatusRepository.findById.mockResolvedValue(terminalStatus);

        await expect(
          useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId),
        ).rejects.toThrow(new BusinessRuleError('Cannot update appointments in terminal status'));

        jest.clearAllMocks();
      }
    });

    // Debería requerir nota para cambios de fecha en citas confirmadas
    it('should require note for dateTime changes in confirmed appointments', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      jest.spyOn(appointment, 'isConfirmed').mockReturnValue(true);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      const dateOnlyDto: UpdateAppointmentDto = { dateTime: getFutureISOString(120) };

      await expect(
        useCase.execute(validAppointmentId, dateOnlyDto, validRequesterId),
      ).rejects.toThrow(
        new BusinessRuleError(
          'A note or reason is required when changing the date/time of a confirmed appointment',
        ),
      );
    });

    // Debería lanzar BusinessRuleError para modificaciones demasiado tarde
    it('should throw BusinessRuleError for too late modifications', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      jest.spyOn(appointment, 'canBeModified').mockReturnValue(false);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      await expect(
        useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId),
      ).rejects.toThrow(
        new BusinessRuleError(
          'Appointments can only be modified at least 24 hours in advance. ' +
            'For last-minute changes, please contact customer service.',
        ),
      );
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError cuando la cita no existe
    it('should throw NotFoundError when appointment does not exist', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId),
      ).rejects.toThrow(new NotFoundError('Appointment', validAppointmentId));
    });

    // Debería lanzar NotFoundError cuando el estilista no existe
    it('should throw NotFoundError when stylist does not exist', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const invalidStylistDto: UpdateAppointmentDto = { stylistId: validNewStylistId };
      mockStylistRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(validAppointmentId, invalidStylistDto, validRequesterId),
      ).rejects.toThrow(new NotFoundError('Stylist', validNewStylistId));
    });

    // Debería lanzar NotFoundError cuando el servicio no existe
    it('should throw NotFoundError when service does not exist', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const invalidServiceDto: UpdateAppointmentDto = { serviceIds: [validNewServiceId] };
      mockServiceRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(validAppointmentId, invalidServiceDto, validRequesterId),
      ).rejects.toThrow(new NotFoundError('Service', validNewServiceId));
    });
  });

  describe('Conflict Detection', () => {
    // Debería lanzar ConflictError para conflictos de horario
    it('should throw ConflictError for scheduling conflicts', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);

      const conflictingAppointment = createMockAppointment({ id: generateUuid() });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);
      mockAppointmentRepository.findConflictingAppointments.mockResolvedValue([
        conflictingAppointment,
      ]);

      const dateTimeUpdateDto: UpdateAppointmentDto = {
        dateTime: getFutureISOString(96),
        notes: 'Reschedule due to conflict',
      };

      await expect(
        useCase.execute(validAppointmentId, dateTimeUpdateDto, validRequesterId),
      ).rejects.toThrow(
        new ConflictError(
          'The updated appointment conflicts with 1 existing appointment(s). ' +
            'Please choose a different time or stylist.',
        ),
      );
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar repositorios con parámetros correctos
    it('should call repositories with correct parameters', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      await useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId);

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
    });
  });

  describe('Data Mapping', () => {
    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
      });
      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId);

      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(96),
        serviceIds: ['service1', 'service2', 'service3'],
      });

      jest.spyOn(appointment, 'canBeModified').mockReturnValue(true);
      setupBasicSuccessfulMocks(appointment);

      const result = await useCase.execute(validAppointmentId, minimalUpdateDto, validRequesterId);

      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toEqual(appointment.serviceIds);
      expect(result.serviceIds).toHaveLength(3);
    });
  });
});
