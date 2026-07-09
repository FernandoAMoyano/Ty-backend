import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso: Eliminar excepción de horario
 * @description Elimina una excepción de horario existente
 */
export class DeleteScheduleException {
  constructor(private readonly scheduleExceptionRepository: IScheduleExceptionRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la excepción a eliminar
   * @returns true si se eliminó correctamente
   * @throws NotFoundError si no se encuentra la excepción
   */
  async execute(id: string): Promise<boolean> {
    // Verificar que la excepción existe
    const exception = await this.scheduleExceptionRepository.findById(id);

    if (!exception) {
      throw new NotFoundError('ScheduleException', id);
    }

    return this.scheduleExceptionRepository.delete(id);
  }
}
