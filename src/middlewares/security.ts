import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { appConfig } from '../config/environment';

// IP whitelist for development/admin access
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Enhanced rate limiting with different tiers
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs || appConfig.security.rateLimit.windowMs,
    max: options.max || appConfig.security.rateLimit.maxRequests,
    message: {
      error: options.message || 'Muitas requisições deste IP, tente novamente mais tarde',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((options.windowMs || appConfig.security.rateLimit.windowMs) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    // Removed custom keyGenerator to use default IPv6-safe implementation
    handler: (req: Request, res: Response) => {
      logger.warn({
        ip: req.ip,
        path: req.path,
        method: req.method,
        headers: req.headers,
        timestamp: new Date().toISOString()
      }, 'Rate limit exceeded');
      
      res.status(429).json({
        success: false,
        error: options.message || 'Muitas requisições deste IP, tente novamente mais tarde',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((options.windowMs || appConfig.security.rateLimit.windowMs) / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
// TESTING CONFIGURATION - More permissive limits for development/testing
export const rateLimiters = {
  // General API rate limit - Very permissive for testing
  general: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
    max: 10000, // 10000 requests per window (increased from 1000)
    message: 'Muitas requisições gerais, tente novamente em 1 minuto'
  }),
  
  // More permissive rate limit for authentication endpoints - FOR TESTING
  auth: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
    max: 100, // 100 attempts per window (increased from 5)
    message: 'Muitas tentativas de login, tente novamente em 1 minuto',
    skipSuccessfulRequests: true
  }),
  
  // Very permissive rate limit for API mutations - FOR TESTING
  mutations: createRateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute (reduced from 5 minutes)
    max: 5000, // 5000 requests per window (increased from 100)
    message: 'Muitas operações de escrita, tente novamente em 1 minuto'
  }),
  
  // Very lenient rate limit for read operations - FOR TESTING
  reads: createRateLimit({
    windowMs: 30 * 1000, // 30 seconds (reduced from 1 minute)
    max: 5000, // 5000 requests per window (increased from 200)
    message: 'Muitas consultas, tente novamente em 30 segundos'
  })
};

// Note: Speed limiter temporarily disabled due to missing dependency
// export const speedLimiter = slowDown({ ... });

// Enhanced helmet configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow cross-origin requests for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Request size limiter
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = appConfig.upload.maxFileSizeBytes;
  
  if (contentLength > maxSize) {
    logger.warn({
      ip: req.ip,
      contentLength,
      maxSize,
      path: req.path
    }, 'Request size exceeded limit');
    
    return res.status(413).json({
      success: false,
      error: `Tamanho da requisição excede o limite de ${appConfig.upload.maxFileSizeMB}MB`,
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  
  next();
};

// IP whitelist middleware for admin endpoints
export const adminIPWhitelist = (req: Request, res: Response, next: NextFunction) => {
  if (appConfig.server.isProduction && ADMIN_IP_WHITELIST.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!ADMIN_IP_WHITELIST.includes(clientIP || '')) {
      logger.warn({
        ip: clientIP,
        path: req.path,
        method: req.method
      }, 'Unauthorized IP attempted admin access');
      
      return res.status(403).json({
        success: false,
        error: 'Acesso negado para este IP',
        code: 'IP_NOT_WHITELISTED'
      });
    }
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed with error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });
  
  next();
};

// Security middleware stack
export const securityMiddleware = [
  securityHeaders,
  requestSizeLimiter,
  // speedLimiter, // Temporarily disabled
  requestLogger
];

// Combined security setup function
export const setupSecurity = () => {
  logger.info('Security middleware configured');
  return securityMiddleware;
};