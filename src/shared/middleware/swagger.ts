import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecification, swaggerUiOptions, swaggerInfo } from '../../docs/swaggerConfig';

/**
 * Configuración Swagger UI en la aplicación Express
 */
export const setupSwagger = (app: Application): void => {
  try {
    // Documentación principal de Swagger UI
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecification, swaggerUiOptions));

    // JSON crudo de la especificación
    app.get('/api/docs.json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpecification);
    });

    // Información básica de la API
    app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          name: swaggerInfo.title,
          version: swaggerInfo.version,
          description: swaggerInfo.description,
          documentation: `${req.protocol}://${req.get('host')}/api/docs`,
        },
        message: 'API information retrieved successfully',
      });
    });
  } catch (error) {
    console.error('🔴 Error configurando Swagger:', error);

    // Fallback en caso de error
    app.get('/api/docs', (req: Request, res: Response) => {
      res.status(500).json({
        success: false,
        message: 'Documentation temporarily unavailable',
      });
    });
  }
};
