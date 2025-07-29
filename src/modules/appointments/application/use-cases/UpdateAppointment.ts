import { Appointment } from '../../domain/entities/Appointment';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
import { ServiceRepository } from '../../../services/domain/repositories/ServiceRepository';
import { StylistRepository } from '../../../services/domain/repositories/StylistRepository';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { UpdateAppointmentDto } from '../dto/request/UpdateAppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';

/**
 * Caso de uso para actualizar una cita existente
 * Maneja la actualización con validaciones de reglas de negocio y detección de conflictos
 */
export class UpdateAppointment {
  constructor(
    private appointmentRepository: AppointmentRepository,
    private appointmentStatusRepository: AppointmentStatusRepository,
    private serviceRepository: ServiceRepository,
    private stylistRepository: StylistRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para actualizar una cita
   * @param appointmentId - ID único de la cita a actualizar
   * @param updateDto - Datos de actualización
   * @param requesterId - ID del usuario que realiza la actualización
   * @returns Promise con el DTO de la cita actualizada
   */
  async execute(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
    requesterId: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, updateDto, requesterId);

    // 2. Buscar la cita existente
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar permisos de actualización
    await this.validateUpdatePermissions(appointment, requesterId);

    // 4. Validar reglas de negocio para actualización
    await this.validateUpdateRules(appointment, updateDto);

    // 5. Crear una copia para comparación
    const originalAppointment = { ...appointment };

    // 6. Aplicar cambios paso a paso con validaciones
    if (updateDto.dateTime) {
      await this.updateDateTime(appointment, updateDto.dateTime);
    }

    if (updateDto.duration !== undefined) {
      this.updateDuration(appointment, updateDto.duration);
    }

    if (updateDto.stylistId !== undefined) {
      await this.updateStylist(appointment, updateDto.stylistId);
    }

    if (updateDto.serviceIds !== undefined) {
      await this.updateServices(appointment, updateDto.serviceIds);
    }

    // 7. Validar conflictos después de todos los cambios
    await this.validateNoConflicts(appointment, appointmentId);

    // 8. Registrar información de auditoría
    this.addUpdateAuditInfo(appointment, updateDto, requesterId, originalAppointment);

    // 9. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 10. Mapear a DTO de respuesta
    return this.mapToAppointmentDto(updatedAppointment);
  }

  /**
   * Valida los datos de entrada para la actualización
   */
  private validateInput(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
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

    // Validar que al menos un campo esté presente para actualizar
    const hasUpdates = updateDto.dateTime || 
                      updateDto.duration !== undefined || 
                      updateDto.stylistId !== undefined || 
                      updateDto.serviceIds !== undefined ||
                      updateDto.notes ||
                      updateDto.reason;

    if (!hasUpdates) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // Validar fecha si se proporciona
    if (updateDto.dateTime) {
      const dateTime = new Date(updateDto.dateTime);
      if (isNaN(dateTime.getTime())) {
        throw new ValidationError('DateTime must be a valid ISO 8601 date');
      }

      if (dateTime <= new Date()) {
        throw new ValidationError('Appointment cannot be rescheduled to the past');
      }

      // No más de 6 meses en el futuro
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      if (dateTime > sixMonthsFromNow) {
        throw new ValidationError('Appointment cannot be scheduled more than 6 months in advance');
      }
    }

    // Validar duración si se proporciona
    if (updateDto.duration !== undefined) {
      if (updateDto.duration <= 0) {
        throw new ValidationError('Duration must be greater than 0');
      }

      if (updateDto.duration < 15) {
        throw new ValidationError('Minimum appointment duration is 15 minutes');
      }

      if (updateDto.duration > 480) {
        throw new ValidationError('Maximum appointment duration is 8 hours');
      }

      if (updateDto.duration % 15 !== 0) {
        throw new ValidationError('Duration must be in 15-minute increments');
      }
    }

    // Validar stylistId si se proporciona
    if (updateDto.stylistId && !uuidRegex.test(updateDto.stylistId)) {
      throw new ValidationError('Stylist ID must be a valid UUID');
    }

    // Validar serviceIds si se proporciona
    if (updateDto.serviceIds) {
      if (!Array.isArray(updateDto.serviceIds) || updateDto.serviceIds.length === 0) {
        throw new ValidationError('Service IDs must be a non-empty array');
      }

      for (const serviceId of updateDto.serviceIds) {
        if (!uuidRegex.test(serviceId)) {
          throw new ValidationError('All service IDs must be valid UUIDs');
        }
      }
    }

    // Validar notas si se proporcionan
    if (updateDto.notes !== undefined) {
      if (updateDto.notes.trim().length === 0) {
        throw new ValidationError('Notes cannot be empty if provided');
      }

      if (updateDto.notes.length > 500) {
        throw new ValidationError('Notes cannot exceed 500 characters');
      }
    }

    // Validar razón si se proporciona
    if (updateDto.reason !== undefined) {
      if (updateDto.reason.trim().length === 0) {
        throw new ValidationError('Reason cannot be empty if provided');
      }

      if (updateDto.reason.length > 300) {
        throw new ValidationError('Reason cannot exceed 300 characters');
      }
    }
  }

  /**
   * Valida que el usuario tenga permisos para actualizar la cita
   */
  private async validateUpdatePermissions(
    appointment: Appointment,
    requesterId: string,
  ): Promise<void> {
    // El usuario puede actualizar si es:
    // 1. El creador de la cita
    // 2. El estilista asignado
    // 3. Un administrador (por implementar)

    const canUpdate = 
      appointment.userId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canUpdate) {
      throw new BusinessRuleError('You do not have permission to update this appointment');
    }
  }

  /**
   * Valida las reglas de negocio para permitir la actualización
   */
  private async validateUpdateRules(
    appointment: Appointment,
    updateDto: UpdateAppointmentDto,
  ): Promise<void> {
    // 1. Verificar que la cita no esté en un estado terminal
    const currentStatus = await this.appointmentStatusRepository.findById(appointment.statusId);
    
    if (currentStatus && ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'Completada', 'Cancelada', 'No Se Presento'].includes(currentStatus.name)) {
      throw new BusinessRuleError('Cannot update appointments in terminal status');
    }

    // 2. Verificar que la cita no haya pasado
    if (appointment.isInPast()) {
      throw new BusinessRuleError('Cannot update appointments that have already occurred');
    }

    // 3. Verificar política de modificación (24 horas antes)
    if (!appointment.canBeModified()) {
      throw new BusinessRuleError(
        'Appointments can only be modified at least 24 hours in advance. ' +
        'For last-minute changes, please contact customer service.'
      );
    }

    // 4. Si está confirmada y se cambia fecha/hora, requerir nota o razón
    if (appointment.isConfirmed() && updateDto.dateTime) {
      if (!updateDto.notes && !updateDto.reason) {
        throw new BusinessRuleError(
          'A note or reason is required when changing the date/time of a confirmed appointment'
        );
      }
    }
  }

  /**
   * Actualiza la fecha y hora de la cita
   */
  private async updateDateTime(appointment: Appointment, newDateTime: string): Promise<void> {
    const dateTime = new Date(newDateTime);
    appointment.reschedule(dateTime);
  }

  /**
   * Actualiza la duración de la cita
   */
  private updateDuration(appointment: Appointment, newDuration: number): void {
    appointment.updateDuration(newDuration);
  }

  /**
   * Actualiza el estilista asignado
   */
  private async updateStylist(appointment: Appointment, newStylistId: string): Promise<void> {
    if (newStylistId) {
      // Verificar que el estilista existe
      const stylist = await this.stylistRepository.findById(newStylistId);
      if (!stylist) {
        throw new NotFoundError('Stylist', newStylistId);
      }
      
      appointment.updateStylist(newStylistId);
    } else {
      // Permitir quitar el estilista (asignarlo a null)
      appointment.stylistId = undefined;
      appointment.updatedAt = new Date();
    }
  }

  /**
   * Actualiza los servicios de la cita
   */
  private async updateServices(appointment: Appointment, newServiceIds: string[]): Promise<void> {
    // Verificar que todos los servicios existen
    for (const serviceId of newServiceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Service', serviceId);
      }
    }

    // Limpiar servicios actuales y agregar nuevos
    appointment.serviceIds = [];
    for (const serviceId of newServiceIds) {
      appointment.addService(serviceId);
    }
  }

  /**
   * Valida que no haya conflictos después de los cambios
   */
  private async validateNoConflicts(appointment: Appointment, appointmentId: string): Promise<void> {
    const conflictingAppointments = await this.appointmentRepository.findConflictingAppointments(
      appointment.dateTime,
      appointment.duration,
      appointment.stylistId,
      appointmentId // Excluir la cita actual
    );

    if (conflictingAppointments.length > 0) {
      throw new ConflictError(
        `The updated appointment conflicts with ${conflictingAppointments.length} existing appointment(s). ` +
        'Please choose a different time or stylist.'
      );
    }
  }

  /**
   * Agrega información de auditoría a la cita
   */
  private addUpdateAuditInfo(
    appointment: Appointment,
    updateDto: UpdateAppointmentDto,
    requesterId: string,
    originalAppointment: any,
  ): void {
    // Información de auditoría para logging
    const updateInfo = {
      updatedBy: requesterId,
      updatedAt: new Date().toISOString(),
      changes: this.calculateChanges(originalAppointment, appointment),
      notes: updateDto.notes,
      reason: updateDto.reason,
      notifyClient: updateDto.notifyClient !== false
    };

    // Log de la información de actualización para auditoría
    console.log('Appointment updated:', {
      appointmentId: appointment.id,
      updateInfo
    });

    // Actualizar fecha de modificación
    appointment.updatedAt = new Date();
  }

  /**
   * Calcula los cambios realizados para auditoría
   */
  private calculateChanges(original: any, updated: Appointment): Record<string, any> {
    const changes: Record<string, any> = {};

    if (original.dateTime.getTime() !== updated.dateTime.getTime()) {
      changes.dateTime = {
        from: original.dateTime.toISOString(),
        to: updated.dateTime.toISOString()
      };
    }

    if (original.duration !== updated.duration) {
      changes.duration = {
        from: original.duration,
        to: updated.duration
      };
    }

    if (original.stylistId !== updated.stylistId) {
      changes.stylistId = {
        from: original.stylistId,
        to: updated.stylistId
      };
    }

    if (JSON.stringify(original.serviceIds) !== JSON.stringify(updated.serviceIds)) {
      changes.serviceIds = {
        from: original.serviceIds,
        to: updated.serviceIds
      };
    }

    return changes;
  }

  /**
   * Mapea una entidad Appointment a su DTO de respuesta
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
