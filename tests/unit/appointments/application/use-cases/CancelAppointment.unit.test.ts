import { CancelAppointment } from '../../../../../src/modules/appointments/application/use-cases/CancelAppointment';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentStatusRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import {
  AppointmentStatus,
  AppointmentStatusEnum,
} from '../../../../../src/modules/appointments/domain/entities/AppointmentStatus';
import { CancelAppointmentDto } from '../../../../../src/modules/appointments/application/dto/request/CancelAppointmentDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('CancelAppointment Use Case', () => {
  let useCase: CancelAppointment;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockAppointmentStatusRepository: jest.Mocked<AppointmentStatusRepository>;

  // Generar fechas futuras dinámicamente para evitar problemas de tiempo
  const getFutureDate = (hoursFromNow: number = 48): Date => {
    const future = new Date();
    future.setHours(future.getHours() + hoursFromNow);
    return future;
  };

  // IDs válidos para los tests
  const validAppointmentId = generateUuid();
  const validRequesterId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validStylistId = generateUuid();
  const validScheduleId = generateUuid();
  const validConfirmedStatusId = generateUuid();
  const validCancelledStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  // DTOs de ejemplo
  const validCancelDto: CancelAppointmentDto = {
    reason: 'Client requested cancellation due to scheduling conflict',
    cancelledBy: 'client',
    notifyClient: true,
  };

  const minimalCancelDto: CancelAppointmentDto = {};

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
      clientId: string;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(48), // 2 días en futuro por defecto
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

  // Crear appointment status de ejemplo
  const createMockAppointmentStatus = (
    name: string,
    id: string = generateUuid(),
  ): AppointmentStatus => {
    return new AppointmentStatus(id, name, `Status: ${name}`);
  };

  // Helper para configurar mocks exitosos
  const setupSuccessfulMocks = (appointment: Appointment) => {
    const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED, validConfirmedStatusId);
    const cancelledStatus = createMockAppointmentStatus(AppointmentStatusEnum.CANCELLED, validCancelledStatusId);

    mockAppointmentRepository.findById.mockResolvedValue(appointment);
    // Para validateCancellationRules (status actual)
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
    // Para getCancelledStatus
    mockAppointmentStatusRepository.findByName.mockResolvedValue(cancelledStatus);
    // Para validateStatusTransition - current status
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(confirmedStatus);
    // Para validateStatusTransition - new status
    mockAppointmentStatusRepository.findById.mockResolvedValueOnce(cancelledStatus);
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
    useCase = new CancelAppointment(mockAppointmentRepository, mockAppointmentStatusRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería cancelar cita exitosamente con datos completos
    it('should cancel appointment successfully with complete data', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId, // El requester es el creador
        dateTime: getFutureDate(72), // 3 días en futuro (más de 2 horas)
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(AppointmentStatusEnum.CANCELLED);
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
      
      expect(result.id).toBe(appointment.id);
      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
    });

    // Debería cancelar cita exitosamente con datos mínimos
    it('should cancel appointment successfully with minimal data', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, minimalCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir cancelación por el cliente asignado
    it('should allow cancellation by assigned client', async () => {
      // Arrange
      const appointment = createMockAppointment({
        clientId: validRequesterId, // El requester es el cliente
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });

    // Debería permitir cancelación por el estilista asignado
    it('should allow cancellation by assigned stylist', async () => {
      // Arrange
      const appointment = createMockAppointment({
        stylistId: validRequesterId, // El requester es el estilista
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
      expect(mockAppointmentRepository.update).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para appointmentId vacío
    it('should throw error for empty appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute('', validCancelDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Appointment ID is required')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId con formato UUID inválido
    it('should throw error for invalid appointmentId UUID format', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid', validCancelDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Appointment ID must be a valid UUID')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para requesterId vacío
    it('should throw error for empty requesterId', async () => {
      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, '')).rejects.toThrow(
        new ValidationError('Requester ID is required')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para razón de cancelación vacía si se proporciona
    it('should throw error for empty cancellation reason if provided', async () => {
      // Arrange
      const invalidCancelDto: CancelAppointmentDto = {
        reason: '   ', // Solo espacios
      };

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Cancellation reason cannot be empty if provided')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para razón de cancelación demasiado larga
    it('should throw error for cancellation reason too long', async () => {
      // Arrange
      const invalidCancelDto: CancelAppointmentDto = {
        reason: 'x'.repeat(501), // 501 caracteres
      };

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Cancellation reason cannot exceed 500 characters')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para tipo de cancelación inválido
    it('should throw error for invalid cancellation type', async () => {
      // Arrange
      const invalidCancelDto: CancelAppointmentDto = {
        cancelledBy: 'invalid-type' as any,
      };

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, invalidCancelDto, validRequesterId)).rejects.toThrow(
        new ValidationError('Invalid cancellation type. Must be one of: client, stylist, admin, system')
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('Business Rules Validation', () => {
    // Debería lanzar BusinessRuleError para cita ya cancelada
    it('should throw BusinessRuleError for already cancelled appointment', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        statusId: validCancelledStatusId,
      });
      const cancelledStatus = createMockAppointmentStatus(AppointmentStatusEnum.CANCELLED, validCancelledStatusId);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(cancelledStatus);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new BusinessRuleError('Appointment is already cancelled')
      );
    });

    // Debería lanzar BusinessRuleError para cita completada
    it('should throw BusinessRuleError for completed appointment', async () => {
      // Arrange
      const completedStatusId = generateUuid();
      const appointment = createMockAppointment({
        userId: validRequesterId,
        statusId: completedStatusId,
      });
      const completedStatus = createMockAppointmentStatus(AppointmentStatusEnum.COMPLETED, completedStatusId);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(completedStatus);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new BusinessRuleError('Cannot cancel a completed appointment')
      );
    });

    // Debería lanzar BusinessRuleError para usuario sin permisos
    it('should throw BusinessRuleError for user without permissions', async () => {
      // Arrange
      const unauthorizedUserId = generateUuid();
      const appointment = createMockAppointment({
        userId: validUserId, // Diferente al requester
        clientId: validClientId, // Diferente al requester
        stylistId: validStylistId, // Diferente al requester
        dateTime: getFutureDate(72),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, unauthorizedUserId)).rejects.toThrow(
        new BusinessRuleError('You do not have permission to cancel this appointment')
      );
    });

    // Debería lanzar BusinessRuleError para cancelación demasiado tarde (política de 2 horas)
    it('should throw BusinessRuleError for too late cancellation', async () => {
      // Arrange
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 1); // Solo 1 hora en futuro (menos de 2 requeridas)

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: soonDate,
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new BusinessRuleError(
          'Appointments can only be cancelled at least 2 hours in advance. ' +
          'For last-minute cancellations, please contact customer service.'
        )
      );
    });

    // Debería lanzar BusinessRuleError para cita en el pasado
    it('should throw BusinessRuleError for past appointment', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72), // Creamos con fecha futura válida
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      // Mock del método isInPast para simular que la cita está en el pasado
      jest.spyOn(appointment, 'isInPast').mockReturnValue(true);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new BusinessRuleError('Cannot cancel appointments that have already occurred')
      );
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError cuando cita no existe
    it('should throw NotFoundError when appointment does not exist', async () => {
      // Arrange
      mockAppointmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new NotFoundError('Appointment', validAppointmentId)
      );

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).not.toHaveBeenCalled();
    });

    // Debería lanzar NotFoundError cuando estado CANCELLED no existe
    it('should throw NotFoundError when CANCELLED status does not exist', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      const confirmedStatus = createMockAppointmentStatus(AppointmentStatusEnum.CONFIRMED);

      mockAppointmentRepository.findById.mockResolvedValue(appointment);
      mockAppointmentStatusRepository.findById.mockResolvedValue(confirmedStatus);
      mockAppointmentStatusRepository.findByName.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId, validCancelDto, validRequesterId)).rejects.toThrow(
        new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CANCELLED)
      );
    });
  });

  describe('Cancellation Types', () => {
    // Debería manejar cancelación por cliente
    it('should handle client cancellation', async () => {
      // Arrange
      const clientCancelDto: CancelAppointmentDto = {
        reason: 'Personal emergency',
        cancelledBy: 'client',
        notifyClient: false, // Cliente se cancela a sí mismo
      };

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, clientCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
    });

    // Debería manejar cancelación por estilista
    it('should handle stylist cancellation', async () => {
      // Arrange
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

      // Act
      const result = await useCase.execute(validAppointmentId, stylistCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
    });

    // Debería manejar cancelación por administrador
    it('should handle admin cancellation', async () => {
      // Arrange
      const adminCancelDto: CancelAppointmentDto = {
        reason: 'Salon closed due to maintenance',
        cancelledBy: 'admin',
        notifyClient: true,
      };

      const appointment = createMockAppointment({
        userId: validRequesterId, // Admin tiene permisos sobre cualquier cita
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, adminCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
    });

    // Debería manejar cancelación por sistema
    it('should handle system cancellation', async () => {
      // Arrange
      const systemCancelDto: CancelAppointmentDto = {
        reason: 'Automatic cancellation due to overbooking',
        cancelledBy: 'system',
        notifyClient: true,
      };

      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, systemCancelDto, validRequesterId);

      // Assert
      expect(result.id).toBe(appointment.id);
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar repositorios con parámetros correctos
    it('should call repositories with correct parameters', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
      expect(mockAppointmentStatusRepository.findByName).toHaveBeenCalledWith(AppointmentStatusEnum.CANCELLED);
      expect(mockAppointmentRepository.update).toHaveBeenCalledWith(appointment);
    });
  });

  describe('Data Mapping', () => {
    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(result.dateTime).toBe(appointment.dateTime.toISOString());
      expect(result.createdAt).toBe(appointment.createdAt.toISOString());
      expect(result.updatedAt).toBe(appointment.updatedAt.toISOString());
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      // Arrange
      const appointment = createMockAppointment({
        userId: validRequesterId,
        dateTime: getFutureDate(72),
      });
      setupSuccessfulMocks(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId, validCancelDto, validRequesterId);

      // Assert
      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toEqual(appointment.serviceIds);
    });
  });
});
