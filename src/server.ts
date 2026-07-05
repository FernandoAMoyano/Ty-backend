import app from './app';
import { prisma } from './shared/config/Prisma';
import { logger } from './shared/logger/logger';

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`Turnity API running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message, stack: (error as Error).stack });
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
