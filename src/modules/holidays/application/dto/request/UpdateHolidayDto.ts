/**
 * DTO para actualizar un feriado
 */
export interface UpdateHolidayDto {
  name?: string;
  date?: string; // ISO date string (YYYY-MM-DD)
  description?: string | null;
}
