export interface CreateAppointmentDto {
  dateTime: string; // formato de cadena ISO
  duration?: number; // opcional, se puede calcular a partir de los servicios
  clientId: string;
  stylistId?: string;
  serviceIds: string[];
  notes?: string;
}
