import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

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
   * @description Define rutas públicas y protegidas con sus respectivos middlewares
   * @routes
   * - POST /auth/login - Iniciar sesión
   * - POST /auth/register - Registrar nuevo usuario
   * - POST /auth/refresh-token - Renovar tokens
   * - GET /auth/profile - Obtener perfil (requiere autenticación)
   * - PUT /auth/profile - Actualizar perfil (requiere autenticación)
   * - PUT /auth/change-password - Cambiar contraseña (requiere autenticación)
   */
  private setupRoutes(): void {
    this.router.post('/login', (req, res, next) => {
      this.authController.login(req, res).catch(next);
    });

    this.router.post('/register', (req, res, next) => {
      this.authController.register(req, res).catch(next);
    });

    this.router.post('/refresh-token', (req, res, next) => {
      this.authController.refreshToken(req, res).catch(next);
    });

    this.router.get(
      '/profile',
      (req, res, next) => {
        this.authMiddleware.authenticate(req, res, next);
      },
      (req, res, next) => {
        this.authController.getProfile(req, res).catch(next);
      },
    );

    this.router.put(
      '/profile',
      (req, res, next) => {
        this.authMiddleware.authenticate(req, res, next);
      },
      (req, res, next) => {
        this.authController.updateProfile(req, res).catch(next);
      },
    );

    this.router.put(
      '/change-password',
      (req, res, next) => {
        this.authMiddleware.authenticate(req, res, next);
      },
      (req, res, next) => {
        this.authController.changePassword(req, res).catch(next);
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
