export interface GetAvailableSlotsDto {
  date: string; // Formato: "YYYY-MM-DD"
  stylistId?: string;
  serviceIds?: string[];
  duration?: number; // En minutos
}
