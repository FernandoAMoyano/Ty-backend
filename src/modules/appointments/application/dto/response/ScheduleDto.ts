import { DayOfWeekEnum } from '../../../domain/entities/Schedule';

export interface ScheduleDto {
  id: string;
  dayOfWeek: DayOfWeekEnum;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  holidayId?: string;

  // Campos calculados
  durationInMinutes?: number;
  availableSlots?: string[];

  // Relaciones pobladas opcionales
  holiday?: {
    id: string;
    name: string;
    date: string;
    description?: string;
  };
}
