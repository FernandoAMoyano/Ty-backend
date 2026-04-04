import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';

/**
 * Caso de uso: Eliminar feriado
 * @description Elimina un feriado y sus excepciones de horario asociadas
 */
export class DeleteHoliday {
  constructor(
    private readonly holidayRepository: IHolidayRepository,
    private readonly scheduleExceptionRepository: IScheduleExceptionRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID del feriado a eliminar
   * @returns true si se eliminó correctamente
   * @throws Error si no se encuentra el feriado
   */
  async execute(id: string): Promise<boolean> {
    // Verificar que el feriado existe
    const holiday = await this.holidayRepository.findById(id);

    if (!holiday) {
      throw new Error('Feriado no encontrado');
    }

    // Eliminar las excepciones de horario asociadas
    await this.scheduleExceptionRepository.deleteByHolidayId(id);

    // Eliminar el feriado
    return this.holidayRepository.delete(id);
  }
}
