import { Request, Response } from 'express';
import { GrupoModel } from '../models/grupoModel';
import { GameManagementService } from '../services/gameManagementService';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';

export class GruposController {
  /**
   * Lista todos os grupos de uma modalidade
   */
  static async listarGrupos(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, edicaoId } = req.query;

      if (!modalidadeId || !genero) {
        return ResponseHandler.badRequest(res, 'modalidadeId e genero são obrigatórios');
      }

      const grupos = await GrupoModel.listarGrupos(
        parseInt(modalidadeId as string),
        genero as string,
        edicaoId ? parseInt(edicaoId as string) : undefined
      );

      return ResponseHandler.success(res, { grupos });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error listing groups');
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Calcula e retorna a tabela de classificação de um grupo
   */
  static async obterTabelaGrupo(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, grupo, edicaoId } = req.query;

      if (!modalidadeId || !genero || !grupo) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero e grupo são obrigatórios');
      }

      const tabela = await GrupoModel.calcularTabelaGrupo(
        parseInt(modalidadeId as string),
        genero as string,
        grupo as string,
        edicaoId ? parseInt(edicaoId as string) : undefined
      );

      return ResponseHandler.success(res, { tabela });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting group table');
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Obtém os classificados de um grupo
   */
  static async obterClassificados(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, grupo, quantidade, edicaoId } = req.query;

      if (!modalidadeId || !genero || !grupo) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero e grupo são obrigatórios');
      }

      const classificados = await GrupoModel.getClassificados(
        parseInt(modalidadeId as string),
        genero as string,
        grupo as string,
        quantidade ? parseInt(quantidade as string) : 2,
        edicaoId ? parseInt(edicaoId as string) : undefined
      );

      return ResponseHandler.success(res, { classificados });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting qualified teams');
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Atualiza o grupo de um time
   */
  static async atualizarGrupoTime(req: Request, res: Response) {
    try {
      const { timeId } = req.params;
      const { grupo } = req.body;

      if (!timeId) {
        return ResponseHandler.badRequest(res, 'timeId é obrigatório');
      }

      await GrupoModel.atualizarGrupoTime(parseInt(timeId), grupo);

      return ResponseHandler.success(res, { message: 'Grupo do time atualizado com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating team group');
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Gera automaticamente os jogos de fase de grupos
   */
  static async gerarJogosFaseGrupos(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, edicaoId, dataInicio, local } = req.body;

      if (!modalidadeId || !genero || !edicaoId || !dataInicio) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero, edicaoId e dataInicio são obrigatórios');
      }

      await GameManagementService.gerarJogosFaseGrupos(
        parseInt(modalidadeId),
        genero,
        parseInt(edicaoId),
        new Date(dataInicio),
        local || 'Quadra Principal'
      );

      return ResponseHandler.success(res, { message: 'Jogos de fase de grupos gerados com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating group stage games');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Gera automaticamente as semifinais
   */
  static async gerarSemifinais(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, edicaoId, dataInicio, local } = req.body;

      if (!modalidadeId || !genero || !edicaoId || !dataInicio) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero, edicaoId e dataInicio são obrigatórios');
      }

      await GameManagementService.gerarSemifinais(
        parseInt(modalidadeId),
        genero,
        parseInt(edicaoId),
        new Date(dataInicio),
        local || 'Quadra Principal'
      );

      return ResponseHandler.success(res, { message: 'Semifinais geradas com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating semifinals');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Gera automaticamente a final
   */
  static async gerarFinal(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, edicaoId, dataFinal, local } = req.body;

      if (!modalidadeId || !genero || !edicaoId || !dataFinal) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero, edicaoId e dataFinal são obrigatórios');
      }

      await GameManagementService.gerarFinal(
        parseInt(modalidadeId),
        genero,
        parseInt(edicaoId),
        new Date(dataFinal),
        local || 'Quadra Principal'
      );

      return ResponseHandler.success(res, { message: 'Final gerada com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating final');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Gera semifinais manualmente especificando os IDs dos times
   */
  static async gerarSemifinaisManual(req: Request, res: Response) {
    try {
      const { modalidadeId, genero, edicaoId, dataInicio, local, semifinais } = req.body;

      if (!modalidadeId || !genero || !edicaoId || !dataInicio || !semifinais) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero, edicaoId, dataInicio e semifinais são obrigatórios');
      }

      if (!semifinais.jogo1 || !semifinais.jogo2) {
        return ResponseHandler.badRequest(res, 'semifinais deve conter jogo1 e jogo2');
      }

      await GameManagementService.gerarSemifinaisManual(
        parseInt(modalidadeId),
        genero,
        parseInt(edicaoId),
        new Date(dataInicio),
        local || 'Quadra Principal',
        semifinais
      );

      return ResponseHandler.success(res, { message: 'Semifinais geradas manualmente com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating manual semifinals');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }

  /**
   * Gera todos os jogos de uma modalidade (processo completo)
   */
  static async gerarTodosJogos(req: Request, res: Response) {
    try {
      const { 
        modalidadeId, 
        genero, 
        edicaoId, 
        dataInicioGrupos, 
        dataInicioSemifinais, 
        dataFinal, 
        local 
      } = req.body;

      if (!modalidadeId || !genero || !edicaoId || !dataInicioSemifinais) {
        return ResponseHandler.badRequest(res, 'modalidadeId, genero, edicaoId e dataInicioSemifinais são obrigatórios');
      }

      await GameManagementService.gerarTodosJogos(
        parseInt(modalidadeId),
        genero,
        parseInt(edicaoId),
        dataInicioGrupos ? new Date(dataInicioGrupos) : new Date(),
        new Date(dataInicioSemifinais),
        dataFinal ? new Date(dataFinal) : new Date(),
        local || 'Quadra Principal'
      );

      return ResponseHandler.success(res, { message: 'Todos os jogos gerados com sucesso' });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating all games');
      
      if (error instanceof Error) {
        return ResponseHandler.badRequest(res, error.message);
      }
      
      return ResponseHandler.error(res, 'Erro interno do servidor');
    }
  }
}