import { NotificationStatusDto } from './NotificationStatusDto';

/**
 * DTO de respuesta para una notificación
 * @description Representa una notificación en las respuestas de la API
 */
export interface NotificationDto {
  /**
   * ID único de la notificación
   */
  id: string;

  /**
   * Tipo de notificación
   * @example 'APPOINTMENT_CONFIRMATION', 'APPOINTMENT_REMINDER', 'PROMOTIONAL'
   */
  type: string;

  /**
   * Mensaje de la notificación
   */
  message: string;

  /**
   * ID del usuario destinatario
   */
  userId: string;

  /**
   * ID del estado de la notificación
   */
  statusId: string;

  /**
   * Información del estado (cuando se incluye en la respuesta)
   */
  status?: NotificationStatusDto;

  /**
   * Fecha y hora de envío de la notificación (ISO 8601)
   * @example '2024-01-15T10:30:00.000Z'
   */
  sentAt?: string;

  /**
   * Fecha y hora de creación de la notificación (ISO 8601)
   * @example '2024-01-15T10:00:00.000Z'
   */
  createdAt: string;

  /**
   * Indica si la notificación ha sido leída
   */
  isRead?: boolean;
}

/**
 * DTO de respuesta para lista paginada de notificaciones
 */
export interface NotificationListDto {
  /**
   * Lista de notificaciones
   */
  notifications: NotificationDto[];

  /**
   * Total de notificaciones (sin paginación)
   */
  total: number;

  /**
   * Página actual
   */
  page: number;

  /**
   * Cantidad de elementos por página
   */
  limit: number;

  /**
   * Total de páginas disponibles
   */
  totalPages: number;

  /**
   * Indica si hay más páginas
   */
  hasNextPage: boolean;

  /**
   * Indica si hay páginas anteriores
   */
  hasPreviousPage: boolean;
}

/**
 * DTO de respuesta para conteo de notificaciones no leídas
 */
export interface UnreadCountDto {
  /**
   * Cantidad de notificaciones no leídas
   */
  unreadCount: number;
}
