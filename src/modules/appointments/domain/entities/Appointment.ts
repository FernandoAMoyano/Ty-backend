import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Appointment {
  constructor(
    public id: string,
    public dateTime: Date,
    public duration: number, // en minutos
    public userId: string,
    public clientId: string,
    public scheduleId: string,
    public statusId: string,
    public stylistId?: string,
    public confirmedAt?: Date,
    public serviceIds: string[] = [],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de cita con validaciones automáticas
   * @param dateTime - Fecha y hora de la cita
   * @param duration - Duración en minutos (mínimo 15, múltiplo de 15)
   * @param userId - ID del usuario que crea la cita
   * @param clientId - ID del cliente para la cita
   * @param scheduleId - ID del horario asociado
   * @param statusId - ID del estado inicial de la cita
   * @param stylistId - ID del estilista asignado (opcional)
   * @param serviceIds - Lista de IDs de servicios incluidos
   * @returns Nueva instancia de Appointment
   * @throws ValidationError si algún dato es inválido
   */
  static create(
    dateTime: Date,
    duration: number,
    userId: string,
    clientId: string,
    scheduleId: string,
    statusId: string,
    stylistId?: string,
    serviceIds: string[] = [],
  ): Appointment {
    return new Appointment(
      generateUuid(),
      dateTime,
      duration,
      userId,
      clientId,
      scheduleId,
      statusId,
      stylistId,
      undefined,
      serviceIds,
    );
  }

  /**
   * Reconstruye una instancia de cita desde datos de persistencia
   * @param id - ID único de la cita
   * @param dateTime - Fecha y hora de la cita
   * @param duration - Duración en minutos
   * @param userId - ID del usuario creador
   * @param clientId - ID del cliente
   * @param scheduleId - ID del horario
   * @param statusId - ID del estado actual
   * @param stylistId - ID del estilista (opcional)
   * @param confirmedAt - Fecha de confirmación (opcional)
   * @param serviceIds - Lista de servicios
   * @param createdAt - Fecha de creación (opcional)
   * @param updatedAt - Fecha de última actualización (opcional)
   * @returns Instancia de Appointment desde persistencia
   */
  static fromPersistence(
    id: string,
    dateTime: Date,
    duration: number,
    userId: string,
    clientId: string,
    scheduleId: string,
    statusId: string,
    stylistId?: string,
    confirmedAt?: Date,
    serviceIds: string[] = [],
    createdAt?: Date,
    updatedAt?: Date,
  ): Appointment {
    return new Appointment(
      id,
      dateTime,
      duration,
      userId,
      clientId,
      scheduleId,
      statusId,
      stylistId,
      confirmedAt,
      serviceIds,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Ejecuta todas las validaciones necesarias para la cita
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    this.validateDateTime();
    this.validateDuration();
    this.validateRequiredFields();
  }

  /**
   * Valida que la fecha y hora de la cita sean válidas
   * @throws ValidationError si la fecha es inválida o está en el pasado
   */
  private validateDateTime(): void {
    if (!this.dateTime) {
      throw new ValidationError('Appointment date and time is required');
    }

    if (this.dateTime < new Date()) {
      throw new ValidationError('Appointment cannot be scheduled in the past');
    }
  }

  /**
   * Valida que la duración cumpla con las reglas de negocio
   * @throws ValidationError si la duración es inválida
   */
  private validateDuration(): void {
    if (!this.duration || this.duration <= 0) {
      throw new ValidationError('Duration must be greater than 0');
    }

    if (this.duration < 15) {
      throw new ValidationError('Minimum appointment duration is 15 minutes');
    }

    if (this.duration > 480) {
      // 8 horas
      throw new ValidationError('Maximum appointment duration is 8 hours');
    }

    if (this.duration % 15 !== 0) {
      throw new ValidationError('Duration must be in 15-minute increments');
    }
  }

  /**
   * Valida que todos los campos requeridos estén presentes
   * @throws ValidationError si algún campo requerido falta
   */
  private validateRequiredFields(): void {
    const requiredFields = [
      { field: this.userId, name: 'userId' },
      { field: this.clientId, name: 'clientId' },
      { field: this.scheduleId, name: 'scheduleId' },
      { field: this.statusId, name: 'statusId' },
    ];

    for (const { field, name } of requiredFields) {
      if (!field || field.trim().length === 0) {
        throw new ValidationError(`${name} is required`);
      }
    }
  }

  // Métodos lógicos de negocios

  /**
   * Confirma la cita estableciendo la fecha de confirmación
   * @throws ValidationError si la cita ya está confirmada
   */
  confirm(): void {
    if (this.confirmedAt) {
      throw new ValidationError('Appointment is already confirmed');
    }
    this.confirmedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reprograma la cita a una nueva fecha y hora, opcionalmente cambiando la duración
   * @param newDateTime - Nueva fecha y hora para la cita
   * @param newDuration - Nueva duración en minutos (opcional)
   * @throws ValidationError si la nueva fecha está en el pasado o los datos son inválidos
   */
  reschedule(newDateTime: Date, newDuration?: number): void {
    if (newDateTime < new Date()) {
      throw new ValidationError('Cannot reschedule to a past date');
    }

    this.dateTime = newDateTime;
    if (newDuration) {
      this.duration = newDuration;
    }
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Agrega un servicio a la lista de servicios de la cita
   * @param serviceId - ID del servicio a agregar
   * @throws ValidationError si el servicio ya está agregado o el ID es inválido
   */
  addService(serviceId: string): void {
    if (!serviceId || serviceId.trim().length === 0) {
      throw new ValidationError('Service ID is required');
    }

    if (this.serviceIds.includes(serviceId)) {
      throw new ValidationError('Service is already added to this appointment');
    }

    this.serviceIds.push(serviceId);
    this.updatedAt = new Date();
  }

  /**
   * Remueve un servicio de la lista de servicios de la cita
   * @param serviceId - ID del servicio a remover
   * @throws ValidationError si el servicio no está en la cita
   */
  removeService(serviceId: string): void {
    const index = this.serviceIds.indexOf(serviceId);
    if (index === -1) {
      throw new ValidationError('Service not found in this appointment');
    }

    this.serviceIds.splice(index, 1);
    this.updatedAt = new Date();
  }

  /**
   * Actualiza el estilista asignado a la cita
   * @param stylistId - ID del nuevo estilista
   * @throws ValidationError si el ID del estilista es inválido
   */
  updateStylist(stylistId: string): void {
    if (!stylistId || stylistId.trim().length === 0) {
      throw new ValidationError('Stylist ID is required');
    }

    this.stylistId = stylistId;
    this.updatedAt = new Date();
  }

  /**
   * Actualiza la duración de la cita
   * @param newDuration - Nueva duración en minutos
   * @throws ValidationError si la nueva duración no cumple las reglas de negocio
   */
  updateDuration(newDuration: number): void {
    this.duration = newDuration;
    this.updatedAt = new Date();
    this.validateDuration();
  }

  // Métodos de consulta

  /**
   * Verifica si la cita está confirmada
   * @returns true si la cita tiene fecha de confirmación, false en caso contrario
   */
  isConfirmed(): boolean {
    return this.confirmedAt !== undefined;
  }

  /**
   * Calcula la fecha y hora de finalización de la cita
   * @returns Fecha y hora cuando termina la cita
   */
  getEndTime(): Date {
    return new Date(this.dateTime.getTime() + this.duration * 60000);
  }

  /**
   * Verifica si la cita está programada en el pasado
   * @returns true si la fecha de la cita ya pasó, false en caso contrario
   */
  isInPast(): boolean {
    return this.dateTime < new Date();
  }

  /**
   * Verifica si esta cita tiene conflicto de horario con otra cita
   * @param otherAppointment - Otra cita a comparar
   * @returns true si hay conflicto de horario, false en caso contrario
   */
  hasConflictWith(otherAppointment: Appointment): boolean {
    const thisStart = this.dateTime.getTime();
    const thisEnd = this.getEndTime().getTime();
    const otherStart = otherAppointment.dateTime.getTime();
    const otherEnd = otherAppointment.getEndTime().getTime();

    return !(thisEnd <= otherStart || thisStart >= otherEnd);
  }

  /**
   * Verifica si la cita puede ser modificada (debe ser al menos 24 horas en el futuro)
   * @returns true si se puede modificar, false en caso contrario
   */
  canBeModified(): boolean {
    // Se puede modificar si son al menos 24 horas en el futuro
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

    return this.dateTime > twentyFourHoursFromNow;
  }

  // Métodos de gestión de estado

  /**
   * Cambia el estado de la cita a un nuevo estado específico
   * @param newStatusId - ID del nuevo estado para la cita
   * @throws ValidationError si el ID del estado no es válido
   */
  changeStatus(newStatusId: string): void {
    this.validateStatusId(newStatusId);
    this.statusId = newStatusId;
    this.updatedAt = new Date();
  }

  // Métodos de transición específicos

  /**
   * Marca la cita como confirmada, estableciendo la fecha de confirmación y cambiando el estado
   * @param confirmedStatusId - ID del estado "confirmado"
   * @throws ValidationError si la cita ya está confirmada
   */
  markAsConfirmed(confirmedStatusId: string): void {
    this.confirm();
    this.changeStatus(confirmedStatusId);
  }

  /**
   * Marca la cita como cancelada cambiando su estado
   * @param cancelledStatusId - ID del estado "cancelado"
   */
  markAsCancelled(cancelledStatusId: string): void {
    this.changeStatus(cancelledStatusId);
  }

  /**
   * Marca la cita como completada cambiando su estado
   * @param completedStatusId - ID del estado "completado"
   */
  markAsCompleted(completedStatusId: string): void {
    this.changeStatus(completedStatusId);
  }

  /**
   * Marca la cita como en progreso cambiando su estado
   * @param inProgressStatusId - ID del estado "en progreso"
   */
  markAsInProgress(inProgressStatusId: string): void {
    this.changeStatus(inProgressStatusId);
  }

  /**
   * Marca la cita como no show (cliente no se presentó) cambiando su estado
   * @param noShowStatusId - ID del estado "no show"
   */
  markAsNoShow(noShowStatusId: string): void {
    this.changeStatus(noShowStatusId);
  }

  /**
   * Valida que el ID del estado sea válido y no esté vacío
   * @param statusId - ID del estado a validar
   * @throws ValidationError si el ID del estado es inválido o vacío
   */
  private validateStatusId(statusId: string): void {
    if (!statusId || statusId.trim().length === 0) {
      throw new ValidationError('Status ID is required');
    }
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades de la cita
   */
  toPersistence() {
    return {
      id: this.id,
      dateTime: this.dateTime,
      duration: this.duration,
      userId: this.userId,
      clientId: this.clientId,
      scheduleId: this.scheduleId,
      statusId: this.statusId,
      stylistId: this.stylistId,
      confirmedAt: this.confirmedAt,
      serviceIds: this.serviceIds,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
