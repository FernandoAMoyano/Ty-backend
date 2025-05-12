import { ITimeStamped } from '../common/interfaces';

export interface IHoliday extends ITimeStamped {
  name: string;
  date: Date;
  description?: string;
}
