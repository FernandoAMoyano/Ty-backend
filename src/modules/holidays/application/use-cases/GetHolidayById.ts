import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso: Obtener feriado por ID
 * @description Obtiene un feriado específico por su ID
 */
export class GetHolidayById {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del feriado a buscar
   * @returns El feriado encontrado
   * @throws NotFoundError si no se encuentra el feriado
   */
  async execute(id: string): Promise<HolidayResponseDto> {
    const holiday = await this.holidayRepository.findById(id);

    if (!holiday) {
      throw new NotFoundError('Holiday', id);
    }

    return HolidayResponseMapper.toDto(holiday);
  }
}
