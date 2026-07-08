import { GetAppointmentsByStylist } from '../../../../../src/modules/appointments/application/use-cases/GetAppointmentsByStylist';
import { IAppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/IAppointmentRepository';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { ForbiddenError } from '../../../../../src/shared/exceptions/ForbiddenError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetAppointmentsByStylist Use Case', () => {
  let useCase: GetAppointmentsByStylist;
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;

  const getFutureDate = (daysFromNow: number = 30): Date => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future;
  };

  const validStylistId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();
  const validScheduleId = generateUuid();
  const validStatusId = generateUuid();
  const validServiceIds = [generateUuid(), generateUuid()];

  // Constantes de permisos — tests existentes usan ADMIN para bypass de ownership
  const adminRequesterId = generateUuid();
  const adminRole = 'ADMIN';

  const createMockAppointment = (
    overrides: Partial<{
      id: string;
      dateTime: Date;
      duration: number;
      stylistId: string;
      userId: string;
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
      existsActiveByServiceId: jest.fn(),
    };

    useCase = new GetAppointmentsByStylist(mockAppointmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener citas del estilista exitosamente
    it('should get stylist appointments successfully', async () => {
      const appointment1 = createMockAppointment({ dateTime: getFutureDate(10), duration: 60 });
      const appointment2 = createMockAppointment({ dateTime: getFutureDate(20), duration: 90 });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment1, appointment2]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledWith(validStylistId);
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

    // Debería retornar array vacío cuando estilista no tiene citas
    it('should return empty array when stylist has no appointments', async () => {
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    // Debería mapear correctamente las citas confirmadas
    it('should correctly map confirmed appointments', async () => {
      const confirmedAt = new Date();
      const confirmedAppointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([confirmedAppointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result).toHaveLength(1);
      expect(result[0].confirmedAt).toBe(confirmedAt.toISOString());
      expect(result[0].stylistId).toBe(validStylistId);
    });

    // Debería manejar múltiples citas con diferentes duraciones
    it('should handle multiple appointments with different durations', async () => {
      const appointments = [
        createMockAppointment({ duration: 30 }),
        createMockAppointment({ duration: 60 }),
        createMockAppointment({ duration: 120 }),
      ];
      mockAppointmentRepository.findByStylistId.mockResolvedValue(appointments);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.duration)).toEqual([30, 60, 120]);
      expect(result.every((r) => r.stylistId === validStylistId)).toBe(true);
    });

    // Debería mapear correctamente todas las propiedades de la cita
    it('should correctly map all appointment properties', async () => {
      const specificDate = getFutureDate(45);
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-02T00:00:00.000Z');
      const confirmedAt = new Date('2024-01-01T12:00:00.000Z');

      const appointment = createMockAppointment({
        id: 'specific-appointment-id',
        dateTime: specificDate,
        duration: 75,
        confirmedAt,
      });
      appointment.createdAt = createdAt;
      appointment.updatedAt = updatedAt;

      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

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

  describe('Access Control', () => {
    // Debería permitir acceso a ADMIN para cualquier estilista
    it('should allow ADMIN to view any stylist appointments', async () => {
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);
      const unrelatedAdminId = generateUuid();

      const result = await useCase.execute(validStylistId, unrelatedAdminId, 'ADMIN');

      expect(result).toEqual([]);
      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledWith(validStylistId);
    });

    // Debería permitir al STYLIST ver sus propias citas
    it('should allow STYLIST to view own appointments', async () => {
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      const result = await useCase.execute(validStylistId, validStylistId, 'STYLIST');

      expect(result).toEqual([]);
    });

    // Debería denegar al STYLIST ver citas de otro estilista
    it('should deny STYLIST from viewing other stylist appointments', async () => {
      const otherStylistId = generateUuid();

      await expect(useCase.execute(otherStylistId, validStylistId, 'STYLIST')).rejects.toThrow(
        ForbiddenError,
      );

      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería permitir al CLIENT consultar pero filtrar resultados a sus citas
    it('should allow CLIENT to query and filter to own appointments', async () => {
      const otherUserId = generateUuid();
      const ownAppointment = createMockAppointment({
        userId: validClientId,
        clientId: validClientId,
      });
      const otherAppointment = createMockAppointment({
        userId: otherUserId,
        clientId: otherUserId,
      });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([
        ownAppointment,
        otherAppointment,
      ]);

      // CLIENT consulta: solo ve las citas donde es el userId o clientId
      const result = await useCase.execute(validStylistId, validClientId, 'CLIENT');

      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe(validClientId);
    });

    // Debería retornar array vacío cuando CLIENT no tiene citas con ese estilista
    it('should return empty array when CLIENT has no appointments with that stylist', async () => {
      const otherUserId = generateUuid();
      const appointment = createMockAppointment({ userId: otherUserId, clientId: otherUserId });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, validClientId, 'CLIENT');

      expect(result).toHaveLength(0);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para stylistId vacío
    it('should throw error for empty stylistId', async () => {
      await expect(useCase.execute('', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId nulo
    it('should throw error for null stylistId', async () => {
      await expect(useCase.execute(null as any, adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId undefined
    it('should throw error for undefined stylistId', async () => {
      await expect(useCase.execute(undefined as any, adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId solo con espacios
    it('should throw error for whitespace-only stylistId', async () => {
      await expect(useCase.execute('   ', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para formato UUID inválido
    it('should throw error for invalid UUID format', async () => {
      await expect(useCase.execute('invalid-uuid', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID must be a valid UUID'),
      );
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería lanzar error para UUID con formato parcialmente correcto
    it('should throw error for partially correct UUID format', async () => {
      await expect(
        useCase.execute('12345678-1234-1234-1234-12345678901', adminRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Stylist ID must be a valid UUID'));
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
    });

    // Debería aceptar UUID válido
    it('should accept valid UUID format', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      const result = await useCase.execute(validUuid, adminRequesterId, adminRole);

      expect(result).toEqual([]);
      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledWith(validUuid);
    });

    // Debería aceptar diferentes formatos de UUID válidos
    it('should accept different valid UUID formats', async () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      for (const uuid of validUuids) {
        await expect(useCase.execute(uuid, adminRequesterId, adminRole)).resolves.toEqual([]);
        expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledWith(uuid);
      }

      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledTimes(validUuids.length);
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockAppointmentRepository.findByStylistId.mockRejectedValue(repositoryError);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        repositoryError,
      );
    });

    // Debería manejar timeout del repository
    it('should handle repository timeout', async () => {
      const timeoutError = new Error('Query timeout');
      mockAppointmentRepository.findByStylistId.mockRejectedValue(timeoutError);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        'Query timeout',
      );
    });

    // Debería manejar errores de red del repository
    it('should handle repository network errors', async () => {
      const networkError = new Error('Network error');
      mockAppointmentRepository.findByStylistId.mockRejectedValue(networkError);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con el stylistId correcto
    it('should call repository with correct stylistId', async () => {
      const testStylistId = generateUuid();
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      await useCase.execute(testStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledWith(testStylistId);
    });

    // Debería llamar al repository solo una vez
    it('should call repository only once', async () => {
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledTimes(1);
    });

    // No debería llamar otros métodos del repository
    it('should not call other repository methods', async () => {
      mockAppointmentRepository.findByStylistId.mockResolvedValue([]);

      await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findAll).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.delete).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
    });
  });

  describe('Data Mapping', () => {
    // Debería mapear fechas a formato ISO string
    it('should map dates to ISO string format', async () => {
      const specificDateTime = getFutureDate(40);
      const specificCreatedAt = new Date('2024-01-01T10:00:00.000Z');
      const specificUpdatedAt = new Date('2024-02-01T15:00:00.000Z');

      const appointment = createMockAppointment({ dateTime: specificDateTime });
      appointment.createdAt = specificCreatedAt;
      appointment.updatedAt = specificUpdatedAt;

      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result[0].dateTime).toBe(specificDateTime.toISOString());
      expect(result[0].createdAt).toBe(specificCreatedAt.toISOString());
      expect(result[0].updatedAt).toBe(specificUpdatedAt.toISOString());
    });

    // Debería mapear confirmedAt cuando está presente
    it('should map confirmedAt when present', async () => {
      const confirmedAt = new Date('2024-01-15T09:00:00.000Z');
      const appointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result[0].confirmedAt).toBe(confirmedAt.toISOString());
    });

    // Debería mapear confirmedAt como undefined cuando no está presente
    it('should map confirmedAt as undefined when not present', async () => {
      const appointment = createMockAppointment({ confirmedAt: undefined });
      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result[0].confirmedAt).toBeUndefined();
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      const customServiceIds = ['service1', 'service2', 'service3'];
      const appointment = createMockAppointment();
      appointment.serviceIds = customServiceIds;
      mockAppointmentRepository.findByStylistId.mockResolvedValue([appointment]);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result[0].serviceIds).toEqual(customServiceIds);
      expect(Array.isArray(result[0].serviceIds)).toBe(true);
      expect(result[0].serviceIds).toHaveLength(3);
    });
  });
});
