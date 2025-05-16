export interface ICreatePaymentDto {
  appointmentId: string;
  amount: number;
  method?: string;
  paymentDate?: Date;
}
