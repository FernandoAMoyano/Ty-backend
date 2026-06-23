import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../domain/repositories/IAppointmentStatusRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { ConfirmAppointmentDto } from '../dto/request/ConfirmAppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { AppointmentStatusEnum } from '../../domain/entities/AppointmentStatus';

/**
 * Caso de uso para confirmar una cita existente
 * Maneja la confirmación con validaciones de reglas de negocio y cambio de estado
 */
export class ConfirmAppointment {
  constructor(
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para confirmar una cita
   * @param appointmentId - ID único de la cita a confirmar
   * @param confirmDto - Datos de confirmación (notas, notificaciones, etc.)
   * @param requesterId - ID del usuario que realiza la confirmación
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con el DTO de la cita confirmada
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la cita no existe
   * @throws BusinessRuleError si no se puede confirmar según reglas de negocio
   */
  async execute(
    appointmentId: string,
    confirmDto: ConfirmAppointmentDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, confirmDto, requesterId);

    // 2. Buscar la cita
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar reglas de negocio para confirmación
    await this.validateConfirmationRules(appointment, requesterId, requesterRole);

    // 4. Obtener el estado "CONFIRMED"
    const confirmedStatus = await this.getConfirmedStatus();

    // 5. Verificar transición de estado válida
    await this.validateStatusTransition(appointment, confirmedStatus.id);

    // 6. Confirmar la cita con notas opcionales
    appointment.markAsConfirmed(confirmedStatus.id, confirmDto.notes);

    // 7. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 8. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(updatedAppointment);
  }

  /**
   * Valida los datos de entrada para la confirmación
   * @param appointmentId - ID de la cita
   * @param confirmDto - DTO de confirmación
   * @param requesterId - ID del usuario solicitante
   * @throws ValidationError si algún dato es inválido
   */
  private validateInput(
    appointmentId: string,
    confirmDto: ConfirmAppointmentDto,
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

    // Validar notas de confirmación (si se proporcionan)
    if (confirmDto.notes && confirmDto.notes.trim().length === 0) {
      throw new ValidationError('Confirmation notes cannot be empty if provided');
    }

    if (confirmDto.notes && confirmDto.notes.length > 500) {
      throw new ValidationError('Confirmation notes cannot exceed 500 characters');
    }

    // Validar confirmedBy si se proporciona
    if (confirmDto.confirmedBy && !uuidRegex.test(confirmDto.confirmedBy)) {
      throw new ValidationError('Confirmed by ID must be a valid UUID');
    }
  }

  /**
   * Valida las reglas de negocio para permitir la confirmación
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @throws BusinessRuleError si no se puede confirmar
   */
  private async validateConfirmationRules(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // 1. Verificar que la cita no esté ya confirmada
    if (appointment.isConfirmed()) {
      throw new BusinessRuleError('Appointment is already confirmed');
    }

    // 2. Verificar que la cita no esté cancelada
    const currentStatus = await this.appointmentStatusRepository.findById(appointment.statusId);
    if (currentStatus?.name === AppointmentStatusEnum.CANCELLED) {
      throw new BusinessRuleError('Cannot confirm a cancelled appointment');
    }

    // 3. Verificar que la cita no esté completada
    if (currentStatus?.name === AppointmentStatusEnum.COMPLETED) {
      throw new BusinessRuleError('Cannot confirm a completed appointment');
    }

    // 4. Verificar que la cita no haya pasado
    if (appointment.isInPast()) {
      throw new BusinessRuleError('Cannot confirm appointments that have already occurred');
    }

    // 5. Verificar permisos de confirmación
    await this.validateConfirmationPermissions(appointment, requesterId, requesterRole);

    // 6. Verificar política de confirmación (ej: hasta 1 hora antes)
    this.validateConfirmationPolicy(appointment);
  }

  /**
   * Valida que el usuario tenga permisos para confirmar la cita
   * Aplica ownership unificado (userId || clientId || stylistId) con ADMIN override
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @param requesterRole - Nombre del rol del usuario
   * @throws BusinessRuleError si no tiene permisos
   */
  private async validateConfirmationPermissions(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // ADMIN puede confirmar cualquier cita
    if (requesterRole === 'ADMIN') return;

    // Ownership unificado: userId, clientId o stylistId
    const canConfirm = 
      appointment.userId === requesterId ||
      appointment.clientId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canConfirm) {
      throw new BusinessRuleError('You do not have permission to confirm this appointment');
    }
  }

  /**
   * Valida las políticas de tiempo para confirmación
   * @param appointment - Entidad de la cita
   * @throws BusinessRuleError si viola las políticas de tiempo
   */
  private validateConfirmationPolicy(appointment: Appointment): void {
    // Política: Se puede confirmar hasta 1 hora antes de la cita
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    if (appointment.dateTime <= oneHourFromNow) {
      throw new BusinessRuleError(
        'Appointments can only be confirmed at least 1 hour in advance. ' +
        'For last-minute confirmations, please contact customer service.'
      );
    }
  }

  /**
   * Obtiene el estado "CONFIRMED" de la base de datos
   * @returns Estado de confirmación
   * @throws NotFoundError si no existe el estado
   */
  private async getConfirmedStatus() {
    const confirmedStatus = await this.appointmentStatusRepository.findByName(
      AppointmentStatusEnum.CONFIRMED,
    );

    if (!confirmedStatus) {
      throw new NotFoundError('AppointmentStatus', AppointmentStatusEnum.CONFIRMED);
    }

    return confirmedStatus;
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
