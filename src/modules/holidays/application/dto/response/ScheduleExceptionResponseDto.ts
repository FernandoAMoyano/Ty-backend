import { ScheduleException } from '../../../domain/entities/ScheduleException';

/**
 * DTO de respuesta para excepción de horario
 */
export interface ScheduleExceptionResponseDto {
  id: string;
  exceptionDate: string;
  startTimeException: string;
  endTimeException: string;
  reason: string | null;
  holidayId: string | null;
  isHolidayRelated: boolean;
  durationInMinutes: number;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mapper para convertir entidad ScheduleException a DTO de respuesta
 */
export class ScheduleExceptionResponseMapper {
  /**
   * Convierte una entidad ScheduleException a DTO de respuesta
   * @param exception - Entidad ScheduleException
   * @returns DTO de respuesta
   */
  static toDto(exception: ScheduleException): ScheduleExceptionResponseDto {
    return {
      id: exception.id,
      exceptionDate: exception.exceptionDate.toISOString().split('T')[0],
      startTimeException: exception.startTimeException,
      endTimeException: exception.endTimeException,
      reason: exception.reason,
      holidayId: exception.holidayId,
      isHolidayRelated: exception.isHolidayRelated,
      durationInMinutes: exception.durationInMinutes,
      isPast: exception.isPast,
      isToday: exception.isToday,
      isFuture: exception.isFuture,
      createdAt: exception.createdAt.toISOString(),
      updatedAt: exception.updatedAt.toISOString(),
    };
  }

  /**
   * Convierte una lista de entidades ScheduleException a DTOs de respuesta
   * @param exceptions - Lista de entidades ScheduleException
   * @returns Lista de DTOs de respuesta
   */
  static toDtoList(exceptions: ScheduleException[]): ScheduleExceptionResponseDto[] {
    return exceptions.map(exception => this.toDto(exception));
  }
}
