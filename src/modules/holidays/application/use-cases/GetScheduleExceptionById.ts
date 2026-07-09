import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

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
   * @throws NotFoundError si no se encuentra la excepción
   */
  async execute(id: string): Promise<ScheduleExceptionResponseDto> {
    const exception = await this.scheduleExceptionRepository.findById(id);

    if (!exception) {
      throw new NotFoundError('ScheduleException', id);
    }

    return ScheduleExceptionResponseMapper.toDto(exception);
  }
}
