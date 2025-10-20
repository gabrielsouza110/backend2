import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';
import { logger } from '../utils/logger';

export const validate = (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (e: any) {
      const errors = e.errors || [];
      const errorMessages = errors.map((err: any) => ({
        field: err.path?.join('.') || 'unknown',
        message: err.message,
        code: err.code
      }));
      
      logger.warn(`Validation error: ${JSON.stringify(errorMessages)}`);
      
      return res.status(400).json({
        error: 'Erro de validação',
        details: errorMessages,
        received: {
          body: req.body,
          query: req.query,
          params: req.params
        }
      });
    }
  };