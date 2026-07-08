// env.ts DEBE ser el primer import: valida las variables de entorno
// requeridas (secrets de JWT, DATABASE_URL, etc.)
import { env } from './shared/config/env';
import app from './app';
import { prisma } from './shared/config/Prisma';
import { logger } from './shared/logger/logger';

const PORT = env.PORT;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Turnity API running on port ${PORT}`, {
        environment: env.NODE_ENV,
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
