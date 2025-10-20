import { pino } from 'pino';

// Production-safe logger configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger configuration based on environment
const createLoggerConfig = () => {
  const baseConfig = {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  };

  // Only use pino-pretty in development, use JSON logging in production
  if (isDevelopment) {
    try {
      return {
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      };
    } catch (error) {
      // Fallback to JSON logging if pino-pretty is not available
      console.warn('pino-pretty not available, falling back to JSON logging');
      return baseConfig;
    }
  }

  // Production: JSON logging only
  return baseConfig;
};

export const logger = pino(createLoggerConfig());