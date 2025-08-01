import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para obtener todas las citas de un estilista específico
 * Maneja la búsqueda y validación de existencia del estilista y retorna sus citas ordenadas
 */
export class GetAppointmentsByStylist {
  constructor(private appointmentRepository: AppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un estilista
   * @param stylistId - ID único del estilista
   * @returns Promise con array de DTOs de las citas del estilista ordenadas por fecha (más recientes primero)
   * @throws ValidationError si el ID del estilista no es válido
   */
  async execute(stylistId: string): Promise<AppointmentDto[]> {
    // 1. Validar datos básicos
    this.validateInput(stylistId);

    // 2. Buscar todas las citas del estilista en el repositorio
    const appointments = await this.appointmentRepository.findByStylistId(stylistId);

    // 3. Mapear a DTOs de respuesta
    return appointments.map(appointment => this.mapToAppointmentDto(appointment));
  }

  /**
   * Valida que el ID del estilista sea válido
   * @param stylistId - ID del estilista a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(stylistId: string): void {
    if (!stylistId || stylistId.trim().length === 0) {
      throw new ValidationError('Stylist ID is required');
    }

    // Validar formato UUID (básico)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stylistId)) {
      throw new ValidationError('Stylist ID must be a valid UUID');
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
