import { Request, Response } from 'express';
import { UsuarioModel } from '../models/usuarioModel';
import { AuthenticatedRequest } from '../middlewares/auth';

export class UsuariosController {
  static async getAdminsByTurma(req: Request, res: Response) {
    try {
      const { turmaId } = req.params;
      const turmaIdNum = parseInt(turmaId);
      if (isNaN(turmaIdNum)) {
        return res.status(400).json({ error: 'Invalid class id' });
      }
      const admins = await UsuarioModel.findAdminsByTurma(turmaIdNum);
      return res.json(admins);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar administradores da turma' });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      // Usar o modelo para buscar todos os usuários (versão pública)
      const usuarios = await UsuarioModel.findAllPublic();
      
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  /**
   * Busca todos os usuários com informações completas (apenas para administradores)
   */
  static async getAllAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      // Verificar se o usuário é administrador
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado - requer privilégios administrativos' });
      }

      // Usar o modelo para buscar todos os usuários (versão completa)
      const usuarios = await UsuarioModel.findAllAdmin();
      
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nome, email, senha, tipo, turmaId } = req.body;
      
      // Validação básica dos campos obrigatórios
      if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios faltando',
          required: ['nome', 'email', 'senha', 'tipo'],
          received: { nome: !!nome, email: !!email, senha: !!senha, tipo: !!tipo }
        });
      }
      
      // Verificação específica para admin_turma
      if (tipo === 'admin_turma' && !turmaId) {
        return res.status(400).json({ 
          error: 'Admin de turma deve ter turmaId informado'
        });
      }
      
      // Admin geral não deve ter turmaId
      if (tipo === 'admin_geral' && turmaId) {
        return res.status(400).json({ 
          error: 'Admin geral não deve ter turmaId informado'
        });
      }
      
      // Verificar se o email já existe
      const usuarioExistente = await UsuarioModel.findByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ 
          error: 'Email já está em uso',
          email: email
        });
      }
      
      // Usar o modelo para criar o usuário
      const usuario = await UsuarioModel.create(nome, email, senha, tipo, turmaId);
      
      res.status(201).json({
        message: 'Usuário criado com sucesso',
        usuario: usuario
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      
      // Tratar erros específicos do Prisma
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as any;
        
        if (prismaError.code === 'P2002') {
          return res.status(400).json({ 
            error: 'Email já está em uso',
            code: 'DUPLICATE_EMAIL'
          });
        }
        
        if (prismaError.code === 'P2003') {
          return res.status(400).json({ 
            error: 'Dados de referência inválidos (turmaId não existe)',
            code: 'FOREIGN_KEY_CONSTRAINT'
          });
        }
      }
      
      // Tratar erros específicos
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Erro interno do servidor ao criar usuário',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      });
    }
  }
  
  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Usar o modelo para buscar o usuário
      const usuario = await UsuarioModel.findById(idNum);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      const { id } = req.params;
      const { nome, email, senha, tipo, turmaId, ativo } = req.body;
      const idNum = parseInt(id);
      
      // Verificar se o usuário existe
      const usuarioExistente = await UsuarioModel.findById(idNum);
      
      if (!usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verificar permissão (apenas o próprio usuário ou um admin pode atualizar)
      if (req.user.id !== parseInt(id) && !req.user.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      
      // Preparação e validação dos dados
      const updateData: any = {};
      if (nome !== undefined) updateData.nome = nome;
      if (email !== undefined) updateData.email = email;
      if (senha !== undefined) updateData.senha = senha;
      if (tipo !== undefined) updateData.tipo = tipo;
      if (turmaId !== undefined) updateData.turmaId = turmaId;
      if (ativo !== undefined) updateData.ativo = ativo;
      
      // Validação de negócio para tipo
      if (tipo) {
        // Admin turma deve ter turmaId
        if (tipo === 'admin_turma' && turmaId === undefined && !usuarioExistente.turmaId) {
          return res.status(400).json({ 
            error: 'Admin de turma deve ter turmaId informado'
          });
        }
        
        // Admin geral não deve ter turmaId
        if (tipo === 'admin_geral' && (turmaId || usuarioExistente.turmaId)) {
          updateData.turmaId = null; // Remove turmaId se for admin geral
        }
      }
      
      // Usar o modelo para atualizar o usuário
      const usuarioAtualizado = await UsuarioModel.update(idNum, updateData);
      
      res.json(usuarioAtualizado);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Verificar se o usuário existe
      const usuarioExistente = await UsuarioModel.findById(idNum);
      
      if (!usuarioExistente) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Verificar permissão básica (apenas admin pode excluir)
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado - apenas administradores podem excluir usuários' });
      }
      
      // Impedir auto-exclusão
      if (req.user.id === idNum) {
        return res.status(403).json({ error: 'Não é possível excluir sua própria conta' });
      }
      
      // Controle hierárquico: admin_turma NÃO pode excluir admin_geral
      if (req.user.tipo === 'admin_turma' && usuarioExistente.tipo === 'admin_geral') {
        return res.status(403).json({ 
          error: 'Acesso negado - admin de turma não pode excluir administrador geral'
        });
      }
      
      // admin_turma só pode excluir outros admin_turma da mesma turma
      if (req.user.tipo === 'admin_turma' && usuarioExistente.tipo === 'admin_turma') {
        // Buscar turmaId do usuário atual
        const currentUser = await UsuarioModel.findById(req.user.id);
        if (!currentUser || !currentUser.turmaId) {
          return res.status(403).json({ error: 'Admin de turma deve estar associado a uma turma' });
        }
        
        // Verificar se é da mesma turma
        if (usuarioExistente.turmaId !== currentUser.turmaId) {
          return res.status(403).json({ 
            error: 'Admin de turma só pode excluir usuários da mesma turma'
          });
        }
      }
      
      // Log de auditoria
      console.log(`[AUDIT] Usuário excluído por ${req.user.email} (${req.user.tipo}): ${usuarioExistente.email} (${usuarioExistente.tipo})`);
      
      // Usar o modelo para excluir o usuário
      await UsuarioModel.delete(idNum);
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
  }
}