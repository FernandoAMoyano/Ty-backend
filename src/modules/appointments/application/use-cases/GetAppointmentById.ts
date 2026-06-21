import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Caso de uso para obtener una cita específica por su ID
 * Aplica control de acceso híbrido: ownership + role-based
 * - ADMIN: puede ver cualquier cita
 * - STYLIST: solo citas donde es el estilista asignado
 * - CLIENT: solo citas donde es el creador (userId) o el cliente (clientId)
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
   * @throws UnauthorizedError si el usuario no tiene permisos para ver la cita
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
   * Valida que el usuario tenga permisos para ver la cita
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws UnauthorizedError si no tiene permisos
   */
  private validateAccessPermissions(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): void {
    // ADMIN puede ver cualquier cita
    if (requesterRole === 'ADMIN') return;

    // STYLIST solo ve citas donde es el estilista asignado
    if (requesterRole === 'STYLIST') {
      if (appointment.stylistId === requesterId) return;
      throw new UnauthorizedError('You do not have permission to view this appointment');
    }

    // CLIENT solo ve citas donde es el creador o el cliente
    if (
      appointment.userId === requesterId ||
      appointment.clientId === requesterId
    ) {
      return;
    }

    throw new UnauthorizedError('You do not have permission to view this appointment');
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
