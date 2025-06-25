import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './shared/middleware/ErrorHandler';
import { prisma } from './shared/config/Prisma';
import { AuthContainer } from './modules/auth/AuthContainer';
import { setupSwagger, addDocsHeaders, logDocsAccess } from './shared/middleware/swagger';
import { ServicesContainer } from './modules/services/ServicesContainer';

class App {
  public app: express.Application;
  private authContainer: AuthContainer;
  private serviceContainer: ServicesContainer;

  constructor() {
    this.app = express();
    this.authContainer = AuthContainer.getInstance(prisma);
    this.serviceContainer = ServicesContainer.getInstance(
      prisma,
      this.authContainer.authMiddleware,
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Seguridad
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      }),
    );

    // Analizador
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Turnity API is running',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    this.app.use(addDocsHeaders);
    this.app.use(logDocsAccess);
    setupSwagger(this.app);

    // API routes
    this.app.use('/api/v1/auth', this.authContainer.authRoutes.getRouter());
    this.app.use('/api/v1', this.serviceContainer.servicesRoutes.getRouter());

    // 404 handler
    this.app.use('/*splat', (req, res) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND',
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default new App().getApp();
