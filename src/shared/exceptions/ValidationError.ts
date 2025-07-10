import { AppError } from './AppError';

/**
 * Excepción para errores de validación cuando los datos
 * de entrada no cumplen con los requisitos
 * Se utiliza para validaciones de formato, rangos,
 * campos requeridos y reglas de negocio
 * Mapea al código de estado HTTP 400 (Bad Request)
 */

/**
 * Crea una nueva instancia de error de validación
 * @param message - Mensaje descriptivo específico de la validación que falló
 * @example
 * Uso típico para campos requeridos
 * throw new ValidationError('Email is required')
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
