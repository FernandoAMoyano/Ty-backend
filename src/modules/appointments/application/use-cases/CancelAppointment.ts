import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../domain/repositories/IAppointmentStatusRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { CancelAppointmentDto } from '../dto/request/CancelAppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';
import { AppointmentStatusEnum } from '../../domain/entities/AppointmentStatus';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';

/**
 * Caso de uso para cancelar una cita existente
 * Maneja la cancelación con validaciones de reglas de negocio y estado
 */
export class CancelAppointment {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para cancelar una cita
   * @param appointmentId - ID único de la cita a cancelar
   * @param cancelDto - Datos de cancelación (razón, tipo, notificaciones)
   * @param requesterId - ID del usuario que realiza la cancelación
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con el DTO de la cita cancelada
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la cita no existe
   * @throws BusinessRuleError si no se puede cancelar según reglas de negocio
   */
  async execute(
    appointmentId: string,
    cancelDto: CancelAppointmentDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, cancelDto, requesterId);

    // 2. Buscar la cita
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar reglas de negocio para cancelación
    await this.validateCancellationRules(appointment, requesterId, requesterRole);

    // 4. Obtener el estado "CANCELLED"
    const cancelledStatus = await this.getCancelledStatus();

    // 5. Verificar transición de estado válida
    await this.validateStatusTransition(appointment, cancelledStatus.id);

    // 6. Cancelar la cita con razón y tipo de cancelación
    appointment.markAsCancelled(cancelledStatus.id, cancelDto.reason, cancelDto.cancelledBy);

    // 7. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 8. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(updatedAppointment);
  }

  /**
   * Valida los datos de entrada para la cancelación
   * @param appointmentId - ID de la cita
   * @param cancelDto - DTO de cancelación
   * @param requesterId - ID del usuario solicitante
   * @throws ValidationError si algún dato es inválido
   */
  private validateInput(
    appointmentId: string,
    cancelDto: CancelAppointmentDto,
    requesterId: string,
  ): void {
    // Validar ID de cita
    assertValidUuid(appointmentId, 'Appointment ID');

    // Validar ID del solicitante
    assertValidUuid(requesterId, 'Requester ID');

    // Validar razón de cancelación (si se proporciona)
    if (cancelDto.reason && cancelDto.reason.trim().length === 0) {
      throw new ValidationError('Cancellation reason cannot be empty if provided');
    }

    if (cancelDto.reason && cancelDto.reason.length > 500) {
      throw new ValidationError('Cancellation reason cannot exceed 500 characters');
    }

    // Validar tipo de cancelación
    if (cancelDto.cancelledBy) {
      const validTypes = ['client', 'stylist', 'admin', 'system'];
      if (!validTypes.includes(cancelDto.cancelledBy)) {
        throw new ValidationError(
          'Invalid cancellation type. Must be one of: client, stylist, admin, system',
        );
      }
    }
  }

  /**
   * Valida las reglas de negocio para permitir la cancelación
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @throws BusinessRuleError si no se puede cancelar
   */
  private async validateCancellationRules(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // 1. Verificar que la cita no esté ya cancelada
    const currentStatus = await this.appointmentStatusRepository.findById(appointment.statusId);
    if (currentStatus?.name === AppointmentStatusEnum.CANCELLED) {
      throw new BusinessRuleError('Appointment is already cancelled');
    }

    // 2. Verificar que la cita no esté completada
    if (currentStatus?.name === AppointmentStatusEnum.COMPLETED) {
      throw new BusinessRuleError('Cannot cancel a completed appointment');
    }

    // 3. Verificar que la cita no haya pasado
    if (appointment.isInPast()) {
      throw new BusinessRuleError('Cannot cancel appointments that have already occurred');
    }

    // 4. Verificar permisos de cancelación
    await this.validateCancellationPermissions(appointment, requesterId, requesterRole);

    // 5. Verificar política de cancelación (ej: 24 horas antes)
    this.validateCancellationPolicy(appointment);
  }

  /**
   * Valida que el usuario tenga permisos para cancelar la cita
   * Aplica ownership unificado (userId || clientId || stylistId) con ADMIN override
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws ForbiddenError si no tiene permisos
   */
  private async validateCancellationPermissions(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // ADMIN puede cancelar cualquier cita
    if (requesterRole === 'ADMIN') return;

    // Ownership unificado: userId, clientId o stylistId
    const canCancel =
      appointment.userId === requesterId ||
      appointment.clientId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canCancel) {
      throw new ForbiddenError('You do not have permission to cancel this appointment');
    }
  }

  /**
   * Valida las políticas de tiempo para cancelación
   * @param appointment - Entidad de la cita
   * @throws BusinessRuleError si viola las políticas de tiempo
   */
  private validateCancellationPolicy(appointment: Appointment): void {
    // Política: Se puede cancelar hasta 2 horas antes de la cita
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    if (appointment.dateTime <= twoHoursFromNow) {
      throw new BusinessRuleError(
        'Appointments can only be cancelled at least 2 hours in advance. ' +
          'For last-minute cancellations, please contact customer service.',
      );
    }
  }

  /**
   * Obtiene el estado "CANCELLED" de la base de datos
   * @returns Estado de cancelación
   * @throws NotFoundError si no existe el estado
   */
  private async getCancelledStatus() {
    const cancelledStatus = await this.appointmentStatusRepository.findByName(
      AppointmentStatusEnum.CANCELLED,
    );

    if (!cancelledStatus) {
      throw new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CANCELLED);
    }

    return cancelledStatus;
  }

  /**
   * Valida que la transición de estado sea permitida
   * @param appointment - Entidad de la cita
   * @param newStatusId - ID del nuevo estado
   * @throws BusinessRuleError si la transición no es válida
   */
  private async validateStatusTransition(
    appointment: Appointment,
    newStatusId: string,
  ): Promise<void> {
    const currentStatus = await this.appointmentStatusRepository.findById(appointment.statusId);
    const newStatus = await this.appointmentStatusRepository.findById(newStatusId);

    if (!currentStatus || !newStatus) {
      throw new NotFoundError('AppointmentStatus', 'current or new status');
    }

    if (!currentStatus.canTransitionTo(newStatus.name)) {
      throw new BusinessRuleError(
        `Cannot transition from ${currentStatus.name} to ${newStatus.name}`,
      );
    }
  }

  /**
   * Mapea una entidad Appointment a su DTO de respuesta
   * @param appointment - Entidad de cita
   * @returns DTO de cita para respuesta
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
