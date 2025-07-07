export interface UpdateAppointmentDto {
  dateTime?: string; // formato de cadena ISO
  duration?: number;
  stylistId?: string;
  serviceIds?: string[];
  notes?: string;
}
