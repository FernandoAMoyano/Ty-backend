import app from './app';
import { prisma } from './shared/config/Prisma';

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log(' 🟢Database connected successfully');

    app.listen(PORT, () => {
      console.log(`\n =========================================`);
      console.log(` Turnity API running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` ===========================================\n`);

      console.log(` 🟢Health check: http://localhost:${PORT}/health`);
      console.log(` 🟢API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(` 🟢API Info: http://localhost:${PORT}/api/info\n`);
    });
  } catch (error) {
    console.error('🔴 Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('🔴 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔴 SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
