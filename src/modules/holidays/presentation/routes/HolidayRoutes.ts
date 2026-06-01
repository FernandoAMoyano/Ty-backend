import { Router, Request, Response, NextFunction } from 'express';
import { HolidayController } from '../controllers/HolidayController';
import { HolidayValidations } from '../validations/HolidayValidations';
import { AuthMiddleware } from '../../../auth/presentation/middleware/AuthMiddleware';
import { ValidationMiddleware } from '../../../../shared/middleware/ValidationMiddleware';

/**
 * Configurador de rutas para el módulo de feriados
 * @description Organiza todas las rutas relacionadas con feriados y excepciones de horario
 */
export class HolidayRoutes {
  private router: Router;

  constructor(
    private controller: HolidayController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Configura todas las rutas del módulo de feriados
   * @routes
   * HOLIDAYS:
   * - GET /holidays - Listar todos los feriados
   * - GET /holidays/upcoming - Próximos feriados
   * - GET /holidays/check/:date - Verificar si fecha es feriado
   * - GET /holidays/year/:year - Feriados por año
   * - GET /holidays/:id - Obtener feriado por ID
   * - POST /holidays - Crear feriado (admin)
   * - PUT /holidays/:id - Actualizar feriado (admin)
   * - DELETE /holidays/:id - Eliminar feriado (admin)
   * 
   * SCHEDULE EXCEPTIONS:
   * - GET /holidays/exceptions - Listar excepciones
   * - GET /holidays/exceptions/upcoming - Próximas excepciones
   * - GET /holidays/exceptions/:id - Obtener excepción por ID
   * - GET /holidays/:holidayId/exceptions - Excepciones de un feriado
   * - POST /holidays/exceptions - Crear excepción (admin)
   * - PUT /holidays/exceptions/:id - Actualizar excepción (admin)
   * - DELETE /holidays/exceptions/:id - Eliminar excepción (admin)
   */
  private setupRoutes(): void {
    // ==========================================
    // RUTAS DE EXCEPCIONES (más específicas primero)
    // ==========================================

    // GET /exceptions/upcoming - Próximas excepciones (público)
    this.router.get(
      '/exceptions/upcoming',
      HolidayValidations.getUpcomingExceptions,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getUpcomingExceptions(req, res, next);
      },
    );

    // GET /exceptions - Listar todas las excepciones (público)
    this.router.get(
      '/exceptions',
      HolidayValidations.getAllExceptions,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getAllExceptions(req, res, next);
      },
    );

    // POST /exceptions - Crear excepción (admin only)
    this.router.post(
      '/exceptions',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.createException,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.createException(req, res, next);
      },
    );

    // GET /exceptions/:id - Obtener excepción por ID (público)
    this.router.get(
      '/exceptions/:id',
      HolidayValidations.getExceptionById,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getExceptionById(req, res, next);
      },
    );

    // PUT /exceptions/:id - Actualizar excepción (admin only)
    this.router.put(
      '/exceptions/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.updateException,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.updateException(req, res, next);
      },
    );

    // DELETE /exceptions/:id - Eliminar excepción (admin only)
    this.router.delete(
      '/exceptions/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.deleteException,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.deleteException(req, res, next);
      },
    );

    // ==========================================
    // RUTAS DE FERIADOS (rutas específicas primero)
    // ==========================================

    // GET /upcoming - Próximos feriados (público)
    this.router.get(
      '/upcoming',
      HolidayValidations.getUpcoming,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getUpcoming(req, res, next);
      },
    );

    // GET /check/:date - Verificar si fecha es feriado (público)
    this.router.get(
      '/check/:date',
      HolidayValidations.checkDate,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.checkDate(req, res, next);
      },
    );

    // GET /year/:year - Feriados por año (público)
    this.router.get(
      '/year/:year',
      HolidayValidations.getByYear,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getByYear(req, res, next);
      },
    );

    // ==========================================
    // RUTAS BASE DE FERIADOS
    // ==========================================

    // GET / - Listar todos los feriados (público)
    this.router.get(
      '/',
      HolidayValidations.getAll,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getAll(req, res, next);
      },
    );

    // POST / - Crear feriado (admin only)
    this.router.post(
      '/',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.create,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.create(req, res, next);
      },
    );

    // ==========================================
    // RUTAS CON PARÁMETROS DINÁMICOS - AL FINAL
    // ==========================================

    // GET /:holidayId/exceptions - Excepciones de un feriado (público)
    this.router.get(
      '/:holidayId/exceptions',
      HolidayValidations.getExceptionsByHoliday,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getExceptionsByHoliday(req, res, next);
      },
    );

    // GET /:id - Obtener feriado por ID (público)
    this.router.get(
      '/:id',
      HolidayValidations.getById,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.getById(req, res, next);
      },
    );

    // PUT /:id - Actualizar feriado (admin only)
    this.router.put(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.update,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.update(req, res, next);
      },
    );

    // DELETE /:id - Eliminar feriado (admin only)
    this.router.delete(
      '/:id',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      HolidayValidations.delete,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.controller.delete(req, res, next);
      },
    );
  }

  /**
   * Obtiene el router configurado
   * @returns Router de Express con todas las rutas configuradas
   */
  getRouter(): Router {
    return this.router;
  }
}
