import { Request, Response } from 'express';
import { EstatisticaModel } from '../models/estatisticaModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { createHash } from 'crypto';
import { ModalidadeModel } from '../models/modalidadeModel';

export class EstatisticasController {
  // Helper function to generate ETag
  private static generateETag(data: any): string {
    const hash = createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  // Helper function to check if client's ETag matches
  private static checkETag(req: Request, data: any): boolean {
    const eTag = EstatisticasController.generateETag(data);
    const ifNoneMatch = req.headers['if-none-match'];
    return ifNoneMatch === eTag;
  }

  static async getClassificacao(req: Request, res: Response) {
    try {
      const { modalidadeId } = req.params;
      const { edicaoId } = req.query;
      
      const modalidadeIdNum = parseInt(modalidadeId);
      
      // Validate modalidadeId
      if (isNaN(modalidadeIdNum) || modalidadeIdNum <= 0) {
        return res.status(400).json({ error: 'ID da modalidade inválido' });
      }
      
      // Check if modalidade exists
      const modalidade = await ModalidadeModel.findById(modalidadeIdNum);
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      const edicaoIdNum = edicaoId ? parseInt(edicaoId as string) : undefined;
      
      // Obter a classificação usando o modelo
      const classificacao = await EstatisticaModel.getClassificacao(modalidadeIdNum, edicaoIdNum);
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(classificacao);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, classificacao)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(classificacao);
    } catch (error) {
      console.error('Erro ao buscar classificação:', error);
      return res.status(500).json({ error: 'Erro ao buscar classificação' });
    }
  }

  static async getArtilheiros(req: Request, res: Response) {
    try {
      const { modalidadeId } = req.params;
      const { edicaoId, limit } = req.query;
      
      const modalidadeIdNum = parseInt(modalidadeId);
      
      // Validate modalidadeId
      if (isNaN(modalidadeIdNum) || modalidadeIdNum <= 0) {
        return res.status(400).json({ error: 'ID da modalidade inválido' });
      }
      
      // Check if modalidade exists
      const modalidade = await ModalidadeModel.findById(modalidadeIdNum);
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      const edicaoIdNum = edicaoId ? parseInt(edicaoId as string) : undefined;
      const limitNum = limit ? parseInt(limit as string) : 10;
      
      // Obter artilheiros usando o modelo (método a ser implementado no modelo)
      const artilheiros = await EstatisticaModel.getArtilheiros(modalidadeIdNum, edicaoIdNum, limitNum);
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(artilheiros);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, artilheiros)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(artilheiros);
    } catch (error) {
      console.error('Erro ao buscar artilheiros:', error);
      return res.status(500).json({ error: 'Erro ao buscar artilheiros' });
    }
  }
  
  static async getEstatisticasJogador(req: Request, res: Response) {
    try {
      const { playerId, jogadorId } = req.params;
      const playerIdToUse = playerId || jogadorId; // Suportar ambos os formatos
      const { modalidadeId } = req.query;
      
      const jogadorIdNum = parseInt(playerIdToUse);
      const modalidadeIdNum = modalidadeId ? parseInt(modalidadeId as string) : undefined;
      
      // Validate jogadorId
      if (isNaN(jogadorIdNum) || jogadorIdNum <= 0) {
        return res.status(400).json({ error: 'ID do jogador inválido' });
      }
      
      // Validate modalidadeId if provided
      if (modalidadeIdNum !== undefined) {
        if (isNaN(modalidadeIdNum) || modalidadeIdNum <= 0) {
          return res.status(400).json({ error: 'ID da modalidade inválido' });
        }
        
        // Check if modalidade exists
        const modalidade = await ModalidadeModel.findById(modalidadeIdNum);
        if (!modalidade) {
          return res.status(404).json({ error: 'Modalidade não encontrada' });
        }
      }
      
      let estatisticas;
      
      // Se modalidadeId foi fornecido, buscar estatísticas específicas da modalidade
      if (modalidadeIdNum) {
        estatisticas = await EstatisticaModel.findByJogadorEModalidade(jogadorIdNum, modalidadeIdNum);
      } else {
        // Caso contrário, buscar todas as estatísticas do jogador
        estatisticas = await EstatisticaModel.findAllByJogador(jogadorIdNum);
      }
      
      if (!estatisticas || (Array.isArray(estatisticas) && estatisticas.length === 0)) {
        return res.status(404).json({ error: 'Estatísticas não encontradas' });
      }
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(estatisticas);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, estatisticas)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do jogador:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas do jogador' });
    }
  }
  
  static async getEstatisticasTime(req: Request, res: Response) {
    try {
      const { teamId, timeId } = req.params;
      const teamIdToUse = teamId || timeId; // Suportar ambos os formatos
      const { modalidadeId } = req.query;
      
      const timeIdNum = parseInt(teamIdToUse);
      const modalidadeIdNum = modalidadeId ? parseInt(modalidadeId as string) : undefined;
      
      // Validate timeId
      if (isNaN(timeIdNum) || timeIdNum <= 0) {
        return res.status(400).json({ error: 'ID do time inválido' });
      }
      
      // Validate modalidadeId if provided
      if (modalidadeIdNum !== undefined) {
        if (isNaN(modalidadeIdNum) || modalidadeIdNum <= 0) {
          return res.status(400).json({ error: 'ID da modalidade inválido' });
        }
        
        // Check if modalidade exists
        const modalidade = await ModalidadeModel.findById(modalidadeIdNum);
        if (!modalidade) {
          return res.status(404).json({ error: 'Modalidade não encontrada' });
        }
      }
      
      let estatisticas;
      
      // Se modalidadeId foi fornecido, buscar estatísticas específicas da modalidade
      if (modalidadeIdNum) {
        estatisticas = await EstatisticaModel.findByTimeEModalidade(timeIdNum, modalidadeIdNum);
      } else {
        // Caso contrário, buscar todas as estatísticas do time
        const allStats = await EstatisticaModel.findAllByTime(timeIdNum);
        // If there's only one set of statistics, return it directly
        // Otherwise, return the array
        estatisticas = allStats.length === 1 ? allStats[0] : allStats;
      }
      
      if (!estatisticas || (Array.isArray(estatisticas) && estatisticas.length === 0)) {
        return res.status(404).json({ error: 'Estatísticas não encontradas' });
      }
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(estatisticas);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, estatisticas)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(estatisticas);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do time:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas do time' });
    }
  }
  
  static async resetEstatisticas(req: AuthenticatedRequest, res: Response) {
    try {
      const { modalidadeId } = req.params;
      const modalidadeIdNum = parseInt(modalidadeId);
      
      // Validate modalidadeId
      if (isNaN(modalidadeIdNum) || modalidadeIdNum <= 0) {
        return res.status(400).json({ error: 'ID da modalidade inválido' });
      }
      
      // Check if modalidade exists
      const modalidade = await ModalidadeModel.findById(modalidadeIdNum);
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      // Resetar estatísticas usando o modelo
      await EstatisticaModel.resetEstatisticas(modalidadeIdNum);
      
      res.status(200).json({ message: 'Estatísticas resetadas com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao resetar estatísticas' });
    }
  }
  
  static async recalcularEstatisticas(req: AuthenticatedRequest, res: Response) {
    try {
      const { EstatisticasService } = await import('../services/estatisticasService');
      
      // Recalcular todas as estatísticas
      const resultado = await EstatisticasService.recalcularTodasEstatisticas();
      
      res.status(200).json({
        message: 'Estatísticas recalculadas com sucesso',
        ...resultado
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao recalcular estatísticas' });
    }
  }
  
  /**
   * Get dashboard summary statistics
   */
  static async getDashboardSummary(req: Request, res: Response) {
    try {
      // Get total games count
      const totalGames = await EstatisticaModel.countGames();
      
      // Get games by status
      const gamesByStatus = await EstatisticaModel.getGamesByStatus();
      
      // Get top 3 teams by points
      const topTeams = await EstatisticaModel.getTopTeams(3);
      
      const summary = {
        summary: {
          totalGames,
          gamesByStatus,
          topTeams
        }
      };
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(summary);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, summary)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(summary);
    } catch (error) {
      console.error('Error in getDashboardSummary:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas do dashboard' });
    }
  }
  
  /**
   * Get top scorers for dashboard
   */
  static async getDashboardTopScorers(req: Request, res: Response) {
    try {
      const { limit = '10' } = req.query;
      const limitNum = parseInt(limit as string);
      
      // Get top scorers
      const topScorers = await EstatisticaModel.getTopScorers(limitNum);
      
      const response = {
        topScorers
      };
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(response);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, response)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(response);
    } catch (error) {
      console.error('Error in getDashboardTopScorers:', error);
      return res.status(500).json({ error: 'Erro ao buscar artilheiros do dashboard' });
    }
  }
  
  /**
   * Get chart data for dashboard
   */
  static async getDashboardChartData(req: Request, res: Response) {
    try {
      const { metric = 'goals', period = 'month' } = req.query;
      
      // Get chart data based on metric and period
      const chartData = await EstatisticaModel.getChartData(metric as string, period as string);
      
      const response = {
        chartData
      };
      
      // Add ETag support
      const eTag = EstatisticasController.generateETag(response);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (EstatisticasController.checkETag(req, response)) {
        return res.status(304).send(); // Not Modified
      }
      
      return res.json(response);
    } catch (error) {
      console.error('Error in getDashboardChartData:', error);
      return res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
    }
  }
}