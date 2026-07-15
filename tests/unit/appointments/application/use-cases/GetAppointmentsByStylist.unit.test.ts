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

  // Paginación por defecto usada por el caso de uso (F17)
  const defaultLimit = 20;
  const defaultOffset = 0;

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
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([
        appointment1,
        appointment2,
      ]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(2);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validStylistId,
        defaultLimit,
        defaultOffset,
        undefined,
      );
      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledWith(
        validStylistId,
        undefined,
      );
      expect(result.appointments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(defaultLimit);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
      expect(result.appointments[0]).toEqual({
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

    // Debería retornar página vacía cuando estilista no tiene citas
    it('should return empty page when stylist has no appointments', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    // Debería mapear correctamente las citas confirmadas
    it('should correctly map confirmed appointments', async () => {
      const confirmedAt = new Date();
      const confirmedAppointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([
        confirmedAppointment,
      ]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments).toHaveLength(1);
      expect(result.appointments[0].confirmedAt).toBe(confirmedAt.toISOString());
      expect(result.appointments[0].stylistId).toBe(validStylistId);
    });

    // Debería manejar múltiples citas con diferentes duraciones
    it('should handle multiple appointments with different durations', async () => {
      const appointments = [
        createMockAppointment({ duration: 30 }),
        createMockAppointment({ duration: 60 }),
        createMockAppointment({ duration: 120 }),
      ];
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue(appointments);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(appointments.length);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments).toHaveLength(3);
      expect(result.appointments.map((r) => r.duration)).toEqual([30, 60, 120]);
      expect(result.appointments.every((r) => r.stylistId === validStylistId)).toBe(true);
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

      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([appointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments).toHaveLength(1);
      const dto = result.appointments[0];
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

    // Debería calcular el offset correctamente para páginas distintas de la primera
    it('should compute the correct offset for a non-first page', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await useCase.execute(validStylistId, adminRequesterId, adminRole, 3, 10);

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validStylistId,
        10,
        20,
        undefined,
      );
    });
  });

  describe('Access Control', () => {
    // Debería permitir acceso a ADMIN para cualquier estilista
    it('should allow ADMIN to view any stylist appointments', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);
      const unrelatedAdminId = generateUuid();

      const result = await useCase.execute(validStylistId, unrelatedAdminId, 'ADMIN');

      expect(result.appointments).toEqual([]);
      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validStylistId,
        defaultLimit,
        defaultOffset,
        undefined,
      );
    });

    // Debería permitir al STYLIST ver sus propias citas
    it('should allow STYLIST to view own appointments', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      const result = await useCase.execute(validStylistId, validStylistId, 'STYLIST');

      expect(result.appointments).toEqual([]);
    });

    // Debería denegar al STYLIST ver citas de otro estilista
    it('should deny STYLIST from viewing other stylist appointments', async () => {
      const otherStylistId = generateUuid();

      await expect(useCase.execute(otherStylistId, validStylistId, 'STYLIST')).rejects.toThrow(
        ForbiddenError,
      );

      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería permitir al CLIENT consultar aplicando el ownershipFilter en el repositorio
    it('should allow CLIENT to query with the correct ownership filter', async () => {
      const ownAppointment = createMockAppointment({
        userId: validClientId,
        clientId: validClientId,
      });
      // El repositorio (mockeado) simula que la DB ya filtró por ownership
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([ownAppointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, validClientId, 'CLIENT');

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validStylistId,
        defaultLimit,
        defaultOffset,
        { userId: validClientId, clientId: validClientId },
      );
      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledWith(validStylistId, {
        userId: validClientId,
        clientId: validClientId,
      });
      expect(result.appointments).toHaveLength(1);
      expect(result.appointments[0].clientId).toBe(validClientId);
    });

    // Debería retornar página vacía cuando CLIENT no tiene citas con ese estilista
    it('should return empty page when CLIENT has no appointments with that stylist', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      const result = await useCase.execute(validStylistId, validClientId, 'CLIENT');

      expect(result.appointments).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validStylistId,
        defaultLimit,
        defaultOffset,
        { userId: validClientId, clientId: validClientId },
      );
    });
  });

  describe('Pagination Metadata (F17)', () => {
    // El total y las páginas deben reflejar el filtro de ownership de CLIENT, no el total sin filtrar
    it('should return pagination metadata consistent with the ownership filter', async () => {
      // Simula que, sin filtro, el estilista tiene muchas más citas, pero el CLIENT
      // solo tiene acceso a 3 de ellas. countByStylistId debe recibir el ownershipFilter
      // para que "total" refleje el subconjunto real y no el total global (bug de F3).
      const filteredAppointments = [
        createMockAppointment({ userId: validClientId, clientId: validClientId }),
        createMockAppointment({ userId: validClientId, clientId: validClientId }),
        createMockAppointment({ userId: validClientId, clientId: validClientId }),
      ];
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue(filteredAppointments);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(3);

      const result = await useCase.execute(validStylistId, validClientId, 'CLIENT', 1, 10);

      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledWith(validStylistId, {
        userId: validClientId,
        clientId: validClientId,
      });
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1);
      expect(result.appointments).toHaveLength(3);
    });
  });

  describe('Input Validation', () => {
    // Debería lanzar error para stylistId vacío
    it('should throw error for empty stylistId', async () => {
      await expect(useCase.execute('', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId nulo
    it('should throw error for null stylistId', async () => {
      await expect(useCase.execute(null as any, adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId undefined
    it('should throw error for undefined stylistId', async () => {
      await expect(useCase.execute(undefined as any, adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería lanzar error para stylistId solo con espacios
    it('should throw error for whitespace-only stylistId', async () => {
      await expect(useCase.execute('   ', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID is required'),
      );
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería lanzar error para formato UUID inválido
    it('should throw error for invalid UUID format', async () => {
      await expect(useCase.execute('invalid-uuid', adminRequesterId, adminRole)).rejects.toThrow(
        new ValidationError('Stylist ID must be a valid UUID'),
      );
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería lanzar error para UUID con formato parcialmente correcto
    it('should throw error for partially correct UUID format', async () => {
      await expect(
        useCase.execute('12345678-1234-1234-1234-12345678901', adminRequesterId, adminRole),
      ).rejects.toThrow(new ValidationError('Stylist ID must be a valid UUID'));
      expect(mockAppointmentRepository.findByStylistIdPaginated).not.toHaveBeenCalled();
    });

    // Debería aceptar UUID válido
    it('should accept valid UUID format', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      const result = await useCase.execute(validUuid, adminRequesterId, adminRole);

      expect(result.appointments).toEqual([]);
      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        validUuid,
        defaultLimit,
        defaultOffset,
        undefined,
      );
    });

    // Debería aceptar diferentes formatos de UUID válidos
    it('should accept different valid UUID formats', async () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      for (const uuid of validUuids) {
        const result = await useCase.execute(uuid, adminRequesterId, adminRole);
        expect(result.appointments).toEqual([]);
        expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
          uuid,
          defaultLimit,
          defaultOffset,
          undefined,
        );
      }

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledTimes(
        validUuids.length,
      );
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del repository
    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      mockAppointmentRepository.findByStylistIdPaginated.mockRejectedValue(repositoryError);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        repositoryError,
      );
    });

    // Debería manejar timeout del repository
    it('should handle repository timeout', async () => {
      const timeoutError = new Error('Query timeout');
      mockAppointmentRepository.findByStylistIdPaginated.mockRejectedValue(timeoutError);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        'Query timeout',
      );
    });

    // Debería manejar errores de red del repository
    it('should handle repository network errors', async () => {
      const networkError = new Error('Network error');
      mockAppointmentRepository.findByStylistIdPaginated.mockRejectedValue(networkError);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        'Network error',
      );
    });

    // Debería propagar errores del conteo aunque la búsqueda paginada resuelva
    it('should propagate errors from the count query', async () => {
      const countError = new Error('Count query failed');
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockRejectedValue(countError);

      await expect(useCase.execute(validStylistId, adminRequesterId, adminRole)).rejects.toThrow(
        'Count query failed',
      );
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar al repository con el stylistId correcto
    it('should call repository with correct stylistId', async () => {
      const testStylistId = generateUuid();
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await useCase.execute(testStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledWith(
        testStylistId,
        defaultLimit,
        defaultOffset,
        undefined,
      );
      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledWith(
        testStylistId,
        undefined,
      );
    });

    // Debería llamar a los métodos paginados del repository solo una vez
    it('should call repository methods only once', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledTimes(1);
    });

    // No debería llamar otros métodos del repository, en particular el finder no paginado
    // (evita repetir el bug de F3: paginar/filtrar en memoria en vez de en el repositorio)
    it('should not call other repository methods', async () => {
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(0);

      await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(mockAppointmentRepository.findByStylistIdPaginated).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.countByStylistId).toHaveBeenCalledTimes(1);
      expect(mockAppointmentRepository.findByStylistId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findById).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findAll).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.save).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.update).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.delete).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByClientId).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.findByClientIdPaginated).not.toHaveBeenCalled();
      expect(mockAppointmentRepository.countByClientId).not.toHaveBeenCalled();
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

      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([appointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments[0].dateTime).toBe(specificDateTime.toISOString());
      expect(result.appointments[0].createdAt).toBe(specificCreatedAt.toISOString());
      expect(result.appointments[0].updatedAt).toBe(specificUpdatedAt.toISOString());
    });

    // Debería mapear confirmedAt cuando está presente
    it('should map confirmedAt when present', async () => {
      const confirmedAt = new Date('2024-01-15T09:00:00.000Z');
      const appointment = createMockAppointment({ confirmedAt });
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([appointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments[0].confirmedAt).toBe(confirmedAt.toISOString());
    });

    // Debería mapear confirmedAt como undefined cuando no está presente
    it('should map confirmedAt as undefined when not present', async () => {
      const appointment = createMockAppointment({ confirmedAt: undefined });
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([appointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments[0].confirmedAt).toBeUndefined();
    });

    // Debería mantener la estructura de arrays intacta
    it('should maintain array structure intact', async () => {
      const customServiceIds = ['service1', 'service2', 'service3'];
      const appointment = createMockAppointment();
      appointment.serviceIds = customServiceIds;
      mockAppointmentRepository.findByStylistIdPaginated.mockResolvedValue([appointment]);
      mockAppointmentRepository.countByStylistId.mockResolvedValue(1);

      const result = await useCase.execute(validStylistId, adminRequesterId, adminRole);

      expect(result.appointments[0].serviceIds).toEqual(customServiceIds);
      expect(Array.isArray(result.appointments[0].serviceIds)).toBe(true);
      expect(result.appointments[0].serviceIds).toHaveLength(3);
    });
  });
});
