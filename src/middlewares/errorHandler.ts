import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error classification helper
const classifyError = (error: any): { statusCode: number; message: string; code?: string; details?: any } => {
  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Dados de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          statusCode: 409,
          message: 'Registro duplicado - dados já existem',
          code: 'DUPLICATE_ENTRY',
          details: { field: error.meta?.target }
        };
      case 'P2025':
        return {
          statusCode: 404,
          message: 'Registro não encontrado',
          code: 'NOT_FOUND'
        };
      case 'P2003':
        return {
          statusCode: 400,
          message: 'Violação de chave estrangeira',
          code: 'FOREIGN_KEY_CONSTRAINT',
          details: { field: error.meta?.field_name }
        };
      case 'P2014':
        return {
          statusCode: 400,
          message: 'Relação inválida entre entidades',
          code: 'RELATION_VIOLATION'
        };
      default:
        return {
          statusCode: 500,
          message: 'Erro interno do banco de dados',
          code: 'DATABASE_ERROR'
        };
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expirado',
      code: 'EXPIRED_TOKEN'
    };
  }

  // Custom app errors
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  // Default error
  return {
    statusCode: 500,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR'
  };
};

// Global error handler middleware
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('Global error handler called with:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  
  const { statusCode, message, code, details } = classifyError(error);

  // Log error details
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    },
    timestamp: new Date().toISOString()
  }, `Error ${statusCode}: ${message}`);

  // Send error response
  const response: any = {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  };

  if (code) {
    response.code = code;
  }

  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper for controllers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Rota ${req.method} ${req.originalUrl} não encontrada`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
};