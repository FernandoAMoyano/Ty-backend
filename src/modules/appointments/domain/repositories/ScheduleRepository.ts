import { Schedule, DayOfWeekEnum } from '../entities/Schedule';

export interface ScheduleRepository {
  // Operaciones básicas de crud
  findById(id: string): Promise<Schedule | null>;
  findAll(): Promise<Schedule[]>;
  save(schedule: Schedule): Promise<Schedule>;
  update(schedule: Schedule): Promise<Schedule>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;

  //Consultas específicas del negocio
  findByDayOfWeek(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;
  findByHolidayId(holidayId: string): Promise<Schedule[]>;
  findRegularSchedule(): Promise<Schedule[]>; // horarios sin vacaciones
  findHolidaySchedule(): Promise<Schedule[]>; // horarios con vacaciones

  // Consultas basadas en el tiempo
  findAvailableSchedulesForDay(dayOfWeek: DayOfWeekEnum): Promise<Schedule[]>;
  findScheduleByTimeSlot(dayOfWeek: DayOfWeekEnum, time: string): Promise<Schedule | null>;

  // Detección de conflictos
  findConflictingSchedules(
    dayOfWeek: DayOfWeekEnum,
    startTime: string,
    endTime: string,
    excludeScheduleId?: string,
  ): Promise<Schedule[]>;
}
