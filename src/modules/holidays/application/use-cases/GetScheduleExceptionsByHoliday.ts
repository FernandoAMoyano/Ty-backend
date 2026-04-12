import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';

/**
 * Caso de uso: Obtener excepciones de horario por feriado
 * @description Obtiene todas las excepciones asociadas a un feriado específico
 */
export class GetScheduleExceptionsByHoliday {
  constructor(
    private readonly scheduleExceptionRepository: IScheduleExceptionRepository,
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param holidayId - ID del feriado
   * @returns Lista de excepciones asociadas al feriado
   * @throws Error si el feriado no existe
   */
  async execute(holidayId: string): Promise<ScheduleExceptionResponseDto[]> {
    // Verificar que el feriado existe
    const holiday = await this.holidayRepository.findById(holidayId);

    if (!holiday) {
      throw new Error('Feriado no encontrado');
    }

    const exceptions = await this.scheduleExceptionRepository.findByHolidayId(holidayId);

    return ScheduleExceptionResponseMapper.toDtoList(exceptions);
  }
}
