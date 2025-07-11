import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Category {
  constructor(
    public id: string,
    public name: string,
    public description?: string,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de categoría con validaciones automáticas
   * @param name - Nombre de la categoría (máximo 100 caracteres)
   * @param description - Descripción opcional de la categoría (máximo 500 caracteres)
   * @returns Nueva instancia de Category con ID generado automáticamente
   * @throws ValidationError si los datos no son válidos
   */
  static create(name: string, description?: string): Category {
    return new Category(generateUuid(), name, description);
  }

  /**
   * Reconstruye una instancia de categoría desde datos de persistencia
   * @param id - ID único de la categoría
   * @param name - Nombre de la categoría
   * @param description - Descripción de la categoría (opcional)
   * @param isActive - Estado activo/inactivo (por defecto true)
   * @param createdAt - Fecha de creación (opcional)
   * @param updatedAt - Fecha de última actualización (opcional)
   * @returns Instancia de Category desde persistencia
   */
  static fromPersistence(
    id: string,
    name: string,
    description?: string,
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): Category {
    return new Category(id, name, description, isActive, createdAt, updatedAt);
  }

  /**
   * Ejecuta todas las validaciones de negocio para la categoría
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Category name cannot be empty');
    }

    if (this.name.length > 100) {
      throw new ValidationError('Category name is too long');
    }

    if (this.description && this.description.length > 500) {
      throw new ValidationError('Category description is too long');
    }
  }

  /**
   * Actualiza la información básica de la categoría
   * @param name - Nuevo nombre de la categoría
   * @param description - Nueva descripción de la categoría (opcional)
   * @throws ValidationError si los nuevos datos no son válidos
   */
  updateInfo(name: string, description?: string): void {
    this.name = name.trim();
    this.description = description?.trim();
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Activa la categoría para que sea visible y utilizable
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Desactiva la categoría sin eliminarla del sistema
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades de la categoría
   */
  toPersistence() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
