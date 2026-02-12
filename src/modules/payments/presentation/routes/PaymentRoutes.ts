import { Router, Request, Response, NextFunction } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { PaymentValidations } from '../validations/PaymentValidations';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Configurador de rutas para el módulo de pagos
 * @description Organiza todas las rutas relacionadas con pagos
 */
export class PaymentRoutes {
  private router: Router;

  constructor(
    private paymentController: PaymentController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Configura todas las rutas del módulo de pagos
   * @routes
   * - GET /payments - Listar todos los pagos (admin)
   * - GET /payments/statistics - Obtener estadísticas (admin)
   * - GET /payments/appointment/:appointmentId - Pagos de una cita
   * - GET /payments/:id - Obtener pago por ID
   * - POST /payments - Crear pago (admin, stylist)
   * - POST /payments/:id/process - Procesar pago (admin, stylist)
   * - POST /payments/:id/refund - Reembolsar pago (admin)
   * - POST /payments/:id/cancel - Cancelar pago (admin, stylist)
   * - PUT /payments/:id - Actualizar pago (admin)
   */
  private setupRoutes(): void {
    // ==========================================
    // RUTAS BASE (/) - PRIMERO
    // ==========================================

    // GET / - Listar todos los pagos (admin only)
    this.router.get(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      PaymentValidations.getPayments,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.getAll(req, res).catch(next);
      },
    );

    // POST / - Crear pago (admin, stylist)
    this.router.post(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      PaymentValidations.createPayment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.create(req, res).catch(next);
      },
    );

    // ==========================================
    // RUTAS ESPECÍFICAS (sin parámetros dinámicos)
    // ==========================================

    // GET /statistics - Estadísticas de pagos (admin only)
    this.router.get(
      '/statistics',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      PaymentValidations.getStatistics,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.getStatistics(req, res).catch(next);
      },
    );

    // GET /appointment/:appointmentId - Pagos de una cita
    this.router.get(
      '/appointment/:appointmentId',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      PaymentValidations.paymentsByAppointment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.getByAppointment(req, res).catch(next);
      },
    );

    // ==========================================
    // RUTAS CON PARÁMETROS DINÁMICOS - AL FINAL
    // ==========================================

    // GET /:id - Obtener pago por ID
    this.router.get(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      PaymentValidations.paymentById,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.getById(req, res).catch(next);
      },
    );

    // PUT /:id - Actualizar pago (admin only)
    this.router.put(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      PaymentValidations.updatePayment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.update(req, res).catch(next);
      },
    );

    // POST /:id/process - Procesar pago (admin, stylist)
    this.router.post(
      '/:id/process',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      PaymentValidations.processPayment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.process(req, res).catch(next);
      },
    );

    // POST /:id/refund - Reembolsar pago (admin only)
    this.router.post(
      '/:id/refund',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      PaymentValidations.refundPayment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.refund(req, res).catch(next);
      },
    );

    // POST /:id/cancel - Cancelar pago (admin, stylist)
    this.router.post(
      '/:id/cancel',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN', 'STYLIST']),
      PaymentValidations.paymentById,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.paymentController.cancel(req, res).catch(next);
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
