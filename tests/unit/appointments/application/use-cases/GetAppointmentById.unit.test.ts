import { GetAppointmentById } from '../../../../../src/modules/appointments/application/use-cases/GetAppointmentById';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../../src/shared/exceptions/NotFoundError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetAppointmentById Use Case', () => {
  let useCase: GetAppointmentById;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;

  // Generar fechas futuras dinámicamente para evitar problemas de tiempo
  const getFutureDate = (daysFromNow: number = 30): Date => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future;
  };

  const validAppointmentId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validStylistId = generateUuid();
  const validScheduleId = generateUuid();
  const validStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  // Crear appointment de ejemplo para los tests
  const createMockAppointment = (
    overrides: Partial<{
      id: string;
      dateTime: Date;
      duration: number;
      confirmedAt: Date;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: validAppointmentId,
      dateTime: getFutureDate(30),
      duration: 60,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validStatusId,
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

  beforeEach(() => {
    // Crear mock completo del repository con todos los métodos
    mockAppointmentRepository = {
      // Operaciones básicas CRUD
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),

      // Consultas específicas del negocio
      findByClientId: jest.fn(),
      findByStylistId: jest.fn(),
      findByUserId: jest.fn(),
      findByStatusId: jest.fn(),

      // Consultas basadas en fechas
      findByDateRange: jest.fn(),
      findByClientAndDateRange: jest.fn(),
      findByStylistAndDateRange: jest.fn(),

      // Detección de conflictos
      findConflictingAppointments: jest.fn(),

      // Consultas basadas en programas
      findByScheduleId: jest.fn(),
      findByDate: jest.fn(),

      // Consultas de análisis
      countByStatus: jest.fn(),
      countByDateRange: jest.fn(),
      findUpcomingAppointments: jest.fn(),
      findPendingConfirmation: jest.fn(),
    };

    // Crear instancia del caso de uso con el mock
    useCase = new GetAppointmentById(mockAppointmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener cita por ID exitosamente
    it('should get appointment by ID successfully', async () => {
      // Arrange
      const appointment = createMockAppointment();
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);

      expect(result).toEqual({
        id: appointment.id,
        dateTime: appointment.dateTime.toISOString(),
        duration: appointment.duration,
        confirmedAt: undefined,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
        userId: appointment.userId,
        clientId: appointment.clientId,
        stylistId: appointment.stylistId,
        scheduleId: appointment.scheduleId,
        statusId: appointment.statusId,
        serviceIds: appointment.serviceIds,
      });
    });

    // Debería mapear correctamente cita confirmada
    it('should correctly map confirmed appointment', async () => {
      // Arrange
      const confirmedAt = new Date();
      const appointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.confirmedAt).toBe(confirmedAt.toISOString());
      expect(result.id).toBe(appointment.id);
    });

    // Debería mapear correctamente todas las propiedades de la cita
    it('should correctly map all appointment properties', async () => {
      // Arrange
      const specificId = generateUuid(); // Usar UUID válido
      const specificDate = getFutureDate(45);
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-02T00:00:00.000Z');
      const confirmedAt = new Date('2024-01-01T12:00:00.000Z');

      const appointment = createMockAppointment({
        id: specificId,
        dateTime: specificDate,
        duration: 75,
        confirmedAt,
      });
      // Sobrescribir fechas para test específico
      appointment.createdAt = createdAt;
      appointment.updatedAt = updatedAt;

      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(specificId);

      // Assert
      expect(result.id).toBe(specificId);
      expect(result.dateTime).toBe(specificDate.toISOString());
      expect(result.duration).toBe(75);
      expect(result.confirmedAt).toBe(confirmedAt.toISOString());
      expect(result.createdAt).toBe(createdAt.toISOString());
      expect(result.updatedAt).toBe(updatedAt.toISOString());
      expect(result.userId).toBe(validUserId);
      expect(result.clientId).toBe(validClientId);
      expect(result.stylistId).toBe(validStylistId);
      expect(result.scheduleId).toBe(validScheduleId);
      expect(result.statusId).toBe(validStatusId);
      expect(result.serviceIds).toEqual(validServiceIds);
    });

    // Debería manejar diferentes duraciones de cita
    it('should handle different appointment durations', async () => {
      // Arrange
      const shortAppointment = createMockAppointment({ duration: 30 });
      mockAppointmentRepository.findById.mockResolvedValue(shortAppointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.duration).toBe(30);
      expect(result.id).toBe(validAppointmentId);
    });

    // Debería retornar objeto único (no array)
    it('should return single object (not array)', async () => {
      // Arrange
      const appointment = createMockAppointment();
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result).not.toBeInstanceOf(Array);
      expect(typeof result).toBe('object');
      expect(result.id).toBeDefined();
    });
  });

  describe('Not Found Handling', () => {
    // Debería lanzar NotFoundError cuando cita no existe
    it('should throw NotFoundError when appointment does not exist', async () => {
      // Arrange
      mockAppointmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId)).rejects.toThrow(
        new NotFoundError('Appointment', validAppointmentId),
      );

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
    });

    // Debería lanzar NotFoundError con ID específico en mensaje
    it('should throw NotFoundError with specific ID in message', async () => {
      // Arrange
      const specificId = '123e4567-e89b-12d3-a456-426614174000';
      mockAppointmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(specificId)).rejects.toThrow(
        new NotFoundError('Appointment', specificId),
      );

      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(specificId);
    });

    // Debería verificar que es instancia de NotFoundError
    it('should verify NotFoundError instance', async () => {
      // Arrange
      mockAppointmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      try {
        await useCase.execute(validAppointmentId);
        fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.message).toContain('Appointment');
        expect(error.message).toContain(validAppointmentId);
      }
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para appointmentId vacío
    it('should throw error for empty appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId nulo
    it('should throw error for null appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId undefined
    it('should throw error for undefined appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute(undefined as any)).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para appointmentId solo con espacios
    it('should throw error for whitespace-only appointmentId', async () => {
      // Act & Assert
      await expect(useCase.execute('   ')).rejects.toThrow(
        new ValidationError('Appointment ID is required'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para formato UUID inválido
    it('should throw error for invalid UUID format', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow(
        new ValidationError('Appointment ID must be a valid UUID'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería lanzar error para UUID con formato parcialmente correcto
    it('should throw error for partially correct UUID format', async () => {
      // Act & Assert
      await expect(useCase.execute('12345678-1234-1234-1234-12345678901')).rejects.toThrow(
        new ValidationError('Appointment ID must be a valid UUID'),
      );

      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
    });

    // Debería aceptar UUID válido
    it('should accept valid UUID format', async () => {
      // Arrange
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const appointment = createMockAppointment({ id: validUuid });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validUuid);

      // Assert
      expect(result.id).toBe(validUuid);
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validUuid);
    });

    // Debería aceptar diferentes formatos de UUID válidos
    it('should accept different valid UUID formats', async () => {
      // Arrange
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      // Act & Assert
      for (const uuid of validUuids) {
        const appointment = createMockAppointment({ id: uuid });
        mockAppointmentRepository.findById.mockResolvedValue(appointment);

        const result = await useCase.execute(uuid);
        expect(result.id).toBe(uuid);
        expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(uuid);
      }

      expect(mockAppointmentRepository.findById).toHaveBeenCalledTimes(validUuids.length);
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockAppointmentRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId)).rejects.toThrow(repositoryError);
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
    });

    // Debería manejar timeout del repository
    it('should handle repository timeout', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      mockAppointmentRepository.findById.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId)).rejects.toThrow('Query timeout');
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
    });

    // Debería manejar errores de red del repository
    it('should handle repository network errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockAppointmentRepository.findById.mockRejectedValue(networkError);

      // Act & Assert
      await expect(useCase.execute(validAppointmentId)).rejects.toThrow('Network error');
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(validAppointmentId);
    });

    // Debería diferenciar entre NotFoundError y otros errores
    it('should differentiate between NotFoundError and other errors', async () => {
      // Arrange
      const dbError = new Error('Database error');
      mockAppointmentRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      try {
        await useCase.execute(validAppointmentId);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).not.toBeInstanceOf(NotFoundError);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Database error');
      }
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con el appointmentId correcto
    it('should call repository with correct appointmentId', async () => {
      // Arrange
      const testAppointmentId = generateUuid();
      const appointment = createMockAppointment({ id: testAppointmentId });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      await useCase.execute(testAppointmentId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findById).toHaveBeenCalledWith(testAppointmentId);
    });

    // Debería llamar al repository solo una vez
    it('should call repository only once', async () => {
      // Arrange
      const appointment = createMockAppointment();
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      await useCase.execute(validAppointmentId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledTimes(1);
    });

    // No debería llamar otros métodos del repository
    it('should not call other repository methods', async () => {
      // Arrange
      const appointment = createMockAppointment();
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      await useCase.execute(validAppointmentId);

      // Assert
      expect(mockAppointmentRepository.findById).toHaveBeenCalledTimes(1);

      // Verificar que NO se llamen otros métodos
      expect(mockAppointmentRepository.findAll).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.delete).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.existsById).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByUserId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByStatusId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByDateRange).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByClientAndDateRange).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByStylistAndDateRange).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findConflictingAppointments).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByScheduleId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByDate).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.countByStatus).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.countByDateRange).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findUpcomingAppointments).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findPendingConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('Data Mapping', () => {
    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      // Arrange
      const specificDateTime = getFutureDate(40);
      const specificCreatedAt = new Date('2024-01-01T10:00:00.000Z');
      const specificUpdatedAt = new Date('2024-02-01T15:00:00.000Z');

      const appointment = createMockAppointment({
        dateTime: specificDateTime,
      });
      appointment.createdAt = specificCreatedAt;
      appointment.updatedAt = specificUpdatedAt;

      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.dateTime).toBe(specificDateTime.toISOString());
      expect(result.createdAt).toBe(specificCreatedAt.toISOString());
      expect(result.updatedAt).toBe(specificUpdatedAt.toISOString());
    });

    // Debería mapear confirmedAt cuando está presente
    it('should map confirmedAt when present', async () => {
      // Arrange
      const confirmedAt = new Date('2024-01-15T09:00:00.000Z');
      const appointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.confirmedAt).toBe(confirmedAt.toISOString());
    });

    // Debería mapear confirmedAt como undefined cuando no está presente
    it('should map confirmedAt as undefined when not present', async () => {
      // Arrange
      const appointment = createMockAppointment({ confirmedAt: undefined });
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.confirmedAt).toBeUndefined();
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      // Arrange
      const customServiceIds = ['service1', 'service2', 'service3'];
      const appointment = createMockAppointment();
      appointment.serviceIds = customServiceIds;
      mockAppointmentRepository.findById.mockResolvedValue(appointment);

      // Act
      const result = await useCase.execute(validAppointmentId);

      // Assert
      expect(result.serviceIds).toEqual(customServiceIds);
      expect(Array.isArray(result.serviceIds)).toBe(true);
      expect(result.serviceIds).toHaveLength(3);
    });
  });
});
