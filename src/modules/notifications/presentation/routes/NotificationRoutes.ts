import { Router, Request, Response, NextFunction } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { NotificationValidations } from '../validations/NotificationValidations';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Configurador de rutas para el módulo de notificaciones
 * @description Organiza todas las rutas relacionadas con notificaciones
 */
export class NotificationRoutes {
  private router: Router;

  constructor(
    private notificationController: NotificationController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Configura todas las rutas del módulo de notificaciones
   * @routes
   * - GET /notifications - Obtener notificaciones del usuario (autenticado)
   * - GET /notifications/unread-count - Obtener conteo de no leídas (autenticado)
   * - GET /notifications/:id - Obtener notificación por ID (autenticado, owner)
   * - POST /notifications - Crear notificación (admin only)
   * - POST /notifications/mark-read - Marcar como leídas (autenticado)
   * - POST /notifications/mark-all-read - Marcar todas como leídas (autenticado)
   * - PATCH /notifications/:id/read - Marcar una como leída (autenticado)
   */
  private setupRoutes(): void {
    // ==========================================
    // RUTAS BASE (/ ) - DEBEN IR PRIMERO
    // ==========================================
    
    // GET / - Obtener todas las notificaciones del usuario
    this.router.get(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      NotificationValidations.getNotifications,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.getMyNotifications(req, res).catch(next);
      },
    );

    // POST / - Crear notificación (solo admin)
    this.router.post(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      NotificationValidations.createNotification,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.create(req, res).catch(next);
      },
    );

    // ==========================================
    // RUTAS ESPECÍFICAS (sin parámetros dinámicos)
    // ==========================================

    // GET /unread-count - Conteo de no leídas
    this.router.get(
      '/unread-count',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.getUnreadCountHandler(req, res).catch(next);
      },
    );

    // POST /mark-read - Marcar múltiples como leídas
    this.router.post(
      '/mark-read',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      NotificationValidations.markAsRead,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.markAsRead(req, res).catch(next);
      },
    );

    // POST /mark-all-read - Marcar todas como leídas
    this.router.post(
      '/mark-all-read',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.markAllAsRead(req, res).catch(next);
      },
    );

    // ==========================================
    // RUTAS CON PARÁMETROS DINÁMICOS - AL FINAL
    // ==========================================

    // GET /:id - Obtener notificación por ID
    this.router.get(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      NotificationValidations.notificationById,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.getById(req, res).catch(next);
      },
    );

    // PATCH /:id/read - Marcar una notificación como leída
    this.router.patch(
      '/:id/read',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      NotificationValidations.notificationById,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.notificationController.markSingleAsRead(req, res).catch(next);
      },
    );
  }

  /**
   * Middleware para manejar errores de validación
   */
  private handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => {
        const errorAny = error as any;
        const field = errorAny.path || errorAny.param || errorAny.location || 'field';
        return `${field}: ${error.msg}`;
      });

      throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
    }

    next();
  };

  /**
   * Obtiene el router configurado
   * @returns Router de Express con todas las rutas configuradas
   */
  getRouter(): Router {
    return this.router;
  }
}
