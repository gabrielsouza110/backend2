import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { CacheService } from '../services/cacheService';
import { SmartGameScheduler } from '../services/smartGameScheduler';
import { DateHelper } from '../utils/dateHelper';
import { GameStateMachine } from '../services/gameStateMachine';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { GameScheduler } from '../services/gameScheduler';

export class SystemController {
  /**
   * Retorna estatísticas do sistema de cache
   */
  static async getCacheStats(req: Request, res: Response) {
    try {
      const cacheService = CacheService.getInstance();
      const stats = cacheService.getStats();
      
      return ResponseHandler.success(res, {
        cache: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting cache stats');
      return ResponseHandler.error(res, 'Erro ao obter estatísticas do cache');
    }
  }

  /**
   * Limpa o cache do sistema
   */
  static async clearCache(req: AuthenticatedRequest, res: Response) {
    try {
      const cacheService = CacheService.getInstance();
      cacheService.clear();
      
      logger.info('System cache cleared');
      
      return ResponseHandler.success(res, {
        message: 'Cache limpo com sucesso',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error clearing cache');
      return ResponseHandler.error(res, 'Erro ao limpar cache');
    }
  }

  /**
   * Retorna informações sobre o scheduler de jogos
   */
  static async getSchedulerInfo(req: Request, res: Response) {
    try {
      const scheduler = GameScheduler.getInstance();
      
      return ResponseHandler.success(res, {
        scheduler: {
          isRunning: scheduler['isRunning'], // Accessing private property for info
          config: scheduler['config']
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting scheduler info');
      return ResponseHandler.error(res, 'Erro ao obter informações do scheduler');
    }
  }

  /**
   * Força ativação de jogos agendados
   */
  static async forceGameActivation(req: AuthenticatedRequest, res: Response) {
    try {
      const scheduler = SmartGameScheduler.getInstance();
      const result = await scheduler.forceExecution();
      
      logger.info(`Force execution: activated ${result.activated}, cancelled ${result.cancelled}`);
      
      return ResponseHandler.success(res, {
        message: `${result.activated} jogos ativados, ${result.cancelled} jogos cancelados`,
        activatedCount: result.activated,
        cancelledCount: result.cancelled,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error forcing game execution');
      return ResponseHandler.error(res, 'Erro ao forçar execução do scheduler');
    }
  }

  /**
   * Obtém informações sobre o scheduler inteligente
   */
  static async getSmartSchedulerInfo(req: Request, res: Response) {
    try {
      const scheduler = SmartGameScheduler.getInstance();
      const stats = scheduler.getStats();
      const scheduledExecutions = scheduler.getScheduledExecutions();
      
      return ResponseHandler.success(res, {
        stats,
        scheduledExecutions: scheduledExecutions.slice(0, 10), // Próximas 10 execuções
        systemTime: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting scheduler info');
      return ResponseHandler.error(res, 'Erro ao obter informações do scheduler');
    }
  }

  /**
   * Retorna informações sobre períodos do dia disponíveis
   */
  static async getTimePeriods(req: Request, res: Response) {
    try {
      const periods = DateHelper.getAvailableTimePeriods();
      
      return ResponseHandler.success(res, {
        periods,
        currentTime: {
          date: new Date().toISOString(),
          formatted: DateHelper.formatDate(new Date()),
          today: DateHelper.formatDate(DateHelper.getToday(), false),
          yesterday: DateHelper.formatDate(DateHelper.getYesterday(), false),
          tomorrow: DateHelper.formatDate(DateHelper.getTomorrow(), false)
        }
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting time periods');
      return ResponseHandler.error(res, 'Erro ao obter períodos do dia');
    }
  }

  /**
   * Retorna informações sobre estados de jogo
   */
  static async getGameStates(req: Request, res: Response) {
    try {
      const states = ['AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO'];
      const stateInfo = states.map(state => ({
        status: state,
        description: GameStateMachine.getStateDescription(state as any),
        isFinal: GameStateMachine.isFinalState(state as any),
        validTransitions: GameStateMachine.getValidTransitions(state as any),
        permissions: {
          canEdit: GameStateMachine.canEditGame(state as any),
          canUpdateScore: GameStateMachine.canUpdateScore(state as any),
          canAddEvents: GameStateMachine.canAddEvents(state as any)
        }
      }));
      
      return ResponseHandler.success(res, {
        gameStates: stateInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting game states');
      return ResponseHandler.error(res, 'Erro ao obter estados de jogo');
    }
  }

  /**
   * Retorna informações gerais do sistema
   */
  static async getSystemInfo(req: Request, res: Response) {
    try {
      const cacheService = CacheService.getInstance();
      const cacheStats = cacheService.getStats();
      
      return ResponseHandler.success(res, {
        system: {
          name: 'Dashboard Esportivo API',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        },
        cache: {
          main: {
            size: cacheStats.size,
            hitRate: cacheStats.hitRate,
            maxSize: cacheStats.maxSize
          }
        },
        features: {
          gameStateMachine: true,
          enhancedScheduler: true,
          intelligentCache: true,
          improvedDateHandling: true
        }
      });
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting system info');
      return ResponseHandler.error(res, 'Erro ao obter informações do sistema');
    }
  }
}