import { AppointmentStatus, AppointmentStatusEnum } from '../../domain/entities/AppointmentStatus';
import { AppointmentStatusRepository } from '../../domain/repositories/AppointmentStatusRepository';
import { AppointmentRepository } from '../../domain/repositories/AppointmentRepository';

// Excepciones
import { ValidationError } from '../../../../shared/exceptions/ValidationError';
import { NotFoundError } from '../../../../shared/exceptions/NotFoundError';
import { ConflictError } from '../../../../shared/exceptions/ConflictError';

export interface AppointmentStatusDto {
  id: string;
  name: string;
  description?: string;
}

export class AppointmentStatusService {
  constructor(
    private appointmentStatusRepository: AppointmentStatusRepository,
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Crea un nuevo status de cita en el sistema
   * @param name - Nombre del status (debe ser único y en mayúsculas con guiones bajos)
   * @param description - Descripción opcional del status
   * @returns Promise con los datos del status creado
   * @throws ValidationError si el nombre no cumple con el formato requerido
   * @throws ConflictError si ya existe un status con ese nombre
   */
  async createAppointmentStatus(name: string, description?: string): Promise<AppointmentStatusDto> {
    // Validaciones
    this.validateStatusName(name);

    // Verificar que el nombre no exista
    const existingStatus = await this.appointmentStatusRepository.existsByName(name);
    if (existingStatus) {
      throw new ConflictError(`AppointmentStatus with name '${name}' already exists`);
    }

    // Crear status
    const status = AppointmentStatus.create(name, description);

    // Guardar
    const savedStatus = await this.appointmentStatusRepository.save(status);

    return this.mapStatusToDto(savedStatus);
  }

  /**
   * Actualiza la información de un status de cita existente
   * @param id - ID único del status a actualizar
   * @param name - Nuevo nombre del status (opcional)
   * @param description - Nueva descripción del status (opcional)
   * @returns Promise con los datos del status actualizado
   * @throws NotFoundError si el status no existe
   * @throws ValidationError si el nuevo nombre no cumple con el formato
   * @throws ConflictError si el nuevo nombre ya está en uso
   */
  async updateAppointmentStatus(
    id: string,
    name?: string,
    description?: string,
  ): Promise<AppointmentStatusDto> {
    // Verificar que el status existe
    const status = await this.appointmentStatusRepository.findById(id);
    if (!status) {
      throw new NotFoundError('AppointmentStatus', id);
    }

    // Validar nuevo nombre si se proporciona
    if (name) {
      this.validateStatusName(name);

      // Verificar nombre único si se está cambiando
      if (name !== status.name) {
        const existingStatus = await this.appointmentStatusRepository.existsByName(name);
        if (existingStatus) {
          throw new ConflictError(`AppointmentStatus with name '${name}' already exists`);
        }
      }
    }

    // Actualizar
    status.updateInfo(
      name ?? status.name,
      description !== undefined ? description : status.description,
    );

    const updatedStatus = await this.appointmentStatusRepository.update(status);

    return this.mapStatusToDto(updatedStatus);
  }

  /**
   * Obtiene un status de cita por su ID único
   * @param id - ID único del status a buscar
   * @returns Promise con los datos del status encontrado
   * @throws NotFoundError si el status no existe
   */
  async getAppointmentStatusById(id: string): Promise<AppointmentStatusDto> {
    const status = await this.appointmentStatusRepository.findById(id);
    if (!status) {
      throw new NotFoundError('AppointmentStatus', id);
    }

    return this.mapStatusToDto(status);
  }

  /**
   * Obtiene un status de cita por su nombre
   * @param name - Nombre del status a buscar
   * @returns Promise con los datos del status encontrado
   * @throws NotFoundError si el status no existe
   */
  async getAppointmentStatusByName(name: string): Promise<AppointmentStatusDto> {
    const status = await this.appointmentStatusRepository.findByName(name);
    if (!status) {
      throw new NotFoundError('AppointmentStatus', name);
    }

    return this.mapStatusToDto(status);
  }

  /**
   * Obtiene todos los status de citas disponibles en el sistema
   * @returns Promise con la lista de todos los status
   */
  async getAllAppointmentStatuses(): Promise<AppointmentStatusDto[]> {
    const statuses = await this.appointmentStatusRepository.findAll();
    return statuses.map((status) => this.mapStatusToDto(status));
  }

  /**
   * Obtiene todos los status que son considerados terminales (estados finales)
   * @returns Promise con la lista de status terminales
   */
  async getTerminalStatuses(): Promise<AppointmentStatusDto[]> {
    const statuses = await this.appointmentStatusRepository.findTerminalStatuses();
    return statuses.map((status) => this.mapStatusToDto(status));
  }

  /**
   * Obtiene todos los status que se consideran activos (no terminales)
   * @returns Promise con la lista de status activos
   */
  async getActiveStatuses(): Promise<AppointmentStatusDto[]> {
    const statuses = await this.appointmentStatusRepository.findActiveStatuses();
    return statuses.map((status) => this.mapStatusToDto(status));
  }

  /**
   * Elimina un status de cita del sistema
   * @param id - ID único del status a eliminar
   * @throws NotFoundError si el status no existe
   * @throws ValidationError si es un status del sistema que no se puede eliminar
   * @throws ConflictError si hay citas activas usando este status
   */
  async deleteAppointmentStatus(id: string): Promise<void> {
    const exists = await this.appointmentStatusRepository.existsById(id);
    if (!exists) {
      throw new NotFoundError('AppointmentStatus', id);
    }

    // Verificar que no es un status del sistema que no se puede eliminar
    const status = await this.appointmentStatusRepository.findById(id);
    if (status && this.isSystemStatus(status.name)) {
      throw new ValidationError(`Cannot delete system status: ${status.name}`);
    }

    // Verificar que no hay citas con este status
    await this.checkIfStatusHasAppointments(id);

    await this.appointmentStatusRepository.delete(id);
  }

  /**
   * Verifica si es posible hacer una transición desde un status hacia otro
   * @param fromStatusId - ID del status origen
   * @param toStatusName - Nombre del status destino
   * @returns Promise<boolean> indicando si la transición es válida
   */
  async canTransitionTo(fromStatusId: string, toStatusName: string): Promise<boolean> {
    const fromStatus = await this.appointmentStatusRepository.findById(fromStatusId);
    if (!fromStatus) {
      return false;
    }

    return fromStatus.canTransitionTo(toStatusName);
  }

  /**
   * Obtiene todos los status válidos hacia los cuales se puede transicionar desde un status dado
   * @param statusId - ID del status actual
   * @returns Promise con la lista de status válidos para transición
   * @throws NotFoundError si el status actual no existe
   */
  async getValidTransitions(statusId: string): Promise<AppointmentStatusDto[]> {
    const currentStatus = await this.appointmentStatusRepository.findById(statusId);
    if (!currentStatus) {
      throw new NotFoundError('AppointmentStatus', statusId);
    }

    const allStatuses = await this.appointmentStatusRepository.findAll();
    const validTransitions = allStatuses.filter((status) =>
      currentStatus.canTransitionTo(status.name),
    );

    return validTransitions.map((status) => this.mapStatusToDto(status));
  }

  /**
   * Inicializa los status del sistema por defecto (PENDING, CONFIRMED, etc.)
   * Solo crea los status que no existan previamente
   */
  async initializeSystemStatuses(): Promise<void> {
    const systemStatuses = [
      //La cita está pendiente de confirmación.
      { name: AppointmentStatusEnum.PENDING, description: 'Appointment is pending confirmation' },
      //La cita ha sido confirmada
      { name: AppointmentStatusEnum.CONFIRMED, description: 'Appointment has been confirmed' },
      {
        name: AppointmentStatusEnum.IN_PROGRESS,
        //La cita está actualmente en proceso
        description: 'Appointment is currently in progress',
      },
      //La cita se ha completado
      { name: AppointmentStatusEnum.COMPLETED, description: 'Appointment has been completed' },
      //La cita ha sido cancelada
      { name: AppointmentStatusEnum.CANCELLED, description: 'Appointment has been cancelled' },
      {
        //La clienta no se presentó a la cita
        name: AppointmentStatusEnum.NO_SHOW,
        description: 'Client did not show up for appointment',
      },
    ];

    for (const statusData of systemStatuses) {
      const exists = await this.appointmentStatusRepository.existsByName(statusData.name);
      if (!exists) {
        const status = AppointmentStatus.create(statusData.name, statusData.description);
        await this.appointmentStatusRepository.save(status);
      }
    }
  }

  // Métodos de validación privados

  /**
   * Valida que el nombre del status cumple con las reglas de negocio
   * @param name - Nombre del status a validar
   * @throws ValidationError si el nombre no es válido
   */
  private validateStatusName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Status name is required');
    }

    if (name.length > 50) {
      throw new ValidationError('Status name is too long (max 50 characters)');
    }

    // Validar que sea un nombre válido (solo letras, números y guiones bajos)
    const validNameRegex = /^[A-Z_][A-Z0-9_]*$/;
    if (!validNameRegex.test(name)) {
      throw new ValidationError(
        'Status name must be uppercase letters, numbers, and underscores only',
      );
    }
  }

  /**
   * Verifica si un status es del sistema y por tanto no se puede eliminar
   * @param name - Nombre del status a verificar
   * @returns true si es un status del sistema, false en caso contrario
   */
  private isSystemStatus(name: string): boolean {
    const systemStatuses = Object.values(AppointmentStatusEnum);
    return systemStatuses.includes(name as AppointmentStatusEnum);
  }

  /**
   * Convierte una entidad AppointmentStatus a su representación DTO
   * @param status - Entidad de dominio a convertir
   * @returns Objeto DTO con los datos del status
   */
  private mapStatusToDto(status: AppointmentStatus): AppointmentStatusDto {
    return {
      id: status.id,
      name: status.name,
      description: status.description,
    };
  }

  /**
   * Verifica si existen citas que están usando el status especificado
   * @param statusId - ID del status a verificar
   * @throws ConflictError si hay citas usando este status
   */
  private async checkIfStatusHasAppointments(statusId: string): Promise<void> {
    const appointmentCount = await this.appointmentRepository.countByStatus(statusId);
    if (appointmentCount > 0) {
      throw new ConflictError(
        `Cannot delete status: ${appointmentCount} appointments are using this status`
      );
    }
  }
}
