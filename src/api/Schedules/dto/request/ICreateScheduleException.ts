export interface ICreateScheduleExceptionDto {
  holidayId?: string;
  exceptionDate: Date;
  startTimeException: string;
  endTimeException: string;
  reason?: string;
}
