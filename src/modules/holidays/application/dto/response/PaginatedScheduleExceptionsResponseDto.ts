import { ScheduleExceptionResponseDto } from './ScheduleExceptionResponseDto';

/**
 * DTO de respuesta para listado paginado de excepciones de horario
 */
export interface PaginatedScheduleExceptionsResponseDto {
  exceptions: ScheduleExceptionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
