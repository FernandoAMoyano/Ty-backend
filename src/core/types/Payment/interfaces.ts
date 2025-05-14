import { ITimeStamped } from '../common/interfaces';
import { PaymentMethod, PaymentStatus } from './enums';

export interface IPayment extends ITimeStamped {
  appointmentId: string;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paymentDate?: Date;
}
