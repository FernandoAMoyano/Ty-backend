import { AppError } from './AppError';

/**
 * Excepción para errores de acceso prohibido cuando el usuario
 * está autenticado pero no tiene permisos
 * Se utiliza cuando el usuario tiene credenciales válidas
 * pero no está autorizado para realizar la acción
 * Mapea al código de estado HTTP 403 (Forbidden)
 */

/**
 * Crea una nueva instancia de error de acceso prohibido
 * @param message - Mensaje descriptivo del acceso denegado (por defecto 'Forbidden')
 * @example
 * // Uso típico para permisos insuficientes
 * throw new ForbiddenError('You do not have permission to delete this resource')
 *
 * // Uso para acceso a recursos de otros usuarios
 * throw new ForbiddenError('You can only access your own appointments')
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}
