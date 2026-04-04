import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';

/**
 * Caso de uso: Obtener feriados por año
 * @description Obtiene todos los feriados de un año específico
 */
export class GetHolidaysByYear {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param year - Año a consultar
   * @returns Lista de feriados del año
   */
  async execute(year: number): Promise<HolidayResponseDto[]> {
    const holidays = await this.holidayRepository.findByYear(year);
    return HolidayResponseMapper.toDtoList(holidays);
  }
}
