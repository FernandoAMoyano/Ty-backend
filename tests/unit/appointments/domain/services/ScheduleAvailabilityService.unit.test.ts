import { ScheduleAvailabilityService } from '../../../../../src/modules/appointments/domain/services/ScheduleAvailabilityService';
import { IScheduleRepository } from '../../../../../src/modules/appointments/domain/repositories/IScheduleRepository';
import { IHolidayRepository } from '../../../../../src/modules/holidays/domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from '../../../../../src/modules/holidays/domain/repositories/IScheduleExceptionRepository';
import {
  Schedule,
  DayOfWeekEnum,
} from '../../../../../src/modules/appointments/domain/entities/Schedule';
import { ScheduleException } from '../../../../../src/modules/holidays/domain/entities/ScheduleException';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('ScheduleAvailabilityService', () => {
  let service: ScheduleAvailabilityService;
  let mockHolidayRepository: jest.Mocked<IHolidayRepository>;
  let mockScheduleExceptionRepository: jest.Mocked<IScheduleExceptionRepository>;
  let mockScheduleRepository: jest.Mocked<IScheduleRepository>;

  // Lunes 2026-06-01
  const mondayDate = new Date('2026-06-01T10:00:00.000Z');
  // Domingo 2026-06-07
  const sundayDate = new Date('2026-06-07T10:00:00.000Z');

  const createMockSchedule = (
    dayOfWeek: DayOfWeekEnum,
    startTime: string = '09:00',
    endTime: string = '18:00',
  ): Schedule => {
    return new Schedule(generateUuid(), dayOfWeek, startTime, endTime, new Date(), new Date());
  };

  const createMockException = (
    date: Date,
    startTime: string = '10:00',
    endTime: string = '14:00',
  ): ScheduleException => {
    return ScheduleException.create(
      generateUuid(),
      date,
      startTime,
      endTime,
      'Horario especial',
      null,
    );
  };

  beforeEach(() => {
    mockHolidayRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByYear: jest.fn(),
      findByDate: jest.fn(),
      findAll: jest.fn(),
      findByDateRange: jest.fn(),
      findUpcoming: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByDate: jest.fn(),
      isHoliday: jest.fn(),
    };

    mockScheduleExceptionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDate: jest.fn(),
      findByHolidayId: jest.fn(),
      findAll: jest.fn(),
      findByDateRange: jest.fn(),
      findUpcoming: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByHolidayId: jest.fn(),
      existsByDate: jest.fn(),
      getExceptionForDate: jest.fn(),
    };

    mockScheduleRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsById: jest.fn(),
      findByDayOfWeek: jest.fn(),
      findByHolidayId: jest.fn(),
      findRegularSchedule: jest.fn(),
      findHolidaySchedule: jest.fn(),
      findAvailableSchedulesForDay: jest.fn(),
      findScheduleByTimeSlot: jest.fn(),
      findConflictingSchedules: jest.fn(),
    };

    service = new ScheduleAvailabilityService(
      mockHolidayRepository,
      mockScheduleExceptionRepository,
      mockScheduleRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEffectiveSchedule', () => {
    describe('Priority: ScheduleException > Holiday > Regular', () => {
      // La excepción tiene máxima prioridad sobre holidays y horario regular
      it('should return exception schedule when a ScheduleException exists for the date', async () => {
        const exception = createMockException(mondayDate, '10:00', '14:00');
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(exception);

        const result = await service.getEffectiveSchedule(mondayDate);

        expect(result).not.toBeNull();
        expect(result!.startTime).toBe('10:00');
        expect(result!.endTime).toBe('14:00');
        expect(result!.source).toBe('exception');
        // No debería consultar holidays ni schedules
        expect(mockHolidayRepository.isHoliday).not.toHaveBeenCalled();
        expect(mockScheduleRepository.findByDayOfWeek).not.toHaveBeenCalled();
      });

      // Feriado sin excepción = día cerrado
      it('should return null (closed day) when date is a holiday without exception', async () => {
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
        mockHolidayRepository.isHoliday.mockResolvedValue(true);

        const result = await service.getEffectiveSchedule(mondayDate);

        expect(result).toBeNull();
        // No debería consultar el horario regular
        expect(mockScheduleRepository.findByDayOfWeek).not.toHaveBeenCalled();
      });

      // La excepción tiene prioridad incluso si el día es feriado
      it('should return exception even when the date is also a holiday', async () => {
        const exception = createMockException(mondayDate, '10:00', '15:00');
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(exception);

        const result = await service.getEffectiveSchedule(mondayDate);

        expect(result).not.toBeNull();
        expect(result!.source).toBe('exception');
        expect(result!.startTime).toBe('10:00');
        expect(result!.endTime).toBe('15:00');
        // isHoliday nunca se consulta porque la excepción cortocircuita
        expect(mockHolidayRepository.isHoliday).not.toHaveBeenCalled();
      });

      // Sin excepción ni feriado → horario regular
      it('should return regular schedule when no exception and no holiday exist', async () => {
        const schedule = createMockSchedule(DayOfWeekEnum.MONDAY, '09:00', '18:00');
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
        mockHolidayRepository.isHoliday.mockResolvedValue(false);
        mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);

        const result = await service.getEffectiveSchedule(mondayDate);

        expect(result).not.toBeNull();
        expect(result!.startTime).toBe('09:00');
        expect(result!.endTime).toBe('18:00');
        expect(result!.source).toBe('regular');
      });
    });

    describe('Day Without Regular Schedule', () => {
      // Día sin horario configurado (ej: domingo) retorna null
      it('should return null when no exception, no holiday, and no schedule for the day', async () => {
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
        mockHolidayRepository.isHoliday.mockResolvedValue(false);
        mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

        const result = await service.getEffectiveSchedule(sundayDate);

        expect(result).toBeNull();
        expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenCalledWith(DayOfWeekEnum.SUNDAY);
      });
    });

    describe('Day of Week Mapping', () => {
      // Verifica que las fechas se mapean al DayOfWeekEnum correcto
      it('should correctly map each date to the corresponding DayOfWeekEnum', async () => {
        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
        mockHolidayRepository.isHoliday.mockResolvedValue(false);
        mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

        // Lunes 2026-06-01
        await service.getEffectiveSchedule(new Date('2026-06-01T10:00:00.000Z'));
        expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenLastCalledWith(
          DayOfWeekEnum.MONDAY,
        );

        // Martes 2026-06-02
        await service.getEffectiveSchedule(new Date('2026-06-02T10:00:00.000Z'));
        expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenLastCalledWith(
          DayOfWeekEnum.TUESDAY,
        );

        // Sábado 2026-06-06
        await service.getEffectiveSchedule(new Date('2026-06-06T10:00:00.000Z'));
        expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenLastCalledWith(
          DayOfWeekEnum.SATURDAY,
        );

        // Domingo 2026-06-07
        await service.getEffectiveSchedule(new Date('2026-06-07T10:00:00.000Z'));
        expect(mockScheduleRepository.findByDayOfWeek).toHaveBeenLastCalledWith(
          DayOfWeekEnum.SUNDAY,
        );
      });
    });

    describe('Multiple Schedules for Same Day', () => {
      // Cuando hay múltiples schedules para un día, usa el primero
      it('should use the first schedule when multiple exist for the same day', async () => {
        const morningSchedule = createMockSchedule(DayOfWeekEnum.MONDAY, '08:00', '12:00');
        const afternoonSchedule = createMockSchedule(DayOfWeekEnum.MONDAY, '14:00', '20:00');

        mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
        mockHolidayRepository.isHoliday.mockResolvedValue(false);
        mockScheduleRepository.findByDayOfWeek.mockResolvedValue([
          morningSchedule,
          afternoonSchedule,
        ]);

        const result = await service.getEffectiveSchedule(mondayDate);

        expect(result).not.toBeNull();
        expect(result!.startTime).toBe('08:00');
        expect(result!.endTime).toBe('12:00');
        expect(result!.source).toBe('regular');
      });
    });
  });

  describe('isDayClosed', () => {
    // Feriado sin excepción = cerrado
    it('should return true when the day is a holiday without exception', async () => {
      mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
      mockHolidayRepository.isHoliday.mockResolvedValue(true);

      const result = await service.isDayClosed(mondayDate);

      expect(result).toBe(true);
    });

    // Sin horario regular = cerrado
    it('should return true when no regular schedule exists for the day', async () => {
      mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
      mockHolidayRepository.isHoliday.mockResolvedValue(false);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([]);

      const result = await service.isDayClosed(sundayDate);

      expect(result).toBe(true);
    });

    // Excepción de horario = día abierto con horario especial
    it('should return false when a schedule exception exists (day open with special hours)', async () => {
      const exception = createMockException(mondayDate);
      mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(exception);

      const result = await service.isDayClosed(mondayDate);

      expect(result).toBe(false);
    });

    // Horario regular configurado = abierto
    it('should return false when a regular schedule exists for the day', async () => {
      const schedule = createMockSchedule(DayOfWeekEnum.MONDAY);
      mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(null);
      mockHolidayRepository.isHoliday.mockResolvedValue(false);
      mockScheduleRepository.findByDayOfWeek.mockResolvedValue([schedule]);

      const result = await service.isDayClosed(mondayDate);

      expect(result).toBe(false);
    });

    // Feriado con excepción = la excepción prevalece, día abierto
    it('should return false on a holiday with an exception (exception overrides closure)', async () => {
      const exception = createMockException(mondayDate, '10:00', '14:00');
      mockScheduleExceptionRepository.getExceptionForDate.mockResolvedValue(exception);

      const result = await service.isDayClosed(mondayDate);

      expect(result).toBe(false);
      // isHoliday no se consulta
      expect(mockHolidayRepository.isHoliday).not.toHaveBeenCalled();
    });
  });
});
