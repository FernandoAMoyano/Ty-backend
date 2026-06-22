import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Caso de uso para obtener todas las citas de un estilista específico
 * Aplica control de acceso híbrido: ownership + role-based
 * - ADMIN: puede ver citas de cualquier estilista
 * - STYLIST: solo puede ver sus propias citas (stylistId === requesterId)
 * - CLIENT: ve citas del estilista donde es el cliente
 */
export class GetAppointmentsByStylist {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un estilista
   * @param stylistId - ID único del estilista
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con array de DTOs de las citas del estilista
   * @throws ValidationError si el ID del estilista no es válido
   * @throws UnauthorizedError si el usuario no tiene permisos
   */
  async execute(
    stylistId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto[]> {
    // 1. Validar datos básicos
    this.validateInput(stylistId);

    // 2. Validar permisos de acceso
    this.validateAccessPermissions(stylistId, requesterId, requesterRole);

    // 3. Buscar todas las citas del estilista en el repositorio
    const appointments = await this.appointmentRepository.findByStylistId(stylistId);

    // 4. Filtrar por ownership si es CLIENT
    const filteredAppointments = this.filterByRole(appointments, requesterId, requesterRole);

    // 5. Mapear a DTOs de respuesta
    return filteredAppointments.map(appointment => this.mapToAppointmentDto(appointment));
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
   * Valida que el usuario tenga permisos para consultar citas del estilista
   * @param stylistId - ID del estilista consultado
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws UnauthorizedError si no tiene permisos
   */
  private validateAccessPermissions(
    stylistId: string,
    requesterId: string,
    requesterRole: string,
  ): void {
    // ADMIN puede ver citas de cualquier estilista
    if (requesterRole === 'ADMIN') return;

    // STYLIST solo puede ver sus propias citas
    if (requesterRole === 'STYLIST') {
      if (stylistId !== requesterId) {
        throw new UnauthorizedError('You can only view your own appointments');
      }
      return;
    }

    // CLIENT puede consultar cualquier estilista (se filtra en resultados)
  }

  /**
   * Filtra las citas según el rol del solicitante
   * CLIENT solo ve citas donde es el creador o el cliente
   * @param appointments - Lista completa de citas
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @returns Lista filtrada de citas
   */
  private filterByRole(
    appointments: Appointment[],
    requesterId: string,
    requesterRole: string,
  ): Appointment[] {
    if (requesterRole === 'CLIENT') {
      return appointments.filter(
        a => a.userId === requesterId || a.clientId === requesterId,
      );
    }
    return appointments;
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
