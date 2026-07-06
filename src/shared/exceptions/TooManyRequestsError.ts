import { AppError } from './AppError';

/**
 * Excepción para cuando un cliente supera el límite de requests permitidos
 * en una ventana de tiempo determinada (rate limiting)
 * Se utiliza en endpoints protegidos contra fuerza bruta o spam
 * (ej. login, registro, refresh de tokens)
 * Mapea al código de estado HTTP 429 (Too Many Requests)
 */
export class TooManyRequestsError extends AppError {
  /**
   * Crea una nueva instancia de error de límite de requests excedido
   * @param message - Mensaje descriptivo del límite excedido
   * @example
   * // Uso típico para brute-force protection en login
   * throw new TooManyRequestsError('Too many login attempts, please try again later')
   */
  constructor(message: string) {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}
