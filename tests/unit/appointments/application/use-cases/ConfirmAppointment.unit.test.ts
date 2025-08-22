import { ConfirmAppointment } from '../../../../../src/modules/appointments/application/use-cases/ConfirmAppointment';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { ConfirmAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/ConfirmAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('ConfirmAppointment Use Case', () => {
  let useCase: ConfirmAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;

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
      stylistId: string;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(48), // 2 días en futuro por defecto
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
    // Para validateConfirmationRules (status actual)
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(pendingStatus);
    // Para getConfirmedStatus
    mockAppointmentStatusRepository.findByName.mockResolvedValue(confirmedStatus);
    // Para validateStatusTransition - current status
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(pendingStatus);
    // Para validateStatusTransition - new status
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
    mockAppointmentRepository.update.mockResolvedValue(appointment);
  };

  beforeEach(() => {
    // Crear mock completo del AppointmentRepository
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

    // Crear mock del AppointmentStatusRepository
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

    // Crear instancia del caso de uso con los mocks
    useCase = new ConfirmAppointment(mockAppointmentRepository, mockAppointmentStatusRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería confirmar cita exitosamente con datos completos
    it('should confirm appointment successfully with complete data', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId, // El requester es el creador
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(
        AppointmentStatusEnum.CONFIRMED,
      );
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);

      expect(result.id).toBe(appointment.id);
    });

    // Debería confirmar cita exitosamente con datos mínimos
    it('should confirm appointment successfully with minimal data', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, minimalConfirmDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir confirmación por el estilista asignado
    it('should allow confirmation by assigned stylist', async () => {
      // Arrange
      const appointment = createMockAppointment({
        stylistId: validRequesterId, // El requester es el estilista
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para appointmentId vacío
    it('should throw error for empty appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute('', validConfirmDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId con formato UUID inválido
    it('should throw error for invalid appointmentId UUID format', async () => {
      // Act & Assert
      await expect(
        useCase.execute('invalid-uuid', validConfirmDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Appointment ID must be a valid UUID'));

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para requesterId vacío
    it('should throw error for empty requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validConfirmDto, '')).rejects.toThrow(
        new ValidationError('Requester ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para notas vacías si se proporcionan
    it('should throw error for empty notes if provided', async () => {
      // Arrange
      const invalidConfirmDto: ConfirmAppointmentDto = {
        notes: '   ', // Solo espacios
      };

      // Act & Assert
      await expect(
        useCase.execute(validAppointmentId, invalidConfirmDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Confirmation notes cannot be empty if provided'));

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para notas demasiado largas
    it('should throw error for notes too long', async () => {
      // Arrange
      const invalidConfirmDto: ConfirmAppointmentDto = {
        notes: 'x'.repeat(501), // 501 caracteres
      };

      // Act & Assert
      await expect(
        useCase.execute(validAppointmentId, invalidConfirmDto, validRequesterId),
      ).rejects.toThrow(new ValidationError('Confirmation notes cannot exceed 500 characters'));

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Business Rules Validation', () => {
    // Debería lanzar BusinessRuleError para cita ya confirmada
    it('should throw BusinessRuleError for already confirmed appointment', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        confirmedAt: new Date(), // Ya confirmada
      });

      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act & Assert
      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, validRequesterId),
      ).rejects.toThrow(new BusinessRuleError('Appointment is already confirmed'));
    });

    // Debería lanzar BusinessRuleError para usuario sin permisos
    it('should throw BusinessRuleError for user without permissions', async () => {
      // Arrange
      const unauthorizedUserId = generateUuid();
      const appointment = createMockAppointment({
        userId: validUserId, // Diferente al requester
        stylistId: validStylistId, // Diferente al requester
      });
      const pendingStatus = createMockAppointmentStatus(AppointmentStatusEnum.PENDING);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(pendingStatus);

      // Act & Assert
      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, unauthorizedUserId),
      ).rejects.toThrow(
        new BusinessRuleError('You do not have permission to confirm this appointment'),
      );
    });

    // Debería lanzar BusinessRuleError para confirmación demasiado tarde
    it('should throw BusinessRuleError for too late confirmation', async () => {
      // Arrange
      const soonDate = new Date();
      soonDate.setMinutes(soonDate.getMinutes() + 30); // Solo 30 minutos en futuro

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: soonDate,
      });
      const pendingStatus = createMockAppointmentStatus(AppointmentStatusEnum.PENDING);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(pendingStatus);

      // Act & Assert
      await expect(
        useCase.execute(validAppointmentId, validConfirmDto, validRequesterId),
      ).rejects.toThrow(
        new BusinessRuleError(
          'Appointments can only be confirmed at least 1 hour in advance. ' +
            'For last-minute confirmations, please contact customer service.',
        ),
      );
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar repositorios con parámetros correctos
    it('should call repositories with correct parameters', async () => {
      // Arrange
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      // Act
      await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId);

      // Assert
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
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId);

      // Assert
      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      // Arrange
      const appointment = createMockAppointment({ userId: validRequesterId });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validConfirmDto, validRequesterId);

      // Assert
      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toEqual(appointment.serviceIds);
    });
  });
});
