import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { AuthValidations } from '../validations/AuthValidations';
import { ValidationMiddleware } from '../../../../shared/middleware/ValidationMiddleware';

/**
 * Configurador de rutas para el módulo de autenticación
 * Organiza todas las rutas relacionadas con login, registro y gestión de perfiles
 */
export class AuthRoutes {
  private router: Router;

  constructor(
    private authController: AuthController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  /**
   * Configura todas las rutas del módulo de autenticación
   * @description Define rutas públicas y protegidas con sus respectivos middlewares y validaciones
   * @routes
   * - POST /auth/login - Iniciar sesión
   * - POST /auth/register - Registrar nuevo usuario
   * - POST /auth/refresh-token - Renovar tokens
   * - GET /auth/profile - Obtener perfil (requiere autenticación)
   * - PUT /auth/profile - Actualizar perfil (requiere autenticación)
   * - PUT /auth/change-password - Cambiar contraseña (requiere autenticación)
   * - PATCH /auth/users/:id/deactivate - Desactivar usuario (solo ADMIN)
   */
  private setupRoutes(): void {
    // POST /login - Inicio de sesión (público)
    this.router.post(
      '/login',
      AuthValidations.login,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.login(req, res).catch(next);
      },
    );

    // POST /register - Registro de usuario (público)
    this.router.post(
      '/register',
      AuthValidations.register,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.register(req, res).catch(next);
      },
    );

    // POST /refresh-token - Renovar token (público)
    this.router.post(
      '/refresh-token',
      AuthValidations.refreshToken,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.refreshToken(req, res).catch(next);
      },
    );

    // GET /profile - Obtener perfil (requiere autenticación)
    this.router.get(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.getProfile(req, res).catch(next);
      },
    );

    // PUT /profile - Actualizar perfil (requiere autenticación)
    this.router.put(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AuthValidations.updateProfile,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.updateProfile(req, res).catch(next);
      },
    );

    // PUT /change-password - Cambiar contraseña (requiere autenticación)
    this.router.put(
      '/change-password',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      AuthValidations.changePassword,
      ValidationMiddleware.handleValidationErrors,
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.changePassword(req, res).catch(next);
      },
    );

    // PATCH /users/:id/deactivate - Desactivar usuario (solo ADMIN)
    this.router.patch(
      '/users/:id/deactivate',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.authMiddleware.authorize(['ADMIN']),
      (req: Request, res: Response, next: NextFunction) => {
        this.authController.deactivateUser(req, res).catch(next);
      },
    );
  }

  /**
   * Obtiene el router configurado con todas las rutas de autenticación
   * @returns Router de Express con todas las rutas del módulo de autenticación configuradas
   */
  getRouter(): Router {
    return this.router;
  }
}
