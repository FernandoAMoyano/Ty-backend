import {
  Schedule,
  DayOfWeekEnum,
} from '../../../../../src/modules/appointments/domain/entities/Schedule';
import { generateUuid } from '../../../../../src/shared/utils/uuid';

describe('Schedule Entity', () => {
  const validScheduleData = {
    id: generateUuid(),
    dayOfWeek: DayOfWeekEnum.MONDAY,
    startTime: '09:00',
    endTime: '17:00',
    holidayId: generateUuid(),
  };

  describe('Schedule Creation', () => {
    // Debería crear horario con datos válidos
    it('should create schedule with valid data', () => {
      const schedule = new Schedule(
        validScheduleData.id,
        validScheduleData.dayOfWeek,
        validScheduleData.startTime,
        validScheduleData.endTime,
        new Date(),
        new Date(),
        validScheduleData.holidayId,
      );

      expect(schedule.id).toBe(validScheduleData.id);
      expect(schedule.dayOfWeek).toBe(validScheduleData.dayOfWeek);
      expect(schedule.startTime).toBe(validScheduleData.startTime);
      expect(schedule.endTime).toBe(validScheduleData.endTime);
      expect(schedule.holidayId).toBe(validScheduleData.holidayId);
      expect(schedule.createdAt).toBeInstanceOf(Date);
      expect(schedule.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear horario con método estático create
    it('should create schedule with static create method', () => {
      const schedule = Schedule.create(
        validScheduleData.dayOfWeek,
        validScheduleData.startTime,
        validScheduleData.endTime,
        validScheduleData.holidayId,
      );

      expect(schedule.id).toBeDefined();
      expect(schedule.dayOfWeek).toBe(validScheduleData.dayOfWeek);
      expect(schedule.startTime).toBe(validScheduleData.startTime);
      expect(schedule.endTime).toBe(validScheduleData.endTime);
      expect(schedule.holidayId).toBe(validScheduleData.holidayId);
      expect(schedule.createdAt).toBeInstanceOf(Date);
      expect(schedule.updatedAt).toBeInstanceOf(Date);
    });

    // Debería crear horario sin holidayId
    it('should create schedule without holidayId', () => {
      const schedule = Schedule.create(
        validScheduleData.dayOfWeek,
        validScheduleData.startTime,
        validScheduleData.endTime,
      );

      expect(schedule.id).toBeDefined();
      expect(schedule.holidayId).toBeUndefined();
    });

    // Debería crear horario desde datos de persistencia
    it('should create schedule from persistence data', () => {
      const createdAt = new Date('2024-01-01T10:00:00.000Z');
      const updatedAt = new Date('2024-01-02T10:00:00.000Z');

      const schedule = Schedule.fromPersistence(
        validScheduleData.id,
        validScheduleData.dayOfWeek,
        validScheduleData.startTime,
        validScheduleData.endTime,
        createdAt,
        updatedAt,
        validScheduleData.holidayId,
      );

      expect(schedule.id).toBe(validScheduleData.id);
      expect(schedule.createdAt).toBe(createdAt);
      expect(schedule.updatedAt).toBe(updatedAt);
      expect(schedule.holidayId).toBe(validScheduleData.holidayId);
    });
  });

  describe('Schedule Validation', () => {
    describe('Time Format Validation', () => {
      // Debería lanzar error para formato de hora de inicio inválido
      it('should throw error for invalid start time format', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            '25:00', // Invalid hour
            validScheduleData.endTime,
          );
        }).toThrow('Start time must be in HH:mm format');
      });

      // Debería lanzar error para formato de hora de fin inválido
      it('should throw error for invalid end time format', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            validScheduleData.startTime,
            '17:60', // Minutos no válidos
          );
        }).toThrow('End time must be in HH:mm format');
      });

      // Debería aceptar formatos de hora válidos
      it('should accept valid time formats', () => {
        const validTimeTests = [
          { start: '00:00', end: '01:00' },
          { start: '09:30', end: '10:00' },
          { start: '12:15', end: '13:00' },
          { start: '22:00', end: '23:59' },
        ];

        validTimeTests.forEach(({ start, end }) => {
          expect(() => {
            new Schedule(validScheduleData.id, validScheduleData.dayOfWeek, start, end);
          }).not.toThrow();
        });
      });

      // Debería rechazar formatos de hora inválidos
      it('should reject invalid time formats', () => {
        const invalidTimes = ['24:00', '12:60', 'abc:def', '12', '12:', '', '25:30', '23:61'];

        invalidTimes.forEach((time) => {
          expect(() => {
            new Schedule(validScheduleData.id, validScheduleData.dayOfWeek, time, '17:00');
          }).toThrow('Start time must be in HH:mm format');
        });
      });
    });

    describe('Time Range Validation', () => {
      // Debería lanzar error cuando hora de inicio es igual a hora de fin
      it('should throw error when start time equals end time', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            '09:00',
            '09:00', // La misma que la hora de inicio
          );
        }).toThrow('Start time must be before end time');
      });

      // Debería lanzar error cuando hora de inicio es posterior a hora de fin
      it('should throw error when start time is after end time', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            '17:00',
            '09:00', // Hora de finalización antes de la hora de inicio
          );
        }).toThrow('Start time must be before end time');
      });

      // Debería lanzar error para horario menor a 30 minutos
      it('should throw error for schedule less than 30 minutes', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            '09:00',
            '09:29', // Solo 29 minutos
          );
        }).toThrow('Schedule must be at least 30 minutes long');
      });

      // Debería aceptar horario con exactamente 30 minutos
      it('should accept schedule with exactly 30 minutes', () => {
        expect(() => {
          new Schedule(
            validScheduleData.id,
            validScheduleData.dayOfWeek,
            '09:00',
            '09:30', // Exactamente 30 minutos
          );
        }).not.toThrow();
      });
    });
  });

  describe('Schedule Business Logic', () => {
    let schedule: Schedule;

    beforeEach(() => {
      schedule = new Schedule(
        validScheduleData.id,
        validScheduleData.dayOfWeek,
        validScheduleData.startTime,
        validScheduleData.endTime,
        new Date(),
        new Date(),
        validScheduleData.holidayId,
      );
    });

    describe('Schedule Update', () => {
      // Debería actualizar horarios
      it('should update schedule times', () => {
        const newStartTime = '08:00';
        const newEndTime = '18:00';
        const originalUpdatedAt = schedule.updatedAt;

        schedule.updateSchedule(newStartTime, newEndTime);

        expect(schedule.startTime).toBe(newStartTime);
        expect(schedule.endTime).toBe(newEndTime);
        expect(schedule.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });

      // Debería validar al actualizar horario
      it('should validate when updating schedule', () => {
        expect(() => {
          schedule.updateSchedule('25:00', '17:00'); // Hora de inicio no válida
        }).toThrow('Start time must be in HH:mm format');
      });

      // Debería validar rango de tiempo al actualizar
      it('should validate time range when updating', () => {
        expect(() => {
          schedule.updateSchedule('17:00', '09:00'); // Finalizar antes de comenzar
        }).toThrow('Start time must be before end time');
      });
    });

    describe('Duration Calculation', () => {
      // Debería calcular duración correctamente
      it('should calculate duration correctly', () => {
        // 09:00 to 17:00 = 8 horas = 480 minutos
        expect(schedule.getDurationInMinutes()).toBe(480);
      });

      // Debería calcular duración para diferentes horarios
      it('should calculate duration for different times', () => {
        schedule.updateSchedule('10:30', '14:45');
        // 10:30 to 14:45 = 4 horas 15 minutos = 255 minutos
        expect(schedule.getDurationInMinutes()).toBe(255);
      });

      // Debería calcular duración para horario corto
      it('should calculate duration for short schedule', () => {
        schedule.updateSchedule('12:00', '12:30');
        // 30 minutos
        expect(schedule.getDurationInMinutes()).toBe(30);
      });
    });

    describe('Working Hours Verification', () => {
      // Debería detectar hora dentro del horario laboral
      it('should detect time within working hours', () => {
        expect(schedule.isWithinWorkingHours('09:00')).toBe(true); // Hora de inicio
        expect(schedule.isWithinWorkingHours('12:30')).toBe(true); // Medio
        expect(schedule.isWithinWorkingHours('17:00')).toBe(true); // Tiempo de finalización
      });

      // Debería detectar hora fuera del horario laboral
      it('should detect time outside working hours', () => {
        expect(schedule.isWithinWorkingHours('08:59')).toBe(false); // Antes de comenzar
        expect(schedule.isWithinWorkingHours('17:01')).toBe(false); // After end
        expect(schedule.isWithinWorkingHours('07:00')).toBe(false); // Way before
        expect(schedule.isWithinWorkingHours('20:00')).toBe(false); // Way after
      });

      // Debería manejar casos límite
      it('should handle edge cases', () => {
        expect(schedule.isWithinWorkingHours('09:00')).toBe(true); // Exactamente al comienzo
        expect(schedule.isWithinWorkingHours('17:00')).toBe(true); // Exactamente al final
      });
    });

    describe('Available Slots Generation', () => {
      // Debería generar slots con duración predeterminada de 30 minutos
      it('should generate slots with default 30-minute duration', () => {
        // 09:00 to 17:00 with 30-minute slots
        const slots = schedule.getAvailableSlots();

        expect(slots).toHaveLength(16); // 8 hours / 30 minutes = 16 slots
        expect(slots[0]).toBe('09:00');
        expect(slots[1]).toBe('09:30');
        expect(slots[2]).toBe('10:00');
        expect(slots[slots.length - 1]).toBe('16:30'); // Last slot
      });

      // Debería generar slots con duración personalizada
      it('should generate slots with custom duration', () => {
        // 09:00 to 17:00 with 60-minute slots
        const slots = schedule.getAvailableSlots(60);

        expect(slots).toHaveLength(8); // 8 hours / 60 minutes = 8 slots
        expect(slots[0]).toBe('09:00');
        expect(slots[1]).toBe('10:00');
        expect(slots[slots.length - 1]).toBe('16:00'); // Último slot que se ajusta
      });

      // Debería generar slots con duración de 15 minutos
      it('should generate slots with 15-minute duration', () => {
        //  horario más corto para una prueba más fácil
        schedule.updateSchedule('10:00', '11:00'); // 1 hour
        const slots = schedule.getAvailableSlots(15);

        expect(slots).toHaveLength(4); // 60 minutes / 15 minutes = 4 slots
        expect(slots).toEqual(['10:00', '10:15', '10:30', '10:45']);
      });

      // Debería manejar casos donde la duración del slot no encaja perfectamente
      it('should handle cases where slot duration does not fit evenly', () => {
        schedule.updateSchedule('09:00', '09:50'); // 50 minutes
        const slots = schedule.getAvailableSlots(30); // 30-minute slots

        expect(slots).toHaveLength(1); // Solo se encaja un slot de 30 minutos
        expect(slots[0]).toBe('09:00');
      });

      // Debería retornar array vacío cuando no encajan slots
      it('should return empty array when no slots fit', () => {
        schedule.updateSchedule('09:00', '09:50'); // 50 minutos - no encaja slot de 60
        const slots = schedule.getAvailableSlots(60); // Los slot de 60 minutos no encajan

        expect(slots).toHaveLength(0);
      });

      // Debería generar formato de hora correcto con ceros iniciales
      it('should generate correct time format with leading zeros', () => {
        schedule.updateSchedule('08:00', '10:00');
        const slots = schedule.getAvailableSlots(60);

        expect(slots).toEqual(['08:00', '09:00']);
        expect(slots.every((slot) => /^\d{2}:\d{2}$/.test(slot))).toBe(true);
      });
    });

    describe('Persistence Conversion', () => {
      // Debería convertir a formato de persistencia
      it('should convert to persistence format', () => {
        const persistenceData = schedule.toPersistence();

        expect(persistenceData).toEqual({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          holidayId: schedule.holidayId,
        });
      });

      // Debería convertir a formato de persistencia sin holidayId
      it('should convert to persistence format without holidayId', () => {
        const scheduleWithoutHoliday = new Schedule(
          validScheduleData.id,
          validScheduleData.dayOfWeek,
          validScheduleData.startTime,
          validScheduleData.endTime,
        );

        const persistenceData = scheduleWithoutHoliday.toPersistence();

        expect(persistenceData.holidayId).toBeUndefined();
      });
    });
  });

  describe('DayOfWeekEnum', () => {
    // Debería tener todos los valores de día esperados
    it('should have all expected day values', () => {
      expect(DayOfWeekEnum.MONDAY).toBe('MONDAY');
      expect(DayOfWeekEnum.TUESDAY).toBe('TUESDAY');
      expect(DayOfWeekEnum.WEDNESDAY).toBe('WEDNESDAY');
      expect(DayOfWeekEnum.THURSDAY).toBe('THURSDAY');
      expect(DayOfWeekEnum.FRIDAY).toBe('FRIDAY');
      expect(DayOfWeekEnum.SATURDAY).toBe('SATURDAY');
      expect(DayOfWeekEnum.SUNDAY).toBe('SUNDAY');
    });

    // Debería tener exactamente 7 valores de día
    it('should have exactly 7 day values', () => {
      const dayValues = Object.values(DayOfWeekEnum);
      expect(dayValues).toHaveLength(7);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    // Debería manejar cruce de medianoche correctamente (limitación actual)
    it('should handle midnight crossing correctly', () => {
      // Nota: la implementación actual no es compatible con el cruce de medianoche
      // Esta prueba documenta el comportamiento actual
      expect(() => {
        new Schedule(
          validScheduleData.id,
          validScheduleData.dayOfWeek,
          '22:00',
          '02:00', // Al día siguiente
        );
      }).toThrow('Start time must be before end time');
    });

    // Debería manejar horario de día completo
    it('should handle full day schedule', () => {
      const fullDaySchedule = new Schedule(
        validScheduleData.id,
        validScheduleData.dayOfWeek,
        '00:00',
        '23:59',
      );

      expect(fullDaySchedule.getDurationInMinutes()).toBe(1439); // 23:59
      expect(fullDaySchedule.isWithinWorkingHours('12:00')).toBe(true);
      expect(fullDaySchedule.isWithinWorkingHours('00:00')).toBe(true);
      expect(fullDaySchedule.isWithinWorkingHours('23:59')).toBe(true);
    });

    // Debería manejar horario muy corto
    it('should handle very short schedule', () => {
      const shortSchedule = new Schedule(
        validScheduleData.id,
        validScheduleData.dayOfWeek,
        '12:00',
        '12:30', // Exactamente 30 minutos
      );

      expect(shortSchedule.getDurationInMinutes()).toBe(30);
      const slots = shortSchedule.getAvailableSlots(30);
      expect(slots).toEqual(['12:00']);
    });
  });
});
