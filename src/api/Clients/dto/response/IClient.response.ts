import { IAppointmentBrief } from '../../../Appointments/dto/response/IAppointmentBrief.response';

export interface IClientResponse {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  preferences?: string[];
  appointments?: IAppointmentBrief[];
}
