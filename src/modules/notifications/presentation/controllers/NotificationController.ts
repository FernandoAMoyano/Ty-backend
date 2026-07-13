import { Response } from 'express';
import { CreateNotification } from '../../application/use-cases/CreateNotification';
import { GetUserNotifications } from '../../application/use-cases/GetUserNotifications';
import { GetNotificationById } from '../../application/use-cases/GetNotificationById';
import { MarkNotificationAsRead } from '../../application/use-cases/MarkNotificationAsRead';
import { MarkAllNotificationsAsRead } from '../../application/use-cases/MarkAllNotificationsAsRead';
import { GetUnreadCount } from '../../application/use-cases/GetUnreadCount';
import { NotificationTypeEnum } from '../../domain/entities/Notification';
import { AuthenticatedRequest } from '../../../auth/presentation/middleware/AuthMiddleware';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Controlador para el módulo de notificaciones
 * @description Maneja las peticiones HTTP relacionadas con notificaciones
 * Los errores burbujean al errorHandler global via .catch(next) en NotificationRoutes
 */
export class NotificationController {
  constructor(
    private _createNotification: CreateNotification,
    private _getUserNotifications: GetUserNotifications,
    private _getNotificationById: GetNotificationById,
    private _markNotificationAsRead: MarkNotificationAsRead,
    private _getUnreadCount: GetUnreadCount,
    private _markAllNotificationsAsRead: MarkAllNotificationsAsRead,
  ) {}

  /**
   * Crea una nueva notificación
   * @route POST /notifications
   * @param req - Request autenticado con datos de la notificación en el body
   * @param res - Response de Express
   * @returns Promise con la notificación creada
   * @responseStatus 201 - Notificación creada exitosamente
   * @throws ValidationError si los datos no son válidos
   * @throws NotFoundError si el estado inicial no existe
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { type, message, userId } = req.body;

    const notification = await this._createNotification.execute({
      type: type as NotificationTypeEnum,
      message,
      userId,
    });

    return res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
    });
  }

  /**
   * Obtiene las notificaciones del usuario autenticado
   * @route GET /notifications
   * @param req - Request autenticado con filtros opcionales en query params
   * @param res - Response de Express
   * @returns Promise con la lista paginada de notificaciones
   * @responseStatus 200 - Notificaciones obtenidas exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws ValidationError si los filtros no son válidos
   */
  async getMyNotifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as NotificationTypeEnum | undefined;

    const result = await this._getUserNotifications.execute(req.user.userId, {
      page,
      limit,
      unreadOnly,
      type,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Notifications retrieved successfully',
    });
  }

  /**
   * Obtiene una notificación por su ID
   * @route GET /notifications/:id
   * @param req - Request autenticado con ID de notificación en params
   * @param res - Response de Express
   * @returns Promise con los datos de la notificación
   * @responseStatus 200 - Notificación obtenida exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws NotFoundError si la notificación no existe
   * @throws BusinessRuleError si el usuario no tiene permiso
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const notification = await this._getNotificationById.execute(id, req.user.userId);

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification retrieved successfully',
    });
  }

  /**
   * Marca una o múltiples notificaciones como leídas
   * @route POST /notifications/mark-read
   * @param req - Request autenticado con IDs de notificaciones en el body
   * @param res - Response de Express
   * @returns Promise con el conteo de notificaciones actualizadas
   * @responseStatus 200 - Notificaciones marcadas como leídas exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws NotFoundError si alguna notificación no existe
   * @throws BusinessRuleError si el usuario no tiene permiso
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { notificationId, notificationIds } = req.body;

    const result = await this._markNotificationAsRead.execute(
      { notificationId, notificationIds },
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Notifications marked as read successfully',
    });
  }

  /**
   * Marca una notificación específica como leída por ID
   * @route PATCH /notifications/:id/read
   * @param req - Request autenticado con ID de notificación en params
   * @param res - Response de Express
   * @returns Promise con los datos de la notificación actualizada
   * @responseStatus 200 - Notificación marcada como leída exitosamente
   * @throws UnauthorizedError si no hay autenticación
   * @throws NotFoundError si la notificación no existe
   * @throws BusinessRuleError si el usuario no tiene permiso
   */
  async markSingleAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const { id } = req.params;
    const notification = await this._markNotificationAsRead.executeSingle(id, req.user.userId);

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   * @route POST /notifications/mark-all-read
   * @param req - Request autenticado
   * @param res - Response de Express
   * @returns Promise con el conteo de notificaciones actualizadas
   * @responseStatus 200 - Todas las notificaciones marcadas como leídas
   * @throws UnauthorizedError si no hay autenticación
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await this._markAllNotificationsAsRead.execute(req.user.userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'All notifications marked as read',
    });
  }

  /**
   * Obtiene el conteo de notificaciones no leídas del usuario
   * @route GET /notifications/unread-count
   * @param req - Request autenticado
   * @param res - Response de Express
   * @returns Promise con el conteo de notificaciones no leídas
   * @responseStatus 200 - Conteo obtenido exitosamente
   * @throws UnauthorizedError si no hay autenticación
   */
  async getUnreadCountHandler(req: AuthenticatedRequest, res: Response): Promise<Response> {
    if (!req.user?.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await this._getUnreadCount.execute(req.user.userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Unread count retrieved successfully',
    });
  }
}
