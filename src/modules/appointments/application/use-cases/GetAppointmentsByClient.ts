import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { PaginatedAppointmentsResponseDto } from '../dto/response/PaginatedAppointmentsResponseDto';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para obtener todas las citas de un cliente específico, paginadas
 * Aplica control de acceso híbrido: ownership + role-based
 * - ADMIN: puede ver citas de cualquier cliente
 * - CLIENT: solo puede ver sus propias citas (clientId === requesterId)
 * - STYLIST: ve citas del cliente donde es el estilista asignado o el creador de la cita
 * El filtro de ownership de STYLIST se aplica en el repositorio (WHERE), no en memoria,
 * para que total/totalPages reflejen el filtro real (F17, corrige el mismo patrón de bug que F3)
 */
export class GetAppointmentsByClient {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un cliente
   * @param clientId - ID único del cliente (corresponde a User.id)
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @param page - Número de página (default 1)
   * @param limit - Cantidad de resultados por página (default 20)
   * @returns Promise con la página de citas del cliente y metadata de paginación
   * @throws ValidationError si el ID del cliente no es válido
   * @throws ForbiddenError si el usuario no tiene permisos
   */
  async execute(
    clientId: string,
    requesterId: string,
    requesterRole: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedAppointmentsResponseDto> {
    // 1. Validar datos básicos
    this.validateInput(clientId);

    // 2. Validar permisos de acceso
    this.validateAccessPermissions(clientId, requesterId, requesterRole);

    // 3. Construir el filtro de ownership (mismo criterio que el filtrado en memoria que reemplaza)
    const ownershipFilter =
      requesterRole === 'STYLIST' ? { stylistId: requesterId, userId: requesterId } : undefined;

    // 4. Buscar la página de citas y el total, ambos con el mismo ownershipFilter
    const offset = (page - 1) * limit;
    const [appointments, total] = await Promise.all([
      this.appointmentRepository.findByClientIdPaginated(clientId, limit, offset, ownershipFilter),
      this.appointmentRepository.countByClientId(clientId, ownershipFilter),
    ]);

    // 5. Mapear a DTOs de respuesta y construir metadata de paginación
    const totalPages = Math.ceil(total / limit);

    return {
      appointments: appointments.map(appointment => this.mapToAppointmentDto(appointment)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Valida que el ID del cliente sea válido
   * @param clientId - ID del cliente a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(clientId: string): void {
    assertValidUuid(clientId, 'Client ID');
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
