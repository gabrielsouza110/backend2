import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { TurmaModel } from '../models/turmaModel';
import { JogadorModel } from '../models/jogadorModel';
import { ResponseHandler } from '../utils/responseHandler';

export class TurmasController {
  static async getAll(req: Request, res: Response) {
    try {
      const turmas = await TurmaModel.findAll();
      return res.json(turmas);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar turmas' });
    }
  }
  
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      const turma = await TurmaModel.findById(idNum);
      
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      return res.json(turma);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar turma' });
    }
  }
  
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, serie, turno, edicaoId } = req.body;
      
      // Validar dados obrigatórios
      if (!nome || !serie || !turno) {
        return res.status(400).json({ 
          error: 'Nome, série e turno são obrigatórios' 
        });
      }
      
      // If edicaoId is not provided, use the current edition
      let edicaoIdToUse = edicaoId;
      if (edicaoIdToUse === undefined) {
        const { EditionUtils } = await import('../utils/editionUtils');
        edicaoIdToUse = await EditionUtils.getCurrentEditionId();
      }
      
      // Verificar se já existe uma turma com o mesmo nome
      const turmaExistente = await TurmaModel.findByNome(nome);
      
      if (turmaExistente) {
        return res.status(400).json({ error: 'Já existe uma turma com este nome' });
      }
      
      // Criar a turma
      const turma = await TurmaModel.create(nome, parseInt(serie), turno, edicaoIdToUse ? parseInt(edicaoIdToUse) : undefined);
      
      return res.status(201).json(turma);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao criar turma' });
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      const { nome, serie, turno, edicaoId } = req.body;
      
      // Verificar se a turma existe
      const turma = await TurmaModel.findById(idNum);
      
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      // Verificar se já existe outra turma com o mesmo nome
      if (nome && nome !== turma.nome) {
        const turmaExistente = await TurmaModel.findByNomeExcluindoId(nome, idNum);
        
        if (turmaExistente) {
          return res.status(400).json({ error: 'Já existe outra turma com este nome' });
        }
      }
      
      // If edicaoId is not provided, keep the existing one
      let edicaoIdToUse = edicaoId;
      if (edicaoIdToUse === undefined) {
        edicaoIdToUse = turma.edicaoId;
      }
      
      // Atualizar a turma
      const turmaAtualizada = await TurmaModel.update(
        idNum, 
        nome, 
        serie ? parseInt(serie) : undefined, 
        turno, 
        edicaoIdToUse ? parseInt(edicaoIdToUse) : undefined
      );
      
      return res.json(turmaAtualizada);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar turma' });
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Verificar se a turma existe com suas relações
      const turma = await TurmaModel.findByIdWithRelations(idNum);
      
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      // Verificar se há dados relacionados
      if (turma.alunos.length > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir esta turma pois existem alunos associados',
          detalhes: {
            alunos: turma.alunos.length
          }
        });
      }
      
      // Excluir a turma
      await TurmaModel.delete(idNum);
      
      return res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir turma' });
    }
  }
  
  /**
   * Get the time associated with a turma
   */
  static async getTimeForTurma(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      const turma = await TurmaModel.findById(idNum);
      
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      // For now, return null for time since this needs to be updated
      // when the Prisma client is regenerated
      return res.json({
        turma: {
          id: turma.id,
          nome: turma.nome,
          serie: turma.serie,
          turno: turma.turno
        },
        time: null
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar time da turma' });
    }
  }
  
  /**
   * Assign a time to a turma
   */
  static async assignTimeToTurma(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { timeId } = req.body;
      const turmaId = parseInt(id);
      
      if (!timeId) {
        return res.status(400).json({ error: 'ID do time é obrigatório' });
      }
      
      const turma = await TurmaModel.findById(turmaId);
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      // For now, return a success response since this needs to be updated
      // when the Prisma client is regenerated
      return res.json({
        message: 'Associação solicitada com sucesso',
        turma: {
          id: turma.id,
          nome: turma.nome
        },
        timeId
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao associar turma ao time' });
    }
  }
  
  /**
   * Remove time assignment from a turma
   */
  static async removeTimeFromTurma(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const turmaId = parseInt(id);
      
      const turma = await TurmaModel.findById(turmaId);
      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }
      
      // For now, return a success response since this needs to be updated
      // when the Prisma client is regenerated
      return res.json({
        message: 'Remoção solicitada com sucesso',
        turma: {
          id: turma.id,
          nome: turma.nome
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao remover turma do time' });
    }
  }
  
  /**
   * Get all players for a specific turma
   */
  static async getPlayersByTurma(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Validate turma ID
      if (isNaN(idNum)) {
        return ResponseHandler.badRequest(res, 'ID da turma inválido');
      }
      
      // Check if turma exists
      const turma = await TurmaModel.findById(idNum);
      if (!turma) {
        return ResponseHandler.notFound(res, 'Turma não encontrada');
      }
      
      // Get players for this turma
      const players = await JogadorModel.findByTurma(idNum);
      
      return ResponseHandler.success(res, {
        turma: {
          id: turma.id,
          nome: turma.nome
        },
        jogadores: players,
        total: players.length
      });
    } catch (error) {
      console.error('Erro ao buscar jogadores da turma:', error);
      return ResponseHandler.error(res, 'Erro ao buscar jogadores da turma');
    }
  }
}