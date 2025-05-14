import { ITimeStamped } from '../common/interfaces';
import { DayOfWeek } from './enums';

export interface ISchedule extends ITimeStamped {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  holidayId?: string;
}

export interface IScheduleException extends ITimeStamped {
  holidayId?: string;
  exceptionDate: Date;
  startTimeException: string;
  endTimeException: string;
  reason?: string;
}
