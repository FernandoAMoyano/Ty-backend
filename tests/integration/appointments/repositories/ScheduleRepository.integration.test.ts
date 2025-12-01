import { PrismaScheduleRepository } from '../../../../src/modules/appointments/infrastructure/persistence/PrismaScheduleRepository';
import {
  Schedule,
  DayOfWeekEnum,
} from '../../../../src/modules/appointments/domain/entities/Schedule';
import { testPrisma } from '../../../setup/database';
import { generateUuid } from '../../../../src/shared/utils/uuid';

describe('ScheduleRepository Integration Tests', () => {
  let repository: PrismaScheduleRepository;

  beforeAll(async () => {
    repository = new PrismaScheduleRepository(testPrisma);
  });

  beforeEach(async () => {
    // Limpiar schedules de prueba creados por tests
    // Solo eliminar schedules que tengan horarios no estándar para evitar afectar el seed
    await testPrisma.schedule.deleteMany({
      where: {
        OR: [
          { startTime: { not: { in: ['08:00', '09:00', '10:00'] } } },
          { endTime: { not: { in: ['17:00', '18:00', '19:00', '20:00'] } } },
        ],
      },
    });
  });

  describe('findAll', () => {
    it('should return all schedules including seed data', async () => {
      const schedules = await repository.findAll();

      expect(schedules.length).toBeGreaterThanOrEqual(1);

      schedules.forEach((schedule) => {
        expect(schedule.id).toBeDefined();
        expect(schedule.dayOfWeek).toBeDefined();
        expect(schedule.startTime).toBeDefined();
        expect(schedule.endTime).toBeDefined();
        expect(Object.values(DayOfWeekEnum)).toContain(schedule.dayOfWeek);
      });
    });
  });

  describe('findById', () => {
    it('should find schedule by existing id', async () => {
      const seedSchedule = await testPrisma.schedule.findFirst();

      if (seedSchedule) {
        const foundSchedule = await repository.findById(seedSchedule.id);

        expect(foundSchedule).toBeDefined();
        expect(foundSchedule!.id).toBe(seedSchedule.id);
        expect(foundSchedule!.startTime).toBeDefined();
        expect(foundSchedule!.endTime).toBeDefined();
      } else {
        // Si no hay schedules en el seed, crear uno para el test
        const testSchedule = await testPrisma.schedule.create({
          data: {
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '18:00',
          },
        });

        const foundSchedule = await repository.findById(testSchedule.id);
        expect(foundSchedule).toBeDefined();
        expect(foundSchedule!.id).toBe(testSchedule.id);
      }
    });

    it('should return null for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      const foundSchedule = await repository.findById(nonExistingId);
      expect(foundSchedule).toBeNull();
    });
  });

  describe('findByDayOfWeek', () => {
    it('should find schedule by existing day of week', async () => {
      // Buscar o crear un schedule para Monday
      let mondaySchedule = await testPrisma.schedule.findFirst({
        where: { dayOfWeek: 'MONDAY' },
      });

      if (!mondaySchedule) {
        mondaySchedule = await testPrisma.schedule.create({
          data: {
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '18:00',
          },
        });
      }

      const foundSchedules = await repository.findByDayOfWeek(DayOfWeekEnum.MONDAY);

      expect(foundSchedules).toBeDefined();
      expect(foundSchedules.length).toBeGreaterThanOrEqual(1);
      expect(foundSchedules[0].dayOfWeek).toBe(DayOfWeekEnum.MONDAY);
    });

    it('should return empty array for day without schedule', async () => {
      // Asegurar que no hay schedule para Sunday
      await testPrisma.schedule.deleteMany({
        where: { dayOfWeek: 'SUNDAY' },
      });

      const foundSchedules = await repository.findByDayOfWeek(DayOfWeekEnum.SUNDAY);
      expect(foundSchedules).toEqual([]);
    });
  });

  describe('save', () => {
    it('should save new schedule successfully', async () => {
      const newSchedule = new Schedule(
        generateUuid(),
        DayOfWeekEnum.SATURDAY,
        '10:00',
        '19:00',
        new Date(),
        new Date(),
      );

      const savedSchedule = await repository.save(newSchedule);

      expect(savedSchedule.id).toBeDefined();
      expect(savedSchedule.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(savedSchedule.dayOfWeek).toBe(DayOfWeekEnum.SATURDAY);
      expect(savedSchedule.startTime).toBe('10:00');
      expect(savedSchedule.endTime).toBe('19:00');
      expect(savedSchedule.createdAt).toBeDefined();
      expect(savedSchedule.updatedAt).toBeDefined();
    });

    it('should save schedule using create method', async () => {
      const newSchedule = Schedule.create(DayOfWeekEnum.SUNDAY, '11:00', '20:00');

      const savedSchedule = await repository.save(newSchedule);

      expect(savedSchedule.id).toBeDefined();
      expect(savedSchedule.dayOfWeek).toBe(DayOfWeekEnum.SUNDAY);
      expect(savedSchedule.startTime).toBe('11:00');
      expect(savedSchedule.endTime).toBe('20:00');
    });

    it('should allow multiple schedules for same dayOfWeek (different time slots)', async () => {
      // El modelo permite múltiples horarios por día (ej: turno mañana y tarde)
      const morningSchedule = Schedule.create(DayOfWeekEnum.SATURDAY, '08:00', '12:00');
      const afternoonSchedule = Schedule.create(DayOfWeekEnum.SATURDAY, '14:00', '18:00');

      const savedMorning = await repository.save(morningSchedule);
      const savedAfternoon = await repository.save(afternoonSchedule);

      expect(savedMorning.dayOfWeek).toBe(DayOfWeekEnum.SATURDAY);
      expect(savedAfternoon.dayOfWeek).toBe(DayOfWeekEnum.SATURDAY);
      expect(savedMorning.id).not.toBe(savedAfternoon.id);

      // Verificar que ambos se pueden encontrar
      const saturdaySchedules = await repository.findByDayOfWeek(DayOfWeekEnum.SATURDAY);
      expect(saturdaySchedules.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('update', () => {
    it('should update existing schedule', async () => {
      const originalSchedule = Schedule.create(DayOfWeekEnum.SATURDAY, '09:00', '17:00');

      const savedSchedule = await repository.save(originalSchedule);

      const updatedSchedule = new Schedule(
        savedSchedule.id,
        DayOfWeekEnum.SATURDAY,
        '08:00',
        '20:00',
        savedSchedule.createdAt,
        new Date(),
      );

      const result = await repository.update(updatedSchedule);

      expect(result.id).toBe(savedSchedule.id);
      expect(result.startTime).toBe('08:00');
      expect(result.endTime).toBe('20:00');
      expect(result.updatedAt.getTime()).toBeGreaterThan(savedSchedule.updatedAt.getTime());
    });

    it('should throw error for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';
      const schedule = new Schedule(
        nonExistingId,
        DayOfWeekEnum.MONDAY,
        '09:00',
        '17:00',
        new Date(),
        new Date(),
      );

      await expect(repository.update(schedule)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete existing schedule', async () => {
      const schedule = Schedule.create(DayOfWeekEnum.SATURDAY, '09:00', '17:00');

      const savedSchedule = await repository.save(schedule);

      await repository.delete(savedSchedule.id);

      const foundSchedule = await repository.findById(savedSchedule.id);
      expect(foundSchedule).toBeNull();
    });

    it('should throw error when deleting non-existing schedule', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      await expect(repository.delete(nonExistingId)).rejects.toThrow();
    });
  });

  describe('existsById', () => {
    it('should return true for existing id', async () => {
      const schedule = Schedule.create(DayOfWeekEnum.SATURDAY, '09:00', '17:00');

      const savedSchedule = await repository.save(schedule);

      const exists = await repository.existsById(savedSchedule.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing id', async () => {
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      const exists = await repository.existsById(nonExistingId);
      expect(exists).toBe(false);
    });
  });

  describe('Business Logic Methods', () => {
    let testSchedule: Schedule;

    beforeEach(async () => {
      // Crear horario de prueba para métodos de lógica de negocio
      await testPrisma.schedule.deleteMany({
        where: { dayOfWeek: 'SATURDAY' },
      });

      testSchedule = Schedule.create(DayOfWeekEnum.SATURDAY, '09:00', '18:00');

      testSchedule = await repository.save(testSchedule);
    });

    describe('Domain Entity Methods', () => {
      it('should return true for time within range', async () => {
        const foundSchedule = await repository.findById(testSchedule.id);
        expect(foundSchedule).toBeDefined();

        // Verificar que el schedule tiene los métodos esperados del dominio
        const isWithin = foundSchedule!.isWithinWorkingHours('14:00');
        expect(isWithin).toBe(true);

        // Verificar que los datos son correctos
        expect(foundSchedule!.startTime).toBe('09:00');
        expect(foundSchedule!.endTime).toBe('18:00');
      });

      it('should return false for time outside range', async () => {
        const foundSchedule = await repository.findById(testSchedule.id);
        expect(foundSchedule).toBeDefined();

        // Hora antes del inicio
        const isWithinEarly = foundSchedule!.isWithinWorkingHours('08:00');
        expect(isWithinEarly).toBe(false);

        // Hora después del fin
        const isWithinLate = foundSchedule!.isWithinWorkingHours('19:00');
        expect(isWithinLate).toBe(false);
      });

      it('should return available slots correctly', async () => {
        const foundSchedule = await repository.findById(testSchedule.id);
        expect(foundSchedule).toBeDefined();

        const slots = foundSchedule!.getAvailableSlots(60); // Slots de 1 hora
        expect(slots.length).toBeGreaterThan(0);
        expect(slots).toContain('09:00');
        expect(slots).toContain('10:00');

        // No debería incluir el último slot que sobrepase el endTime
        expect(slots).not.toContain('18:00');
      });

      it('should validate time format correctly', async () => {
        // Test que verifica que el constructor valida correctamente
        expect(() => {
          new Schedule(
            generateUuid(),
            DayOfWeekEnum.MONDAY,
            'invalid-time',
            '18:00',
            new Date(),
            new Date(),
          );
        }).toThrow();
      });

      it('should validate time order correctly', async () => {
        // Test que verifica que startTime < endTime
        expect(() => {
          new Schedule(
            generateUuid(),
            DayOfWeekEnum.MONDAY,
            '18:00', // Después de endTime
            '09:00',
            new Date(),
            new Date(),
          );
        }).toThrow();
      });
    });
  });

  describe('Data Integrity', () => {
    it('should handle appointment references appropriately', async () => {
      // Crear horario
      await testPrisma.schedule.deleteMany({
        where: { dayOfWeek: 'SATURDAY' },
      });

      const schedule = Schedule.create(DayOfWeekEnum.SATURDAY, '09:00', '17:00');

      const savedSchedule = await repository.save(schedule);

      // Verificar que el schedule se creó correctamente
      expect(savedSchedule.id).toBeDefined();
      expect(savedSchedule.dayOfWeek).toBe(DayOfWeekEnum.SATURDAY);

      // En un test real, aquí se crearían appointments que referencien este schedule
      // y se verificaría el comportamiento al eliminar el schedule

      // Por ahora, solo verificamos que se puede eliminar sin appointments
      await expect(repository.delete(savedSchedule.id)).resolves.not.toThrow();
    });

    it('should preserve all properties when finding schedule', async () => {
      const originalSchedule = Schedule.create(DayOfWeekEnum.SUNDAY, '10:00', '19:00');

      const savedSchedule = await repository.save(originalSchedule);
      const foundSchedule = await repository.findById(savedSchedule.id);

      expect(foundSchedule).toBeDefined();
      expect(foundSchedule!.id).toBe(savedSchedule.id);
      expect(foundSchedule!.dayOfWeek).toBe(savedSchedule.dayOfWeek);
      expect(foundSchedule!.startTime).toBe(savedSchedule.startTime);
      expect(foundSchedule!.endTime).toBe(savedSchedule.endTime);
      expect(foundSchedule!.createdAt).toBeDefined();
      expect(foundSchedule!.updatedAt).toBeDefined();
    });

    it('should handle schedule with holiday reference', async () => {
      // Primero crear un holiday válido para referenciar
      const holiday = await testPrisma.holiday.create({
        data: {
          id: generateUuid(),
          name: 'Test Holiday',
          date: new Date('2025-12-25'),
          description: 'Holiday for testing schedule reference',
        },
      });

      const scheduleWithHoliday = new Schedule(
        generateUuid(),
        DayOfWeekEnum.FRIDAY,
        '10:00',
        '16:00',
        new Date(),
        new Date(),
        holiday.id,
      );

      const savedSchedule = await repository.save(scheduleWithHoliday);

      expect(savedSchedule.holidayId).toBe(holiday.id);

      // Cleanup: eliminar el schedule y holiday creados
      await testPrisma.schedule.delete({ where: { id: savedSchedule.id } });
      await testPrisma.holiday.delete({ where: { id: holiday.id } });
    });
  });
});
