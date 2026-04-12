import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';

/**
 * Caso de uso: Obtener próximas excepciones de horario
 * @description Obtiene las excepciones de horario futuras más próximas
 */
export class GetUpcomingScheduleExceptions {
  constructor(private readonly scheduleExceptionRepository: IScheduleExceptionRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param limit - Cantidad máxima de excepciones a retornar (por defecto 5)
   * @returns Lista de próximas excepciones
   */
  async execute(limit: number = 5): Promise<ScheduleExceptionResponseDto[]> {
    const exceptions = await this.scheduleExceptionRepository.findUpcoming(limit);
    return ScheduleExceptionResponseMapper.toDtoList(exceptions);
  }
}
