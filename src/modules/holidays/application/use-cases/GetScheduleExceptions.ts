import { IScheduleExceptionRepository, ScheduleExceptionFilters } from '../../domain/repositories/IScheduleExceptionRepository';
import { ScheduleExceptionFiltersDto } from '../dto/request/ScheduleExceptionFiltersDto';
import { ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';
import { PaginatedScheduleExceptionsResponseDto } from '../dto/response/PaginatedScheduleExceptionsResponseDto';

/**
 * Caso de uso: Obtener excepciones de horario
 * @description Obtiene una lista paginada de excepciones con filtros opcionales
 */
export class GetScheduleExceptions {
  constructor(private readonly scheduleExceptionRepository: IScheduleExceptionRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Filtros y opciones de paginación
   * @returns Lista paginada de excepciones
   */
  async execute(dto: ScheduleExceptionFiltersDto): Promise<PaginatedScheduleExceptionsResponseDto> {
    const filters: ScheduleExceptionFilters = {};

    if (dto.startDate) {
      filters.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      filters.endDate = new Date(dto.endDate);
    }

    if (dto.holidayId) {
      filters.holidayId = dto.holidayId;
    }

    if (dto.reason) {
      filters.reason = dto.reason;
    }

    const pagination = {
      page: dto.page || 1,
      limit: dto.limit || 10,
    };

    const result = await this.scheduleExceptionRepository.findAll(filters, pagination);

    return {
      exceptions: ScheduleExceptionResponseMapper.toDtoList(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    };
  }
}
