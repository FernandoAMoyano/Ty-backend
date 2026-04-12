import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';

/**
 * Caso de uso: Obtener excepción de horario por ID
 * @description Obtiene una excepción de horario específica por su ID
 */
export class GetScheduleExceptionById {
  constructor(private readonly scheduleExceptionRepository: IScheduleExceptionRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la excepción a buscar
   * @returns La excepción encontrada
   * @throws Error si no se encuentra la excepción
   */
  async execute(id: string): Promise<ScheduleExceptionResponseDto> {
    const exception = await this.scheduleExceptionRepository.findById(id);

    if (!exception) {
      throw new Error('Excepción de horario no encontrada');
    }

    return ScheduleExceptionResponseMapper.toDto(exception);
  }
}
