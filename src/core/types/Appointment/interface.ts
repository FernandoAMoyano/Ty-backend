import { IBase, ITimeStamped } from '../common/interfaces';
import { AppointmentStatusName } from './enums';

export interface IAppointmentStatus extends IBase {
  name: AppointmentStatusName;
  description?: string;
}

export interface IAppointment extends ITimeStamped {
  userId: string;
  clientId: string;
  stylistId?: string;
  scheduleId: string;
  statusId: string;
  dateTime: Date;
  duration: number;
  confirmedAt?: Date;
}

export interface IAppointmentService {
  appointmentId: string;
  serviceId: string;
}
