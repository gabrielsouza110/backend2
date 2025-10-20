/**
 * Helper para manipulação de datas e consultas temporais
 * Centraliza a lógica de timezone e formatação de datas
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeOfDayFilter {
  name: string;
  startHour: number;
  endHour: number;
}

export class DateHelper {
  private static readonly DEFAULT_TIMEZONE = 'America/Sao_Paulo';
  
  private static readonly TIME_PERIODS: Record<string, TimeOfDayFilter> = {
    'manha': { name: 'Manhã', startHour: 6, endHour: 12 },
    'manhã': { name: 'Manhã', startHour: 6, endHour: 12 },
    'meio-dia': { name: 'Meio-dia', startHour: 12, endHour: 14 },
    'meiodia': { name: 'Meio-dia', startHour: 12, endHour: 14 },
    'tarde': { name: 'Tarde', startHour: 14, endHour: 18 },
    'noite': { name: 'Noite', startHour: 18, endHour: 24 }
  };

  /**
   * Cria um range de data para o dia inteiro (00:00:00 até 23:59:59)
   */
  static getDayRange(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  /**
   * Cria um range de data com buffer para consultas de banco
   * Útil para lidar com diferenças de timezone
   */
  static getDayRangeWithBuffer(date: Date, bufferHours: number = 12): DateRange {
    const { start, end } = this.getDayRange(date);
    
    const bufferedStart = new Date(start.getTime() - (bufferHours * 60 * 60 * 1000));
    const bufferedEnd = new Date(end.getTime() + (bufferHours * 60 * 60 * 1000));
    
    return { start: bufferedStart, end: bufferedEnd };
  }

  /**
   * Verifica se uma data está dentro de um período do dia
   */
  static isInTimeOfDay(date: Date, timeOfDay: string): boolean {
    const period = this.TIME_PERIODS[timeOfDay.toLowerCase()];
    if (!period) return true; // Se período inválido, retorna todos
    
    const hour = date.getHours();
    
    // Tratamento especial para noite (pode passar da meia-noite)
    if (period.name === 'Noite') {
      return hour >= period.startHour || hour < 6;
    }
    
    return hour >= period.startHour && hour < period.endHour;
  }

  /**
   * Filtra uma lista de jogos por período do dia
   */
  static filterByTimeOfDay<T extends { dataHora: Date }>(
    items: T[], 
    timeOfDay?: string
  ): T[] {
    if (!timeOfDay) return items;
    
    return items.filter(item => this.isInTimeOfDay(item.dataHora, timeOfDay));
  }

  /**
   * Verifica se uma data está no mesmo dia local que outra
   */
  static isSameLocalDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Cria datas relativas (hoje, ontem, amanhã)
   */
  static getRelativeDate(offset: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
  }

  static getToday(): Date {
    return this.getRelativeDate(0);
  }

  static getYesterday(): Date {
    return this.getRelativeDate(-1);
  }

  static getTomorrow(): Date {
    return this.getRelativeDate(1);
  }

  /**
   * Formata uma data para exibição
   */
  static formatDate(date: Date, includeTime: boolean = true): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: this.DEFAULT_TIMEZONE
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return date.toLocaleString('pt-BR', options);
  }

  /**
   * Converte string para Date de forma segura
   */
  static parseDate(dateString: string | Date): Date | null {
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? null : dateString;
    }

    if (typeof dateString !== 'string') {
      return null;
    }

    // Tenta diferentes formatos
    const formats = [
      // ISO format (YYYY-MM-DD) - create as local date to avoid timezone issues
      () => {
        const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
          const [, year, month, day] = isoMatch;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return null;
      },
      // Brazilian format (DD/MM/YYYY)
      () => {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
      },
      // American format (MM/DD/YYYY)
      () => {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
        return null;
      },
      // Fallback to native Date constructor
      () => new Date(dateString)
    ];

    for (const format of formats) {
      try {
        const date = format();
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Get timezone offset for Brazil at a specific date
   */
  private static getTimezoneOffsetForBrazil(date: Date): number {
    // Get timezone offset for Brazil/Sao_Paulo
    const utcDate = new Date(date.toLocaleString("en-US", {timeZone: "UTC"}));
    const brazilDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    return (utcDate.getTime() - brazilDate.getTime()) / 60000;
  }

  /**
   * Calcula diferença em minutos entre duas datas
   */
  static getMinutesDifference(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60));
  }

  /**
   * Verifica se uma data está dentro de uma janela de tempo
   */
  static isWithinTimeWindow(
    targetDate: Date, 
    referenceDate: Date = new Date(), 
    windowMinutes: number = 5
  ): boolean {
    const diffMinutes = Math.abs(this.getMinutesDifference(targetDate, referenceDate));
    return diffMinutes <= windowMinutes;
  }

  /**
   * Retorna os períodos do dia disponíveis
   */
  static getAvailableTimePeriods(): TimeOfDayFilter[] {
    return Object.values(this.TIME_PERIODS);
  }
}