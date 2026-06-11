import { Schedule, DayOfWeekEnum } from '../entities/Schedule';

/**
 * Interfaz del repositorio para la gestión de persistencia de horarios
 */
export interface IScheduleRepository {
  findById(id: string): Promise<Schedule | null>;
  findAll(): Promise<Schedule[]>;
  save(schedule: Schedule): Promise<Schedule>;
  update(schedule: Schedule): Promise<Schedule>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
  findByDayOfWeek(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;
  findByHolidayId(holidayId: string): Promise<Schedule[]>;
  findRegularSchedule(): Promise<Schedule[]>;
  findHolidaySchedule(): Promise<Schedule[]>;
  findAvailableSchedulesForDay(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;
  findScheduleByTimeSlot(dayOfWeek: DayOfWeekEnum, time: string): Promise<Schedule | null>;
  findConflictingSchedules(dayOfWeek: DayOfWeekEnum, startTime: string, endTime: string, excludeScheduleId?: string): Promise<Schedule[]>;
}
