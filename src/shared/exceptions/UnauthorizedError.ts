import { AppError } from './AppError';

/**
 * Excepción para errores de autenticación cuando las credenciales
 * son inválidas o faltan. Se utiliza cuando el usuario no está
 * autenticado o sus credenciales son incorrectas
 * Mapea al código de estado HTTP 401 (Unauthorized)
 */

export class UnauthorizedError extends AppError {
  /**
   * Crea una nueva instancia de error de autenticación
   * @param message - Mensaje descriptivo del error de autenticación (por defecto 'Unauthorized')
   * @example
   * // Uso típico para credenciales inválidas
   * throw new UnauthorizedError('Invalid email or password')
   *
   * // Uso para tokens expirados
   * throw new UnauthorizedError('Token has expired, please login again')
   *
   * // Uso para falta de autenticación
   * throw new UnauthorizedError('Authentication required to access this resource')
   */
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
