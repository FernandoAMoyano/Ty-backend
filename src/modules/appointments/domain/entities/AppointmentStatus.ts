import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Enumeración de estados posibles para las citas
 */
export enum AppointmentStatusEnum {
  /** Cita pendiente de confirmación */
  PENDING = 'PENDING',
  /** Cita confirmada */
  CONFIRMED = 'CONFIRMED',
  /** Cita en progreso */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Cita completada exitosamente */
  COMPLETED = 'COMPLETED',
  /** Cita cancelada */
  CANCELLED = 'CANCELLED',
  /** Cliente no se presentó a la cita */
  NO_SHOW = 'NO_SHOW'
}

export class AppointmentStatus {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de estado de cita con validaciones automáticas
   * @param name - Nombre del estado (debe ser único y seguir convenciones)
   * @param description - Descripción opcional del estado
   * @returns Nueva instancia de AppointmentStatus
   * @throws ValidationError si los datos no son válidos
   */
  static create(name: string, description?: string): AppointmentStatus {
    return new AppointmentStatus(generateUuid(), name, description);
  }

  /**
   * Reconstruye una instancia de estado desde datos de persistencia
   * @param id - ID único del estado
   * @param name - Nombre del estado
   * @param description - Descripción del estado (opcional)
   * @returns Instancia de AppointmentStatus desde persistencia
   */
  static fromPersistence(
    id: string,
    name: string,
    description?: string,
  ): AppointmentStatus {
    return new AppointmentStatus(id, name, description);
  }

  /**
   * Ejecuta todas las validaciones necesarias para el estado
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('AppointmentStatus name cannot be empty');
    }

    if (this.name.length > 50) {
      throw new ValidationError('AppointmentStatus name is too long (max 50 characters)');
    }

    if (this.description && this.description.length > 200) {
      throw new ValidationError('AppointmentStatus description is too long (max 200 characters)');
    }
  }

  /**
   * Actualiza la información del estado con validaciones
   * @param name - Nuevo nombre del estado
   * @param description - Nueva descripción del estado (opcional)
   * @throws ValidationError si los nuevos datos no son válidos
   */
  updateInfo(name: string, description?: string): void {
    this.name = name.trim();
    this.description = description?.trim();
    this.validate();
  }

  /**
   * Verifica si este estado es terminal (no permite más transiciones)
   * @returns true si es un estado final (COMPLETED, CANCELLED, NO_SHOW), false en caso contrario
   */
  isTerminalStatus(): boolean {
    return this.name === AppointmentStatusEnum.COMPLETED || 
           this.name === AppointmentStatusEnum.CANCELLED || 
           this.name === AppointmentStatusEnum.NO_SHOW;
  }

  /**
   * Verifica si es posible hacer una transición desde este estado hacia otro estado específico
   * @param newStatus - Nombre del estado destino
   * @returns true si la transición es válida según las reglas de negocio, false en caso contrario
   */
  canTransitionTo(newStatus: string): boolean {
    const transitions: Record<string, string[]> = {
      [AppointmentStatusEnum.PENDING]: [AppointmentStatusEnum.CONFIRMED, AppointmentStatusEnum.CANCELLED],
      [AppointmentStatusEnum.CONFIRMED]: [AppointmentStatusEnum.IN_PROGRESS, AppointmentStatusEnum.CANCELLED, AppointmentStatusEnum.NO_SHOW],
      [AppointmentStatusEnum.IN_PROGRESS]: [AppointmentStatusEnum.COMPLETED, AppointmentStatusEnum.CANCELLED],
      [AppointmentStatusEnum.COMPLETED]: [],
      [AppointmentStatusEnum.CANCELLED]: [],
      [AppointmentStatusEnum.NO_SHOW]: []
    };

    return transitions[this.name]?.includes(newStatus) || false;
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades del estado
   */
  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
    };
  }
}
