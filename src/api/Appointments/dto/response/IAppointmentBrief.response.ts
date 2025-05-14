import { AppointmentStatusName } from '../../../../core/types/Appointment/enums';

export interface IAppointmentBrief {
  id: string;
  dateTime: Date;
  status: AppointmentStatusName;
  stylistName?: string;
  serviceName: string;
}
