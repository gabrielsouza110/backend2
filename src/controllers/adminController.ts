import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { requireAdminGeral } from '../middlewares/permissions';
import { AdminType } from '../types/admin';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * Lista todos os usuários (apenas admin geral)
   */
  static async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if summary mode is requested
      const isSummary = req.query.summary === 'true' || req.query.summary === '1';
      
      if (isSummary) {
        // Return only essential fields for list view
        const users = await prisma.usuario.findMany({
          select: {
            id: true,
            nome: true,
            tipo: true,
            ativo: true
          },
          orderBy: [
            { tipo: 'asc' },
            { nome: 'asc' }
          ]
        });

        // Agrupar por tipo para melhor visualização
        const usersByType = users.reduce((acc, user) => {
          if (!acc[user.tipo]) acc[user.tipo] = [];
          acc[user.tipo].push(user);
          return acc;
        }, {} as Record<string, typeof users>);

        return ResponseHandler.success(res, {
          total: users.length,
          usersByType,
          message: 'Usuários listados com sucesso (resumo)'
        });
      } else {
        // Return full details
        const users = await prisma.usuario.findMany({
          select: {
            id: true,
            nome: true,
            email: true,
            tipo: true,
            ativo: true,
            criadoEm: true,
            ultimoLogin: true,
            turmaId: true
          },
          orderBy: [
            { tipo: 'asc' },
            { nome: 'asc' }
          ]
        });

        // Agrupar por tipo para melhor visualização
        const usersByType = users.reduce((acc, user) => {
          if (!acc[user.tipo]) acc[user.tipo] = [];
          acc[user.tipo].push(user);
          return acc;
        }, {} as Record<string, typeof users>);

        return ResponseHandler.success(res, {
          total: users.length,
          usersByType,
          message: 'Usuários listados com sucesso'
        });
      }

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return ResponseHandler.error(res, 'Erro interno ao listar usuários');
    }
  }

  /**
   * Estatísticas dos usuários (apenas admin geral)
   */
  static async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      const totalUsers = await prisma.usuario.count();
      const activeUsers = await prisma.usuario.count({ where: { ativo: true } });
      const inactiveUsers = await prisma.usuario.count({ where: { ativo: false } });

      const usersByType = await prisma.usuario.groupBy({
        by: ['tipo'],
        _count: { tipo: true },
        where: { ativo: true }
      });

      const recentUsers = await prisma.usuario.findMany({
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          criadoEm: true
        },
        orderBy: { criadoEm: 'desc' },
        take: 5
      });

      return ResponseHandler.success(res, {
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byType: usersByType.reduce((acc, item) => {
            acc[item.tipo] = item._count.tipo;
            return acc;
          }, {} as Record<string, number>)
        },
        recentUsers,
        message: 'Estatísticas obtidas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return ResponseHandler.error(res, 'Erro interno ao obter estatísticas');
    }
  }
}