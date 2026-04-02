import { HolidayResponseDto } from './HolidayResponseDto';

/**
 * DTO de respuesta para listado paginado de feriados
 */
export interface PaginatedHolidaysResponseDto {
  holidays: HolidayResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
