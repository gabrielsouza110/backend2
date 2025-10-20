import { Request, Response } from 'express';
import { JogoModel } from '../models/jogoModel';
import { JogadorModel } from '../models/jogadorModel';
import { TimeModel } from '../models/timeModel';
import { ModalidadeModel } from '../models/modalidadeModel';
import { TurmaModel } from '../models/turmaModel';
import { EdicaoModel } from '../models/edicaoModel';
import { ResponseHandler } from '../utils/responseHandler';
import { TypeHelpers } from '../utils/typeHelpers';

export class BatchController {
  /**
   * Process multiple queries in a single request
   */
  static async processBatch(req: Request, res: Response) {
    try {
      const { queries } = req.body;

      if (!Array.isArray(queries)) {
        return ResponseHandler.badRequest(res, 'Queries deve ser um array de requisições');
      }

      // Process each query
      const results = await Promise.all(
        queries.map(async (query, index) => {
          try {
            const result = await BatchController.processQuery(query);
            return {
              index,
              success: true,
              data: result
            };
          } catch (error) {
            return {
              index,
              success: false,
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
          }
        })
      );

      return ResponseHandler.success(res, {
        results
      });
    } catch (error) {
      console.error('Error in BatchController.processBatch:', error);
      return ResponseHandler.error(res, 'Erro ao processar requisições em lote');
    }
  }

  /**
   * Process a single query based on its type
   */
  private static async processQuery(query: any) {
    const { type, params } = query;

    switch (type) {
      case 'games':
        return await BatchController.processGamesQuery(params);
      case 'players':
        return await BatchController.processPlayersQuery(params);
      case 'teams':
        return await BatchController.processTeamsQuery(params);
      case 'modalities':
        return await BatchController.processModalitiesQuery(params);
      case 'classes':
        return await BatchController.processClassesQuery(params);
      case 'editions':
        return await BatchController.processEditionsQuery(params);
      default:
        throw new Error(`Tipo de consulta não suportado: ${type}`);
    }
  }

  /**
   * Process games query
   */
  private static async processGamesQuery(params: any) {
    const { id, filters } = params;

    if (id) {
      // Get specific game by ID
      const gameId = TypeHelpers.toInt(id);
      if (!gameId) {
        throw new Error('ID do jogo inválido');
      }
      return await JogoModel.findById(gameId);
    } else {
      // Get games with filters
      return await JogoModel.findAll(filters || {});
    }
  }

  /**
   * Process players query
   */
  private static async processPlayersQuery(params: any) {
    const { id, filters } = params;

    if (id) {
      // Get specific player by ID
      const playerId = TypeHelpers.toInt(id);
      if (!playerId) {
        throw new Error('ID do jogador inválido');
      }
      return await JogadorModel.findById(playerId);
    } else {
      // Get players with filters
      const { edicaoId, modalidadeId } = filters || {};
      const edicaoIdNum = edicaoId ? TypeHelpers.toInt(edicaoId) : undefined;
      const modalidadeIdNum = modalidadeId ? TypeHelpers.toInt(modalidadeId) : undefined;
      return await JogadorModel.findAll(edicaoIdNum, modalidadeIdNum);
    }
  }

  /**
   * Process teams query
   */
  private static async processTeamsQuery(params: any) {
    const { id, filters } = params;

    if (id) {
      // Get specific team by ID
      const teamId = TypeHelpers.toInt(id);
      if (!teamId) {
        throw new Error('ID do time inválido');
      }
      return await TimeModel.findById(teamId);
    } else {
      // Get teams with filters
      const { modalidadeId, edicaoId } = filters || {};
      const modalidadeIdNum = modalidadeId ? TypeHelpers.toInt(modalidadeId) : undefined;
      const edicaoIdNum = edicaoId ? TypeHelpers.toInt(edicaoId) : undefined;
      return await TimeModel.findAll(edicaoIdNum, modalidadeIdNum);
    }
  }

  /**
   * Process modalities query
   */
  private static async processModalitiesQuery(params: any) {
    const { id } = params;

    if (id) {
      // Get specific modality by ID
      const modalityId = TypeHelpers.toInt(id);
      if (!modalityId) {
        throw new Error('ID da modalidade inválido');
      }
      return await ModalidadeModel.findById(modalityId);
    } else {
      // Get all modalities
      return await ModalidadeModel.findAll();
    }
  }

  /**
   * Process classes query
   */
  private static async processClassesQuery(params: any) {
    const { id } = params;

    if (id) {
      // Get specific class by ID
      const classId = TypeHelpers.toInt(id);
      if (!classId) {
        throw new Error('ID da turma inválido');
      }
      return await TurmaModel.findById(classId);
    } else {
      // Get all classes
      return await TurmaModel.findAll();
    }
  }

  /**
   * Process editions query
   */
  private static async processEditionsQuery(params: any) {
    const { id } = params;

    if (id) {
      // Get specific edition by ID
      const editionId = TypeHelpers.toInt(id);
      if (!editionId) {
        throw new Error('ID da edição inválido');
      }
      return await EdicaoModel.findById(editionId);
    } else {
      // Get all editions
      return await EdicaoModel.findAll();
    }
  }
}