import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';

/**
 * Caso de uso: Verificar si una fecha es feriado
 * @description Verifica si una fecha específica es feriado
 */
export class CheckIsHoliday {
  constructor(private readonly holidayRepository: IHolidayRepository) {}

  /**
   * Ejecuta el caso de uso
   * @param date - Fecha a verificar (string ISO o Date)
   * @returns Objeto con el resultado y datos del feriado si existe
   */
  async execute(date: string | Date): Promise<{ isHoliday: boolean; holidayName?: string }> {
    const dateToCheck = typeof date === 'string' ? new Date(date) : date;
    
    const holiday = await this.holidayRepository.findByDate(dateToCheck);

    if (holiday) {
      return {
        isHoliday: true,
        holidayName: holiday.name,
      };
    }

    return {
      isHoliday: false,
    };
  }
}
