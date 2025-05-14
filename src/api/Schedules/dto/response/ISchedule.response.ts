import { IHoliday } from '../../../../core/types/Holiday/interface';
import { ISchedule } from '../../../../core/types/Schedule/interfaces';
import { IAppointmentBrief } from '../../../Appointments/dto/response/IAppointmentBrief.response';

export interface IScheduleResponse extends ISchedule {
  holiday?: IHoliday;
  appointments?: IAppointmentBrief[];
}
