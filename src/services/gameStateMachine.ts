import { StatusJogo } from '@prisma/client';
import { logger } from '../utils/logger';

export interface GameStateTransition {
  from: StatusJogo;
  to: StatusJogo;
  timestamp: Date;
  reason?: string;
  userId?: number;
}

export class GameStateMachine {
  private static readonly transitions: Record<StatusJogo, StatusJogo[]> = {
    AGENDADO: ['EM_ANDAMENTO', 'CANCELADO'],
    EM_ANDAMENTO: ['PAUSADO', 'FINALIZADO', 'CANCELADO'],
    PAUSADO: ['EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO'],
    FINALIZADO: [], // Estado final
    CANCELADO: [] // Estado final
  };

  private static readonly stateDescriptions: Record<StatusJogo, string> = {
    AGENDADO: 'Jogo agendado para o futuro',
    EM_ANDAMENTO: 'Jogo em andamento',
    PAUSADO: 'Jogo pausado (intervalo/interrupção)',
    FINALIZADO: 'Jogo finalizado',
    CANCELADO: 'Jogo cancelado'
  };

  /**
   * Verifica se uma transição de estado é válida
   */
  static canTransition(from: StatusJogo, to: StatusJogo): boolean {
    if (from === to) {
      return false; // Não permite transição para o mesmo estado
    }

    return this.transitions[from]?.includes(to) || false;
  }

  /**
   * Valida e executa uma transição de estado
   */
  static validateTransition(
    currentStatus: StatusJogo,
    newStatus: StatusJogo,
    context?: { userId?: number; reason?: string }
  ): { valid: boolean; error?: string; transition?: GameStateTransition } {

    if (!this.canTransition(currentStatus, newStatus)) {
      const validTransitions = this.transitions[currentStatus] || [];
      return {
        valid: false,
        error: `Transição inválida de ${currentStatus} para ${newStatus}. Transições válidas: ${validTransitions.join(', ')}`
      };
    }

    const transition: GameStateTransition = {
      from: currentStatus,
      to: newStatus,
      timestamp: new Date(),
      reason: context?.reason,
      userId: context?.userId
    };

    logger.info({
      transition,
      gameState: {
        from: this.stateDescriptions[currentStatus],
        to: this.stateDescriptions[newStatus]
      }
    }, 'Game state transition validated');

    return { valid: true, transition };
  }

  /**
   * Retorna todas as transições possíveis para um estado
   */
  static getValidTransitions(currentStatus: StatusJogo): StatusJogo[] {
    return this.transitions[currentStatus] || [];
  }

  /**
   * Verifica se um estado é final (não permite mais transições)
   */
  static isFinalState(status: StatusJogo): boolean {
    return this.transitions[status].length === 0;
  }

  /**
   * Retorna a descrição de um estado
   */
  static getStateDescription(status: StatusJogo): string {
    return this.stateDescriptions[status] || 'Estado desconhecido';
  }

  /**
   * Valida se um jogo pode ser editado baseado no seu estado
   */
  static canEditGame(status: StatusJogo): boolean {
    return status === 'AGENDADO';
  }

  /**
   * Valida se um jogo pode ter seu placar atualizado
   */
  static canUpdateScore(status: StatusJogo): boolean {
    return ['EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO'].includes(status);
  }

  /**
   * Valida se eventos podem ser adicionados ao jogo
   */
  static canAddEvents(status: StatusJogo): boolean {
    return ['EM_ANDAMENTO', 'PAUSADO'].includes(status);
  }
}