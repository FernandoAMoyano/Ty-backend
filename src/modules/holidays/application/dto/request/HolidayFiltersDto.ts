/**
 * DTO para filtros de búsqueda de feriados
 */
export interface HolidayFiltersDto {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  name?: string;
  page?: number;
  limit?: number;
}
