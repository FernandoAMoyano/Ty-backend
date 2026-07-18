import { Appointment } from '../../domain/entities/Appointment';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IAppointmentStatusRepository } from '../../domain/repositories/IAppointmentStatusRepository';
import { IServiceRepository } from '../../../services/domain/repositories/IServiceRepository';
import { IStylistServiceRepository } from '../../../services/domain/repositories/IStylistServiceRepository';
import { UserRoleValidationService } from '../../../auth/domain/services/UserRoleValidationService';
import { RoleName } from '@prisma/client';
import { AppointmentDto } from '../dto/response/AppointmentDto';
import { UpdateAppointmentDto } from '../dto/request/UpdateAppointmentDto';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { BusinessRuleError } from '../../../../shared/exceptions/BusinessRuleError';
import { ForbiddenError } from '../../../../shared/exceptions/ForbiddenError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';
import { AppointmentStatusEnum } from '../../domain/entities/AppointmentStatus';
import { assertValidUuid } from '../../../../shared/utils/validateUuid';
import {
  ScheduleAvailabilityService,
  EffectiveSchedule,
} from '../../domain/services/ScheduleAvailabilityService';

/**
 * Caso de uso para actualizar una cita existente
 * Maneja la actualización con validaciones de reglas de negocio y detección de conflictos
 */
export class UpdateAppointment {
  /** Máximo de citas activas por cliente por día (alineado con CreateAppointment) */
  private static readonly MAX_DAILY_APPOINTMENTS = 3;

  constructor(
    private appointmentRepository: IAppointmentRepository,
    private appointmentStatusRepository: IAppointmentStatusRepository,
    private serviceRepository: IServiceRepository,
    private userRoleValidationService: UserRoleValidationService,
    private scheduleAvailabilityService: ScheduleAvailabilityService,
    private stylistServiceRepository: IStylistServiceRepository,
  ) {}

  /**
   * Ejecuta el caso de uso para actualizar una cita
   * @param appointmentId - ID único de la cita a actualizar
   * @param updateDto - Datos de actualización
   * @param requesterId - ID del usuario que realiza la actualización
   * @param requesterRole - Nombre del rol del usuario solicitante
   * @returns Promise con el DTO de la cita actualizada
   */
  async execute(
    appointmentId: string,
    updateDto: UpdateAppointmentDto,
    requesterId: string,
    requesterRole: string,
  ): Promise<AppointmentDto> {
    // 1. Validar datos de entrada
    this.validateInput(appointmentId, updateDto, requesterId);

    // 2. Buscar la cita existente
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundError('Appointment', appointmentId);
    }

    // 3. Validar permisos de actualización
    await this.validateUpdatePermissions(appointment, requesterId, requesterRole);

    // 4. Validar reglas de negocio para actualización
    await this.validateUpdateRules(appointment, updateDto);

    // 5. Aplicar cambios paso a paso con validaciones
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

    // 6. Si cambió la fecha/hora o la duración, revalidar horario efectivo (día cerrado / fuera de horario laboral)
    if (updateDto.dateTime || updateDto.duration !== undefined) {
      await this.validateEffectiveSchedule(appointment);
    }

    // 6b. Si cambió la fecha, revalidar el límite diario de citas activas del cliente sobre la nueva fecha
    if (updateDto.dateTime) {
      await this.validateDailyAppointmentLimit(appointment, appointmentId);
    }

    // 7. Validar conflictos después de todos los cambios
    await this.validateNoConflicts(appointment, appointmentId);

    // 8. Guardar los cambios
    const updatedAppointment = await this.appointmentRepository.update(appointment);

    // 9. Mapear a DTO de respuesta
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
    assertValidUuid(appointmentId, 'Appointment ID');

    // Validar ID del solicitante
    assertValidUuid(requesterId, 'Requester ID');

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
    if (updateDto.stylistId) {
      try {
        assertValidUuid(updateDto.stylistId, 'Stylist ID');
      } catch {
        throw new ValidationError('Stylist ID must be a valid UUID');
      }
    }

    // Validar serviceIds si se proporciona
    if (updateDto.serviceIds) {
      if (!Array.isArray(updateDto.serviceIds) || updateDto.serviceIds.length === 0) {
        throw new ValidationError('Service IDs must be a non-empty array');
      }

      for (const serviceId of updateDto.serviceIds) {
        try {
          assertValidUuid(serviceId, 'Service ID');
        } catch {
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
   * Aplica ownership unificado (userId || clientId || stylistId) con ADMIN override
   */
  private async validateUpdatePermissions(
    appointment: Appointment,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // ADMIN puede actualizar cualquier cita
    if (requesterRole === 'ADMIN') return;

    // Ownership unificado: userId, clientId o stylistId
    const canUpdate = 
      appointment.userId === requesterId ||
      appointment.clientId === requesterId ||
      appointment.stylistId === requesterId;

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this appointment');
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
    const terminalStatuses = [
      AppointmentStatusEnum.COMPLETED,
      AppointmentStatusEnum.CANCELLED,
      AppointmentStatusEnum.NO_SHOW,
    ];

    if (currentStatus && terminalStatuses.includes(currentStatus.name as AppointmentStatusEnum)) {
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
   * @param appointment - La cita a actualizar
   * @param newStylistId - User.id del nuevo estilista
   */
  private async updateStylist(appointment: Appointment, newStylistId: string): Promise<void> {
    if (newStylistId) {
      // newStylistId es User.id; verificar que existe y tiene rol STYLIST
      await this.userRoleValidationService.ensureUserHasRole(newStylistId, RoleName.STYLIST);

      appointment.updateStylist(newStylistId);
    } else {
      // Permitir quitar el estilista (asignarlo a null)
      appointment.stylistId = undefined;
      appointment.updatedAt = new Date();
    }
  }

  /**
   * Actualiza los servicios de la cita
   * Revalida que cada servicio esté activo y, si hay estilista asignado, que lo
   * siga ofreciendo activamente (misma validación que CreateAppointment — APT-29)
   */
  private async updateServices(appointment: Appointment, newServiceIds: string[]): Promise<void> {
    // Verificar que todos los servicios existen y están activos
    for (const serviceId of newServiceIds) {
      const service = await this.serviceRepository.findById(serviceId);
      if (!service) {
        throw new NotFoundError('Service', serviceId);
      }
      if (!service.isActive) {
        throw new BusinessRuleError(`Service '${service.name}' is not currently active`);
      }
    }

    // Verificar que el estilista (final, ya aplicado el posible cambio) ofrezca los servicios seleccionados
    if (appointment.stylistId) {
      for (const serviceId of newServiceIds) {
        const assignment = await this.stylistServiceRepository.findByStylistAndService(
          appointment.stylistId,
          serviceId,
        );
        if (!assignment) {
          throw new BusinessRuleError('Stylist does not offer one of the selected services');
        }
        if (!assignment.isOffering) {
          throw new BusinessRuleError('Stylist is not currently offering one of the selected services');
        }
      }
    }

    // Limpiar servicios actuales y agregar nuevos
    appointment.serviceIds = [];
    for (const serviceId of newServiceIds) {
      appointment.addService(serviceId);
    }
  }

  /**
   * Revalida que la cita (con la fecha/duración ya aplicadas) siga dentro del
   * horario efectivo del día (prioridad Exception > Holiday > Regular),
   * reusando ScheduleAvailabilityService.getEffectiveSchedule (APT-39)
   */
  private async validateEffectiveSchedule(appointment: Appointment): Promise<void> {
    const effectiveSchedule = await this.scheduleAvailabilityService.getEffectiveSchedule(
      appointment.dateTime,
    );

    if (!effectiveSchedule) {
      throw new BusinessRuleError(
        'The salon is closed on the selected date (holiday or no schedule available)',
      );
    }

    this.validateWorkingHours(appointment.dateTime, appointment.duration, effectiveSchedule);
  }

  /**
   * Valida que la cita completa (inicio + duración) esté dentro del horario laboral del día
   * Equivalente a CreateAppointment.validateWorkingHours
   */
  private validateWorkingHours(
    dateTime: Date,
    duration: number,
    schedule: EffectiveSchedule,
  ): void {
    const appointmentHours = dateTime.getUTCHours();
    const appointmentMinutes = dateTime.getUTCMinutes();

    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const appointmentStartInMinutes = appointmentHours * 60 + appointmentMinutes;
    const appointmentEndInMinutes = appointmentStartInMinutes + duration;
    const scheduleStartInMinutes = startH * 60 + startM;
    const scheduleEndInMinutes = endH * 60 + endM;

    if (appointmentStartInMinutes < scheduleStartInMinutes) {
      throw new BusinessRuleError(
        `Appointment starts before working hours (${schedule.startTime})`,
      );
    }

    if (appointmentEndInMinutes > scheduleEndInMinutes) {
      throw new BusinessRuleError(
        `Appointment ends after working hours (${schedule.endTime})`,
      );
    }
  }

  /**
   * Revalida que el cliente no exceda el límite diario de citas activas en la
   * nueva fecha, excluyendo la propia cita que se está reprogramando (APT-39)
   */
  private async validateDailyAppointmentLimit(
    appointment: Appointment,
    appointmentId: string,
  ): Promise<void> {
    const appointmentDate = appointment.dateTime;

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentRepository.findByClientAndDateRange(
      appointment.clientId,
      startOfDay,
      endOfDay,
    );

    const cancelledStatus = await this.appointmentStatusRepository.findByName('CANCELLED');

    const activeAppointments = existingAppointments.filter((a) => {
      if (a.id === appointmentId) return false; // excluir la propia cita
      if (cancelledStatus && a.statusId === cancelledStatus.id) return false;
      return true;
    });

    if (activeAppointments.length >= UpdateAppointment.MAX_DAILY_APPOINTMENTS) {
      throw new BusinessRuleError(
        `Maximum of ${UpdateAppointment.MAX_DAILY_APPOINTMENTS} appointments per day has been reached`,
      );
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
   * Mapea una entidad Appointment a su DTO de respuesta
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
