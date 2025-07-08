export interface GetAvailableSlotsDto {
  date: string; // Formato: "aaa yyy-mm-dd"
  stylistId?: string;
  serviceIds?: string[];
  duration?: number; // En minutos
}
