import { AppError } from './AppError';

/**
 * Excepción para errores de conflicto cuando una operación no puede
 *  completarse debido a conflictos con el estado actual
 * Se utiliza para situaciones como recursos duplicados,
 * violaciones de unicidad o estados incompatibles
 * Mapea al código de estado HTTP 409 (Conflict)
 */

/**
 * Crea una nueva instancia de error de conflicto
 * @param message - Mensaje descriptivo del conflicto específico que ocurrió
 * @example
 * // Uso típico para recursos duplicados
 * throw new ConflictError('A user with this email already exists')
 *
 * // Uso para estados incompatibles
 * throw new ConflictError('Cannot delete status: 5 appointments are using this status')
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
