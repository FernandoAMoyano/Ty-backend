import { generateUuid } from '../../../../shared/utils/uuid';
import { Holiday } from '../../domain/entities/Holiday';
import { IHolidayRepository } from '../../domain/repositories/IHolidayRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../../appointments/domain/repositories/IAppointmentStatusRepository';
import { AppointmentStatusEnum } from '../../../appointments/domain/entities/AppointmentStatus';
import { CreateHolidayDto } from '../dto/request/CreateHolidayDto';
import { HolidayResponseDto, HolidayResponseMapper } from '../dto/response/HolidayResponseDto';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';

/**
 * Caso de uso: Crear feriado
 * @description Crea un nuevo feriado y cancela automáticamente las citas activas
 * (PENDING/CONFIRMED) que existan para esa fecha
 */
export class CreateHoliday {
  constructor(
    private readonly holidayRepository: IHolidayRepository,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly appointmentStatusRepository: IAppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para crear el feriado
   * @returns El feriado creado
   * @throws Error si ya existe un feriado en la fecha especificada
   */
  async execute(dto: CreateHolidayDto): Promise<HolidayResponseDto> {
    const date = new Date(dto.date);

    // Verificar si ya existe un feriado en esa fecha
    const existingHoliday = await this.holidayRepository.existsByDate(date);
    if (existingHoliday) {
      throw new ConflictError('A holiday already exists on the specified date');
    }

    // Crear la entidad
    const holiday = Holiday.create(
      generateUuid(),
      dto.name,
      date,
      dto.description,
    );

    // Guardar en el repositorio
    const savedHoliday = await this.holidayRepository.save(holiday);

    // Cancelar automáticamente citas activas en la fecha del feriado
    await this.cancelAppointmentsOnHolidayDate(date);

    return HolidayResponseMapper.toDto(savedHoliday);
  }

  /**
   * Cancela automáticamente las citas activas (PENDING/CONFIRMED) en la fecha del feriado
   * Usa cancelación directa vía entidad (acción de sistema, no reutiliza CancelAppointment)
   * @param holidayDate - Fecha del feriado
   */
  private async cancelAppointmentsOnHolidayDate(holidayDate: Date): Promise<void> {
    // Obtener estado CANCELLED
    const cancelledStatus = await this.appointmentStatusRepository.findByName(
      AppointmentStatusEnum.CANCELLED,
    );
    if (!cancelledStatus) {
      throw new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CANCELLED);
    }

    // Obtener estados activos
    const [pendingStatus, confirmedStatus] = await Promise.all([
      this.appointmentStatusRepository.findByName(AppointmentStatusEnum.PENDING),
      this.appointmentStatusRepository.findByName(AppointmentStatusEnum.CONFIRMED),
    ]);

    const activeStatusIds = [pendingStatus?.id, confirmedStatus?.id].filter(Boolean) as string[];

    if (activeStatusIds.length === 0) return;

    // Buscar citas del día (inicio y fin del día del feriado)
    const startOfDay = new Date(holidayDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(holidayDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentRepository.findByDateRange(startOfDay, endOfDay);

    // Filtrar solo las activas y cancelarlas
    const activeAppointments = appointments.filter(a => activeStatusIds.includes(a.statusId));

    for (const appointment of activeAppointments) {
      appointment.markAsCancelled(cancelledStatus.id, 'Holiday created', 'system');
      await this.appointmentRepository.update(appointment);
    }
  }
}
