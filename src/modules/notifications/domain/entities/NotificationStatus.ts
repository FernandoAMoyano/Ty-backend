import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Enumeración de estados posibles para las notificaciones
 * @description Define los estados del ciclo de vida de una notificación
 */
export enum NotificationStatusEnum {
  /** Notificación pendiente de envío */
  PENDING = 'PENDING',
  /** Notificación enviada exitosamente */
  SENT = 'SENT',
  /** Notificación leída por el usuario */
  READ = 'READ',
  /** Error al enviar la notificación */
  FAILED = 'FAILED',
}

/**
 * Entidad de dominio que representa el estado de una notificación
 * @description Maneja el ciclo de vida y las transiciones de estado de las notificaciones
 */
export class NotificationStatus {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de estado de notificación con validaciones automáticas
   * @param name - Nombre del estado (debe ser único y seguir convenciones)
   * @param description - Descripción opcional del estado
   * @returns Nueva instancia de NotificationStatus
   * @throws ValidationError si los datos no son válidos
   */
  static create(name: string, description?: string): NotificationStatus {
    return new NotificationStatus(generateUuid(), name, description);
  }

  /**
   * Reconstruye una instancia de estado desde datos de persistencia
   * @param id - ID único del estado
   * @param name - Nombre del estado
   * @param description - Descripción del estado (opcional)
   * @returns Instancia de NotificationStatus desde persistencia
   */
  static fromPersistence(
    id: string,
    name: string,
    description?: string,
  ): NotificationStatus {
    return new NotificationStatus(id, name, description);
  }

  /**
   * Ejecuta todas las validaciones necesarias para el estado
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('NotificationStatus name cannot be empty');
    }

    if (this.name.length > 50) {
      throw new ValidationError('NotificationStatus name is too long (max 50 characters)');
    }

    if (this.description && this.description.length > 200) {
      throw new ValidationError('NotificationStatus description is too long (max 200 characters)');
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
   * @returns true si es un estado final (READ, FAILED), false en caso contrario
   */
  isTerminalStatus(): boolean {
    return this.name === NotificationStatusEnum.READ || 
           this.name === NotificationStatusEnum.FAILED;
  }

  /**
   * Verifica si es posible hacer una transición desde este estado hacia otro estado específico
   * @param newStatus - Nombre del estado destino
   * @returns true si la transición es válida según las reglas de negocio, false en caso contrario
   */
  canTransitionTo(newStatus: string): boolean {
    const transitions: Record<string, string[]> = {
      [NotificationStatusEnum.PENDING]: [NotificationStatusEnum.SENT, NotificationStatusEnum.FAILED],
      [NotificationStatusEnum.SENT]: [NotificationStatusEnum.READ],
      [NotificationStatusEnum.READ]: [],
      [NotificationStatusEnum.FAILED]: [NotificationStatusEnum.PENDING], // Permitir reintentar
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
