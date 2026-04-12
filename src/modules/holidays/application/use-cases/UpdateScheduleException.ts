import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { UpdateScheduleExceptionDto } from '../dto/request/UpdateScheduleExceptionDto';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';

/**
 * Caso de uso: Actualizar excepción de horario
 * @description Actualiza una excepción de horario existente
 */
export class UpdateScheduleException {
  constructor(
    private readonly scheduleExceptionRepository: IScheduleExceptionRepository,
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param id - ID de la excepción a actualizar
   * @param dto - Datos a actualizar
   * @returns La excepción actualizada
   * @throws Error si no se encuentra la excepción
   * @throws Error si la nueva fecha ya tiene otra excepción
   * @throws Error si el holidayId no existe
   */
  async execute(id: string, dto: UpdateScheduleExceptionDto): Promise<ScheduleExceptionResponseDto> {
    // Buscar la excepción
    const exception = await this.scheduleExceptionRepository.findById(id);

    if (!exception) {
      throw new Error('Excepción de horario no encontrada');
    }

    // Si se actualiza la fecha, verificar que no exista otra excepción en esa fecha
    if (dto.exceptionDate) {
      const newDate = new Date(dto.exceptionDate);
      const existingException = await this.scheduleExceptionRepository.existsByDate(newDate, id);
      if (existingException) {
        throw new Error('Ya existe una excepción de horario en la fecha especificada');
      }
      exception.updateDate(newDate);
    }

    // Actualizar horarios si se proporcionan ambos
    if (dto.startTimeException !== undefined && dto.endTimeException !== undefined) {
      exception.updateTimes(dto.startTimeException, dto.endTimeException);
    } else if (dto.startTimeException !== undefined || dto.endTimeException !== undefined) {
      // Si solo se proporciona uno, usar el valor actual del otro
      const startTime = dto.startTimeException ?? exception.startTimeException;
      const endTime = dto.endTimeException ?? exception.endTimeException;
      exception.updateTimes(startTime, endTime);
    }

    // Actualizar razón si se proporciona (puede ser null)
    if (dto.reason !== undefined) {
      exception.updateReason(dto.reason);
    }

    // Actualizar holidayId si se proporciona
    if (dto.holidayId !== undefined) {
      if (dto.holidayId === null) {
        exception.disassociateFromHoliday();
      } else {
        // Verificar que el feriado exista
        const holiday = await this.holidayRepository.findById(dto.holidayId);
        if (!holiday) {
          throw new Error('El feriado especificado no existe');
        }
        exception.associateToHoliday(dto.holidayId);
      }
    }

    // Guardar cambios
    const updatedException = await this.scheduleExceptionRepository.update(exception);

    return ScheduleExceptionResponseMapper.toDto(updatedException);
  }
}
