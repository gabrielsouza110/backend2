import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prisma client configuration with logging and error handling
export const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty',
});

// Database event logging
prisma.$on('query', (e) => {
  if (process.env.LOG_LEVEL === 'debug') {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: e.timestamp
    }, 'Database Query');
  }
});

prisma.$on('error', (e) => {
  logger.error({
    target: e.target,
    message: e.message,
    timestamp: e.timestamp
  }, 'Database Error');
});

prisma.$on('info', (e) => {
  logger.info({
    target: e.target,
    message: e.message,
    timestamp: e.timestamp
  }, 'Database Info');
});

prisma.$on('warn', (e) => {
  logger.warn({
    target: e.target,
    message: e.message,
    timestamp: e.timestamp
  }, 'Database Warning');
});

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Database health check failed');
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Database connection retry logic
export const connectWithRetry = async (maxRetries: number = 5): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully');
      return;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, `Database connection attempt ${i + 1} failed`);
      
      if (i === maxRetries - 1) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Graceful shutdown with proper cleanup
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error disconnecting from database');
    throw error;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting from database...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting from database...');
  await disconnectDatabase();
  process.exit(0);
});
