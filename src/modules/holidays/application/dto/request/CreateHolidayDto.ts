/**
 * DTO para crear un feriado
 */
export interface CreateHolidayDto {
  name: string;
  date: string; // ISO date string (YYYY-MM-DD)
  description?: string;
}
