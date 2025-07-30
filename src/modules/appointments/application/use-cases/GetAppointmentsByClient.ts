import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Caso de uso para obtener todas las citas de un cliente específico
 * Maneja la búsqueda y validación de existencia del cliente y retorna sus citas ordenadas
 */
export class GetAppointmentsByClient {
  constructor(private appointmentRepository: AppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un cliente
   * @param clientId - ID único del cliente
   * @returns Promise con array de DTOs de las citas del cliente ordenadas por fecha (más recientes primero)
   * @throws ValidationError si el ID del cliente no es válido
   */
  async execute(clientId: string): Promise<AppointmentDto[]> {
    // 1. Validar datos básicos
    this.validateInput(clientId);

    // 2. Buscar todas las citas del cliente en el repositorio
    const appointments = await this.appointmentRepository.findByClientId(clientId);

    // 3. Mapear a DTOs de respuesta
    return appointments.map(appointment => this.mapToAppointmentDto(appointment));
  }

  /**
   * Valida que el ID del cliente sea válido
   * @param clientId - ID del cliente a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(clientId: string): void {
    if (!clientId || clientId.trim().length === 0) {
      throw new ValidationError('Client ID is required');
    }

    // Validar formato UUID (básico)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      throw new ValidationError('Client ID must be a valid UUID');
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
