import { Router, Request, Response, NextFunction } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { AppointmentValidations } from '../validations/AppointmentValidations';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../../shared/exceptions/ValidationError';

/**
 * Configurador de rutas para el módulo de citas
 * Organiza todas las rutas relacionadas con la gestión de citas del sistema
 */
export class AppointmentRoutes {
  private router: Router;

  constructor(
    private appointmentController: AppointmentController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Configura todas las rutas del módulo de citas
   * @description Define rutas públicas y protegidas con sus respectivos middlewares y validaciones
   * @routes
   * - POST /appointments - Crear nueva cita (requiere autenticación)
   * - GET /appointments/:id - Obtener cita por ID (requiere autenticación)
   * - PUT /appointments/:id - Actualizar cita (requiere autenticación)
   * - POST /appointments/:id/confirm - Confirmar cita (requiere autenticación)
   * - POST /appointments/:id/cancel - Cancelar cita (requiere autenticación)
   * - GET /appointments/client/:clientId - Obtener citas de cliente (requiere autenticación)
   * - GET /appointments/stylist/:stylistId - Obtener citas de estilista (requiere autenticación)
   * - GET /appointments/date-range - Obtener citas por rango de fechas (requiere autenticación)
   * - GET /appointments/available-slots - Obtener slots disponibles (público)
   * - GET /appointments/statistics - Obtener estadísticas (requiere autenticación)
   */
  private setupRoutes(): void {
    // Ruta pública para consultar disponibilidad
    this.router.get(
      '/available-slots',
      AppointmentValidations.getAvailableSlots,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAvailableSlots(req, res).catch(next);
      },
    );

    // Rutas protegidas que requieren autenticación
    this.router.post(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.createAppointment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.createAppointment(req, res).catch(next);
      },
    );

    this.router.get(
      '/statistics',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAppointmentStatistics(req, res).catch(next);
      },
    );

    this.router.get(
      '/date-range',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.appointmentsByDateRange,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAppointmentsByDateRange(req, res).catch(next);
      },
    );

    this.router.get(
      '/client/:clientId',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.appointmentsByClient,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAppointmentsByClient(req, res).catch(next);
      },
    );

    this.router.get(
      '/stylist/:stylistId',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.appointmentsByStylist,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAppointmentsByStylist(req, res).catch(next);
      },
    );

    this.router.get(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.appointmentById,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.getAppointmentById(req, res).catch(next);
      },
    );

    this.router.put(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.updateAppointment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.updateAppointment(req, res).catch(next);
      },
    );

    this.router.post(
      '/:id/confirm',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.confirmAppointment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.confirmAppointment(req, res).catch(next);
      },
    );

    this.router.post(
      '/:id/cancel',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AppointmentValidations.cancelAppointment,
      this.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.appointmentController.cancelAppointment(req, res).catch(next);
      },
    );
  }

  /**
   * Middleware para manejar errores de validación de express-validator
   * @param req - Request de Express
   * @param res - Response de Express
   * @param next - Función next de Express
   * @description Procesa errores de validación y los formatea consistentemente
   * @throws ValidationError con detalles de los errores encontrados
   */
  private handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => {
        // Extraer el campo de manera segura para diferentes tipos de errores
        const errorAny = error as any;
        const field = errorAny.path || errorAny.param || errorAny.location || 'field';
        return `${field}: ${error.msg}`;
      });
      
      throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`);
    }
    
    next();
  };

  /**
   * Obtiene el router configurado con todas las rutas de citas
   * @returns Router de Express con todas las rutas del módulo de citas configuradas
   */
  getRouter(): Router {
    return this.router;
  }
}
