import { z } from 'zod';
// Note: Import logger only when needed to avoid circular dependency

// Environment schema validation
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional().default('3000').transform(val => {
    // Render provides PORT dynamically at runtime, prioritize process.env.PORT
    const renderPort = process.env.PORT;
    if (renderPort) {
      return parseInt(renderPort, 10);
    }
    return parseInt(val, 10);
  }),
  API_URL: z.string().url().optional(),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Security Configuration
  BCRYPT_ROUNDS: z.string().transform(val => parseInt(val, 10) || 12),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10) || 900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10) || 1000),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().optional(),
  
  // Cache Configuration
  CACHE_TTL_SECONDS: z.string().transform(val => parseInt(val, 10) || 300),
  CACHE_MAX_ITEMS: z.string().transform(val => parseInt(val, 10) || 500),
  
  // CORS Configuration
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().optional().transform(val => val === 'true').default(false),
  
  // Proxy Configuration
  TRUST_PROXY: z.string().optional().default('loopback'),
  
  // File Upload Configuration
  MAX_FILE_SIZE_MB: z.string().transform(val => parseInt(val, 10) || 5),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Email Configuration (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => val ? parseInt(val, 10) : undefined).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // Monitoring Configuration
  HEALTH_CHECK_INTERVAL_MS: z.string().transform(val => parseInt(val, 10) || 30000),
  
  // Feature Flags
  ENABLE_SWAGGER: z.string().optional().transform(val => val === 'true').default(true),
  ENABLE_METRICS: z.string().optional().transform(val => val === 'true').default(false),
  ENABLE_AUDIT_LOG: z.string().optional().transform(val => val === 'true').default(true)
});

// Validate and parse environment variables
let config: z.infer<typeof envSchema>;

try {
  console.log('🔧 Starting environment validation...');
  console.log('🔍 Available environment variables:', Object.keys(process.env).filter(key => 
    ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET'].includes(key)
  ));
  
  config = envSchema.parse(process.env);
  console.log('✅ Environment configuration validated successfully');
} catch (error) {
  console.error('❌ Environment validation failed!');
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map((err: any) => 
      `${err.path.join('.')}: ${err.message}`
    ).join('\n');
    
    console.error('Validation errors:\n' + errorMessages);
    console.error('Available env vars:', Object.keys(process.env).join(', '));
    process.exit(1);
  }
  console.error('Unexpected error:', error);
  throw error;
}

// Export typed configuration
export const envConfig = config;

// Configuration object with computed values
export const appConfig = {
  // Server
  server: {
    port: config.PORT,
    env: config.NODE_ENV,
    apiUrl: config.API_URL || `http://localhost:${config.PORT}`,
    isDevelopment: config.NODE_ENV === 'development',
    isProduction: config.NODE_ENV === 'production',
    isTest: config.NODE_ENV === 'test'
  },
  
  // Database
  database: {
    url: config.DATABASE_URL
  },
  
  // Authentication
  auth: {
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN,
    bcryptRounds: config.BCRYPT_ROUNDS
  },
  
  // Security
  security: {
    rateLimit: {
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      maxRequests: config.RATE_LIMIT_MAX_REQUESTS
    },
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: config.CORS_CREDENTIALS
    },
    proxy: {
      trust: config.TRUST_PROXY
    }
  },
  
  // Logging
  logging: {
    level: config.LOG_LEVEL,
    filePath: config.LOG_FILE_PATH
  },
  
  // Cache
  cache: {
    ttlSeconds: config.CACHE_TTL_SECONDS,
    maxItems: config.CACHE_MAX_ITEMS
  },
  
  // File Upload
  upload: {
    maxFileSizeMB: config.MAX_FILE_SIZE_MB,
    maxFileSizeBytes: config.MAX_FILE_SIZE_MB * 1024 * 1024,
    uploadDir: config.UPLOAD_DIR
  },
  
  // Email
  email: {
    smtp: {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    },
    enabled: !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS)
  },
  
  // Monitoring
  monitoring: {
    healthCheckIntervalMs: config.HEALTH_CHECK_INTERVAL_MS
  },
  
  // Features
  features: {
    swagger: config.ENABLE_SWAGGER,
    metrics: config.ENABLE_METRICS,
    auditLog: config.ENABLE_AUDIT_LOG
  }
};

// Helper function to get required environment variable
export const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
};

// Helper function to get optional environment variable with default
export const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

// Configuration summary for logging
export const getConfigSummary = () => {
  return {
    environment: appConfig.server.env,
    port: appConfig.server.port,
    logLevel: appConfig.logging.level,
    features: appConfig.features,
    rateLimit: appConfig.security.rateLimit,
    cacheConfig: appConfig.cache
  };
};

// Log configuration on startup (lazily import logger to avoid circular dependency)
if (!appConfig.server.isTest) {
  import('../utils/logger').then(({ logger }) => {
    logger.info(getConfigSummary(), 'Application configuration loaded');
  });
}