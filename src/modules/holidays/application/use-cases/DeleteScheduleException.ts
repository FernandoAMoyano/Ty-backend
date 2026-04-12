import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';

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
   * @throws Error si no se encuentra la excepción
   */
  async execute(id: string): Promise<boolean> {
    // Verificar que la excepción existe
    const exception = await this.scheduleExceptionRepository.findById(id);

    if (!exception) {
      throw new Error('Excepción de horario no encontrada');
    }

    return this.scheduleExceptionRepository.delete(id);
  }
}
