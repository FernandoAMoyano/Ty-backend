import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
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
    private appointmentRepository: AppointmentRepository,
    private appointmentStatusRepository: AppointmentStatusRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para confirmar una cita
   * @param appointmentId - ID único de la cita a confirmar
   * @param confirmDto - Datos de confirmación (notas, notificaciones, etc.)
   * @param requesterId - ID del usuario que realiza la confirmación
   * @returns Promise con el DTO de la cita confirmada
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si la cita no existe
   * @throws BusinessRuleError si no se puede confirmar según reglas de negocio
   */
  async execute(
    appointmentId: string,
    confirmDto: ConfirmAppointmentDto,
    requesterId: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, confirmDto, requesterId);

    // 2. Buscar la cita
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar reglas de negocio para confirmación
    await this.validateConfirmationRules(appointment, requesterId);

    // 4. Obtener el estado "CONFIRMED"
    const confirmedStatus = await this.getConfirmedStatus();

    // 5. Verificar transición de estado válida
    await this.validateStatusTransition(appointment, confirmedStatus.id);

    // 6. Confirmar la cita (establece confirmedAt y cambia estado)
    appointment.markAsConfirmed(confirmedStatus.id);

    // 7. Agregar información de confirmación si hay notas
    if (confirmDto.notes) {
      this.addConfirmationNotes(appointment, confirmDto, requesterId);
    }

    // 8. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 9. Mapear a DTO de respuesta
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
  ): Promise<void> {
    // 1. Verificar que la cita no esté ya confirmada
    if (appointment.isConfirmed()) {
      throw new BusinessRuleError('Appointment is already confirmed');
    }

    // 2. Verificar que la cita no esté cancelada
    const currentStatus = await this.appointmentStatusRepository.findById(appointment.statusId);
    if (currentStatus?.name === AppointmentStatusEnum.CANCELLED || currentStatus?.name === 'CANCELLED') {
      throw new BusinessRuleError('Cannot confirm a cancelled appointment');
    }

    // 3. Verificar que la cita no esté completada
    if (currentStatus?.name === AppointmentStatusEnum.COMPLETED || currentStatus?.name === 'COMPLETED') {
      throw new BusinessRuleError('Cannot confirm a completed appointment');
    }

    // 4. Verificar que la cita no haya pasado
    if (appointment.isInPast()) {
      throw new BusinessRuleError('Cannot confirm appointments that have already occurred');
    }

    // 5. Verificar permisos de confirmación
    await this.validateConfirmationPermissions(appointment, requesterId);

    // 6. Verificar política de confirmación (ej: hasta 1 hora antes)
    this.validateConfirmationPolicy(appointment);
  }

  /**
   * Valida que el usuario tenga permisos para confirmar la cita
   * @param appointment - Entidad de la cita
   * @param requesterId - ID del usuario solicitante
   * @throws BusinessRuleError si no tiene permisos
   */
  private async validateConfirmationPermissions(
    appointment: Appointment,
    requesterId: string,
  ): Promise<void> {
    // El usuario puede confirmar si es:
    // 1. El creador de la cita
    // 2. El cliente de la cita (autoconfirmación)
    // 3. El estilista asignado
    // 4. Un administrador (esto se validaría con roles, por ahora simplificamos)

    // Para validar si el requesterId corresponde al clientId, necesitamos verificar
    // que el requesterId sea el userId asociado al cliente
    // Por ahora simplificamos permitiendo al creador y al estilista
    const canConfirm = 
      appointment.userId === requesterId ||
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
    // Intentar con diferentes variaciones del nombre del estado
    let confirmedStatus = await this.appointmentStatusRepository.findByName(AppointmentStatusEnum.CONFIRMED);
    
    if (!confirmedStatus) {
      // Intentar con nombres alternativos comunes
      confirmedStatus = await this.appointmentStatusRepository.findByName('CONFIRMED');
    }
    
    if (!confirmedStatus) {
      confirmedStatus = await this.appointmentStatusRepository.findByName('Confirmada');
    }
    
    if (!confirmedStatus) {
      confirmedStatus = await this.appointmentStatusRepository.findByName('Confirmado');
    }
    
    if (!confirmedStatus) {
      throw new NotFoundError('AppointmentStatus', 'CONFIRMED (tried multiple variations)');
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

    // Verificar transiciones válidas manualmente para mayor compatibilidad
    const validTransitions = this.getValidTransitions(currentStatus.name);
    if (!validTransitions.includes(newStatus.name)) {
      throw new BusinessRuleError(
        `Cannot transition from ${currentStatus.name} to ${newStatus.name}. Valid transitions: ${validTransitions.join(', ')}`
      );
    }
  }

  /**
   * Obtiene las transiciones válidas para un estado dado
   * @param currentStatusName - Nombre del estado actual
   * @returns Array de nombres de estados válidos para transición
   */
  private getValidTransitions(currentStatusName: string): string[] {
    // Mapeo de estados base a sus transiciones permitidas
    const baseTransitions: Record<string, string[]> = {
      // Estados PENDING y sus variaciones pueden transicionar a CONFIRMED o CANCELLED
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'Pendiente': ['CONFIRMED', 'CANCELLED'],
      'Pending': ['CONFIRMED', 'CANCELLED'],
      
      // Estados CONFIRMED y sus variaciones
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      'Confirmada': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      'Confirmado': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      'Confirmed': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
      
      // Estados IN_PROGRESS y sus variaciones
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'En Progreso': ['COMPLETED', 'CANCELLED'],
      'In Progress': ['COMPLETED', 'CANCELLED'],
      
      // Estados terminales (no permiten transiciones)
      'COMPLETED': [],
      'Completada': [],
      'Completado': [],
      'Completed': [],
      'CANCELLED': [],
      'Cancelada': [],
      'Cancelado': [],
      'Cancelled': [],
      'NO_SHOW': [],
      'No Se Presento': [],
      'No Show': [],
    };

    const allowedTransitions = baseTransitions[currentStatusName] || [];
    
    // Expandir las transiciones base para incluir todas las variaciones
    const expandedTransitions: string[] = [];
    
    allowedTransitions.forEach(baseStatus => {
      switch(baseStatus) {
        case 'CONFIRMED':
          expandedTransitions.push('CONFIRMED', 'Confirmada', 'Confirmado', 'Confirmed');
          break;
        case 'CANCELLED':
          expandedTransitions.push('CANCELLED', 'Cancelada', 'Cancelado', 'Cancelled');
          break;
        case 'IN_PROGRESS':
          expandedTransitions.push('IN_PROGRESS', 'En Progreso', 'In Progress');
          break;
        case 'COMPLETED':
          expandedTransitions.push('COMPLETED', 'Completada', 'Completado', 'Completed');
          break;
        case 'NO_SHOW':
          expandedTransitions.push('NO_SHOW', 'No Se Presento', 'No Show');
          break;
        default:
          expandedTransitions.push(baseStatus);
      }
    });

    return [...new Set(expandedTransitions)]; // Eliminar duplicados
  }

  /**
   * Agrega información de confirmación a la cita
   * @param appointment - Entidad de la cita
   * @param confirmDto - DTO con información de confirmación
   * @param requesterId - ID del usuario que confirma
   */
  private addConfirmationNotes(
    appointment: Appointment,
    confirmDto: ConfirmAppointmentDto,
    requesterId: string,
  ): void {
    // En una implementación real, esto podría ser un campo separado
    // o una tabla de historial de confirmaciones
    
    const confirmationInfo = {
      notes: confirmDto.notes,
      confirmedBy: confirmDto.confirmedBy || requesterId,
      confirmedAt: new Date().toISOString(),
      requesterId: requesterId,
      notifyClient: confirmDto.notifyClient !== false
    };

    // Actualizar fecha de modificación para reflejar el cambio
    appointment.updatedAt = new Date();
    
    // Log de la información de confirmación para auditoría
    console.log('Appointment confirmed:', {
      appointmentId: appointment.id,
      confirmationInfo
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
