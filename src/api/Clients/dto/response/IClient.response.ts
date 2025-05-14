import { IClient } from '../../../../core/types/Client/interfaces';
import { IUser } from '../../../../core/types/User/interfaces';
import { IAppointmentBrief } from '../../../Appointments/dto/response/IAppointmentBrief.response';

export interface IClientResponse extends IClient {
  user: Omit<IUser, 'password'>;
  appointments?: IAppointmentBrief[];
}
