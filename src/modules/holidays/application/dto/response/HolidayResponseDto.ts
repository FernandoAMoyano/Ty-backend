import { Holiday } from '../../../domain/entities/Holiday';

/**
 * DTO de respuesta para feriado
 */
export interface HolidayResponseDto {
  id: string;
  name: string;
  date: string;
  description: string | null;
  year: number;
  month: number;
  day: number;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapper para convertir entidad Holiday a DTO de respuesta
 */
export class HolidayResponseMapper {
  /**
   * Convierte una entidad Holiday a DTO de respuesta
   * @param holiday - Entidad Holiday
   * @returns DTO de respuesta
   */
  static toDto(holiday: Holiday): HolidayResponseDto {
    return {
      id: holiday.id,
      name: holiday.name,
      date: holiday.date.toISOString().split('T')[0],
      description: holiday.description,
      year: holiday.year,
      month: holiday.month,
      day: holiday.day,
      isPast: holiday.isPast,
      isToday: holiday.isToday,
      isFuture: holiday.isFuture,
      createdAt: holiday.createdAt.toISOString(),
      updatedAt: holiday.updatedAt.toISOString(),
    };
  }

  /**
   * Convierte una lista de entidades Holiday a DTOs de respuesta
   * @param holidays - Lista de entidades Holiday
   * @returns Lista de DTOs de respuesta
   */
  static toDtoList(holidays: Holiday[]): HolidayResponseDto[] {
    return holidays.map(holiday => this.toDto(holiday));
  }
}
