/**
 * DTO para filtros de búsqueda de excepciones de horario
 */
export interface ScheduleExceptionFiltersDto {
  startDate?: string;
  endDate?: string;
  holidayId?: string;
  reason?: string;
  page?: number;
  limit?: number;
}
