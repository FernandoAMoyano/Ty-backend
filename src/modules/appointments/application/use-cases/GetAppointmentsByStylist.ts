import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { PaginatedAppointmentsResponseDto } from '../dto/response/PaginatedAppointmentsResponseDto';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';

/**
 * Caso de uso para obtener todas las citas de un estilista específico, paginadas
 * Aplica control de acceso híbrido: ownership + role-based
 * - ADMIN: puede ver citas de cualquier estilista
 * - STYLIST: solo puede ver sus propias citas (stylistId === requesterId)
 * - CLIENT: ve citas del estilista donde es el cliente
 * El filtro de ownership de CLIENT se aplica en el repositorio (WHERE), no en memoria,
 * para que total/totalPages reflejen el filtro real (F17, corrige el mismo patrón de bug que F3)
 */
export class GetAppointmentsByStylist {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  /**
   * Ejecuta el caso de uso para obtener las citas de un estilista
   * @param stylistId - ID único del estilista
   * @param requesterId - ID del usuario que realiza la consulta
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @param page - Número de página (default 1)
   * @param limit - Cantidad de resultados por página (default 20)
   * @returns Promise con la página de citas del estilista y metadata de paginación
   * @throws ValidationError si el ID del estilista no es válido
   * @throws ForbiddenError si el usuario no tiene permisos
   */
  async execute(
    stylistId: string,
    requesterId: string,
    requesterRole: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedAppointmentsResponseDto> {
    // 1. Validar datos básicos
    this.validateInput(stylistId);

    // 2. Validar permisos de acceso
    this.validateAccessPermissions(stylistId, requesterId, requesterRole);

    // 3. Construir el filtro de ownership (mismo criterio que el filtrado en memoria que reemplaza)
    const ownershipFilter =
      requesterRole === 'CLIENT' ? { userId: requesterId, clientId: requesterId } : undefined;

    // 4. Buscar la página de citas y el total, ambos con el mismo ownershipFilter
    const offset = (page - 1) * limit;
    const [appointments, total] = await Promise.all([
      this.appointmentRepository.findByStylistIdPaginated(stylistId, limit, offset, ownershipFilter),
      this.appointmentRepository.countByStylistId(stylistId, ownershipFilter),
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
   * Valida que el ID del estilista sea válido
   * @param stylistId - ID del estilista a validar
   * @throws ValidationError si el ID es inválido
   */
  private validateInput(stylistId: string): void {
    assertValidUuid(stylistId, 'Stylist ID');
  }

  /**
   * Valida que el usuario tenga permisos para consultar citas del estilista
   * @param stylistId - ID del estilista consultado
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws ForbiddenError si no tiene permisos
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
        throw new ForbiddenError('You can only view your own appointments');
      }
      return;
    }

    // CLIENT puede consultar cualquier estilista (se filtra en resultados)
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
