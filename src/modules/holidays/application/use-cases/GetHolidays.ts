import { IHolidayRepository, HolidayFilters } from '../../domain/repositories/IHolidayRepository';
import { HolidayFiltersDto } from '../dto/request/HolidayFiltersDto';
import { HolidayResponseMapper } from '../dto/response/HolidayResponseDto';
import { PaginatedHolidaysResponseDto } from '../dto/response/PaginatedHolidaysResponseDto';

/**
 * Caso de uso: Obtener feriados
 * @description Obtiene una lista paginada de feriados con filtros opcionales
 */
export class GetHolidays {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Filtros y opciones de paginación
   * @returns Lista paginada de feriados
   */
  async execute(dto: HolidayFiltersDto): Promise<PaginatedHolidaysResponseDto> {
    const filters: HolidayFilters = {};

    if (dto.year) {
      filters.year = dto.year;
    }

    if (dto.month) {
      filters.month = dto.month;
    }

    if (dto.startDate) {
      filters.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      filters.endDate = new Date(dto.endDate);
    }

    if (dto.name) {
      filters.name = dto.name;
    }

    const pagination = {
      page: dto.page || 1,
      limit: dto.limit || 10,
    };

    const result = await this.holidayRepository.findAll(filters, pagination);

    return {
      holidays: HolidayResponseMapper.toDtoList(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
    };
  }
}
