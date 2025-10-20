/**
 * Helper para gerenciar períodos de jogos e lógica de ativação/cancelamento
 */

export enum PeriodoJogo {
  MANHA = 'MANHA',
  MEIO_DIA = 'MEIO_DIA', 
  TARDE = 'TARDE',
  NOITE = 'NOITE'
}

export interface PeriodConfig {
  name: string;
  startHour: number;
  endHour: number;
  enum: PeriodoJogo;
}

export class GamePeriodHelper {
  private static readonly PERIODS: Record<PeriodoJogo, PeriodConfig> = {
    [PeriodoJogo.MANHA]: { 
      name: 'Manhã', 
      startHour: 6, 
      endHour: 12, 
      enum: PeriodoJogo.MANHA 
    },
    [PeriodoJogo.MEIO_DIA]: { 
      name: 'Meio-dia', 
      startHour: 12, 
      endHour: 14, 
      enum: PeriodoJogo.MEIO_DIA 
    },
    [PeriodoJogo.TARDE]: { 
      name: 'Tarde', 
      startHour: 14, 
      endHour: 18, 
      enum: PeriodoJogo.TARDE 
    },
    [PeriodoJogo.NOITE]: { 
      name: 'Noite', 
      startHour: 18, 
      endHour: 24, 
      enum: PeriodoJogo.NOITE 
    }
  };

  /**
   * Determina o período do dia baseado na hora
   */
  static getPeriodFromHour(hour: number): PeriodoJogo {
    if (hour >= 6 && hour < 12) return PeriodoJogo.MANHA;
    if (hour >= 12 && hour < 14) return PeriodoJogo.MEIO_DIA;
    if (hour >= 14 && hour < 18) return PeriodoJogo.TARDE;
    return PeriodoJogo.NOITE; // 18-24 e 0-6
  }

  /**
   * Determina o período do dia baseado em uma data
   */
  static getPeriodFromDate(date: Date): PeriodoJogo {
    return this.getPeriodFromHour(date.getHours());
  }

  /**
   * Verifica se estamos atualmente dentro de um período específico
   */
  static isCurrentlyInPeriod(period: PeriodoJogo, currentTime: Date = new Date()): boolean {
    const currentHour = currentTime.getHours();
    const periodConfig = this.PERIODS[period];
    
    // Tratamento especial para noite (pode passar da meia-noite)
    if (period === PeriodoJogo.NOITE) {
      return currentHour >= periodConfig.startHour || currentHour < 6;
    }
    
    return currentHour >= periodConfig.startHour && currentHour < periodConfig.endHour;
  }

  /**
   * Verifica se um período já passou no dia atual
   */
  static hasPeriodPassed(period: PeriodoJogo, currentTime: Date = new Date()): boolean {
    const currentHour = currentTime.getHours();
    const periodConfig = this.PERIODS[period];
    
    // Tratamento especial para noite - só passou se for de manhã do dia seguinte
    if (period === PeriodoJogo.NOITE) {
      return currentHour >= 6 && currentHour < periodConfig.startHour;
    }
    
    return currentHour >= periodConfig.endHour;
  }

  /**
   * Verifica se um jogo pode ser ativado baseado no período
   */
  static canActivateGame(
    gamePeriod: PeriodoJogo | null, 
    gameDate: Date, 
    currentTime: Date = new Date()
  ): boolean {
    // Se não tem período definido, usa a lógica antiga (ativação por horário exato)
    if (!gamePeriod) {
      return gameDate <= currentTime;
    }

    // Verifica se é o mesmo dia
    if (!this.isSameDay(gameDate, currentTime)) {
      return false;
    }

    // Verifica se estamos no período correto
    return this.isCurrentlyInPeriod(gamePeriod, currentTime);
  }

  /**
   * Verifica se um jogo deve ser cancelado por ter perdido o período
   */
  static shouldCancelGame(
    gamePeriod: PeriodoJogo | null,
    gameDate: Date,
    currentTime: Date = new Date()
  ): boolean {
    // Se não tem período definido, não cancela automaticamente
    if (!gamePeriod) {
      return false;
    }

    // Verifica se é o mesmo dia
    if (!this.isSameDay(gameDate, currentTime)) {
      // Se é um dia passado, deve cancelar
      return gameDate < currentTime;
    }

    // Verifica se o período já passou
    return this.hasPeriodPassed(gamePeriod, currentTime);
  }

  /**
   * Retorna todos os períodos disponíveis
   */
  static getAllPeriods(): PeriodConfig[] {
    return Object.values(this.PERIODS);
  }

  /**
   * Retorna a configuração de um período específico
   */
  static getPeriodConfig(period: PeriodoJogo): PeriodConfig {
    return this.PERIODS[period];
  }

  /**
   * Converte string para enum PeriodoJogo
   */
  static stringToPeriod(periodString: string): PeriodoJogo | null {
    const upperString = periodString.toUpperCase();
    return Object.values(PeriodoJogo).find(p => p === upperString) || null;
  }

  /**
   * Verifica se duas datas são do mesmo dia
   */
  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Retorna o próximo período que pode ativar jogos
   */
  static getNextActivationPeriod(currentTime: Date = new Date()): PeriodoJogo {
    const currentHour = currentTime.getHours();
    
    if (currentHour < 6) return PeriodoJogo.MANHA;
    if (currentHour < 12) return PeriodoJogo.MEIO_DIA;
    if (currentHour < 14) return PeriodoJogo.TARDE;
    if (currentHour < 18) return PeriodoJogo.NOITE;
    
    // Se já passou das 18h, o próximo período é manhã do dia seguinte
    return PeriodoJogo.MANHA;
  }
}