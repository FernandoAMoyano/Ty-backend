import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

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
   * @throws NotFoundError si no se encuentra el feriado
   * @description Los Schedule que referencian este feriado (Schedule.holidayId) no se
   * tocan explícitamente acá: la FK tiene onDelete: SetNull (schema.prisma), así que la
   * base de datos los desvincula automáticamente (holidayId -> null) al borrar el
   * feriado, sin necesidad de lógica adicional en este use case (F9)
   */
  async execute(id: string): Promise<boolean> {
    // Verificar que el feriado existe
    const holiday = await this.holidayRepository.findById(id);

    if (!holiday) {
      throw new NotFoundError('Holiday', id);
    }

    // Eliminar las excepciones de horario asociadas
    await this.scheduleExceptionRepository.deleteByHolidayId(id);

    // Eliminar el feriado (los Schedule asociados quedan con holidayId = null vía FK SetNull)
    return this.holidayRepository.delete(id);
  }
}
