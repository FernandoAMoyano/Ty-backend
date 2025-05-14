import { AppointmentStatusName } from '../../../../core/types/Appointment/enums';
import { IAppointment } from '../../../../core/types/Appointment/interface';
import { IPayment } from '../../../../core/types/Payment/interfaces';
import { IService } from '../../../../core/types/Service/interface';

export interface IAppointmentDetailedResponse extends IAppointment {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  stylist?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  services: IService[];
  status: AppointmentStatusName;
  totalPrice: number;
  payments?: IPayment[];
}
