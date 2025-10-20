import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuarioModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { AdminType, ADMIN_PERMISSIONS, UserWithPermissions } from '../types/admin';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
  private static generateToken(usuario: any) {
    return jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        tipo: usuario.tipo
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  private static formatUsuarioResponse(usuario: any): UserWithPermissions {
    const userType = usuario.tipo as AdminType;
    const permissions = ADMIN_PERMISSIONS[userType as AdminType] || ADMIN_PERMISSIONS[AdminType.ADMIN_TURMA];
    
    return { 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email, 
      tipo: userType,
      ativo: usuario.ativo,
      permissions
    };
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;
      
      // Log da tentativa de login (sem dados sensíveis)
      logger.info({ email, ip: req.ip }, 'Tentativa de login');
      
      // Verificar se o JWT_SECRET está definido
      if (!process.env.JWT_SECRET) {
        logger.error('JWT_SECRET não está definido no ambiente');
        return res.status(500).json({
          error: 'Configuração de segurança não encontrada',
          details: 'JWT_SECRET não está definido'
        });
      }

      let usuario;
      try {
        usuario = await UsuarioModel.findByEmailWithPassword(email);
      } catch (dbError) {
        // Log do erro de banco de dados
        logger.error({ error: dbError, email }, 'Erro ao buscar usuário no banco de dados');
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: 'Erro de conectividade com o banco de dados'
        });
      }

      if (!usuario) {
        logger.warn({ email, ip: req.ip }, 'Tentativa de login com email inexistente');
        return res.status(401).json({
          error: 'Credenciais inválidas',
          details: 'Usuário não encontrado'
        });
      }

      // Verificar se a senha está correta
      let senhaValida;
      try {
        senhaValida = await UsuarioModel.verificarSenha(senha, usuario.senha);
      } catch (bcryptError) {
        logger.error({ error: bcryptError, userId: usuario.id }, 'Erro ao verificar senha');
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: 'Erro na verificação de autenticação'
        });
      }
      
      if (!senhaValida) {
        logger.warn({ email, userId: usuario.id, ip: req.ip }, 'Tentativa de login com senha incorreta');
        return res.status(401).json({
          error: 'Credenciais inválidas',
          details: 'Senha incorreta'
        });
      }

      // Gerar token
      let token;
      let usuarioResponse;
      try {
        token = AuthController.generateToken(usuario);
        usuarioResponse = AuthController.formatUsuarioResponse(usuario);
      } catch (tokenError) {
        logger.error({ error: tokenError, userId: usuario.id }, 'Erro ao gerar token JWT');
        return res.status(500).json({
          error: 'Erro interno do servidor',
          details: 'Erro na geração de token de autenticação'
        });
      }

      // Log de login bem-sucedido
      logger.info({ 
        userId: usuario.id, 
        email: usuario.email, 
        tipo: usuario.tipo, 
        ip: req.ip 
      }, 'Login realizado com sucesso');

      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token: token,
        usuario: usuarioResponse
      });

    } catch (error) {
      // Log de erro inesperado com detalhes
      logger.error({ 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        ip: req.ip,
        body: req.body ? { email: req.body.email } : undefined
      }, 'Erro inesperado no processo de login');
      
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Erro inesperado no processo de autenticação'
      });
    }
  }
  
  // New register method for admin-only user creation
  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, email, senha, tipo, turmaId } = req.body;
      
      // Check if requester is admin
      const userType = req.user?.tipo as AdminType;
      if (!userType || (userType !== AdminType.ADMIN_GERAL && userType !== AdminType.ADMIN_TURMA)) {
        return ResponseHandler.forbidden(res, 'Acesso negado - apenas administradores podem registrar usuários');
      }
      
      // Validate required fields
      if (!nome || !email || !senha || !tipo) {
        return ResponseHandler.badRequest(res, 'Campos obrigatórios faltando');
      }
      
      // Specific validation for admin_turma
      if (tipo === 'admin_turma' && !turmaId) {
        return ResponseHandler.badRequest(res, 'Admin de turma deve ter turmaId informado');
      }
      
      // Admin geral should not have turmaId
      if (tipo === 'admin_geral' && turmaId) {
        return ResponseHandler.badRequest(res, 'Admin geral não deve ter turmaId informado');
      }
      
      // Check if email already exists
      const existingUser = await prisma.usuario.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return ResponseHandler.conflict(res, 'Email já está em uso');
      }
      
      // Permission checks based on admin type
      if (userType === AdminType.ADMIN_TURMA) {
        // Admin turma can only create users for their own turma
        const adminUser = await prisma.usuario.findUnique({
          where: { id: req.user!.id }
        });
        
        if (!adminUser || !adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma deve estar associado a uma turma');
        }
        
        // If creating admin_turma, must be for the same turma
        if (tipo === 'admin_turma' && turmaId !== adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma só pode criar usuários para sua própria turma');
        }
        
        // Cannot create admin_geral
        if (tipo === 'admin_geral') {
          return ResponseHandler.forbidden(res, 'Admin de turma não pode criar administrador geral');
        }
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(senha, 12);
      
      // Create user
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: hashedPassword,
          tipo,
          turmaId: turmaId || null
        },
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          turmaId: true,
          ativo: true,
          criadoEm: true
        }
      });
      
      // Audit log
      logger.info({
        action: 'USER_CREATED',
        createdBy: req.user?.email,
        createdUserId: newUser.id,
        createdUserEmail: newUser.email,
        createdUserType: newUser.tipo
      }, 'Novo usuário criado');
      
      return ResponseHandler.created(res, {
        user: newUser,
        message: 'Usuário criado com sucesso'
      });
      
    } catch (error) {
      logger.error({ error, body: req.body }, 'Erro ao registrar usuário');
      
      // Handle Prisma errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        
        if (prismaError.code === 'P2002') {
          return ResponseHandler.conflict(res, 'Email já está em uso');
        }
        
        if (prismaError.code === 'P2003') {
          return ResponseHandler.badRequest(res, 'Dados de referência inválidos (turmaId não existe)');
        }
      }
      
      return ResponseHandler.error(res, 'Erro interno ao registrar usuário');
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, email, senha, tipo, turmaId, ativo } = req.body;
      const userId = parseInt(id);
      
      // Check if requester is admin
      const userType = req.user?.tipo as AdminType;
      if (!userType || (userType !== AdminType.ADMIN_GERAL && userType !== AdminType.ADMIN_TURMA)) {
        return ResponseHandler.forbidden(res, 'Acesso negado - apenas administradores podem atualizar usuários');
      }
      
      // Check if user exists
      const existingUser = await prisma.usuario.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        return ResponseHandler.notFound(res, 'Usuário não encontrado');
      }
      
      // Permission checks based on admin type
      if (userType === AdminType.ADMIN_TURMA) {
        // Admin turma can only manage users from their own turma
        const adminUser = await prisma.usuario.findUnique({
          where: { id: req.user!.id }
        });
        
        if (!adminUser || !adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma deve estar associado a uma turma');
        }
        
        // Cannot manage admin_geral
        if (existingUser.tipo === 'admin_geral') {
          return ResponseHandler.forbidden(res, 'Admin de turma não pode gerenciar administrador geral');
        }
        
        // Can only manage users from the same turma
        if (existingUser.turmaId !== adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma só pode gerenciar usuários da mesma turma');
        }
        
        // Cannot promote to admin_geral
        if (tipo === 'admin_geral') {
          return ResponseHandler.forbidden(res, 'Admin de turma não pode promover usuário a administrador geral');
        }
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (nome !== undefined) updateData.nome = nome;
      if (email !== undefined) updateData.email = email;
      if (senha !== undefined) updateData.senha = await bcrypt.hash(senha, 12);
      if (tipo !== undefined) updateData.tipo = tipo;
      if (turmaId !== undefined) updateData.turmaId = turmaId;
      if (ativo !== undefined) updateData.ativo = ativo;
      
      // Validate business rules for tipo
      if (tipo) {
        // Admin turma must have turmaId
        if (tipo === 'admin_turma' && turmaId === undefined && !existingUser.turmaId) {
          return ResponseHandler.badRequest(res, 'Admin de turma deve ter turmaId informado');
        }
        
        // Admin geral should not have turmaId
        if (tipo === 'admin_geral' && (turmaId || existingUser.turmaId)) {
          updateData.turmaId = null; // Remove turmaId if becoming admin geral
        }
      }
      
      // Update user
      const updatedUser = await prisma.usuario.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          nome: true,
          email: true,
          tipo: true,
          turmaId: true,
          ativo: true,
          criadoEm: true,
          atualizadoEm: true
        }
      });
      
      // Audit log
      logger.info({
        action: 'USER_UPDATED',
        updatedBy: req.user?.email,
        updatedUserId: updatedUser.id,
        changes: updateData
      }, 'Usuário atualizado');
      
      return ResponseHandler.success(res, {
        user: updatedUser,
        message: 'Usuário atualizado com sucesso'
      });
      
    } catch (error) {
      logger.error({ error, params: req.params, body: req.body }, 'Erro ao atualizar usuário');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno ao atualizar usuário');
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      // Check if requester is admin
      const userType = req.user?.tipo as AdminType;
      if (!userType || (userType !== AdminType.ADMIN_GERAL && userType !== AdminType.ADMIN_TURMA)) {
        return ResponseHandler.forbidden(res, 'Acesso negado - apenas administradores podem excluir usuários');
      }
      
      // Check if user exists
      const existingUser = await prisma.usuario.findUnique({
        where: { id: userId }
      });
      
      if (!existingUser) {
        return ResponseHandler.notFound(res, 'Usuário não encontrado');
      }
      
      // Prevent self-deletion
      if (req.user?.id === userId) {
        return ResponseHandler.forbidden(res, 'Não é possível excluir sua própria conta');
      }
      
      // Permission checks based on admin type
      if (userType === AdminType.ADMIN_TURMA) {
        // Admin turma can only manage users from their own turma
        const adminUser = await prisma.usuario.findUnique({
          where: { id: req.user!.id }
        });
        
        if (!adminUser || !adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma deve estar associado a uma turma');
        }
        
        // Cannot manage admin_geral
        if (existingUser.tipo === 'admin_geral') {
          return ResponseHandler.forbidden(res, 'Admin de turma não pode gerenciar administrador geral');
        }
        
        // Can only manage users from the same turma
        if (existingUser.turmaId !== adminUser.turmaId) {
          return ResponseHandler.forbidden(res, 'Admin de turma só pode gerenciar usuários da mesma turma');
        }
      }
      
      // Prevent deletion of the last admin_geral
      if (existingUser.tipo === 'admin_geral') {
        const activeAdminGeralCount = await prisma.usuario.count({
          where: {
            tipo: 'admin_geral',
            ativo: true
          }
        });
        
        if (activeAdminGeralCount <= 1) {
          return ResponseHandler.forbidden(res, 'Não é possível excluir o último administrador geral do sistema');
        }
      }
      
      // Delete user
      await prisma.usuario.delete({
        where: { id: userId }
      });
      
      // Audit log
      logger.info({
        action: 'USER_DELETED',
        deletedBy: req.user?.email,
        deletedUserId: userId,
        deletedUserEmail: existingUser.email,
        deletedUserType: existingUser.tipo
      }, 'Usuário excluído');
      
      return ResponseHandler.success(res, {
        message: 'Usuário excluído com sucesso'
      });
      
    } catch (error) {
      logger.error({ error, params: req.params }, 'Erro ao excluir usuário');
      return ResponseHandler.error(res, 'Erro interno ao excluir usuário');
    }
  }

  static async verifyToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return ResponseHandler.unauthorized(res, 'Token inválido ou expirado');
      }

      const usuario = await UsuarioModel.findById(req.user.id);
      
      if (!usuario) {
        return ResponseHandler.notFound(res, 'Usuário não encontrado');
      }
      
      const usuarioResponse = AuthController.formatUsuarioResponse(usuario);
      return ResponseHandler.success(res, { usuario: usuarioResponse });
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao verificar token');
    }
  }

  static async getPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return ResponseHandler.unauthorized(res, 'Token inválido ou expirado');
      }

      const userType = req.user.tipo as AdminType;
      const permissions = ADMIN_PERMISSIONS[userType as AdminType] || ADMIN_PERMISSIONS[AdminType.ADMIN_TURMA];
      
      return ResponseHandler.success(res, { 
        userType, 
        permissions,
        description: `Usuário tipo: ${userType}`
      });
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao obter permissões');
    }
  }
}