import { Router } from 'express';
import { AuthController } from './AuthController';
import { AuthMiddleware } from './AuthMiddleware';

export class AuthRoutes {
  private router: Router;

  constructor(
    private authController: AuthController,
    private authMiddleware: AuthMiddleware,
  ) {
    this.router = Router();
    this.setupRoutes();
  }

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

    // Rutas protegidas
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

  getRouter(): Router {
    return this.router;
  }
}
