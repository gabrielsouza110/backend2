import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { JogadorModel } from '../models/jogadorModel';
import { prisma } from '../models/database'; // Mantido para verificações específicas
import { EditionUtils } from '../utils/editionUtils';
import { ResponseHandler } from '../utils/responseHandler';

export class JogadoresController {
  static async getAll(req: Request, res: Response) {
    try {
      const { edicaoId, modalidadeId, page = '1', limit = '20' } = req.query;

      const edicaoIdNum = edicaoId ? parseInt(edicaoId as string) : undefined;
      const modalidadeIdNum = modalidadeId ? parseInt(modalidadeId as string) : undefined;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      // Validate pagination parameters
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: 'Parâmetro page inválido. Deve ser um número maior que 0.' });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ error: 'Parâmetro limit inválido. Deve ser um número entre 1 e 100.' });
      }

      // Calculate offset for pagination
      const offset = (pageNum - 1) * limitNum;

      // Get total count for pagination info
      const totalCount = await JogadorModel.count(edicaoIdNum, modalidadeIdNum);
      
      // Get paginated players
      const jogadores = await JogadorModel.findAllPaginated(edicaoIdNum, modalidadeIdNum, offset, limitNum);

      // Return paginated response
      return res.json({
        data: jogadores,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount: totalCount,
          pageSize: limitNum
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar jogadores' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);

      const jogador = await JogadorModel.findCompleteById(idNum);

      if (!jogador) {
        return res.status(404).json({ error: 'Jogador não encontrado' });
      }

      return res.json(jogador);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar jogador' });
    }
  }

  static async getByTeam(req: Request, res: Response) {
    try {
      const { timeId } = req.params;
      const timeIdNum = parseInt(timeId);
      if (isNaN(timeIdNum)) {
        return res.status(400).json({ error: 'Invalid teamId' });
      }
      const jogadores = await JogadorModel.findByTime(timeIdNum);
      return res.json(jogadores);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar jogadores do time' });
    }
  }

  static async getByGame(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const gameIdNum = parseInt(gameId);
      if (isNaN(gameIdNum)) {
        return res.status(400).json({ error: 'Invalid gameId' });
      }
      const jogadores = await JogadorModel.findByGame(gameIdNum);
      return res.json(jogadores);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar jogadores do jogo' });
    }
  }

  static async getByTurma(req: Request, res: Response) {
    try {
      const { turmaId } = req.params;
      const { edicaoId } = req.query;

      const turmaIdNum = parseInt(turmaId);
      const edicaoIdNum = edicaoId ? parseInt(edicaoId as string) : undefined;

      const jogadores = await JogadorModel.findByTurma(turmaIdNum, edicaoIdNum);

      return res.json(jogadores);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar jogadores da turma' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Extract gender and modalidades from request body along with other fields
      const { nome, genero, turmaId, edicaoId, modalidades, numeroCamisa } = req.body;

      // Validate required fields before processing with specific error messages
      if (!genero) {
        return ResponseHandler.badRequest(res, 'Gênero é obrigatório e deve ser masculino, feminino ou misto');
      }

      if (genero && typeof genero !== 'string') {
        return ResponseHandler.badRequest(res, 'Gênero deve ser uma string válida');
      }

      if (genero && genero.trim() === '') {
        return ResponseHandler.badRequest(res, 'Gênero não pode ser uma string vazia');
      }

      if (!modalidades) {
        return ResponseHandler.badRequest(res, 'Modalidades é obrigatório');
      }

      if (!Array.isArray(modalidades)) {
        return ResponseHandler.badRequest(res, 'Modalidades deve ser um array de IDs de modalidades');
      }

      if (modalidades.length === 0) {
        return ResponseHandler.badRequest(res, 'Pelo menos uma modalidade é obrigatória');
      }

      // If edicaoId is not provided, use the current edition
      let finalEdicaoId = edicaoId;
      if (finalEdicaoId === undefined) {
        finalEdicaoId = await EditionUtils.getCurrentEditionId();
      }

      // Check if a player with the same name already exists in the same turma and edicao
      if (turmaId && finalEdicaoId) {
        const existingPlayer = await JogadorModel.findByNomeTurmaEdicao(nome, turmaId, finalEdicaoId);
        if (existingPlayer) {
          return ResponseHandler.conflict(res, 'Jogador com este nome já existe nesta turma e edição');
        }
      }

      // Pass new parameters to JogadorModel.create method with correct order
      const jogador = await JogadorModel.create(nome, genero, modalidades, turmaId, finalEdicaoId, numeroCamisa);

      // Fetch the complete player with its relations
      const jogadorCompleto = await JogadorModel.findCompleteById(jogador.id);

      return ResponseHandler.created(res, jogadorCompleto);
    } catch (error: any) {
      // Handle Prisma unique constraint error
      if (error.code === 'P2002') {
        return ResponseHandler.conflict(res, 'Jogador com este nome já existe nesta turma e edição');
      }

      // Enhanced error handling for new validation requirements with specific messages
      if (error.message) {
        // Gender validation errors - specific error messages
        if (error.message.includes('Gênero é obrigatório')) {
          return ResponseHandler.badRequest(res, 'Gênero é obrigatório e deve ser masculino, feminino ou misto');
        }

        if (error.message.includes('Gênero inválido')) {
          return ResponseHandler.badRequest(res, 'Gênero inválido. Deve ser masculino, feminino ou misto');
        }

        if (error.message.includes('Gênero não pode ser uma string vazia')) {
          return ResponseHandler.badRequest(res, 'Gênero não pode ser uma string vazia. Deve ser masculino, feminino ou misto');
        }

        if (error.message.includes('deve ser uma string válida')) {
          return ResponseHandler.badRequest(res, 'Gênero deve ser uma string válida (masculino, feminino ou misto)');
        }

        // Modality validation errors - specific error messages
        if (error.message.includes('Modalidades é obrigatório')) {
          return ResponseHandler.badRequest(res, 'Modalidades é obrigatório');
        }

        if (error.message.includes('Pelo menos uma modalidade é obrigatória')) {
          return ResponseHandler.badRequest(res, 'Pelo menos uma modalidade é obrigatória');
        }

        if (error.message.includes('Modalidades deve ser um array')) {
          return ResponseHandler.badRequest(res, 'Modalidades deve ser um array de IDs de modalidades');
        }

        if (error.message.includes('modalidade') && error.message.includes('não encontrada')) {
          return ResponseHandler.badRequest(res, error.message);
        }

        // Generic validation errors with consistent format
        if (error.message.includes('obrigatório') ||
          error.message.includes('inválido') ||
          error.message.includes('deve ser')) {
          return ResponseHandler.badRequest(res, error.message);
        }
      }

      console.error('Erro ao criar jogador:', error);
      return ResponseHandler.error(res, 'Erro interno do servidor ao criar jogador');
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      let { nome, genero, turmaId, edicaoId, modalidades, numeroCamisa } = req.body;

      // Verificar se o jogador existe
      const jogador = await JogadorModel.findById(idNum);

      if (!jogador) {
        return ResponseHandler.notFound(res, 'Jogador não encontrado');
      }

      // If edicaoId is not provided, keep the existing one
      if (edicaoId === undefined) {
        edicaoId = jogador.edicaoId;
      }

      // Check if updating to a name that already exists for this turma and edicao
      if (nome && turmaId && edicaoId) {
        const existingPlayer = await JogadorModel.findByNomeTurmaEdicao(nome, turmaId, edicaoId);
        if (existingPlayer && existingPlayer.id !== idNum) {
          return ResponseHandler.conflict(res, 'Jogador com este nome já existe nesta turma e edição');
        }
      }

      // Update the player with new fields (allow updating gender in existing players)
      await JogadorModel.update(idNum, nome, genero, turmaId, edicaoId, numeroCamisa);

      // Update modalidades if provided (allow adding modalidades to existing players)
      if (modalidades !== undefined) {
        // Validate modalidades array if provided
        if (!Array.isArray(modalidades)) {
          return ResponseHandler.badRequest(res, 'Modalidades deve ser um array');
        }

        // Maintain backward compatibility - allow empty array but handle it gracefully
        if (modalidades.length === 0) {
          // For backward compatibility, don't enforce minimum modalidades on updates
          // This allows existing players without modalidades to remain functional
          console.warn(`Warning: Player ${idNum} updated with empty modalidades array - maintaining backward compatibility`);

          // Clear all existing modalidades for this player
          await JogadorModel.deleteJogadorModalidades(idNum);
        } else {
          // Update with new modalidades (replaces all existing ones)
          await JogadorModel.updateModalidades(idNum, modalidades);
        }
      }

      // Fetch the complete updated player with its relations
      const jogadorCompleto = await JogadorModel.findCompleteById(idNum);

      return ResponseHandler.success(res, jogadorCompleto);
    } catch (error: any) {
      // Handle Prisma unique constraint error
      if (error.code === 'P2002') {
        return ResponseHandler.conflict(res, 'Jogador com este nome já existe nesta turma e edição');
      }

      // Handle specific validation errors from model
      if (error.message) {
        // Gender validation errors
        if (error.message.includes('Gênero inválido') ||
          error.message.includes('Gênero não pode ser uma string vazia')) {
          return ResponseHandler.badRequest(res, error.message);
        }

        // Modality validation errors
        if (error.message.includes('modalidade') || error.message.includes('Modalidade')) {
          return ResponseHandler.badRequest(res, error.message);
        }

        // Generic validation errors
        if (error.message.includes('inválido') ||
          error.message.includes('deve ser')) {
          return ResponseHandler.badRequest(res, error.message);
        }
      }

      console.error('Erro ao atualizar jogador:', error);
      return ResponseHandler.error(res, 'Erro ao atualizar jogador');
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);

      // Verificar se o jogador existe
      const jogador = await JogadorModel.findByIdWithRelationsForDelete(idNum);

      if (!jogador) {
        return ResponseHandler.notFound(res, 'Jogador não encontrado');
      }

      // Excluir as relações primeiro
      if (jogador.jogadorModalidades.length > 0) {
        await JogadorModel.deleteJogadorModalidades(idNum);
      }

      if (jogador.timeJogadores.length > 0) {
        await JogadorModel.deleteTimeJogadores(idNum);
      }

      // Excluir o jogador
      await JogadorModel.delete(idNum);

      return ResponseHandler.success(res, { message: 'Jogador excluído com sucesso' });
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao excluir jogador');
    }
  }

  static async addModalidade(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      const { modalidadeId } = req.body;

      // Verificar se o jogador existe
      const jogador = await JogadorModel.findById(idNum);

      if (!jogador) {
        return ResponseHandler.notFound(res, 'Jogador não encontrado');
      }

      // Verificar se a modalidade existe
      const modalidade = await prisma.modalidade.findUnique({
        where: { id: modalidadeId }
      });

      if (!modalidade) {
        return ResponseHandler.notFound(res, 'Modalidade não encontrada');
      }

      // Verificar se a associação já existe
      const associacaoExistente = await JogadorModel.findJogadorModalidade(idNum, modalidadeId);

      if (associacaoExistente) {
        return ResponseHandler.badRequest(res, 'Jogador já está associado a esta modalidade');
      }

      // Criar a associação
      const jogadorModalidade = await JogadorModel.addModalidade(idNum, modalidadeId);

      return ResponseHandler.created(res, jogadorModalidade);
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao adicionar modalidade ao jogador');
    }
  }

  static async removeModalidade(req: AuthenticatedRequest, res: Response) {
    try {
      const { id, modalidadeId } = req.params;
      const idNum = parseInt(id);
      const modalidadeIdNum = parseInt(modalidadeId);

      // Verificar se a associação existe
      const jogadorModalidade = await JogadorModel.findJogadorModalidade(idNum, modalidadeIdNum);

      if (!jogadorModalidade) {
        return ResponseHandler.notFound(res, 'Associação entre jogador e modalidade não encontrada');
      }

      // Remover a associação
      await JogadorModel.removeModalidade(idNum, modalidadeIdNum);

      return ResponseHandler.success(res, { message: 'Modalidade removida do jogador com sucesso' });
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao remover modalidade do jogador');
    }
  }
}