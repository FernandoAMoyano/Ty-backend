import { generateUuid } from '../../../../shared/utils/uuid';
import { ScheduleException } from '../../domain/entities/ScheduleException';
import { IScheduleExceptionRepository } from '../../domain/repositories/IScheduleExceptionRepository';
import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { CreateScheduleExceptionDto } from '../dto/request/CreateScheduleExceptionDto';
import { ScheduleExceptionResponseDto, ScheduleExceptionResponseMapper } from '../dto/response/ScheduleExceptionResponseDto';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { parseDateOnlyUTC } from '../../../../shared/utils/dateOnly';

/**
 * Caso de uso: Crear excepción de horario
 * @description Crea una nueva excepción de horario
 */
export class CreateScheduleException {
  constructor(
    private readonly scheduleExceptionRepository: IScheduleExceptionRepository,
    private readonly holidayRepository: IHolidayRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para crear la excepción
   * @returns La excepción creada
   * @throws Error si ya existe una excepción en la fecha especificada
   * @throws Error si el holidayId no existe
   */
  async execute(dto: CreateScheduleExceptionDto): Promise<ScheduleExceptionResponseDto> {
    const exceptionDate = parseDateOnlyUTC(dto.exceptionDate);

    // Verificar si ya existe una excepción en esa fecha
    const existingException = await this.scheduleExceptionRepository.existsByDate(exceptionDate);
    if (existingException) {
      throw new ConflictError('A schedule exception already exists on the specified date');
    }

    // Si se proporciona holidayId, verificar que exista
    if (dto.holidayId) {
      const holiday = await this.holidayRepository.findById(dto.holidayId);
      if (!holiday) {
        throw new NotFoundError('Holiday', dto.holidayId);
      }
    }

    // Crear la entidad
    const exception = ScheduleException.create(
      generateUuid(),
      exceptionDate,
      dto.startTimeException,
      dto.endTimeException,
      dto.reason,
      dto.holidayId,
    );

    // Guardar en el repositorio
    const savedException = await this.scheduleExceptionRepository.save(exception);

    return ScheduleExceptionResponseMapper.toDto(savedException);
  }
}
