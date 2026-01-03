/**
 * DTO de respuesta para estado de notificación
 * @description Representa el estado de una notificación en las respuestas de la API
 */
export interface NotificationStatusDto {
  /**
   * ID único del estado
   */
  id: string;

  /**
   * Nombre del estado
   * @example 'PENDING', 'SENT', 'READ', 'FAILED'
   */
  name: string;

  /**
   * Descripción del estado (opcional)
   */
  description?: string;
}
