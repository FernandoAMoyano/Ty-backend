import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para obtener una cita específica por su ID
 * Aplica ownership unificado (userId || clientId || stylistId) con ADMIN override,
 * el mismo patrón que UpdateAppointment/ConfirmAppointment/CancelAppointment
 * - ADMIN: puede ver cualquier cita
 * - Cualquier otro rol: solo si es el creador (userId), el cliente (clientId)
 *   o el estilista asignado (stylistId) de la cita
 */
export class GetAppointmentById {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener una cita por ID
   * @param appointmentId - ID único de la cita a buscar
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con el DTO de la cita encontrada
   * @throws ValidationError si el ID no es válido
   * @throws NotFoundError si la cita no existe
   * @throws ForbiddenError si el usuario no tiene permisos para ver la cita
   */
  async execute(
    appointmentId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos básicos
    this.validateInput(appointmentId);

    // 2. Buscar la cita en el repositorio
    const appointment = await this.appointmentRepository.findById(appointmentId);

    // 3. Verificar que la cita existe
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 4. Validar permisos de acceso
    this.validateAccessPermissions(appointment, requesterId, requesterRole);

    // 5. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(appointment);
  }

  /**
   * Valida que el ID de la cita sea válido
   * @param appointmentId - ID a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(appointmentId: string): void {
    assertValidUuid(appointmentId, 'Appointment ID');
  }

  /**
   * Valida que el usuario tenga permisos para ver la cita
   * Aplica ownership unificado (userId || clientId || stylistId) con ADMIN override
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws ForbiddenError si no tiene permisos
   */
  private validateAccessPermissions(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): void {
    // ADMIN puede ver cualquier cita
    if (requesterRole === 'ADMIN') return;

    // Ownership unificado: userId, clientId o stylistId
    const canView =
      appointment.userId === requesterId ||
      appointment.clientId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canView) {
      throw new ForbiddenError('You do not have permission to view this appointment');
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
