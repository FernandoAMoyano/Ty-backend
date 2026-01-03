import { NotificationTypeEnum } from '../../../domain/entities/Notification';

/**
 * DTO para filtrar notificaciones en consultas
 * @description Permite filtrar notificaciones por varios criterios
 */
export interface GetNotificationsFilterDto {
  /**
   * ID del usuario para filtrar notificaciones
   */
  userId?: string;

  /**
   * Filtrar por tipo de notificación
   */
  type?: NotificationTypeEnum;

  /**
   * Filtrar solo notificaciones no leídas
   */
  unreadOnly?: boolean;

  /**
   * Número de página para paginación (1-indexed)
   * @default 1
   */
  page?: number;

  /**
   * Cantidad de elementos por página
   * @default 20
   */
  limit?: number;
}
