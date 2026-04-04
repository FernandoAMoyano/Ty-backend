import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';

/**
 * Caso de uso: Obtener próximos feriados
 * @description Obtiene los feriados futuros más próximos
 */
export class GetUpcomingHolidays {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param limit - Cantidad máxima de feriados a retornar (por defecto 5)
   * @returns Lista de próximos feriados
   */
  async execute(limit: number = 5): Promise<HolidayResponseDto[]> {
    const holidays = await this.holidayRepository.findUpcoming(limit);
    return HolidayResponseMapper.toDtoList(holidays);
  }
}
