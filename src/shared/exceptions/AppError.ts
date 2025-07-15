/**
 * Clase base para todas las excepciones personalizadas de la aplicación
 * Extiende la clase Error nativa de JavaScript agregando información específica para APIs REST
 */

export class AppError extends Error {
  /**
   * Crea una nueva instancia de error de aplicación
   * @param message - Mensaje descriptivo del error para mostrar al usuario
   * @param statusCode - Código de estado HTTP asociado al error (por defecto 500)
   * @param code - Código interno del error para identificación programática (opcional)
   */
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
