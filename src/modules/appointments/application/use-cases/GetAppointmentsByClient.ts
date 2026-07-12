import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para obtener todas las citas de un cliente específico
 * Aplica control de acceso híbrido: ownership + role-based
 * - ADMIN: puede ver citas de cualquier cliente
 * - CLIENT: solo puede ver sus propias citas (clientId === requesterId)
 * - STYLIST: ve citas del cliente donde es el estilista asignado o el creador de la cita
 */
export class GetAppointmentsByClient {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un cliente
   * @param clientId - ID único del cliente (corresponde a User.id)
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con array de DTOs de las citas del cliente
   * @throws ValidationError si el ID del cliente no es válido
   * @throws ForbiddenError si el usuario no tiene permisos
   */
  async execute(
    clientId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto[]> {
    // 1. Validar datos básicos
    this.validateInput(clientId);

    // 2. Validar permisos de acceso
    this.validateAccessPermissions(clientId, requesterId, requesterRole);

    // 3. Buscar todas las citas del cliente en el repositorio
    const appointments = await this.appointmentRepository.findByClientId(clientId);

    // 4. Filtrar por ownership si es STYLIST
    const filteredAppointments = this.filterByRole(appointments, requesterId, requesterRole);

    // 5. Mapear a DTOs de respuesta
    return filteredAppointments.map(appointment => this.mapToAppointmentDto(appointment));
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
   * Valida que el usuario tenga permisos para consultar citas del cliente
   * @param clientId - ID del cliente consultado
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws ForbiddenError si no tiene permisos
   */
  private validateAccessPermissions(
    clientId: string,
    requesterId: string,
    requesterRole: string,
  ): void {
    // ADMIN puede ver citas de cualquier cliente
    if (requesterRole === 'ADMIN') return;

    // STYLIST puede consultar cualquier cliente (se filtra en resultados)
    if (requesterRole === 'STYLIST') return;

    // CLIENT solo puede ver sus propias citas
    if (clientId !== requesterId) {
      throw new ForbiddenError('You can only view your own appointments');
    }
  }

  /**
   * Filtra las citas según el rol del solicitante
   * STYLIST solo ve citas donde es el estilista asignado o el creador de la cita
   * (un STYLIST puede crear una cita para otro estilista y sigue debiendo verla en este listado)
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
    if (requesterRole === 'STYLIST') {
      return appointments.filter(a => a.stylistId === requesterId || a.userId === requesterId);
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
      cancellationReason: appointment.cancellationReason,
      cancelledBy: appointment.cancelledBy,
      confirmationNotes: appointment.confirmationNotes,
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
