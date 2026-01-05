import { Response } from 'express';
import { CreateNotification } from '../../application/use-cases/CreateNotification';
import { GetUserNotifications } from '../../application/use-cases/GetUserNotifications';
import { GetNotificationById } from '../../application/use-cases/GetNotificationById';
import { MarkNotificationAsRead } from '../../application/use-cases/MarkNotificationAsRead';
import { GetUnreadCount } from '../../application/use-cases/GetUnreadCount';
import { NotificationTypeEnum } from '../../domain/entities/Notification';
import { AuthenticatedRequest } from '../../../auth/presentation/middleware/AuthMiddleware';

/**
 * Controlador para el módulo de notificaciones
 * @description Maneja las peticiones HTTP relacionadas con notificaciones
 */
export class NotificationController {
  constructor(
    private createNotificationUseCase: CreateNotification,
    private getUserNotificationsUseCase: GetUserNotifications,
    private getNotificationByIdUseCase: GetNotificationById,
    private markNotificationAsReadUseCase: MarkNotificationAsRead,
    private getUnreadCountUseCase: GetUnreadCount,
  ) {
    // Bind de métodos para mantener el contexto
    this.create = this.create.bind(this);
    this.getMyNotifications = this.getMyNotifications.bind(this);
    this.getById = this.getById.bind(this);
    this.markAsRead = this.markAsRead.bind(this);
    this.markSingleAsRead = this.markSingleAsRead.bind(this);
    this.markAllAsRead = this.markAllAsRead.bind(this);
    this.getUnreadCountHandler = this.getUnreadCountHandler.bind(this);
  }

  /**
   * Crea una nueva notificación
   * @description POST /notifications
   * @access Admin only
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { type, message, userId } = req.body;

    const notification = await this.createNotificationUseCase.execute({
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
   * @description GET /notifications
   * @access Authenticated user
   */
  async getMyNotifications(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    // Extraer filtros de query params
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type as NotificationTypeEnum | undefined;

    const result = await this.getUserNotificationsUseCase.execute(userId, {
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
   * @description GET /notifications/:id
   * @access Owner only
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    const notification = await this.getNotificationByIdUseCase.execute(id, requesterId);

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification retrieved successfully',
    });
  }

  /**
   * Marca una o múltiples notificaciones como leídas
   * @description POST /notifications/mark-read
   * @access Owner only
   */
  async markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    const { notificationId, notificationIds } = req.body;

    const result = await this.markNotificationAsReadUseCase.execute(
      { notificationId, notificationIds },
      requesterId,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Notifications marked as read successfully',
    });
  }

  /**
   * Marca una notificación específica como leída por ID
   * @description PATCH /notifications/:id/read
   * @access Owner only
   */
  async markSingleAsRead(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const { id } = req.params;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    const notification = await this.markNotificationAsReadUseCase.executeSingle(id, requesterId);

    return res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  }

  /**
   * Marca todas las notificaciones del usuario como leídas
   * @description POST /notifications/mark-all-read
   * @access Owner only
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    // Obtener todas las notificaciones del usuario
    const notifications = await this.getUserNotificationsUseCase.execute(requesterId, { limit: 1000 });
    
    const notificationIds = notifications.notifications.map(n => n.id);

    if (notificationIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { updatedCount: 0 },
        message: 'No notifications to mark as read',
      });
    }

    const result = await this.markNotificationAsReadUseCase.execute(
      { notificationIds },
      requesterId,
    );

    return res.status(200).json({
      success: true,
      data: result,
      message: 'All notifications marked as read',
    });
  }

  /**
   * Obtiene el conteo de notificaciones no leídas del usuario
   * @description GET /notifications/unread-count
   * @access Owner only
   */
  async getUnreadCountHandler(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request',
        code: 'UNAUTHORIZED',
      });
    }

    const result = await this.getUnreadCountUseCase.execute(userId);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Unread count retrieved successfully',
    });
  }
}
