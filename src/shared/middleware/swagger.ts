// src/middleware/swagger.ts

import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecification, swaggerUiOptions, swaggerInfo } from '../../docs/swaggerConfig';

/**
 * Configura Swagger UI en la aplicación Express
 * @param app - Instancia de Express
 */
export const setupSwagger = (app: Application): void => {
  try {
    console.log('📚 Configurando Swagger UI...');

    // Middleware para servir la documentación JSON cruda
    app.get('/api/docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpecification);
    });

    // Middleware para redirigir desde /docs a /api/docs
    app.get('/docs', (req: Request, res: Response) => {
      res.redirect('/api/docs');
    });

    // Middleware principal de Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUiOptions));

    // Endpoint adicional para obtener información de la API
    app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          name: swaggerInfo.title,
          version: swaggerInfo.version,
          description: swaggerInfo.description,
          documentation: {
            swagger: `${req.protocol}://${req.get('host')}/api/docs`,
            json: `${req.protocol}://${req.get('host')}/api/docs.json`,
          },
          endpoints: {
            health: `${req.protocol}://${req.get('host')}/api/health`,
            auth: `${req.protocol}://${req.get('host')}/api/v1/auth`,
          },
        },
        message: 'API information retrieved successfully',
      });
    });

    // Endpoint de salud básico
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: swaggerInfo.version,
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
        },
        message: 'Service is healthy',
      });
    });

    console.log(` Swagger UI configurado exitosamente:`);
    console.log(` Documentación: http://localhost:3000/api/docs`);
    console.log(` JSON Spec: http://localhost:3000/api/docs.json`);
    console.log(` API Info: http://localhost:3000/api/info`);
    console.log(` Health Check: http://localhost:3000/api/health`);
  } catch (error) {
    console.error('Error configurando Swagger:', error);

    // Fallback: endpoint básico de documentación
    app.get('/api/docs', (req: Request, res: Response) => {
      res.status(500).json({
        success: false,
        message: 'Documentation temporarily unavailable',
        error: 'Swagger configuration failed',
      });
    });
  }
};

/**
 * Middleware para agregar headers de documentación en desarrollo
 */
export const addDocsHeaders = (req: Request, res: Response, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-API-Docs', 'http://localhost:3000/api/docs');
    res.setHeader('X-API-Version', swaggerInfo.version);
  }
  next();
};

/**
 * Middleware para logging de requests a la documentación
 */
export const logDocsAccess = (req: Request, res: Response, next: any) => {
  if (req.path.startsWith('/api/docs')) {
    console.log(
      `📚 [${new Date().toISOString()}] Docs accessed: ${req.method} ${req.path} from ${req.ip}`,
    );
  }
  next();
};
