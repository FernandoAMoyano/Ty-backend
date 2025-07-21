import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para obtener una cita específica por su ID
 * Maneja la búsqueda y validación de existencia de la cita
 */
export class GetAppointmentById {
  constructor(private appointmentRepository: AppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener una cita por ID
   * @param appointmentId - ID único de la cita a buscar
   * @returns Promise con el DTO de la cita encontrada
   * @throws ValidationError si el ID no es válido
   * @throws NotFoundError si la cita no existe
   */
  async execute(appointmentId: string): Promise<AppointmentDto> {
    // 1. Validar datos básicos
    this.validateInput(appointmentId);

    // 2. Buscar la cita en el repositorio
    const appointment = await this.appointmentRepository.findById(appointmentId);

    // 3. Verificar que la cita existe
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 4. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(appointment);
  }

  /**
   * Valida que el ID de la cita sea válido
   * @param appointmentId - ID a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(appointmentId: string): void {
    if (!appointmentId || appointmentId.trim().length === 0) {
      throw new ValidationError('Appointment ID is required');
    }

    // Validar formato UUID (básico)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      throw new ValidationError('Appointment ID must be a valid UUID');
    }
  }

  /**
   * Mapea una entidad Appointment a su DTO de respuesta
   * @param appointment - Entidad de cita
   * @returns DTO de cita con formato de respuesta
   */
  private mapToAppointmentDto(appointment: Appointment): AppointmentDto {
    return {
      id: appointment.id,
      dateTime: appointment.dateTime.toISOString(),
      duration: appointment.duration,
      confirmedAt: appointment.confirmedAt?.toISOString(),
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      userId: appointment.userId,
      clientId: appointment.clientId,
      stylistId: appointment.stylistId,
      scheduleId: appointment.scheduleId,
      statusId: appointment.statusId,
      serviceIds: appointment.serviceIds,
    };
  }
}
