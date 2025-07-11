import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Stylist {
  constructor(
    public id: string,
    public userId: string,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de estilista con validaciones automáticas
   * @param userId - ID del usuario que será registrado como estilista
   * @returns Nueva instancia de Stylist con ID generado automáticamente
   * @throws ValidationError si el userId no es válido
   */
  static create(userId: string): Stylist {
    return new Stylist(generateUuid(), userId);
  }

  /**
   * Reconstruye una instancia de estilista desde datos de persistencia
   * @param id - ID único del estilista
   * @param userId - ID del usuario asociado
   * @param createdAt - Fecha de creación (opcional)
   * @param updatedAt - Fecha de última actualización (opcional)
   * @returns Instancia de Stylist desde persistencia
   */
  static fromPersistence(id: string, userId: string, createdAt?: Date, updatedAt?: Date): Stylist {
    return new Stylist(id, userId, createdAt, updatedAt);
  }

  /**
   * Ejecuta todas las validaciones de negocio para el estilista
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID cannot be empty');
    }

    if (!this.id || this.id.trim().length === 0) {
      throw new ValidationError('Stylist ID cannot be empty');
    }
  }

  /**
   * Actualiza la información del estilista (actualmente solo actualiza la fecha)
   * Este método existe para mantener consistencia con otras entidades y permitir
   * futuras expansiones de información del estilista
   */
  updateInfo(): void {
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades del estilista
   */
  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
