import { JogoModel } from '../models/jogoModel';
import { logger } from '../utils/logger';
import { GameStateMachine } from './gameStateMachine';

export interface SchedulerConfig {
  activationIntervalMinutes: number;
  notificationIntervalMinutes: number;
  timezone: string;
}

export class GameScheduler {
  private static instance: GameScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private notificationIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private config: SchedulerConfig;

  private constructor() {
    this.config = {
      activationIntervalMinutes: 1, // Check every minute
      notificationIntervalMinutes: 15, // Notify 15 minutes before
      timezone: process.env.TZ || 'America/Sao_Paulo'
    };
  }

  static getInstance(): GameScheduler {
    if (!GameScheduler.instance) {
      GameScheduler.instance = new GameScheduler();
    }
    return GameScheduler.instance;
  }

  /**
   * Inicia o scheduler com verificações mais frequentes e notificações
   */
  start(): void {
    if (this.isRunning) {
      logger.info('Game scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting enhanced game scheduler');

    // Run immediately on start
    this.checkAndActivateGames();

    // Check for games to activate every minute
    this.intervalId = setInterval(() => {
      this.checkAndActivateGames();
    }, this.config.activationIntervalMinutes * 60 * 1000);

    // Check for upcoming games every 15 minutes for notifications
    this.notificationIntervalId = setInterval(() => {
      this.checkUpcomingGames();
    }, this.config.notificationIntervalMinutes * 60 * 1000);

    logger.info('Enhanced game scheduler started successfully');
  }

  /**
   * Para o scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.notificationIntervalId) {
      clearInterval(this.notificationIntervalId);
      this.notificationIntervalId = null;
    }
    
    this.isRunning = false;
    logger.info('Enhanced game scheduler stopped');
  }

  /**
   * Atualiza a configuração do scheduler
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isRunning) {
      logger.info('Restarting scheduler with new configuration');
      this.stop();
      this.start();
    }
  }

  /**
   * Verifica e ativa jogos baseado na nova lógica de períodos
   * Também cancela jogos que perderam o período de ativação
   */
  private async checkAndActivateGames(): Promise<void> {
    try {
      // Ativar jogos que estão no período correto
      const activatedCount = await JogoModel.activateGamesByPeriod();
      
      // Cancelar jogos que perderam o período
      const cancelledCount = await JogoModel.cancelExpiredGames();
      
      if (activatedCount > 0) {
        logger.info(`Automatically activated ${activatedCount} games by period logic`);
      }
      
      if (cancelledCount > 0) {
        logger.info(`Automatically cancelled ${cancelledCount} expired games`);
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        operation: 'checkAndActivateGames'
      }, 'Error checking and activating games');
    }
  }

  /**
   * Verifica jogos que começarão em breve para notificações
   */
  private async checkUpcomingGames(): Promise<void> {
    try {
      const upcomingGames = await JogoModel.findUpcomingGames(this.config.notificationIntervalMinutes);
      
      if (upcomingGames.length > 0) {
        logger.info(`Found ${upcomingGames.length} upcoming games`);

        // Aqui você pode implementar notificações (email, push, etc.)
        await this.sendGameNotifications(upcomingGames);
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        operation: 'checkUpcomingGames'
      }, 'Error checking upcoming games');
    }
  }

  /**
   * Envia notificações para jogos próximos
   */
  private async sendGameNotifications(games: any[]): Promise<void> {
    // Implementação futura para notificações
    // Por enquanto, apenas log
    for (const game of games) {
      logger.info(`Game notification: ${game.time1?.nome || 'Time 1'} vs ${game.time2?.nome || 'Time 2'} starts at ${game.dataHora}`);
    }
  }

  /**
   * Força a ativação de jogos manualmente (para testes)
   */
  async forceActivation(): Promise<number> {
    try {
      const activatedCount = await JogoModel.activateGamesByPeriod();
      logger.info(`Force activated ${activatedCount} games`);
      return activatedCount;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error force activating games');
      throw error;
    }
  }

  /**
   * Força o cancelamento de jogos expirados manualmente (para testes)
   */
  async forceCancellation(): Promise<number> {
    try {
      const cancelledCount = await JogoModel.cancelExpiredGames();
      logger.info(`Force cancelled ${cancelledCount} expired games`);
      return cancelledCount;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error force cancelling games');
      throw error;
    }
  }
}