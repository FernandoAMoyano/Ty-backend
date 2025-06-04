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
    // Rutas públicas - Usando .bind() para mantener el contexto
    this.router.post(
      '/login',
      this.asyncHandler(this.authController.login.bind(this.authController)),
    );

    this.router.post(
      '/register',
      this.asyncHandler(this.authController.register.bind(this.authController)),
    );

    this.router.post(
      '/refresh-token',
      this.asyncHandler(this.authController.refreshToken.bind(this.authController)),
    );

    // Rutas protegidas
    this.router.get(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.asyncHandler(this.authController.getProfile.bind(this.authController)),
    );

    this.router.put(
      '/profile',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.asyncHandler(this.authController.updateProfile.bind(this.authController)),
    );

    this.router.put(
      '/change-password',
      this.authMiddleware.authenticate.bind(this.authMiddleware),
      this.asyncHandler(this.authController.changePassword.bind(this.authController)),
    );
  }

  private asyncHandler(fn: any) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  getRouter(): Router {
    return this.router;
  }
}
