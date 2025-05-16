export interface IAppointmentDetailedResponse {
  id: string;
  dateTime: Date;
  duration: number;
  status: string;
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
  services: {
    id: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  payments?: {
    id: string;
    amount: number;
    status: string;
    method?: string;
    paymentDate?: Date;
  }[];
}
