import { Request, Response } from 'express';
import { TimeModel } from '../models/timeModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { TypeHelpers } from '../utils/typeHelpers';
import { EditionUtils } from '../utils/editionUtils';

export class TimesController {
  static async getAll(req: Request, res: Response) {
    try {
      const times = await TimeModel.findAll();
      return ResponseHandler.success(res, times);
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      return ResponseHandler.error(res, 'Erro ao buscar times');
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const time = await TimeModel.findById(idNum);
      
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      return ResponseHandler.success(res, time);
    } catch (error) {
      console.error('Erro ao buscar time:', error);
      return ResponseHandler.error(res, 'Erro ao buscar time');
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      let { nome, modalidadeId, edicaoId, jogadores } = req.body;
      
      // If edicaoId is not provided, use the current edition
      if (edicaoId === undefined) {
        edicaoId = await EditionUtils.getCurrentEditionId();
      }
      
      const time = await TimeModel.create(nome, modalidadeId, edicaoId);
      
      const jogadoresArray = TypeHelpers.toArray(jogadores);
      if (jogadoresArray.length > 0) {
        await Promise.all(jogadoresArray.map(async (jogadorId) => {
          const jogadorIdNum = TypeHelpers.toInt(jogadorId);
          if (jogadorIdNum) {
            return TimeModel.addJogador(time.id, jogadorIdNum);
          }
        }));
      }
      
      const timeCompleto = await TimeModel.findCompleteById(time.id);
      
      return ResponseHandler.created(res, timeCompleto);
    } catch (error) {
      console.error('Erro ao criar time:', error);
      return ResponseHandler.error(res, 'Erro ao criar time');
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      let { nome, edicaoId } = req.body;
      
      const time = await TimeModel.findById(idNum);
      
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // If edicaoId is not provided, keep the existing one
      if (edicaoId === undefined) {
        edicaoId = time.edicaoId;
      }
      
      const timeAtualizado = await TimeModel.update(idNum, nome, edicaoId);
      
      return ResponseHandler.success(res, timeAtualizado);
    } catch (error) {
      console.error('Erro ao atualizar time:', error);
      return ResponseHandler.error(res, 'Erro ao atualizar time');
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }
      
      const time = await TimeModel.findByIdWithRelationsForDelete(idNum);
      
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // Delete time-jogadores associations
      await TimeModel.deleteTimeJogadores(idNum);
      
      // Delete jogo-times associations
      await TimeModel.deleteJogoTimes(idNum);
      
      // Delete estatisticas-times associations
      await TimeModel.deleteEstatisticasTimes(idNum);
      
      await TimeModel.delete(idNum);
      
      return ResponseHandler.noContent(res);
    } catch (error) {
      console.error('Erro ao excluir time:', error);
      return ResponseHandler.error(res, 'Erro ao excluir time');
    }
  }
  
  static async addJogador(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }

      const { jogadorId } = req.body;
      
      const time = await TimeModel.findById(idNum);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      const jogadorAdicionado = await TimeModel.addJogador(idNum, jogadorId);
      
      return ResponseHandler.success(res, jogadorAdicionado);
    } catch (error) {
      console.error('Erro ao adicionar jogador ao time:', error);
      return ResponseHandler.error(res, 'Erro ao adicionar jogador ao time');
    }
  }
  
  static async removeJogador(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }

      const jogadorIdNum = TypeHelpers.toInt(req.params.jogadorId);
      if (!jogadorIdNum) {
        return ResponseHandler.badRequest(res, 'ID do jogador inválido');
      }
      
      const time = await TimeModel.findById(idNum);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // Buscar a associação entre time e jogador
      const timeJogador = await TimeModel.findTimeJogador(idNum, jogadorIdNum);
      if (!timeJogador) {
        return ResponseHandler.notFound(res, 'Jogador não está associado a este time');
      }
      
      await TimeModel.removeJogador(timeJogador.id);
      
      return ResponseHandler.noContent(res);
    } catch (error) {
      console.error('Erro ao remover jogador do time:', error);
      return ResponseHandler.error(res, 'Erro ao remover jogador do time');
    }
  }
  
  /**
   * Get all turmas for a specific time
   */
  static async getTurmasForTime(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }
      
      const time = await TimeModel.findById(idNum);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // For now, return an empty array since this needs to be updated
      // when the Prisma client is regenerated
      return ResponseHandler.success(res, {
        time: {
          id: time.id,
          nome: time.nome,
          modalidadeId: time.modalidadeId
        },
        turmas: [],
        total: 0
      });
    } catch (error) {
      console.error('Erro ao buscar turmas do time:', error);
      return ResponseHandler.error(res, 'Erro ao buscar turmas do time');
    }
  }
  
  /**
   * Add a turma to a time
   */
  static async addTurmaToTime(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }
      
      const { turmaId } = req.body;
      if (!turmaId) {
        return ResponseHandler.badRequest(res, 'ID da turma é obrigatório');
      }
      
      const time = await TimeModel.findById(idNum);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // For now, return a success response since this needs to be updated
      // when the Prisma client is regenerated
      return ResponseHandler.success(res, {
        message: 'Associação solicitada com sucesso',
        time: {
          id: time.id,
          nome: time.nome
        },
        turmaId
      });
    } catch (error) {
      console.error('Erro ao adicionar turma ao time:', error);
      return ResponseHandler.error(res, 'Erro ao adicionar turma ao time');
    }
  }
  
  /**
   * Remove a turma from a time
   */
  static async removeTurmaFromTime(req: AuthenticatedRequest, res: Response) {
    try {
      const timeId = TypeHelpers.toInt(req.params.id);
      const turmaId = TypeHelpers.toInt(req.params.turmaId);
      
      if (!timeId || !turmaId) {
        return ResponseHandler.badRequest(res, 'IDs do time e turma são obrigatórios');
      }
      
      const time = await TimeModel.findById(timeId);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // For now, return a success response since this needs to be updated
      // when the Prisma client is regenerated
      return ResponseHandler.success(res, {
        message: 'Remoção solicitada com sucesso',
        time: {
          id: time.id,
          nome: time.nome
        },
        turmaId
      });
    } catch (error) {
      console.error('Erro ao remover turma do time:', error);
      return ResponseHandler.error(res, 'Erro ao remover turma do time');
    }
  }

  /**
   * Get all jogadores for a specific time
   */
  static async getJogadoresByTime(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }

      const time = await TimeModel.findById(idNum);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }

      // Buscar jogadores através da tabela TimeJogador
      const jogadores = await TimeModel.getJogadoresByTime(idNum);
      
      return ResponseHandler.success(res, {
        time: {
          id: time.id,
          nome: time.nome,
          modalidadeId: time.modalidadeId
        },
        jogadores,
        total: jogadores.length
      });
    } catch (error) {
      console.error('Erro ao buscar jogadores do time:', error);
      return ResponseHandler.error(res, 'Erro ao buscar jogadores do time');
    }
  }
}