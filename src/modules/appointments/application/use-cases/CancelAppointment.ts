import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { CancelAppointmentDto } from '../dto/request/CancelAppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { AppointmentStatusEnum } from '../../domain/entities/AppointmentStatus';

/**
 * Caso de uso para cancelar una cita existente
 * Maneja la cancelación con validaciones de reglas de negocio y estado
 */
export class CancelAppointment {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private appointmentStatusRepository: AppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para cancelar una cita
   * @param appointmentId - ID único de la cita a cancelar
   * @param cancelDto - Datos de cancelación (razón, tipo, notificaciones)
   * @param requesterId - ID del usuario que realiza la cancelación
   * @returns Promise con el DTO de la cita cancelada
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la cita no existe
   * @throws BusinessRuleError si no se puede cancelar según reglas de negocio
   */
  async execute(
    appointmentId: string,
    cancelDto: CancelAppointmentDto,
    requesterId: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, cancelDto, requesterId);

    // 2. Buscar la cita
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar reglas de negocio para cancelación
    await this.validateCancellationRules(appointment, requesterId);

    // 4. Obtener el estado "CANCELLED"
    const cancelledStatus = await this.getCancelledStatus();

    // 5. Verificar transición de estado válida
    await this.validateStatusTransition(appointment, cancelledStatus.id);

    // 6. Cancelar la cita
    appointment.markAsCancelled(cancelledStatus.id);

    // 7. Agregar información de cancelación (si hay razón)
    if (cancelDto.reason) {
      this.addCancellationReason(appointment, cancelDto, requesterId);
    }

    // 8. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 9. Mapear a DTO de respuesta
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
    if (!appointmentId || appointmentId.trim().length === 0) {
      throw new ValidationError('Appointment ID is required');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appointmentId)) {
      throw new ValidationError('Appointment ID must be a valid UUID');
    }

    // Validar ID del solicitante
    if (!requesterId || requesterId.trim().length === 0) {
      throw new ValidationError('Requester ID is required');
    }

    if (!uuidRegex.test(requesterId)) {
      throw new ValidationError('Requester ID must be a valid UUID');
    }

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
    await this.validateCancellationPermissions(appointment, requesterId);

    // 5. Verificar política de cancelación (ej: 24 horas antes)
    this.validateCancellationPolicy(appointment);
  }

  /**
   * Valida que el usuario tenga permisos para cancelar la cita
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @throws BusinessRuleError si no tiene permisos
   */
  private async validateCancellationPermissions(
    appointment: Appointment,
    requesterId: string,
  ): Promise<void> {
    // El usuario puede cancelar si es:
    // 1. El creador de la cita
    // 2. El cliente de la cita
    // 3. El estilista asignado
    // 4. Un administrador (esto se validaría con roles, por ahora simplificado)

    const canCancel =
      appointment.userId === requesterId ||
      appointment.clientId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canCancel) {
      throw new BusinessRuleError('You do not have permission to cancel this appointment');
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
   * Agrega información de cancelación a la cita
   * @param appointment - Entidad de la cita
   * @param cancelDto - DTO con información de cancelación
   * @param requesterId - ID del usuario que cancela
   */
  private addCancellationReason(
    appointment: Appointment,
    cancelDto: CancelAppointmentDto,
    requesterId: string,
  ): void {
    // En la implementación real, esto podría ser un campo separado
    // Por ahora, lo agregamos como metadata que puede ser almacenada
    // en un campo JSON o en una tabla relacionada

    const cancellationInfo = {
      reason: cancelDto.reason,
      cancelledBy: cancelDto.cancelledBy || 'user',
      cancelledAt: new Date().toISOString(),
      requesterId: requesterId,
      notifyClient: cancelDto.notifyClient !== false,
    };

    // Agregar la información de cancelación a la entidad
    // En una implementación real, podrías:
    // 1. Tener un campo 'cancellationMetadata' en la entidad Appointment
    // 2. Crear una entidad separada CancellationHistory
    // 3. Usar un sistema de eventos para registrar la cancelación

    // Por ahora, actualizamos la fecha de actualización para reflejar el cambio
    appointment.updatedAt = new Date();

    // Log de la información de cancelación para auditoría
    console.log('Appointment cancelled:', {
      appointmentId: appointment.id,
      cancellationInfo,
    });
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
