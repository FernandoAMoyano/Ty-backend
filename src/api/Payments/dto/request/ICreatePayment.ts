import { PaymentMethod } from '../../../../core/types/Payment/enums';

export interface ICreatePaymentDto {
  appointmentId: string;
  amount: number;
  method?: PaymentMethod;
  paymentDate?: Date;
}
