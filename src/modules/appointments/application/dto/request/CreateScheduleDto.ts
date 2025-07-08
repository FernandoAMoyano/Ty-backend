import { DayOfWeekEnum } from '../../../domain/entities/Schedule';

export interface CreateScheduleDto {
  dayOfWeek: DayOfWeekEnum;
  startTime: string; //Formato: "hh:Mm"
  endTime: string; //Formato: "hh:Mm"
  holidayId?: string;
}
