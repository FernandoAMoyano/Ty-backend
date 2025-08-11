import { GetAppointmentsByClient } from '../../../../../src/modules/appointments/application/use-cases/GetAppointmentsByClient';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetAppointmentsByClient Use Case', () => {
  let useCase: GetAppointmentsByClient;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;

  // Generar fechas futuras dinámicamente para evitar problemas de tiempo
  const getFutureDate = (daysFromNow: number = 30): Date => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future;
  };

  const validClientId = generateUuid();
  const validUserId = generateUuid();
  const validStylistId = generateUuid();
  const validScheduleId = generateUuid();
  const validStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  // Crear appointments de ejemplo para los tests
  const createMockAppointment = (
    overrides: Partial<{
      id: string;
      dateTime: Date;
      duration: number;
      clientId: string;
      confirmedAt: Date;
    }> = {},
  ): Appointment => {
    const baseData = {
      id: generateUuid(),
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
    useCase = new GetAppointmentsByClient(mockAppointmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener citas del cliente exitosamente
    it('should get client appointments successfully', async () => {
      // Arrange
      const appointment1 = createMockAppointment({
        dateTime: getFutureDate(10),
        duration: 60,
      });
      const appointment2 = createMockAppointment({
        dateTime: getFutureDate(20),
        duration: 90,
      });
      const appointments = [appointment1, appointment2];

      mockAppointmentRepository.findByClientId.mockResolvedValue(appointments);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validClientId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: appointment1.id,
        dateTime: appointment1.dateTime.toISOString(),
        duration: appointment1.duration,
        confirmedAt: undefined,
        createdAt: appointment1.createdAt.toISOString(),
        updatedAt: appointment1.updatedAt.toISOString(),
        userId: appointment1.userId,
        clientId: appointment1.clientId,
        stylistId: appointment1.stylistId,
        scheduleId: appointment1.scheduleId,
        statusId: appointment1.statusId,
        serviceIds: appointment1.serviceIds,
      });
    });

    // Debería retornar array vacío cuando cliente no tiene citas
    it('should return empty array when client has no appointments', async () => {
      // Arrange
      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validClientId);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    // Debería mapear correctamente las citas confirmadas
    it('should correctly map confirmed appointments', async () => {
      // Arrange
      const confirmedAt = new Date();
      const confirmedAppointment = createMockAppointment({
        confirmedAt,
      });

      mockAppointmentRepository.findByClientId.mockResolvedValue([confirmedAppointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].confirmedAt).toBe(confirmedAt.toISOString());
      expect(result[0].id).toBe(confirmedAppointment.id);
      expect(result[0].clientId).toBe(validClientId);
    });

    // Debería manejar múltiples citas con diferentes duraciones
    it('should handle multiple appointments with different durations', async () => {
      // Arrange
      const shortAppointment = createMockAppointment({ duration: 30 });
      const mediumAppointment = createMockAppointment({ duration: 60 });
      const longAppointment = createMockAppointment({ duration: 120 });
      const appointments = [shortAppointment, mediumAppointment, longAppointment];

      mockAppointmentRepository.findByClientId.mockResolvedValue(appointments);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.duration)).toEqual([30, 60, 120]);
      expect(result.every((r) => r.clientId === validClientId)).toBe(true);
    });

    // Debería mapear correctamente todas las propiedades de la cita
    it('should correctly map all appointment properties', async () => {
      // Arrange
      const specificDate = getFutureDate(45); // Cambiar a fecha futura
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-02T00:00:00.000Z');
      const confirmedAt = new Date('2024-01-01T12:00:00.000Z');

      const appointment = createMockAppointment({
        id: 'specific-appointment-id',
        dateTime: specificDate,
        duration: 75,
        confirmedAt,
      });
      // Sobrescribir fechas para test específico
      appointment.createdAt = createdAt;
      appointment.updatedAt = updatedAt;

      mockAppointmentRepository.findByClientId.mockResolvedValue([appointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result).toHaveLength(1);
      const dto = result[0];
      expect(dto.id).toBe('specific-appointment-id');
      expect(dto.dateTime).toBe(specificDate.toISOString());
      expect(dto.duration).toBe(75);
      expect(dto.confirmedAt).toBe(confirmedAt.toISOString());
      expect(dto.createdAt).toBe(createdAt.toISOString());
      expect(dto.updatedAt).toBe(updatedAt.toISOString());
      expect(dto.userId).toBe(validUserId);
      expect(dto.clientId).toBe(validClientId);
      expect(dto.stylistId).toBe(validStylistId);
      expect(dto.scheduleId).toBe(validScheduleId);
      expect(dto.statusId).toBe(validStatusId);
      expect(dto.serviceIds).toEqual(validServiceIds);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para clientId vacío
    it('should throw error for empty clientId', async () => {
      // Act & Assert
      await expect(useCase.execute('')).rejects.toThrow(
        new ValidationError('Client ID is required'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para clientId nulo
    it('should throw error for null clientId', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow(
        new ValidationError('Client ID is required'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para clientId undefined
    it('should throw error for undefined clientId', async () => {
      // Act & Assert
      await expect(useCase.execute(undefined as any)).rejects.toThrow(
        new ValidationError('Client ID is required'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para clientId solo con espacios
    it('should throw error for whitespace-only clientId', async () => {
      // Act & Assert
      await expect(useCase.execute('   ')).rejects.toThrow(
        new ValidationError('Client ID is required'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para formato UUID inválido
    it('should throw error for invalid UUID format', async () => {
      // Act & Assert
      await expect(useCase.execute('invalid-uuid')).rejects.toThrow(
        new ValidationError('Client ID must be a valid UUID'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para UUID con formato parcialmente correcto
    it('should throw error for partially correct UUID format', async () => {
      // Act & Assert
      await expect(useCase.execute('12345678-1234-1234-1234-12345678901')).rejects.toThrow(
        new ValidationError('Client ID must be a valid UUID'),
      );

      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });

    // Debería aceptar UUID válido
    it('should accept valid UUID format', async () => {
      // Arrange
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(validUuid);

      // Assert
      expect(result).toEqual([]);
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validUuid);
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

      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act & Assert
      for (const uuid of validUuids) {
        await expect(useCase.execute(uuid)).resolves.toEqual([]);
        expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(uuid);
      }

      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(validUuids.length);
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockAppointmentRepository.findByClientId.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(validClientId)).rejects.toThrow(repositoryError);
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validClientId);
    });

    // Debería manejar timeout del repository
    it('should handle repository timeout', async () => {
      // Arrange
      const timeoutError = new Error('Query timeout');
      mockAppointmentRepository.findByClientId.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(useCase.execute(validClientId)).rejects.toThrow('Query timeout');
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validClientId);
    });

    // Debería manejar errores de red del repository
    it('should handle repository network errors', async () => {
      // Arrange
      const networkError = new Error('Network error');
      mockAppointmentRepository.findByClientId.mockRejectedValue(networkError);

      // Act & Assert
      await expect(useCase.execute(validClientId)).rejects.toThrow('Network error');
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(validClientId);
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con el clientId correcto
    it('should call repository with correct clientId', async () => {
      // Arrange
      const testClientId = generateUuid();
      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      await useCase.execute(testClientId);

      // Assert
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledWith(testClientId);
    });

    // Debería llamar al repository solo una vez
    it('should call repository only once', async () => {
      // Arrange
      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      await useCase.execute(validClientId);

      // Assert
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
    });

    // No debería llamar otros métodos del repository
    it('should not call other repository methods', async () => {
      // Arrange
      mockAppointmentRepository.findByClientId.mockResolvedValue([]);

      // Act
      await useCase.execute(validClientId);

      // Assert
      expect(mockAppointmentRepository.findByClientId).toHaveBeenCalledTimes(1);
      
      // Verificar que NO se llamen otros métodos
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findAll).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.delete).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.existsById).not.toHaveBeenCalled();
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
      const specificDateTime = getFutureDate(40); // Cambiar a fecha futura
      const specificCreatedAt = new Date('2024-01-01T10:00:00.000Z');
      const specificUpdatedAt = new Date('2024-02-01T15:00:00.000Z');

      const appointment = createMockAppointment({
        dateTime: specificDateTime,
      });
      appointment.createdAt = specificCreatedAt;
      appointment.updatedAt = specificUpdatedAt;

      mockAppointmentRepository.findByClientId.mockResolvedValue([appointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result[0].dateTime).toBe(specificDateTime.toISOString());
      expect(result[0].createdAt).toBe(specificCreatedAt.toISOString());
      expect(result[0].updatedAt).toBe(specificUpdatedAt.toISOString());
    });

    // Debería mapear confirmedAt cuando está presente
    it('should map confirmedAt when present', async () => {
      // Arrange
      const confirmedAt = new Date('2024-01-15T09:00:00.000Z');
      const appointment = createMockAppointment({ confirmedAt });

      mockAppointmentRepository.findByClientId.mockResolvedValue([appointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result[0].confirmedAt).toBe(confirmedAt.toISOString());
    });

    // Debería mapear confirmedAt como undefined cuando no está presente
    it('should map confirmedAt as undefined when not present', async () => {
      // Arrange
      const appointment = createMockAppointment({ confirmedAt: undefined });

      mockAppointmentRepository.findByClientId.mockResolvedValue([appointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result[0].confirmedAt).toBeUndefined();
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      // Arrange
      const customServiceIds = ['service1', 'service2', 'service3'];
      const appointment = createMockAppointment();
      appointment.serviceIds = customServiceIds;

      mockAppointmentRepository.findByClientId.mockResolvedValue([appointment]);

      // Act
      const result = await useCase.execute(validClientId);

      // Assert
      expect(result[0].serviceIds).toEqual(customServiceIds);
      expect(Array.isArray(result[0].serviceIds)).toBe(true);
      expect(result[0].serviceIds).toHaveLength(3);
    });
  });
});
