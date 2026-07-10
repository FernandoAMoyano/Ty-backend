import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { UpdateHolidayDto } from '../dto/request/UpdateHolidayDto';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';

/**
 * Caso de uso: Actualizar feriado
 * @description Actualiza un feriado existente
 */
export class UpdateHoliday {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del feriado a actualizar
   * @param dto - Datos a actualizar
   * @returns El feriado actualizado
   * @throws NotFoundError si no se encuentra el feriado
   * @throws ConflictError si la nueva fecha ya tiene otro feriado
   */
  async execute(id: string, dto: UpdateHolidayDto): Promise<HolidayResponseDto> {
    // Buscar el feriado
    const holiday = await this.holidayRepository.findById(id);

    if (!holiday) {
      throw new NotFoundError('Holiday', id);
    }

    // Si se actualiza la fecha, verificar que no exista otro feriado en esa fecha
    if (dto.date) {
      const newDate = new Date(dto.date);
      const existingHoliday = await this.holidayRepository.existsByDate(newDate, id);
      if (existingHoliday) {
        throw new ConflictError('A holiday already exists on the specified date');
      }
      holiday.updateDate(newDate);
    }

    // Actualizar nombre si se proporciona
    if (dto.name !== undefined) {
      holiday.updateName(dto.name);
    }

    // Actualizar descripción si se proporciona (puede ser null)
    if (dto.description !== undefined) {
      holiday.updateDescription(dto.description);
    }

    // Guardar cambios
    const updatedHoliday = await this.holidayRepository.update(holiday);

    return HolidayResponseMapper.toDto(updatedHoliday);
  }
}
