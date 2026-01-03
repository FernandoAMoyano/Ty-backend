/**
 * DTO para marcar una o múltiples notificaciones como leídas
 * @description Contiene los IDs de las notificaciones a marcar como leídas
 */
export interface MarkAsReadDto {
  /**
   * ID de una única notificación a marcar como leída
   * @description Usar cuando se marca una sola notificación
   */
  notificationId?: string;

  /**
   * Array de IDs de notificaciones a marcar como leídas
   * @description Usar cuando se marcan múltiples notificaciones a la vez
   */
  notificationIds?: string[];
}
