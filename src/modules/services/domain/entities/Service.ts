import { generateUuid } from '../../../../shared/utils/uuid';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

export class Service {
  constructor(
    public id: string,
    public categoryId: string,
    public name: string,
    public description: string,
    public duration: number,
    public durationVariation: number,
    public price: number,
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  /**
   * Crea una nueva instancia de servicio con validaciones automáticas
   * @param categoryId - ID de la categoría a la que pertenece el servicio
   * @param name - Nombre del servicio (máximo 150 caracteres)
   * @param description - Descripción del servicio (requerida, máximo 1000 caracteres)
   * @param duration - Duración base en minutos (positivo, máximo 600 minutos)
   * @param durationVariation - Variación de duración permitida en minutos
   * @param price - Precio del servicio (no puede ser negativo)
   * @returns Nueva instancia de Service con ID generado automáticamente
   * @throws ValidationError si los datos no son válidos
   */
  static create(
    categoryId: string,
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
  ): Service {
    return new Service(
      generateUuid(),
      categoryId,
      name,
      description,
      duration,
      durationVariation,
      price,
    );
  }

  /**
   * Reconstruye una instancia de servicio desde datos de persistencia
   * @param id - ID único del servicio
   * @param categoryId - ID de la categoría
   * @param name - Nombre del servicio
   * @param description - Descripción del servicio
   * @param duration - Duración en minutos
   * @param durationVariation - Variación de duración
   * @param price - Precio del servicio
   * @param isActive - Estado activo/inactivo (por defecto true)
   * @param createdAt - Fecha de creación (opcional)
   * @param updatedAt - Fecha de última actualización (opcional)
   * @returns Instancia de Service desde persistencia
   */
  static fromPersistence(
    id: string,
    categoryId: string,
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
    isActive?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
  ): Service {
    return new Service(
      id,
      categoryId,
      name,
      description,
      duration,
      durationVariation,
      price,
      isActive,
      createdAt,
      updatedAt,
    );
  }

  /**
   * Ejecuta todas las validaciones de negocio para el servicio
   * @throws ValidationError si alguna validación falla
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Service name cannot be empty');
    }

    if (this.name.length > 150) {
      throw new ValidationError('Service name is too long');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new ValidationError('Service description cannot be empty');
    }

    if (this.description.length > 1000) {
      throw new ValidationError('Service description is too long');
    }

    if (this.duration <= 0) {
      throw new ValidationError('Service duration must be positive');
    }

    if (this.duration > 600) {
      // 10 horas máximo
      throw new ValidationError('Service duration is too long (max 10 hours)');
    }

    if (this.durationVariation < 0) {
      throw new ValidationError('Duration variation cannot be negative');
    }

    if (this.durationVariation > this.duration) {
      throw new ValidationError('Duration variation cannot exceed base duration');
    }

    if (this.price < 0) {
      throw new ValidationError('Service price cannot be negative');
    }

    if (!this.categoryId || this.categoryId.trim().length === 0) {
      throw new ValidationError('Service must have a category');
    }
  }

  /**
   * Actualiza los detalles principales del servicio
   * @param name - Nuevo nombre del servicio
   * @param description - Nueva descripción del servicio
   * @param duration - Nueva duración en minutos
   * @param durationVariation - Nueva variación de duración
   * @param price - Nuevo precio del servicio
   * @throws ValidationError si los nuevos datos no son válidos
   */
  updateDetails(
    name: string,
    description: string,
    duration: number,
    durationVariation: number,
    price: number,
  ): void {
    this.name = name.trim();
    this.description = description.trim();
    this.duration = duration;
    this.durationVariation = durationVariation;
    this.price = price;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Cambia el servicio a una categoría diferente
   * @param categoryId - ID de la nueva categoría
   * @throws ValidationError si el ID de categoría no es válido
   */
  updateCategory(categoryId: string): void {
    this.categoryId = categoryId;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Activa el servicio para que sea visible y reservable
   */
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Desactiva el servicio sin eliminarlo del sistema
   */
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Calcula la duración mínima del servicio considerando la variación
   * @returns Duración mínima en minutos (nunca menor a 0)
   */
  calculateMinDuration(): number {
    return Math.max(0, this.duration - this.durationVariation);
  }

  /**
   * Calcula la duración máxima del servicio considerando la variación
   * @returns Duración máxima en minutos
   */
  calculateMaxDuration(): number {
    return this.duration + this.durationVariation;
  }

  /**
   * Formatea el precio del servicio para mostrar en la interfaz
   * @returns Precio formateado como string con dos decimales
   */
  getFormattedPrice(): string {
    return (this.price / 100).toFixed(2);
  }

  /**
   * Convierte la entidad a formato de persistencia para guardar en base de datos
   * @returns Objeto plano con todas las propiedades del servicio
   */
  toPersistence() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      name: this.name,
      description: this.description,
      duration: this.duration,
      durationVariation: this.durationVariation,
      price: this.price,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
