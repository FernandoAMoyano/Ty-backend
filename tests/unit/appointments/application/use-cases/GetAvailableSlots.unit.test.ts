import { GetAvailableSlots } from '../../../../../src/modules/appointments/application/use-cases/GetAvailableSlots';
import { AppointmentRepository } from '../../../../../src/modules/appointments/domain/repositories/AppointmentRepository';
import { ScheduleRepository } from '../../../../../src/modules/appointments/domain/repositories/ScheduleRepository';
import { Schedule, DayOfWeekEnum } from '../../../../../src/modules/appointments/domain/entities/Schedule';
import { Appointment } from '../../../../../src/modules/appointments/domain/entities/Appointment';
import { GetAvailableSlotsDto } from '../../../../../src/modules/appointments/application/dto/request/GetAvailableSlotsDto';
import { ValidationError } from '../../../../../src/shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../../src/shared/exceptions/BusinessRuleError';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('GetAvailableSlots Use Case', () => {
  let useCase: GetAvailableSlots;
  let mockAppointmentRepository: jest.Mocked<AppointmentRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;

  // Utilidades de fecha dinámicas
  const getFutureDateString = (daysFromNow: number = 7): string => {
    const future = new Date();
    future.setDate(future.getDate() + daysFromNow);
    return future.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  const getPastDateString = (daysAgo: number = 1): string => {
    const past = new Date();
    past.setDate(past.getDate() - daysAgo);
    return past.toISOString().split('T')[0];
  };

  const getFarFutureDateString = (monthsFromNow: number = 8): string => {
    const future = new Date();
    future.setMonth(future.getMonth() + monthsFromNow);
    return future.toISOString().split('T')[0];
  };

  // IDs válidos para tests
  const validStylistId = generateUuid();
  const validServiceId1 = generateUuid();
  const validServiceId2 = generateUuid();
  const validScheduleId = generateUuid();
  const validStatusId = generateUuid();
  const validUserId = generateUuid();
  const validClientId = generateUuid();

  // DTO base para tests
  const createValidDto = (overrides: Partial<GetAvailableSlotsDto> = {}): GetAvailableSlotsDto => ({
    date: getFutureDateString(7),
    ...overrides,
  });

  // Factory para crear mock de Schedule
  const createMockSchedule = (
    dayOfWeek: DayOfWeekEnum = DayOfWeekEnum.MONDAY,
    startTime: string = '09:00',
    endTime: string = '18:00',
  ): Schedule => {
    const schedule = {
      id: validScheduleId,
      dayOfWeek,
      startTime,
      endTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      getAvailableSlots: jest.fn().mockReturnValue([
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      ]),
      isWithinWorkingHours: jest.fn().mockReturnValue(true),
      validate: jest.fn(),
    } as unknown as Schedule;

    return schedule;
  };

  // Factory para crear mock de Appointment (cita existente)
  const createMockExistingAppointment = (
    dateTime: Date,
    duration: number = 60,
    stylistId?: string,
  ): Appointment => {
    return {
      id: generateUuid(),
      dateTime,
      duration,
      userId: validUserId,
      clientId: validClientId,
      scheduleId: validScheduleId,
      statusId: validStatusId,
      stylistId: stylistId || validStylistId,
      serviceIds: [validServiceId1],
      confirmedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Appointment;
  };

  // Helper para obtener el día de la semana de una fecha
  const getDayOfWeekFromDateString = (dateString: string): DayOfWeekEnum => {
    const dayNames = [
      DayOfWeekEnum.SUNDAY,
      DayOfWeekEnum.MONDAY,
      DayOfWeekEnum.TUESDAY,
      DayOfWeekEnum.WEDNESDAY,
      DayOfWeekEnum.THURSDAY,
      DayOfWeekEnum.FRIDAY,
      DayOfWeekEnum.SATURDAY,
    ];
    const date = new Date(dateString + 'T00:00:00.000Z');
    return dayNames[date.getDay()];
  };

  // Setup básico de mocks exitosos
  const setupSuccessfulMocks = (dateString: string = getFutureDateString(7)) => {
    const dayOfWeek = getDayOfWeekFromDateString(dateString);
    const schedule = createMockSchedule(dayOfWeek);

    mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);
    mockAppointmentRepository.findByDate.mockResolvedValue([]);
  };

  beforeEach(() => {
    // Mock de AppointmentRepository
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
    } as unknown as jest.Mocked<AppointmentRepository>;

    // Mock de ScheduleRepository
    mockScheduleRepository = {
      findById: jest.fn(),
      findByDayOfWeek: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      findByHolidayId: jest.fn(),
      findRegularSchedule: jest.fn(),
      findHolidaySchedule: jest.fn(),
      findAvailableSchedulesForDay: jest.fn(),
      findScheduleByTimeSlot: jest.fn(),
      findConflictingSchedules: jest.fn(),
    } as unknown as jest.Mocked<ScheduleRepository>;

    useCase = new GetAvailableSlots(mockAppointmentRepository, mockScheduleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Execution', () => {
    // Debería obtener slots disponibles para una fecha válida
    it('should get available slots for valid date', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result.date).toBe(dateString);
      expect(result.isWorkingDay).toBe(true);
      expect(result.slots).toBeDefined();
      expect(result.slots.length).toBeGreaterThan(0);
      expect(result.totalSlots).toBeGreaterThan(0);
    });

    // Debería retornar estructura correcta de DayAvailabilityDto
    it('should return correct DayAvailabilityDto structure', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('dayOfWeek');
      expect(result).toHaveProperty('isWorkingDay');
      expect(result).toHaveProperty('totalSlots');
      expect(result).toHaveProperty('availableSlots');
      expect(result).toHaveProperty('slots');
      expect(result).toHaveProperty('workingHours');
      expect(result.workingHours).toHaveProperty('start');
      expect(result.workingHours).toHaveProperty('end');
    });

    // Debería retornar slots con estructura correcta
    it('should return slots with correct structure', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result.slots.length).toBeGreaterThan(0);
      const firstSlot = result.slots[0];
      expect(firstSlot).toHaveProperty('time');
      expect(firstSlot).toHaveProperty('available');
      expect(firstSlot).toHaveProperty('duration');
    });

    // Debería usar duración por defecto de 30 minutos
    it('should use default duration of 30 minutes', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      result.slots.forEach(slot => {
        expect(slot.duration).toBe(30);
      });
    });

    // Debería usar duración personalizada cuando se proporciona
    it('should use custom duration when provided', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString, duration: 60 });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      result.slots.forEach(slot => {
        expect(slot.duration).toBe(60);
      });
    });

    // Debería incluir información de estilista cuando se proporciona stylistId
    it('should include stylist info when stylistId provided', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString, stylistId: validStylistId });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      result.slots.forEach(slot => {
        expect(slot.stylist).toBeDefined();
        expect(slot.stylist!.id).toBe(validStylistId);
      });
    });

    // Debería calcular correctamente availableSlots count
    it('should correctly calculate availableSlots count', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      const availableCount = result.slots.filter(slot => slot.available).length;
      expect(result.availableSlots).toBe(availableCount);
    });
  });

  describe('Non-Working Day Handling', () => {
    // Debería retornar día no laboral cuando no hay horario
    it('should return non-working day when no schedule exists', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });

      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

      const result = await useCase.execute(dto);

      expect(result.isWorkingDay).toBe(false);
      expect(result.totalSlots).toBe(0);
      expect(result.availableSlots).toBe(0);
      expect(result.slots).toEqual([]);
      expect(result.workingHours).toBeUndefined();
    });

    // Debería retornar fecha correcta para día no laboral
    it('should return correct date for non-working day', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });

      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

      const result = await useCase.execute(dto);

      expect(result.date).toBe(dateString);
      expect(result.dayOfWeek).toBeDefined();
    });
  });

  describe('Conflict Detection', () => {
    // Debería marcar slot como no disponible cuando hay conflicto
    it('should mark slot as unavailable when there is a conflict', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });

      const dayOfWeek = getDayOfWeekFromDateString(dateString);
      const schedule = createMockSchedule(dayOfWeek);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);

      // Crear cita existente a las 10:00
      const appointmentDate = new Date(dateString + 'T10:00:00.000Z');
      const existingAppointment = createMockExistingAppointment(appointmentDate, 60);
      mockAppointmentRepository.findByDate.mockResolvedValue([existingAppointment]);

      const result = await useCase.execute(dto);

      // Buscar slot de las 10:00 y verificar que no esté disponible
      const conflictingSlot = result.slots.find(slot => slot.time === '10:00');
      if (conflictingSlot) {
        expect(conflictingSlot.available).toBe(false);
        expect(conflictingSlot.conflictReason).toBeDefined();
      }
    });

    // Debería filtrar citas por estilista cuando se proporciona stylistId
    it('should filter appointments by stylist when stylistId provided', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString, stylistId: validStylistId });

      const dayOfWeek = getDayOfWeekFromDateString(dateString);
      const schedule = createMockSchedule(dayOfWeek);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);

      // Crear cita de otro estilista - no debería afectar disponibilidad
      const otherStylistId = generateUuid();
      const appointmentDate = new Date(dateString + 'T10:00:00.000Z');
      const otherStylistAppointment = createMockExistingAppointment(appointmentDate, 60, otherStylistId);
      mockAppointmentRepository.findByDate.mockResolvedValue([otherStylistAppointment]);

      const result = await useCase.execute(dto);

      // El slot de las 10:00 debería estar disponible porque la cita es de otro estilista
      const slot = result.slots.find(s => s.time === '10:00');
      if (slot) {
        expect(slot.available).toBe(true);
      }
    });

    // Debería detectar conflictos con múltiples citas
    it('should detect conflicts with multiple appointments', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });

      const dayOfWeek = getDayOfWeekFromDateString(dateString);
      const schedule = createMockSchedule(dayOfWeek);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);

      // Crear múltiples citas
      const appointments = [
        createMockExistingAppointment(new Date(dateString + 'T09:00:00.000Z'), 60),
        createMockExistingAppointment(new Date(dateString + 'T14:00:00.000Z'), 90),
      ];
      mockAppointmentRepository.findByDate.mockResolvedValue(appointments);

      const result = await useCase.execute(dto);

      // Verificar que hay algunos slots no disponibles
      const unavailableSlots = result.slots.filter(slot => !slot.available);
      expect(unavailableSlots.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation - Date', () => {
    // Debería lanzar error para fecha vacía
    it('should throw error for empty date', async () => {
      const dto = createValidDto({ date: '' });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Date is required'),
      );
    });

    // Debería lanzar error para fecha solo con espacios
    it('should throw error for whitespace-only date', async () => {
      const dto = createValidDto({ date: '   ' });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Date is required'),
      );
    });

    // Debería lanzar error para formato de fecha inválido
    it('should throw error for invalid date format', async () => {
      const dto = createValidDto({ date: '01-15-2025' }); // Formato MM-DD-YYYY incorrecto

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Date must be in YYYY-MM-DD format'),
      );
    });

    // Debería lanzar error para fecha con formato parcialmente correcto
    it('should throw error for partially correct date format', async () => {
      const dto = createValidDto({ date: '2025-1-15' }); // Falta cero inicial

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Date must be in YYYY-MM-DD format'),
      );
    });

    // Debería lanzar error para fecha inválida (fecha que no existe)
    // Nota: JavaScript convierte fechas inválidas como '2025-02-30' a fechas válidas (ej: 2025-03-02)
    // Por lo que el use case valida el formato primero, y luego las reglas de negocio
    it('should throw error for completely invalid date string', async () => {
      const dto = createValidDto({ date: '2025-13-45' }); // Mes y día imposibles

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
    });

    // Debería aceptar formato de fecha válido YYYY-MM-DD
    it('should accept valid YYYY-MM-DD format', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result.date).toBe(dateString);
    });
  });

  describe('Input Validation - StylistId', () => {
    // Debería lanzar error para stylistId con formato UUID inválido
    it('should throw error for invalid UUID format stylistId', async () => {
      const dto = createValidDto({ stylistId: 'invalid-uuid' });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Stylist ID must be a valid UUID'),
      );
    });

    // Debería aceptar stylistId con formato UUID válido
    it('should accept valid UUID stylistId', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString, stylistId: validStylistId });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
    });

    // Debería funcionar sin stylistId (opcional)
    it('should work without stylistId (optional)', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.slots[0].stylist).toBeUndefined();
    });
  });

  describe('Input Validation - ServiceIds', () => {
    // Debería lanzar error para serviceId con formato UUID inválido
    it('should throw error for invalid UUID format in serviceIds', async () => {
      const dto = createValidDto({ serviceIds: ['invalid-uuid'] });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('All service IDs must be valid UUIDs'),
      );
    });

    // Debería lanzar error si algún serviceId es inválido
    it('should throw error if any serviceId is invalid', async () => {
      const dto = createValidDto({
        serviceIds: [validServiceId1, 'invalid-uuid', validServiceId2],
      });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('All service IDs must be valid UUIDs'),
      );
    });

    // Debería aceptar serviceIds con formato UUID válido
    it('should accept valid UUID serviceIds', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({
        date: dateString,
        serviceIds: [validServiceId1, validServiceId2],
      });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
    });

    // Debería funcionar sin serviceIds (opcional)
    it('should work without serviceIds (optional)', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
    });
  });

  describe('Input Validation - Duration', () => {
    // Debería lanzar error para duración menor a 15 minutos
    it('should throw error for duration less than 15 minutes', async () => {
      const dto = createValidDto({ duration: 10 });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Minimum duration is 15 minutes'),
      );
    });

    // Debería lanzar error para duración mayor a 480 minutos (8 horas)
    it('should throw error for duration greater than 480 minutes', async () => {
      const dto = createValidDto({ duration: 500 });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Maximum duration is 8 hours (480 minutes)'),
      );
    });

    // Debería lanzar error para duración que no sea múltiplo de 15
    it('should throw error for duration not in 15-minute increments', async () => {
      const dto = createValidDto({ duration: 25 });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new ValidationError('Duration must be in 15-minute increments'),
      );
    });

    // Debería aceptar duraciones válidas (múltiplos de 15)
    it('should accept valid durations (multiples of 15)', async () => {
      const dateString = getFutureDateString(7);
      const validDurations = [15, 30, 45, 60, 90, 120, 180, 240, 480];

      for (const duration of validDurations) {
        const dto = createValidDto({ date: dateString, duration });
        setupSuccessfulMocks(dateString);

        const result = await useCase.execute(dto);
        expect(result.slots[0].duration).toBe(duration);
      }
    });
  });

  describe('Business Rules - Date Restrictions', () => {
    // Debería lanzar error para fechas en el pasado
    it('should throw error for past dates', async () => {
      const dto = createValidDto({ date: getPastDateString(1) });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BusinessRuleError('Cannot check availability for past dates'),
      );
    });

    // Debería lanzar error para fechas más de 6 meses en el futuro
    it('should throw error for dates more than 6 months in future', async () => {
      const dto = createValidDto({ date: getFarFutureDateString(8) });

      await expect(useCase.execute(dto)).rejects.toThrow(
        new BusinessRuleError('Cannot check availability more than 6 months in advance'),
      );
    });

    // Debería aceptar fecha de hoy
    it('should accept today date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const dto = createValidDto({ date: today });
      setupSuccessfulMocks(today);

      const result = await useCase.execute(dto);

      expect(result.date).toBe(today);
    });

    // Debería aceptar fecha dentro de 6 meses
    it('should accept date within 6 months', async () => {
      const dateString = getFutureDateString(90); // ~3 meses
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      const result = await useCase.execute(dto);

      expect(result.date).toBe(dateString);
    });
  });

  describe('Repository Integration', () => {
    // Debería llamar a scheduleRepository.findByDayOfWeek con día correcto
    it('should call scheduleRepository.findByDayOfWeek with correct day', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      const expectedDayOfWeek = getDayOfWeekFromDateString(dateString);
      setupSuccessfulMocks(dateString);

      await useCase.execute(dto);

      expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenCalledWith(expectedDayOfWeek);
    });

    // Debería llamar a appointmentRepository.findByDate con fecha correcta
    it('should call appointmentRepository.findByDate', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      setupSuccessfulMocks(dateString);

      await useCase.execute(dto);

      expect(mockAppointmentRepository.findByDate).toHaveBeenCalled();
    });

    // No debería llamar appointmentRepository si no hay horario
    it('should not call appointmentRepository if no schedule exists', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });

      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

      await useCase.execute(dto);

      expect(mockAppointmentRepository.findByDate).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    // Debería propagar errores del scheduleRepository
    it('should propagate scheduleRepository errors', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      const repositoryError = new Error('Database connection failed');

      mockScheduleRepository.findByDayOfWeek.mockRejectedValue(repositoryError);

      await expect(useCase.execute(dto)).rejects.toThrow(repositoryError);
    });

    // Debería propagar errores del appointmentRepository
    it('should propagate appointmentRepository errors', async () => {
      const dateString = getFutureDateString(7);
      const dto = createValidDto({ date: dateString });
      const repositoryError = new Error('Query timeout');

      const dayOfWeek = getDayOfWeekFromDateString(dateString);
      const schedule = createMockSchedule(dayOfWeek);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);
      mockAppointmentRepository.findByDate.mockRejectedValue(repositoryError);

      await expect(useCase.execute(dto)).rejects.toThrow(repositoryError);
    });

    // Debería diferenciar entre ValidationError y BusinessRuleError
    it('should differentiate between ValidationError and BusinessRuleError', async () => {
      // ValidationError - formato inválido
      const invalidFormatDto = createValidDto({ date: 'invalid' });
      await expect(useCase.execute(invalidFormatDto)).rejects.toThrow(ValidationError);

      // BusinessRuleError - fecha pasada
      const pastDateDto = createValidDto({ date: getPastDateString(5) });
      await expect(useCase.execute(pastDateDto)).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('Day of Week Mapping', () => {
    // Debería mapear correctamente todos los días de la semana
    it('should correctly map all days of the week', async () => {
      const daysToTest = [
        { daysFromNow: 0, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(0)) },
        { daysFromNow: 1, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(1)) },
        { daysFromNow: 2, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(2)) },
        { daysFromNow: 3, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(3)) },
        { daysFromNow: 4, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(4)) },
        { daysFromNow: 5, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(5)) },
        { daysFromNow: 6, expectedEnum: getDayOfWeekFromDateString(getFutureDateString(6)) },
      ];

      for (const { daysFromNow, expectedEnum } of daysToTest) {
        const dateString = getFutureDateString(daysFromNow);
        const dto = createValidDto({ date: dateString });
        setupSuccessfulMocks(dateString);

        const result = await useCase.execute(dto);

        expect(result.dayOfWeek).toBe(expectedEnum.toString());
      }
    });
  });
});
