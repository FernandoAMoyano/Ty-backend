export interface ICreateAppointmentDto {
  clientId: string;
  stylistId?: string;
  serviceIds: string[];
  scheduleId: string;
  dateTime: Date;
}
