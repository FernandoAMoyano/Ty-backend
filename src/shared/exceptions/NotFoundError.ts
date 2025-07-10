import { AppError } from './AppError';

/**
 * Excepción para errores cuando un recurso solicitado no puede
 * ser encontrado Se utiliza cuando se busca una entidad
 * por ID, nombre u otro identificador y no existe Mapea
 * al código de estado HTTP 404 (Not Found)
 */

/**
 * Crea una nueva instancia de error de recurso no encontrado
 * @param resource - Nombre del tipo de recurso que no se encontró (ej: 'User', 'Appointment', 'Service')
 * @param identifier - Identificador específico que se buscó (ID, nombre, email, etc.)
 * @example
 * // Uso típico para entidades no encontradas
 * throw new NotFoundError('User', userId)
 * // Resultado: "User not found: 123e4567-e89b-12d3-a456-426614174000"
 *
 * // Uso para búsquedas por nombre
 * throw new NotFoundError('AppointmentStatus', 'PENDING')
 * // Resultado: "AppointmentStatus not found: PENDING"
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 404, 'NOT_FOUND');
  }
}
