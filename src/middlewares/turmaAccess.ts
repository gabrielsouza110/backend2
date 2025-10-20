import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { ResponseHandler } from '../utils/responseHandler';
import { AdminType } from '../types/admin';
import { PermissionUtils } from '../utils/permissionUtils';
import { prisma } from '../models/database';

/**
 * Middleware to check if a user can access a specific turma
 * @param turmaIdParam - Parameter name containing the turma ID (default: 'turmaId')
 */
export const requireTurmaAccess = (turmaIdParam: string = 'turmaId') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userType = req.user?.tipo as AdminType;
      const userId = req.user?.id;
      
      // Admin geral pode acessar qualquer turma
      if (userType === AdminType.ADMIN_GERAL) {
        return next();
      }
      
      // Para admin turma, verificar se a turma é a mesma
      if (userType === AdminType.ADMIN_TURMA && userId) {
        // Extrair turmaId do corpo, params ou query
        const targetTurmaId = 
          parseInt(req.body[turmaIdParam] || req.params[turmaIdParam] || req.query[turmaIdParam] as string);
        
        // Se não houver turmaId especificada, permitir (para operações gerais)
        if (isNaN(targetTurmaId)) {
          return next();
        }
        
        // Buscar o usuário com informações da turma
        const adminUser = await prisma.usuario.findUnique({
          where: { id: userId },
          select: {
            turmaId: true
          }
        });
        
        // Verificar se o admin tem acesso à turma especificada
        if (PermissionUtils.canAccessTurma(userType, adminUser?.turmaId || undefined, targetTurmaId)) {
          return next();
        }
        
        return ResponseHandler.forbidden(res, `Acesso negado - você só pode acessar recursos da sua turma (${adminUser?.turmaId})`);
      }
      
      return ResponseHandler.forbidden(res, 'Acesso negado - requer privilégios de administrador');
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao verificar permissões de turma', 500);
    }
  };
};

/**
 * Middleware to check if a user can access any of the specified turmas
 * @param turmaIdParams - Array of parameter names containing turma IDs
 */
export const requireAnyTurmaAccess = (turmaIdParams: string[] = ['turmaId']) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userType = req.user?.tipo as AdminType;
      const userId = req.user?.id;
      
      // Admin geral pode acessar qualquer turma
      if (userType === AdminType.ADMIN_GERAL) {
        return next();
      }
      
      // Para admin turma, verificar se pelo menos uma das turmas é a mesma
      if (userType === AdminType.ADMIN_TURMA && userId) {
        // Extrair todas as turmaIds dos parâmetros especificados
        const targetTurmaIds = turmaIdParams
          .map(param => parseInt(req.body[param] || req.params[param] || req.query[param] as string))
          .filter(id => !isNaN(id));
        
        // Se não houver turmaIds especificadas, permitir (para operações gerais)
        if (targetTurmaIds.length === 0) {
          return next();
        }
        
        // Buscar o usuário com informações da turma
        const adminUser = await prisma.usuario.findUnique({
          where: { id: userId },
          select: {
            turmaId: true
          }
        });
        
        // Verificar se o admin tem acesso a pelo menos uma das turmas especificadas
        const hasAccess = targetTurmaIds.some(targetTurmaId => 
          PermissionUtils.canAccessTurma(userType, adminUser?.turmaId || undefined, targetTurmaId)
        );
        
        if (hasAccess) {
          return next();
        }
        
        return ResponseHandler.forbidden(res, `Acesso negado - você só pode acessar recursos da sua turma (${adminUser?.turmaId})`);
      }
      
      return ResponseHandler.forbidden(res, 'Acesso negado - requer privilégios de administrador');
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao verificar permissões de turma', 500);
    }
  };
};