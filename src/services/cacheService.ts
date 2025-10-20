import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Cleanup expired items every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Armazena um item no cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const timestamp = Date.now();

    // Remove oldest items if cache is full
    if (this.cache.size >= (options.maxSize || this.maxSize)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp,
      ttl,
      hits: 0
    });

    logger.debug(`Cache SET: ${key}`);
  }

  /**
   * Recupera um item do cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    // Update hit count
    item.hits++;
    logger.debug(`Cache HIT: ${key}`);

    return item.data;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpa itens expirados
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired items`);
    }
  }

  /**
   * Remove o item mais antigo (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache evicted oldest item: ${oldestKey}`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared: ${size} items removed`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    items: Array<{ key: string; hits: number; age: number }>;
  } {
    const now = Date.now();
    let totalHits = 0;
    const items: Array<{ key: string; hits: number; age: number }> = [];

    for (const [key, item] of this.cache.entries()) {
      totalHits += item.hits;
      items.push({
        key,
        hits: item.hits,
        age: now - item.timestamp
      });
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalHits > 0 ? (totalHits / (totalHits + this.cache.size)) : 0,
      items: items.sort((a, b) => b.hits - a.hits)
    };
  }

  /**
   * Para o serviço de cache
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Cache específico para jogos
export class GameCacheService {
  private cache = CacheService.getInstance();
  private readonly CACHE_KEYS = {
    TODAY_GAMES: (modalidade?: number) => `games:today:${modalidade || 'all'}`,
    YESTERDAY_GAMES: (modalidade?: number) => `games:yesterday:${modalidade || 'all'}`,
    TOMORROW_GAMES: (modalidade?: number) => `games:tomorrow:${modalidade || 'all'}`,
    GAME_BY_ID: (id: number) => `game:${id}`,
    GAMES_BY_DATE: (date: string, modalidade?: number) => `games:date:${date}:${modalidade || 'all'}`,
    GAME_EVENTS: (gameId: number) => `game:${gameId}:events`,
    GAME_STATS: (gameId: number) => `game:${gameId}:stats`
  };

  /**
   * Cache para jogos de hoje
   */
  async getTodayGames<T>(
    modalidade: number | undefined,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = this.CACHE_KEYS.TODAY_GAMES(modalidade);
    let games = this.cache.get<T>(key);

    if (!games) {
      games = await fetcher();
      this.cache.set(key, games, { ttl: 2 * 60 * 1000 }); // 2 minutes for today's games
    }

    return games;
  }

  /**
   * Cache para jogos por data
   */
  async getGamesByDate<T>(
    date: string,
    modalidade: number | undefined,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = this.CACHE_KEYS.GAMES_BY_DATE(date, modalidade);
    let games = this.cache.get<T>(key);

    if (!games) {
      games = await fetcher();
      this.cache.set(key, games, { ttl: 10 * 60 * 1000 }); // 10 minutes for date queries
    }

    return games;
  }

  /**
   * Cache para jogo específico
   */
  async getGameById<T>(
    id: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const key = this.CACHE_KEYS.GAME_BY_ID(id);
    let game = this.cache.get<T>(key);

    if (!game) {
      game = await fetcher();
      this.cache.set(key, game, { ttl: 30 * 1000 }); // 30 seconds for individual games
    }

    return game;
  }

  /**
   * Invalida cache relacionado a um jogo específico
   */
  invalidateGameCache(gameId: number): void {
    this.cache.delete(this.CACHE_KEYS.GAME_BY_ID(gameId));
    this.cache.delete(this.CACHE_KEYS.GAME_EVENTS(gameId));
    this.cache.delete(this.CACHE_KEYS.GAME_STATS(gameId));

    // Invalida caches de data (mais agressivo, mas necessário)
    this.invalidateDateCaches();
  }

  /**
   * Invalida todos os caches de data
   */
  private invalidateDateCaches(): void {
    const keys = Array.from(this.cache['cache'].keys());
    const dateKeys = keys.filter(key =>
      key.includes('games:today:') ||
      key.includes('games:yesterday:') ||
      key.includes('games:tomorrow:') ||
      key.includes('games:date:')
    );

    dateKeys.forEach(key => this.cache.delete(key));

    logger.debug(`Invalidated ${dateKeys.length} date-related cache entries`);
  }
}