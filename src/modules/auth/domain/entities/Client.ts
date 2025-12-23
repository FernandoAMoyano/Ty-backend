import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Entidad de dominio que representa un cliente del sistema
 * Un cliente es un usuario que puede agendar citas en el salón
 */
export class Client {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public preferences: string | null = null,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de cliente con validaciones automáticas
   * @param userId - ID del usuario que será registrado como cliente
   * @param preferences - Preferencias opcionales del cliente
   * @returns Nueva instancia de Client con ID generado automáticamente
   * @throws ValidationError si el userId no es válido
   */
  static create(userId: string, preferences: string | null = null): Client {
    return new Client(generateUuid(), userId, preferences);
  }

  /**
   * Reconstruye una instancia de cliente desde datos de persistencia
   * @param id - ID único del cliente
   * @param userId - ID del usuario asociado
   * @param preferences - Preferencias del cliente
   * @param createdAt - Fecha de creación
   * @param updatedAt - Fecha de última actualización
   * @returns Instancia de Client desde persistencia
   */
  static fromPersistence(
    id: string,
    userId: string,
    preferences: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): Client {
    const client = new Client(id, userId, preferences, createdAt, updatedAt);
    return client;
  }

  /**
   * Ejecuta todas las validaciones de negocio para el cliente
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }

    if (!this.id || this.id.trim().length === 0) {
      throw new ValidationError('Client ID cannot be empty');
    }
  }

  /**
   * Actualiza las preferencias del cliente
   * @param preferences - Nuevas preferencias del cliente
   */
  updatePreferences(preferences: string | null): void {
    this.preferences = preferences;
    this.updatedAt = new Date();
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades del cliente
   */
  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
