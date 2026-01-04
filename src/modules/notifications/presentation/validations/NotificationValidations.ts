import { body, param, query } from 'express-validator';
import { NotificationTypeEnum } from '../../domain/entities/Notification';

/**
 * Validaciones para el módulo de notificaciones
 * @description Define las reglas de validación para los endpoints de notificaciones
 */
export class NotificationValidations {
  /**
   * Validación para crear una notificación
   */
  static createNotification = [
    body('type')
      .notEmpty()
      .withMessage('Notification type is required')
      .isIn(Object.values(NotificationTypeEnum))
      .withMessage(
        `Invalid notification type. Must be one of: ${Object.values(NotificationTypeEnum).join(', ')}`,
      ),
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isString()
      .withMessage('Message must be a string')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
    body('userId')
      .notEmpty()
      .withMessage('User ID is required')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
  ];

  /**
   * Validación para obtener notificación por ID
   */
  static notificationById = [
    param('id')
      .notEmpty()
      .withMessage('Notification ID is required')
      .isUUID()
      .withMessage('Notification ID must be a valid UUID'),
  ];

  /**
   * Validación para marcar notificaciones como leídas
   */
  static markAsRead = [
    body('notificationId')
      .optional()
      .isUUID()
      .withMessage('Notification ID must be a valid UUID'),
    body('notificationIds')
      .optional()
      .isArray()
      .withMessage('Notification IDs must be an array'),
    body('notificationIds.*')
      .optional()
      .isUUID()
      .withMessage('Each notification ID must be a valid UUID'),
    body()
      .custom((value) => {
        const hasNotificationId = value.notificationId && value.notificationId.trim().length > 0;
        const hasNotificationIds = value.notificationIds && value.notificationIds.length > 0;
        if (!hasNotificationId && !hasNotificationIds) {
          throw new Error('At least one notification ID is required (use notificationId or notificationIds)');
        }
        return true;
      }),
  ];

  /**
   * Validación para obtener notificaciones con filtros
   */
  static getNotifications = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('unreadOnly')
      .optional()
      .isBoolean()
      .withMessage('unreadOnly must be a boolean'),
    query('type')
      .optional()
      .isIn(Object.values(NotificationTypeEnum))
      .withMessage(
        `Invalid notification type. Must be one of: ${Object.values(NotificationTypeEnum).join(', ')}`,
      ),
  ];
}
