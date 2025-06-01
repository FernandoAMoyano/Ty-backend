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
    // Rutas públicas
    this.router.post('/login', this.authController.login);
    this.router.post('/register', this.authController.register);
    this.router.post('/refresh-token', this.authController.refreshToken);

    // Rutas protegidas
    this.router.get('/profile', this.authMiddleware.authenticate, this.authController.getProfile);

    this.router.put(
      '/profile',
      this.authMiddleware.authenticate,
      this.authController.updateProfile,
    );

    this.router.put(
      '/change-password',
      this.authMiddleware.authenticate,
      this.authController.changePassword,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
