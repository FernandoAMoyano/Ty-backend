/**
 * DTO para actualizar una excepción de horario
 */
export interface UpdateScheduleExceptionDto {
  exceptionDate?: string; // ISO date string (YYYY-MM-DD)
  startTimeException?: string; // HH:MM format
  endTimeException?: string; // HH:MM format
  reason?: string | null;
  holidayId?: string | null;
}
