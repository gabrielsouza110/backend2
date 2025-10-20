import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/database';
import { AdminType } from '../types/admin';
import { logger } from '../utils/logger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { UsuarioModel } from '../models/usuarioModel';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo: string;
    isAdmin: boolean;
    isAdminGeral: boolean;
    isAdminTurma: boolean;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) return res.sendStatus(403);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      tipo: decoded.tipo,
      isAdmin: UsuarioModel.isAdmin({ tipo: decoded.tipo }),
      isAdminGeral: UsuarioModel.isAdminGeral({ tipo: decoded.tipo }),
      isAdminTurma: UsuarioModel.isAdminTurma({ tipo: decoded.tipo })
    };
    
    next();
  });
};

export const requireAdminGeral = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdminGeral) {
    return res.status(403).json({ error: 'Acesso negado - requer privilégios de administrador geral' });
  }
  next();
};

export const requireAdminTurma = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdminTurma) {
    return res.status(403).json({ error: 'Acesso negado - requer privilégios de administrador de turma' });
  }
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado - requer privilégios administrativos' });
  }
  next();
};

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "https: 'unsafe-inline'"]
      }
    }
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP'
  })
];