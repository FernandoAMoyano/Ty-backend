import { ConfirmAppointment } from '../../../../../src/modules/appointments/application/use-cases/ConfirmAppointment';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentStatusRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { ConfirmAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/ConfirmAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../../src/shared/exceptions/ForbiddenError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('ConfirmAppointment Use Case', () => {
  let useCase: ConfirmAppointment;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<IAppointmentStatusRepository>;

  // Generar fechas futuras dinámicamente para evitar problemas de tiempo
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
  const validPendingStatusId = generateUuid();
  const validConfirmedStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  // Constante de rol para tests que no prueban permisos
  const adminRole = 'ADMIN';

  // DTOs de ejemplo
  const validConfirmDto: ConfirmAppointmentDto = {
    notes: 'Confirmed by client request',
    notifyClient: true,
    confirmedBy: validRequesterId,
  };

  const minimalConfirmDto: ConfirmAppointmentDto = {};

  // Crear appointment de ejemplo para los tests
  const createMockAppointment = (
    overrides: Partial<{
      id: string;
      dateTime: Date;
      duration: number;
      statusId: string;
      confirmedAt: Date;
      userId: string;
      clientId: string;
      stylistId: string;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(48),
      duration: 60,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validPendingStatusId,
      stylistId: validStylistId,
      serviceIds: [...validServiceIds],
      confirmedAt: undefined,
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

  // Crear appointment status de ejemplo
  const createMockAppointmentStatus = (
    name: string,
    id: string = generateUuid(),
  ): AppointmentStatus => {
    return new AppointmentStatus(id, name, `Status: ${name}`);
  };

  // Helper para configurar mocks exitosos
  const setupSuccessfulMocks = (appointment: Appointment) => {
    const pendingStatus = createMockAppointmentStatus(
      AppointmentStatusEnum.PENDING,
      validPendingStatusId,
    );
    const confirmedStatus = createMockAppointmentStatus(
      AppointmentStatusEnum.CONFIRMED,
      validConfirmedStatusId,
    );

    mockAppointmentRepository.findById.mockResolvedValue(appointment);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(pendingStatus);
    mockAppointmentStatusRepository.findByName.mockResolvedValue(confirmedStatus);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(pendingStatus);
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
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

    useCase = new ConfirmAppointment(mockAppointmentRepository, mockAppointmentStatusRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería confirmar cita exitosamente con datos completos
    it('should confirm appointment successfully with complete data', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        validRequesterId,
        adminRole,
      );

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(
        AppointmentStatusEnum.CONFIRMED,
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
      expect(result.id).toBe(appointment.id);
    });

    // Debería confirmar cita exitosamente con datos mínimos
    it('should confirm appointment successfully with minimal data', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        minimalConfirmDto,
        validRequesterId,
        adminRole,
      );

      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir confirmación por el estilista asignado
    it('should allow confirmation by assigned stylist', async () => {
      const appointment = createMockAppointment({ stylistId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        validRequesterId,
        'STYLIST',
      );

      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir confirmación por el clientId
    it('should allow confirmation by clientId', async () => {
      const appointment = createMockAppointment({ clientId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        validRequesterId,
        'CLIENT',
      );

      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir ADMIN confirmar cualquier cita
    it('should allow ADMIN to confirm any appointment', async () => {
      const unrelatedAdminId = generateUuid();
      const appointment = createMockAppointment();
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        unrelatedAdminId,
        'ADMIN',
      );

      expect(result.id).toBe(appointment.id);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para appointmentId vacío
    it('should throw error for empty appointmentId', async () => {
      await expect(
        useCase.execute('', validConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Appointment ID is required'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId con formato UUID inválido
    it('should throw error for invalid appointmentId UUID format', async () => {
      await expect(
        useCase.execute('invalid-uuid', validConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Appointment ID must be a valid UUID'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para requesterId vacío
    it('should throw error for empty requesterId', async () => {
      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, '', adminRole),
      ).rejects.toThrow(new ValidationError('Requester ID is required'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para notas vacías si se proporcionan
    it('should throw error for empty notes if provided', async () => {
      const invalidConfirmDto: ConfirmAppointmentDto = { notes: '   ' };

      await expect(
        useCase.execute(validAppointmentId, invalidConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Confirmation notes cannot be empty if provided'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para notas demasiado largas
    it('should throw error for notes too long', async () => {
      const invalidConfirmDto: ConfirmAppointmentDto = { notes: 'x'.repeat(501) };

      await expect(
        useCase.execute(validAppointmentId, invalidConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Confirmation notes cannot exceed 500 characters'));
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Business Rules Validation', () => {
    // Debería lanzar BusinessRuleError para cita ya confirmada
    it('should throw BusinessRuleError for already confirmed appointment', async () => {
      const appointment = createMockAppointment({
        userId: validRequesterId,
        confirmedAt: new Date(),
      });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(new BusinessRuleError('Appointment is already confirmed'));
    });

    // Debería lanzar ForbiddenError para usuario sin permisos (no ADMIN)
    it('should throw ForbiddenError for user without permissions', async () => {
      const unauthorizedUserId = generateUuid();
      const appointment = createMockAppointment({
        userId: validUserId,
        stylistId: validStylistId,
      });
      const pendingStatus = createMockAppointmentStatus(AppointmentStatusEnum.PENDING);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(pendingStatus);

      // Usar rol CLIENT para que no tenga ADMIN override
      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, unauthorizedUserId, 'CLIENT'),
      ).rejects.toThrow(
        new ForbiddenError('You do not have permission to confirm this appointment'),
      );
    });

    // Debería lanzar BusinessRuleError para confirmación demasiado tarde
    it('should throw BusinessRuleError for too late confirmation', async () => {
      const soonDate = new Date();
      soonDate.setMinutes(soonDate.getMinutes() + 30);

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: soonDate,
      });
      const pendingStatus = createMockAppointmentStatus(AppointmentStatusEnum.PENDING);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(pendingStatus);

      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, validRequesterId, adminRole),
      ).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar repositorios con parámetros correctos
    it('should call repositories with correct parameters', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId, adminRole);

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(
        AppointmentStatusEnum.CONFIRMED,
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
    });
  });

  describe('Data Mapping', () => {
    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        validRequesterId,
        adminRole,
      );

      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      const result = await useCase.execute(
        validAppointmentId,
        validConfirmDto,
        validRequesterId,
        adminRole,
      );

      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toEqual(appointment.serviceIds);
    });
  });
});
