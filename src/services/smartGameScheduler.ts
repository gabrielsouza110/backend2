/**
 * Scheduler inteligente que executa apenas nos momentos de transição de períodos
 */

import { JogoModel } from '../models/jogoModel';
import { logger } from '../utils/logger';
import { GamePeriodHelper, PeriodoJogo } from '../utils/gamePeriodHelper';

export interface SmartSchedulerConfig {
  timezone: string;
  notificationMinutesBefore: number;
}

interface PeriodTransition {
  period: PeriodoJogo;
  startHour: number;
  endHour: number;
}

export class SmartGameScheduler {
  private static instance: SmartGameScheduler;
  private timeouts: NodeJS.Timeout[] = [];
  private isRunning = false;
  private config: SmartSchedulerConfig;

  // Definição dos períodos e suas transições
  private readonly PERIOD_TRANSITIONS: PeriodTransition[] = [
    { period: PeriodoJogo.MANHA, startHour: 6, endHour: 12 },
    { period: PeriodoJogo.MEIO_DIA, startHour: 12, endHour: 14 },
    { period: PeriodoJogo.TARDE, startHour: 14, endHour: 18 },
    { period: PeriodoJogo.NOITE, startHour: 18, endHour: 6 } // Cruza meia-noite
  ];

  private constructor() {
    this.config = {
      timezone: process.env.TZ || 'America/Sao_Paulo',
      notificationMinutesBefore: 15
    };
  }

  static getInstance(): SmartGameScheduler {
    if (!SmartGameScheduler.instance) {
      SmartGameScheduler.instance = new SmartGameScheduler();
    }
    return SmartGameScheduler.instance;
  }

  /**
   * Inicia o scheduler inteligente
   */
  start(): void {
    if (this.isRunning) {
      logger.info('Smart game scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting smart game scheduler with period-based execution');

    // Executar imediatamente na inicialização
    this.executeScheduledTasks();

    // Agendar próximas execuções baseadas nos períodos
    this.scheduleNextExecutions();

    logger.info('Smart game scheduler started successfully');
  }

  /**
   * Para o scheduler
   */
  stop(): void {
    // Limpar todos os timeouts agendados
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];

    this.isRunning = false;
    logger.info('Smart game scheduler stopped');
  }

  /**
   * Agenda as próximas execuções baseadas nos horários de transição de períodos
   */
  private scheduleNextExecutions(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Agendar para hoje e amanhã
    [today, tomorrow].forEach(baseDate => {
      this.PERIOD_TRANSITIONS.forEach(transition => {
        // Agendar início do período (para ativação)
        this.scheduleExecution(
          new Date(baseDate.getTime() + transition.startHour * 60 * 60 * 1000),
          'activation',
          transition.period
        );

        // Agendar fim do período (para cancelamento)
        let endDate: Date;
        if (transition.period === PeriodoJogo.NOITE) {
          // Noite termina às 6h do dia seguinte
          endDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000);
        } else {
          endDate = new Date(baseDate.getTime() + transition.endHour * 60 * 60 * 1000);
        }

        this.scheduleExecution(endDate, 'cancellation', transition.period);
      });
    });

    // Agendar reagendamento para o próximo dia (meia-noite + 1 minuto)
    const nextMidnight = new Date(tomorrow.getTime() + 60 * 1000); // 00:01
    this.scheduleExecution(nextMidnight, 'reschedule');
  }

  /**
   * Agenda uma execução específica
   */
  private scheduleExecution(
    targetTime: Date,
    type: 'activation' | 'cancellation' | 'reschedule',
    period?: PeriodoJogo
  ): void {
    const now = new Date();
    const delay = targetTime.getTime() - now.getTime();

    // Só agendar se for no futuro
    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.executeScheduledTask(type, period);

        // Remover timeout da lista
        const index = this.timeouts.indexOf(timeout);
        if (index > -1) {
          this.timeouts.splice(index, 1);
        }
      }, delay);

      this.timeouts.push(timeout);

      logger.debug(`Scheduled ${type} for ${period || 'system'} at ${targetTime.toLocaleString('pt-BR')}`);
    }
  }

  /**
   * Executa uma tarefa agendada específica
   */
  private async executeScheduledTask(
    type: 'activation' | 'cancellation' | 'reschedule',
    period?: PeriodoJogo
  ): Promise<void> {
    try {
      switch (type) {
        case 'activation':
          await this.handlePeriodActivation(period!);
          break;
        case 'cancellation':
          await this.handlePeriodCancellation(period!);
          break;
        case 'reschedule':
          await this.handleReschedule();
          break;
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        type,
        period
      }, 'Error executing scheduled task');
    }
  }

  /**
   * Executa todas as tarefas agendadas (usado na inicialização)
   */
  private async executeScheduledTasks(): Promise<void> {
    try {
      // Ativar jogos que podem ser ativados agora
      const activatedCount = await JogoModel.activateGamesByPeriod();

      // Cancelar jogos expirados
      const cancelledCount = await JogoModel.cancelExpiredGames();

      // Finalizar jogos em atraso (NOVO)
      const finalizedCount = await JogoModel.finalizeOverdueGames();

      if (activatedCount > 0) {
        logger.info(`Smart scheduler activated ${activatedCount} games on startup`);
      }

      if (cancelledCount > 0) {
        logger.info(`Smart scheduler cancelled ${cancelledCount} expired games on startup`);
      }

      if (finalizedCount > 0) {
        logger.info(`Smart scheduler finalized ${finalizedCount} overdue games on startup`);
      }
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error)
      }, 'Error executing scheduled tasks on startup');
    }
  }

  /**
   * Manipula ativação de jogos no início de um período
   */
  private async handlePeriodActivation(period: PeriodoJogo): Promise<void> {
    logger.info(`Period activation triggered for ${period}`);

    const activatedCount = await JogoModel.activateGamesByPeriod();
    const finalizedCount = await JogoModel.finalizeOverdueGames();

    if (activatedCount > 0) {
      logger.info(`Smart scheduler activated ${activatedCount} games for period ${period}`);
    }

    if (finalizedCount > 0) {
      logger.info(`Smart scheduler finalized ${finalizedCount} overdue games during period ${period}`);
    }
  }

  /**
   * Manipula cancelamento de jogos no fim de um período
   */
  private async handlePeriodCancellation(period: PeriodoJogo): Promise<void> {
    logger.info(`Period cancellation triggered for ${period}`);

    const cancelledCount = await JogoModel.cancelExpiredGames();
    const finalizedCount = await JogoModel.finalizeOverdueGames();

    if (cancelledCount > 0) {
      logger.info(`Smart scheduler cancelled ${cancelledCount} expired games after period ${period}`);
    }

    if (finalizedCount > 0) {
      logger.info(`Smart scheduler finalized ${finalizedCount} overdue games after period ${period}`);
    }
  }

  /**
   * Reagenda as execuções para o próximo dia
   */
  private async handleReschedule(): Promise<void> {
    logger.info('Rescheduling smart scheduler for next day');

    // Limpar timeouts antigos
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];

    // Agendar próximas execuções
    this.scheduleNextExecutions();
  }

  /**
   * Força execução manual (para testes)
   */
  async forceExecution(): Promise<{ activated: number; cancelled: number; finalized: number }> {
    try {
      const activatedCount = await JogoModel.activateGamesByPeriod();
      const cancelledCount = await JogoModel.cancelExpiredGames();
      const finalizedCount = await JogoModel.finalizeOverdueGames();

      logger.info(`Force execution: activated ${activatedCount}, cancelled ${cancelledCount}, finalized ${finalizedCount}`);

      return { activated: activatedCount, cancelled: cancelledCount, finalized: finalizedCount };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in force execution');
      throw error;
    }
  }

  /**
   * Obtém informações sobre próximas execuções agendadas
   */
  getScheduledExecutions(): Array<{ time: Date; type: string; period?: PeriodoJogo }> {
    const now = new Date();
    const executions: Array<{ time: Date; type: string; period?: PeriodoJogo }> = [];

    // Esta é uma versão simplificada - em produção você poderia armazenar mais detalhes
    this.PERIOD_TRANSITIONS.forEach(transition => {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const startTime = new Date(today.getTime() + transition.startHour * 60 * 60 * 1000);
      if (startTime > now) {
        executions.push({
          time: startTime,
          type: 'activation',
          period: transition.period
        });
      }

      let endTime: Date;
      if (transition.period === PeriodoJogo.NOITE) {
        endTime = new Date(today.getTime() + 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000);
      } else {
        endTime = new Date(today.getTime() + transition.endHour * 60 * 60 * 1000);
      }

      if (endTime > now) {
        executions.push({
          time: endTime,
          type: 'cancellation',
          period: transition.period
        });
      }
    });

    return executions.sort((a, b) => a.time.getTime() - b.time.getTime());
  }

  /**
   * Obtém estatísticas do scheduler
   */
  getStats(): {
    isRunning: boolean;
    scheduledExecutions: number;
    nextExecution?: Date;
    currentPeriod: PeriodoJogo;
  } {
    const executions = this.getScheduledExecutions();

    return {
      isRunning: this.isRunning,
      scheduledExecutions: this.timeouts.length,
      nextExecution: executions[0]?.time,
      currentPeriod: GamePeriodHelper.getPeriodFromDate(new Date())
    };
  }
}