export interface IAppointmentBrief {
  id: string;
  dateTime: Date;
  status: string;
  stylistName?: string;
  serviceName: string;
}
