import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import { seedDatabase } from './utils/seed.js';

async function startServer() {
  await connectDB();
  await seedDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`Health check available at http://localhost:${env.PORT}/health`);
  });

  const handleShutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
