import { CancelAppointment } from '../../../../../src/modules/appointments/application/use-cases/CancelAppointment';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentStatusRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { CancelAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/CancelAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../../src/shared/exceptions/ForbiddenError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('CancelAppointment Use Case', () => {
  let useCase: CancelAppointment;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<IAppointmentStatusRepository>;

  const getFutureDate = (hoursFromNow: number = 48): Date => {
    const future = new Date();
    future.setHours(future.getHours() + hoursFromNow);
    return future;
  };

  const validAppointmentId = generateUuid();
  const validRequesterId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validStylistId = generateUuid();
  const validScheduleId = generateUuid();
  const validConfirmedStatusId = generateUuid();
  const validCancelledStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  const adminRole = 'ADMIN';

  const validCancelDto: CancelAppointmentDto = {
    reason: 'Client requested cancellation due to scheduling conflict',
    cancelledBy: 'client',
    notifyClient: true,
  };

  const minimalCancelDto: CancelAppointmentDto = {};

  const createMockAppointment = (
    overrides: Partial<{
      id: string;
      dateTime: Date;
      duration: number;
      statusId: string;
      confirmedAt: Date;
      userId: string;
      stylistId: string;
      clientId: string;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(48),
      duration: 60,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validConfirmedStatusId,
      stylistId: validStylistId,
      serviceIds: [...validServiceIds],
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

  const setupSuccessfulMocks = (appointment: Appointment) => {
    const confirmedStatus = createMockAppointmentStatus(
      AppointmentStatusEnum.CONFIRMED,
      validConfirmedStatusId,
    );
    const cancelledStatus = createMockAppointmentStatus(
      AppointmentStatusEnum.CANCELLED,
      validCancelledStatusId,
    );

    mockAppointmentRepository.findById.mockResolvedValue(appointment);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
    mockAppointmentStatusRepository.findByName.mockResolvedValue(cancelledStatus);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(cancelledStatus);
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
      findByClientIdPaginated: jest.fn(),
      countByClientId: jest.fn(),
      findByStylistIdPaginated: jest.fn(),
      countByStylistId: jest.fn(),
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
      existsByServiceId: jest.fn(),
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

    useCase = new CancelAppointment(mockAppointmentRepository, mockAppointmentStatusRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    it('should cancel appointment successfully with complete data', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        validRequesterId,
        adminRole,
      );

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(
        AppointmentStatusEnum.CANCELLED,
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
      expect(result.id).toBe(appointment.id);
    });

    it('should cancel appointment successfully with minimal data', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        minimalCancelDto,
        validRequesterId,
        adminRole,
      );

      expect(result.id).toBe(appointment.id);
    });

    it('should allow cancellation by assigned client', async () => {
      const appointment = createMockAppointment({
        clientId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        validRequesterId,
        'CLIENT',
      );

      expect(result.id).toBe(appointment.id);
    });

    it('should allow cancellation by assigned stylist', async () => {
      const appointment = createMockAppointment({
        stylistId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        validRequesterId,
        'STYLIST',
      );

      expect(result.id).toBe(appointment.id);
    });

    // Debería permitir ADMIN cancelar cualquier cita
    it('should allow ADMIN to cancel any appointment', async () => {
      const unrelatedAdminId = generateUuid();
      const appointment = createMockAppointment({ dateTime: getFutureDate(72) });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        unrelatedAdminId,
        'ADMIN',
      );

      expect(result.id).toBe(appointment.id);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for empty appointmentId', async () => {
      await expect(
        useCase.execute('', validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Appointment ID is required'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error for invalid appointmentId UUID format', async () => {
      await expect(
        useCase.execute('invalid-uuid', validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Appointment ID must be a valid UUID'));
    });

    it('should throw error for empty requesterId', async () => {
      await expect(
        useCase.execute(validAppointmentId, validCancelDto, '', adminRole),
      ).rejects.toThrow(new ValidationError('Requester ID is required'));
    });

    it('should throw error for empty cancellation reason if provided', async () => {
      const invalidCancelDto: CancelAppointmentDto = { reason: '   ' };
      await expect(
        useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Cancellation reason cannot be empty if provided'));
    });

    it('should throw error for cancellation reason too long', async () => {
      const invalidCancelDto: CancelAppointmentDto = { reason: 'x'.repeat(501) };
      await expect(
        useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Cancellation reason cannot exceed 500 characters'));
    });

    it('should throw error for invalid cancellation type', async () => {
      const invalidCancelDto: CancelAppointmentDto = { cancelledBy: 'invalid-type' as any };
      await expect(
        useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(
        new ValidationError(
          'Invalid cancellation type. Must be one of: client, stylist, admin, system',
        ),
      );
    });
  });

  describe('Business Rules Validation', () => {
    it('should throw BusinessRuleError for already cancelled appointment', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        statusId: validCancelledStatusId,
      });
      const cancelledStatus = createMockAppointmentStatus(
        AppointmentStatusEnum.CANCELLED,
        validCancelledStatusId,
      );
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(cancelledStatus);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new BusinessRuleError('Appointment is already cancelled'));
    });

    it('should throw BusinessRuleError for completed appointment', async () => {
      const completedStatusId = generateUuid();
      const appointment = createMockAppointment({
        userId: validRequesterId,
        statusId: completedStatusId,
      });
      const completedStatus = createMockAppointmentStatus(
        AppointmentStatusEnum.COMPLETED,
        completedStatusId,
      );
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(completedStatus);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new BusinessRuleError('Cannot cancel a completed appointment'));
    });

    // Usar rol CLIENT para que no tenga ADMIN override
    it('should throw ForbiddenError for user without permissions', async () => {
      const unauthorizedUserId = generateUuid();
      const appointment = createMockAppointment({
        userId: validUserId,
        clientId: validClientId,
        stylistId: validStylistId,
        dateTime: getFutureDate(72),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, unauthorizedUserId, 'CLIENT'),
      ).rejects.toThrow(
        new ForbiddenError('You do not have permission to cancel this appointment'),
      );
    });

    it('should throw BusinessRuleError for too late cancellation', async () => {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 1);
      const appointment = createMockAppointment({ userId: validRequesterId, dateTime: soonDate });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError for past appointment', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);
      jest.spyOn(appointment, 'isInPast').mockReturnValue(true);
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(
        new BusinessRuleError('Cannot cancel appointments that have already occurred'),
      );
    });
  });

  describe('Not Found Handling', () => {
    it('should throw NotFoundError when appointment does not exist', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new NotFoundError('Appointment', validAppointmentId));
    });

    it('should throw NotFoundError when CANCELLED status does not exist', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);
      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);
      mockAppointmentStatusRepository.findByName.mockResolvedValue(null);

      await expect(
        useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole),
      ).rejects.toThrow(new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CANCELLED));
    });
  });

  describe('Cancellation Types', () => {
    it('should handle client cancellation', async () => {
      const clientCancelDto: CancelAppointmentDto = {
        reason: 'Personal emergency',
        cancelledBy: 'client',
        notifyClient: false,
      };
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        clientCancelDto,
        validRequesterId,
        adminRole,
      );
      expect(result.id).toBe(appointment.id);
    });

    it('should handle stylist cancellation', async () => {
      const stylistCancelDto: CancelAppointmentDto = {
        reason: 'Stylist fell sick',
        cancelledBy: 'stylist',
        notifyClient: true,
      };
      const appointment = createMockAppointment({
        stylistId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        stylistCancelDto,
        validRequesterId,
        adminRole,
      );
      expect(result.id).toBe(appointment.id);
    });

    it('should handle admin cancellation', async () => {
      const adminCancelDto: CancelAppointmentDto = {
        reason: 'Salon closed due to maintenance',
        cancelledBy: 'admin',
        notifyClient: true,
      };
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        adminCancelDto,
        validRequesterId,
        adminRole,
      );
      expect(result.id).toBe(appointment.id);
    });

    it('should handle system cancellation', async () => {
      const systemCancelDto: CancelAppointmentDto = {
        reason: 'Automatic cancellation',
        cancelledBy: 'system',
        notifyClient: true,
      };
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        systemCancelDto,
        validRequesterId,
        adminRole,
      );
      expect(result.id).toBe(appointment.id);
    });
  });

  describe('Repository Integration', () => {
    it('should call repositories with correct parameters', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      await useCase.execute(validAppointmentId, validCancelDto, validRequesterId, adminRole);

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(
        AppointmentStatusEnum.CANCELLED,
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
    });
  });

  describe('Data Mapping', () => {
    it('should map dates to ISO string format', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        validRequesterId,
        adminRole,
      );

      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
    });

    it('should maintain array structure intact', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validCancelDto,
        validRequesterId,
        adminRole,
      );

      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toEqual(appointment.serviceIds);
    });
  });
});
