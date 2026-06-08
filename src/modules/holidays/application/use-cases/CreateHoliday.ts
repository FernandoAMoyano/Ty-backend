import { generateUuid } from '../../../../shared/utils/uuid';
import { Holiday } from '../../domain/entities/Holiday';
import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { CreateHolidayDto } from '../dto/request/CreateHolidayDto';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';

/**
 * Caso de uso: Crear feriado
 * @description Crea un nuevo feriado en el sistema
 */
export class CreateHoliday {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para crear el feriado
   * @returns El feriado creado
   * @throws Error si ya existe un feriado en la fecha especificada
   */
  async execute(dto: CreateHolidayDto): Promise<HolidayResponseDto> {
    const date = new Date(dto.date);

    // Verificar si ya existe un feriado en esa fecha
    const existingHoliday = await this.holidayRepository.existsByDate(date);
    if (existingHoliday) {
      throw new ConflictError('A holiday already exists on the specified date');
    }

    // Crear la entidad
    const holiday = Holiday.create(
      generateUuid(),
      dto.name,
      date,
      dto.description,
    );

    // Guardar en el repositorio
    const savedHoliday = await this.holidayRepository.save(holiday);

    return HolidayResponseMapper.toDto(savedHoliday);
  }
}
