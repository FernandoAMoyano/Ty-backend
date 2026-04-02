/**
 * DTO para crear una excepción de horario
 */
export interface CreateScheduleExceptionDto {
  exceptionDate: string; // ISO date string (YYYY-MM-DD)
  startTimeException: string; // HH:MM format
  endTimeException: string; // HH:MM format
  reason?: string;
  holidayId?: string;
}
