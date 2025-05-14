import { IHoliday } from '../../../../core/types/Holiday/interface';
import { IScheduleException } from '../../../../core/types/Schedule/interfaces';

export interface IScheduleExceptionResponse extends IScheduleException {
  holiday?: IHoliday;
}
