import { JogoModel } from '../models/jogoModel';

/**
 * Helper para calcular automaticamente a minutagem dos eventos de jogo
 */

export interface GameTimeInfo {
  gameStartTime: Date;
  currentTime: Date;
  elapsedMinutes: number;
  gameStatus: string;
  isGameActive: boolean;
}

export class GameTimeHelper {
  /**
   * Calcula a minutagem atual do jogo baseada no horário de início, desconsiderando o tempo pausado
   */
  static async calculateGameMinute(jogoId: number, gameStartTime: Date, eventTime?: Date): Promise<number> {
    const currentTime = eventTime || new Date();
    
    // Se o evento aconteceu antes do início do jogo, retorna 0
    if (currentTime < gameStartTime) {
      return 0;
    }
    
    // Calcular o tempo pausado
    const pausedTimeMs = await JogoModel.calculatePausedTime(jogoId, currentTime);
    
    // Calcula a diferença em milissegundos, desconsiderando o tempo pausado
    const diffMs = currentTime.getTime() - gameStartTime.getTime() - pausedTimeMs;
    
    // Se o tempo ajustado é negativo, retorna 0
    if (diffMs < 0) {
      return 0;
    }
    
    // Converte para minutos e arredonda para baixo
    const minutes = Math.floor(diffMs / (1000 * 60));
    
    // Limita a 120 minutos (tempo máximo razoável para um jogo)
    return Math.min(minutes, 120);
  }

  /**
   * Obtém informações completas sobre o tempo do jogo
   */
  static async getGameTimeInfo(jogoId: number, gameStartTime: Date, gameStatus: string, eventTime?: Date): Promise<GameTimeInfo> {
    const currentTime = eventTime || new Date();
    const elapsedMinutes = await this.calculateGameMinute(jogoId, gameStartTime, currentTime);
    const isGameActive = ['EM_ANDAMENTO', 'PAUSADO'].includes(gameStatus);

    return {
      gameStartTime,
      currentTime,
      elapsedMinutes,
      gameStatus,
      isGameActive
    };
  }

  /**
   * Verifica se é válido adicionar um evento no momento atual
   */
  static async canAddEvent(jogoId: number, gameStartTime: Date, gameStatus: string, eventTime?: Date): Promise<{
    canAdd: boolean;
    reason?: string;
    suggestedMinute?: number;
  }> {
    const currentTime = eventTime || new Date();
    
    // Verifica se o jogo está em um status que permite eventos
    if (!['EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO'].includes(gameStatus)) {
      return {
        canAdd: false,
        reason: 'Jogo não está em andamento, pausado ou finalizado'
      };
    }

    // Verifica se o evento não é anterior ao início do jogo
    if (currentTime < gameStartTime) {
      return {
        canAdd: false,
        reason: 'Não é possível adicionar eventos antes do início do jogo'
      };
    }

    // Calcular minutos sem limitação para validação
    const pausedTimeMs = await JogoModel.calculatePausedTime(jogoId, currentTime);
    const diffMs = currentTime.getTime() - gameStartTime.getTime() - pausedTimeMs;
    const actualMinutes = Math.floor(diffMs / (1000 * 60));
    
    // Verifica se não passou muito tempo (mais de 2 horas)
    if (actualMinutes > 120) {
      return {
        canAdd: false,
        reason: 'Tempo de jogo excede o limite máximo (120 minutos)'
      };
    }

    const elapsedMinutes = await this.calculateGameMinute(jogoId, gameStartTime, currentTime);

    return {
      canAdd: true,
      suggestedMinute: elapsedMinutes
    };
  }

  /**
   * Valida se um minuto informado manualmente está dentro do esperado
   */
  static async validateManualMinute(
    jogoId: number,
    gameStartTime: Date, 
    manualMinute: number, 
    gameStatus: string,
    tolerance: number = 5
  ): Promise<{
    isValid: boolean;
    autoCalculatedMinute: number;
    difference: number;
    warning?: string;
  }> {
    const autoCalculatedMinute = await this.calculateGameMinute(jogoId, gameStartTime);
    const difference = Math.abs(manualMinute - autoCalculatedMinute);
    
    const result = {
      isValid: difference <= tolerance,
      autoCalculatedMinute,
      difference
    };

    if (difference > tolerance) {
      return {
        ...result,
        warning: `Minuto informado (${manualMinute}') difere significativamente do calculado automaticamente (${autoCalculatedMinute}'). Diferença: ${difference} minutos.`
      };
    }

    if (manualMinute > autoCalculatedMinute + tolerance) {
      return {
        ...result,
        warning: `Minuto informado (${manualMinute}') está no futuro. Minuto atual calculado: ${autoCalculatedMinute}'.`
      };
    }

    return result;
  }

  /**
   * Calcula estatísticas de tempo do jogo
   */
  static async getGameStats(jogoId: number, gameStartTime: Date, gameStatus: string): Promise<{
    totalDuration: number;
    formattedDuration: string;
    isOvertime: boolean;
    expectedEndTime: Date;
  }> {
    const now = new Date();
    const totalDuration = await this.calculateGameMinute(jogoId, gameStartTime, now);
    const formattedDuration = this.formatGameTime(totalDuration);
    const isOvertime = totalDuration > 90; // Considera overtime após 90 minutos
    
    // Estima horário de término (90 minutos padrão)
    const expectedEndTime = new Date(gameStartTime.getTime() + (90 * 60 * 1000));

    return {
      totalDuration,
      formattedDuration,
      isOvertime,
      expectedEndTime
    };
  }

  /**
   * Formata o tempo de jogo para exibição
   */
  static formatGameTime(minutes: number): string {
    if (minutes === 0) {
      return "0'";
    }
    
    if (minutes < 60) {
      return `${minutes}'`;
    }
    
    // Para jogos que passam de 60 minutos, mostra horas e minutos
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h${remainingMinutes}'`;
  }

  /**
   * Converte minutagem para timestamp aproximado
   */
  static minuteToTimestamp(gameStartTime: Date, minute: number): Date {
    return new Date(gameStartTime.getTime() + (minute * 60 * 1000));
  }

  /**
   * Obtém o minuto do jogo para um timestamp específico
   */
  static async timestampToMinute(jogoId: number, gameStartTime: Date, timestamp: Date): Promise<number> {
    return await this.calculateGameMinute(jogoId, gameStartTime, timestamp);
  }
}