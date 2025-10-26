// Load environment variables FIRST before any imports
console.log('🔧 Loading environment variables...');
// CONDITIONALLY load dotenv only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Carregando variáveis do .env (Ambiente de Desenvolvimento)');
  require('dotenv').config();
} else {
  console.log('🔧 Using environment variables from platform (Ambiente de Produção)');
}
console.log('✅ Environment variables loaded');
console.log('🔍 PORT from process.env:', process.env.PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);

console.log('🔧 Importing dependencies...');
import express from 'express';
import cors from 'cors';
console.log('✅ Express and CORS imported');
import { logger } from './utils/logger';
console.log('✅ Logger imported');
import { appConfig } from './config/environment';
console.log('✅ Environment config imported');
import { connectWithRetry, disconnectDatabase } from './models/database';
console.log('✅ Database functions imported');
import { errorHandler, notFoundHandler, AppError } from './middlewares/errorHandler';
import { securityMiddleware, rateLimiters } from './middlewares/security';
console.log('✅ Middleware imported');
import { SmartGameScheduler } from './services/smartGameScheduler';
console.log('✅ Smart game scheduler imported');

// Import routes
console.log('🔧 Importing routes...');
import authRoutes from './routes/authRoutes';
import timesRoutes from './routes/timesRoutes';
import modalidadesRoutes from './routes/modalidadesRoutes';
import jogosRoutes from './routes/jogosRoutes';
import estatisticasRoutes from './routes/estatisticasRoutes';
import usuariosRoutes from './routes/usuariosRoutes';
import jogadoresRoutes from './routes/jogadoresRoutes';
import turmasRoutes from './routes/turmasRoutes';
import edicoesRoutes from './routes/edicoesRoutes';
import adminRoutes from './routes/adminRoutes';
import healthRoutes from './routes/healthRoutes';
import turmaTimeRoutes from './routes/turmaTimeRoutes';
import systemRoutes from './routes/systemRoutes';
import batchRoutes from './routes/batchRoutes';
import eventosRoutes from './routes/eventosRoutes';
import gruposRoutes from './routes/gruposRoutes';
import jogosEspecificosRoutes from './routes/jogosEspecificosRoutes';
import backupRoutes from './routes/backupRoutes';
console.log('✅ All routes imported successfully');

console.log('🚀 Creating Express app...');
const app = express();
console.log('✅ Express app created successfully');

// Configure trust proxy based on environment for security
// This prevents IP spoofing while allowing legitimate proxy use
if (appConfig.server.isProduction) {
  // In production, use configured trust proxy setting
  // Common values: 1 (trust first proxy), 'loopback', specific IPs
  app.set('trust proxy', appConfig.security.proxy.trust === 'true' ? true : appConfig.security.proxy.trust);
} else {
  // In development, trust loopback addresses for local testing
  app.set('trust proxy', 'loopback');
}

// Security and utility middlewares
app.use(securityMiddleware);

// CORS configuration
app.use(cors({
  origin: appConfig.security.cors.origin,
  credentials: appConfig.security.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: `${appConfig.upload.maxFileSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${appConfig.upload.maxFileSizeMB}mb` }));

// Serve static files from public directory
app.use(express.static('public'));

// Apply general rate limiting to all routes
app.use(rateLimiters.general);

// Health check routes (before other routes)
app.use('/api', healthRoutes);

// API Routes with specific rate limiting
app.use('/api/auth', rateLimiters.auth, authRoutes);
app.use('/api/users', rateLimiters.mutations, usuariosRoutes);
app.use('/api/editions', rateLimiters.reads, edicoesRoutes);
app.use('/api/classes', rateLimiters.reads, turmasRoutes);
app.use('/api/players', rateLimiters.mutations, jogadoresRoutes);
app.use('/api/teams', rateLimiters.mutations, timesRoutes);
app.use('/api/modalities', rateLimiters.reads, modalidadesRoutes);
app.use('/api/games', rateLimiters.mutations, jogosRoutes);
app.use('/api/events', rateLimiters.mutations, eventosRoutes);
app.use('/api/groups', rateLimiters.mutations, gruposRoutes);
app.use('/api/statistics', rateLimiters.reads, estatisticasRoutes);
app.use('/api/admin', rateLimiters.mutations, adminRoutes);
app.use('/api/class-team', rateLimiters.mutations, turmaTimeRoutes);
app.use('/api/system', rateLimiters.reads, systemRoutes);
app.use('/api/batch', rateLimiters.reads, batchRoutes);
app.use('/api/specific-games', rateLimiters.mutations, jogosEspecificosRoutes);
app.use('/api/backup', rateLimiters.mutations, backupRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dashboard Esportivo API',
    author: 'Gabriel Ozório',
    version: process.env.npm_package_version || '1.0.0',
    environment: appConfig.server.env,
    documentation: '/api-docs',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// API documentation setup would go here when swagger dependencies are installed
// if (appConfig.features.swagger && !appConfig.server.isProduction) {
//   // setupSwagger(app);
// }

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting server initialization...');
    console.log(`📊 Port configuration: ${appConfig.server.port}`);
    console.log(`🌍 Environment: ${appConfig.server.env}`);

    // Connect to database with retry logic
    console.log('📡 Attempting database connection...');
    await connectWithRetry();
    logger.info('Database connected successfully');

    // Initialize and start the smart game scheduler
    console.log('⏰ Initializing smart game scheduler...');
    const scheduler = SmartGameScheduler.getInstance();
    scheduler.start();
    logger.info('Smart game scheduler initialized and started');

    // Start server
    console.log(`🔧 Binding to port ${appConfig.server.port}...`);
    const server = app.listen(appConfig.server.port, '0.0.0.0', () => {
      console.log(`✅ Server listening on port ${appConfig.server.port}`);
      logger.info({
        port: appConfig.server.port,
        environment: appConfig.server.env,
        apiUrl: appConfig.server.apiUrl,
        documentation: appConfig.features.swagger ? `${appConfig.server.apiUrl}/api-docs` : 'disabled',
        health: `${appConfig.server.apiUrl}/api/health`
      }, `🚀 Dashboard Esportivo API started successfully`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Stop the game scheduler
      scheduler.stop();

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Graceful shutdown timed out, forcing exit');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: 'Promise object'
      }, 'Unhandled promise rejection');
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing
export default app;