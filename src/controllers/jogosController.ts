import { Request, Response } from 'express';
import { JogoModel } from '../models/jogoModel';
import { EstatisticasService } from '../services/estatisticasService';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { TypeHelpers } from '../utils/typeHelpers';
import { EditionUtils } from '../utils/editionUtils';
import { GameScheduler } from '../services/gameScheduler';
import { GameCacheService } from '../services/cacheService';
import { DateHelper } from '../utils/dateHelper';
import { GameStateMachine } from '../services/gameStateMachine';
import { logger } from '../utils/logger';
import { StatusJogo } from '@prisma/client';
import { createHash } from 'crypto';

export class JogosController {
  private static gameCache = new GameCacheService();

  // Helper function to generate ETag
  private static generateETag(data: any): string {
    const hash = createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }

  // Helper function to check if client's ETag matches
  private static checkETag(req: Request, data: any): boolean {
    const eTag = JogosController.generateETag(data);
    const ifNoneMatch = req.headers['if-none-match'];
    return ifNoneMatch === eTag;
  }

  static async getAll(req: Request, res: Response) {
    try {
      const { modalidade, data, edicao, horario, summary, fields, include, limit, offset } = req.query;

      const filters: any = {};
      if (modalidade) filters.modalidadeId = TypeHelpers.toInt(modalidade);
      if (data) filters.dataHora = TypeHelpers.toDate(data);
      if (edicao) filters.edicaoId = TypeHelpers.toInt(edicao);

      let jogos = await JogoModel.findAll(filters);

      // Apply time period filter if provided
      if (horario) {
        jogos = DateHelper.filterByTimeOfDay(jogos, horario as string);
      }

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return lean response for lists
        const jogosLean = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            id: jogo.id,
            dataHora: jogo.dataHora,
            status: jogo.status,
            placar: {
              time1: time1Score,
              time2: time2Score
            },
            time1Id: jogo.time1Id,
            time2Id: jogo.time2Id
          };
        });

        // Add ETag support
        const eTag = JogosController.generateETag(jogosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, jogosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, jogosLean);
      } else {
        // Process the games to include scores in a more readable format (full response)
        const jogosComPlacar = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            ...jogo,
            placar: {
              time1: time1Score,
              time2: time2Score
            }
          };
        });

        // Apply pagination if requested
        let finalJogos = jogosComPlacar;
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalJogos = jogosComPlacar.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalJogos = finalJogos.map(jogo => {
            const filteredJogo: any = {};
            fieldList.forEach(field => {
              if (field in jogo) {
                filteredJogo[field] = (jogo as any)[field];
              }
            });
            return filteredJogo;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalJogos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalJogos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalJogos);
      }
    } catch (error) {
      console.error('Error in JogosController.getAll:', error);
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query
      }, 'Error in JogosController.getAll');
      return ResponseHandler.error(res, 'Erro ao buscar jogos');
    }
  }

  /**
   * Get games for today (with cache)
   */
  static async getToday(req: Request, res: Response) {
    try {
      const { modalidade, genero, horario, summary, fields, include, limit, offset } = req.query;
      const modalidadeId = modalidade ? TypeHelpers.toInt(modalidade) : undefined;

      // Use simplified approach - get today's date and filter
      const today = DateHelper.getToday();
      const { start, end } = DateHelper.getDayRangeWithBuffer(today, 12);

      const filters: any = {
        dataHora: {
          gte: start,
          lte: end
        }
      };

      if (modalidadeId) {
        filters.modalidadeId = modalidadeId;
      }

      let jogos = await JogoModel.findAll(filters);

      // Filter to only include games that are actually today
      jogos = jogos.filter(jogo =>
        DateHelper.isSameLocalDay(new Date(jogo.dataHora), today)
      );

      // Apply time period filter if provided
      if (horario) {
        jogos = DateHelper.filterByTimeOfDay(jogos, horario as string);
      }

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return lean response for lists
        const jogosLean = jogos.map(jogo => {
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            id: jogo.id,
            dataHora: jogo.dataHora,
            status: jogo.status,
            placar: {
              time1: time1Score,
              time2: time2Score
            },
            time1Id: jogo.time1Id,
            time2Id: jogo.time2Id
          };
        });

        logger.info(`Retrieved ${jogosLean.length} games for today (summary mode)`);

        // Add ETag support
        const eTag = JogosController.generateETag(jogosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, jogosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, jogosLean);
      } else {
        // Process games with basic score info (full response)
        const jogosComPlacar = jogos.map(jogo => {
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            ...jogo,
            placar: {
              time1: time1Score,
              time2: time2Score
            }
          };
        });

        logger.info(`Retrieved ${jogosComPlacar.length} games for today`);

        // Apply pagination if requested
        let finalJogos = jogosComPlacar;
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalJogos = jogosComPlacar.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalJogos = finalJogos.map(jogo => {
            const filteredJogo: any = {};
            fieldList.forEach(field => {
              if (field in jogo) {
                filteredJogo[field] = (jogo as any)[field];
              }
            });
            return filteredJogo;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalJogos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalJogos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalJogos);
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting today games');
      return ResponseHandler.error(res, 'Erro ao buscar jogos de hoje');
    }
  }

  /**
   * Get games for yesterday
   */
  static async getYesterday(req: Request, res: Response) {
    try {
      const { modalidade, genero, horario, summary, fields, include, limit, offset } = req.query;

      const modalidadeId = modalidade ? TypeHelpers.toInt(modalidade) : undefined;

      const jogos = await JogoModel.findYesterday(modalidadeId as number | undefined, genero as string | undefined, horario as string | undefined);

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return lean response for lists
        const jogosLean = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            id: jogo.id,
            dataHora: jogo.dataHora,
            status: jogo.status,
            placar: {
              time1: time1Score,
              time2: time2Score
            },
            time1Id: jogo.time1Id,
            time2Id: jogo.time2Id
          };
        });

        // Add ETag support
        const eTag = JogosController.generateETag(jogosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, jogosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, jogosLean);
      } else {
        // Process the games to include scores in a more readable format (full response)
        const jogosComPlacar = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            ...jogo,
            placar: {
              time1: time1Score,
              time2: time2Score
            }
          };
        });

        // Apply pagination if requested
        let finalJogos = jogosComPlacar;
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalJogos = jogosComPlacar.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalJogos = finalJogos.map(jogo => {
            const filteredJogo: any = {};
            fieldList.forEach(field => {
              if (field in jogo) {
                filteredJogo[field] = (jogo as any)[field];
              }
            });
            return filteredJogo;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalJogos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalJogos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalJogos);
      }
    } catch (error) {
      console.error('Error in JogosController.getYesterday:', error);
      return ResponseHandler.error(res, 'Erro ao buscar jogos de ontem');
    }
  }

  /**
   * Get games for tomorrow
   */
  static async getTomorrow(req: Request, res: Response) {
    try {
      const { modalidade, genero, horario, summary, fields, include, limit, offset } = req.query;

      const modalidadeId = modalidade ? TypeHelpers.toInt(modalidade) : undefined;

      const jogos = await JogoModel.findTomorrow(modalidadeId as number | undefined, genero as string | undefined, horario as string | undefined);

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return lean response for lists
        const jogosLean = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            id: jogo.id,
            dataHora: jogo.dataHora,
            status: jogo.status,
            placar: {
              time1: time1Score,
              time2: time2Score
            },
            time1Id: jogo.time1Id,
            time2Id: jogo.time2Id
          };
        });

        // Add ETag support
        const eTag = JogosController.generateETag(jogosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, jogosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, jogosLean);
      } else {
        // Process the games to include scores in a more readable format (full response)
        const jogosComPlacar = jogos.map(jogo => {
          // Safely handle jogoTimes
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            ...jogo,
            placar: {
              time1: time1Score,
              time2: time2Score
            }
          };
        });

        // Apply pagination if requested
        let finalJogos = jogosComPlacar;
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalJogos = jogosComPlacar.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalJogos = finalJogos.map(jogo => {
            const filteredJogo: any = {};
            fieldList.forEach(field => {
              if (field in jogo) {
                filteredJogo[field] = (jogo as any)[field];
              }
            });
            return filteredJogo;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalJogos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalJogos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalJogos);
      }
    } catch (error) {
      console.error('Error in JogosController.getTomorrow:', error);
      return ResponseHandler.error(res, 'Erro ao buscar jogos de amanhã');
    }
  }

  /**
   * Get games for a specific date (with cache and improved date handling)
   */
  static async getByDate(req: Request, res: Response) {
    try {
      const { date, modalidade, genero, horario, summary, fields, include, limit, offset } = req.query;

      if (!date) {
        return ResponseHandler.badRequest(res, 'Data é obrigatória');
      }

      const dateObj = DateHelper.parseDate(date as string);
      if (!dateObj) {
        return ResponseHandler.badRequest(res, 'Data inválida. Use formato YYYY-MM-DD ou DD/MM/YYYY');
      }

      const modalidadeId = modalidade ? TypeHelpers.toInt(modalidade) : undefined;
      const dateKey = DateHelper.formatDate(dateObj, false);

      // Use simplified approach - get date range and filter
      const { start, end } = DateHelper.getDayRangeWithBuffer(dateObj, 12);

      const filters: any = {
        dataHora: {
          gte: start,
          lte: end
        }
      };

      if (modalidadeId) {
        filters.modalidadeId = modalidadeId;
      }

      let jogos = await JogoModel.findAll(filters);

      // Filter to only include games that are actually on the requested date
      jogos = jogos.filter(jogo =>
        DateHelper.isSameLocalDay(new Date(jogo.dataHora), dateObj)
      );

      // Apply time period filter if provided
      if (horario) {
        jogos = DateHelper.filterByTimeOfDay(jogos, horario as string);
      }

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return lean response for lists
        const jogosLean = jogos.map(jogo => {
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            id: jogo.id,
            dataHora: jogo.dataHora,
            status: jogo.status,
            placar: {
              time1: time1Score,
              time2: time2Score
            },
            time1Id: jogo.time1Id,
            time2Id: jogo.time2Id
          };
        });

        logger.info(`Retrieved ${jogosLean.length} games for date ${dateKey} (summary mode)`);

        // Add ETag support
        const eTag = JogosController.generateETag(jogosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, jogosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, jogosLean);
      } else {
        // Process games with basic score info (full response)
        const jogosComPlacar = jogos.map(jogo => {
          const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
          const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time1Id)?.gols || 0;
          const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogo.time2Id)?.gols || 0;

          return {
            ...jogo,
            placar: {
              time1: time1Score,
              time2: time2Score
            }
          };
        });

        logger.info(`Retrieved ${jogosComPlacar.length} games for date ${dateKey}`);

        // Apply pagination if requested
        let finalJogos = jogosComPlacar;
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalJogos = jogosComPlacar.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalJogos = finalJogos.map(jogo => {
            const filteredJogo: any = {};
            fieldList.forEach(field => {
              if (field in jogo) {
                filteredJogo[field] = (jogo as any)[field];
              }
            });
            return filteredJogo;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalJogos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalJogos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalJogos);
      }
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting games by date');
      return ResponseHandler.error(res, 'Erro ao buscar jogos por data');
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const jogo = await JogoModel.findById(idNum);

      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Process game with enhanced fields (always full detail for individual game)
      const jogoComPlacar = JogosController.processGameWithScore(jogo);

      // Add ETag support
      const eTag = JogosController.generateETag(jogoComPlacar);
      res.set('ETag', eTag);
      res.set('Last-Modified', new Date().toUTCString());

      // Check if client's ETag matches
      if (JogosController.checkETag(req, jogoComPlacar)) {
        return res.status(304).send(); // Not Modified
      }

      return ResponseHandler.success(res, jogoComPlacar);
    } catch (error) {
      console.error('Error in getById:', error);
      logger.error({ error: error instanceof Error ? error.message : String(error), gameId: req.params.id }, 'Error getting game by ID');
      return ResponseHandler.error(res, 'Erro ao buscar jogo');
    }
  }

  /**
   * Helper method to process games with scores
   */
  private static processGamesWithScores(jogos: any[]): any[] {
    return jogos.map(jogo => JogosController.processGameWithScore(jogo));
  }

  /**
   * Helper method to process a single game with score
   */
  private static processGameWithScore(jogo: any): any {
    try {
      const jogoTimes = Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : [];
      const time1Score = jogoTimes.find((jt: any) => jt && jt.timeId === jogo.time1Id)?.gols || 0;
      const time2Score = jogoTimes.find((jt: any) => jt && jt.timeId === jogo.time2Id)?.gols || 0;

      return {
        ...jogo,
        placar: {
          time1: time1Score,
          time2: time2Score
        },
        isFinished: jogo.status === 'FINALIZADO',
        isInProgress: jogo.status === 'EM_ANDAMENTO',
        isPaused: jogo.status === 'PAUSADO',
        canEdit: jogo.status === 'AGENDADO',
        canUpdateScore: ['EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO'].includes(jogo.status),
        canAddEvents: ['EM_ANDAMENTO', 'PAUSADO'].includes(jogo.status),
        validTransitions: GameStateMachine.getValidTransitions(jogo.status as StatusJogo)
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error), gameId: jogo?.id }, 'Error processing game with score');
      throw error;
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      let { time1Id, time2Id, modalidadeId, dataHora, local, descricao, edicaoId } = req.body;

      if (!time1Id || !time2Id || !modalidadeId || !dataHora) {
        return ResponseHandler.badRequest(res, 'Dados incompletos');
      }

      if (time1Id === time2Id) {
        return ResponseHandler.badRequest(res, 'Os times devem ser diferentes');
      }

      const dataJogo = DateHelper.parseDate(dataHora);
      if (!dataJogo || dataJogo < new Date()) {
        return ResponseHandler.badRequest(res, 'A data do jogo deve ser futura');
      }

      // If edicaoId is not provided, use the current edition
      if (edicaoId === undefined) {
        edicaoId = await EditionUtils.getCurrentEditionId();
      }

      const conflito = await JogoModel.hasScheduleConflict(time1Id, time2Id, dataJogo);
      if (conflito) {
        return ResponseHandler.conflict(res, 'Já existe um jogo agendado para um dos times nesse horário');
      }

      const jogo = await JogoModel.create({
        time1Id,
        time2Id,
        modalidadeId,
        dataHora: dataJogo,
        local,
        descricao,
        edicaoId: TypeHelpers.toInt(edicaoId)
      });

      return ResponseHandler.created(res, jogo);
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao criar jogo');
    }
  }

  static async updatePlacar(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const { placarTime1, placarTime2 } = req.body;

      if (isNaN(placarTime1) || isNaN(placarTime2) || placarTime1 < 0 || placarTime2 < 0) {
        return ResponseHandler.badRequest(res, 'Placar inválido');
      }

      const jogoAtualizado = await JogoModel.atualizarPlacar(
        idNum,
        placarTime1,
        placarTime2
      );

      // Return only the scores instead of the full game object
      const jogoTimes = Array.isArray(jogoAtualizado.jogoTimes) ? jogoAtualizado.jogoTimes : [];
      const time1Score = jogoTimes.find(jt => jt && jt.timeId === jogoAtualizado.time1Id)?.gols || 0;
      const time2Score = jogoTimes.find(jt => jt && jt.timeId === jogoAtualizado.time2Id)?.gols || 0;

      return ResponseHandler.success(res, {
        placar: {
          time1: time1Score,
          time2: time2Score
        }
      });
    } catch (error) {
      console.error('Error in JogosController.updatePlacar:', error);
      // Check if it's a specific error we want to handle differently
      if (error instanceof Error && error.message.includes('não está finalizado')) {
        return ResponseHandler.badRequest(res, 'O jogo precisa ser finalizado antes de atualizar o placar');
      }
      return ResponseHandler.error(res, 'Erro ao atualizar placar');
    }
  }

  /**
   * Score a goal with player information
   */
  static async scoreGoal(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.id);
      const { jogadorId, timeId, minuto } = req.body;

      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      if (!jogadorId) {
        return ResponseHandler.badRequest(res, 'ID do jogador é obrigatório');
      }

      if (!timeId) {
        return ResponseHandler.badRequest(res, 'ID do time é obrigatório');
      }

      const goalEvent = await JogoModel.adicionarGol(
        jogoId,
        jogadorId,
        timeId,
        minuto
      );

      return ResponseHandler.success(res, {
        message: 'Gol marcado com sucesso',
        event: goalEvent
      });
    } catch (error) {
      console.error('Error in JogosController.scoreGoal:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('não encontrado')) {
          return ResponseHandler.notFound(res, error.message);
        }
        if (error.message.includes('não pertence ao time')) {
          return ResponseHandler.badRequest(res, error.message);
        }
        if (error.message.includes('não está participando')) {
          return ResponseHandler.badRequest(res, error.message);
        }
      }
      
      return ResponseHandler.error(res, 'Erro ao marcar gol');
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const jogo = await JogoModel.findById(idNum);

      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      await JogoModel.delete(idNum);

      return ResponseHandler.noContent(res);
    } catch (error) {
      return ResponseHandler.error(res, 'Erro ao excluir jogo');
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const { time1Id, time2Id, modalidadeId, dataHora, local, descricao } = req.body;

      const jogoExistente = await JogoModel.findById(idNum);

      if (!jogoExistente) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Check if game can be edited based on its current status
      if (!GameStateMachine.canEditGame(jogoExistente.status)) {
        return ResponseHandler.badRequest(res,
          `Não é possível editar jogo com status ${jogoExistente.status}. Apenas jogos AGENDADOS podem ser editados.`
        );
      }

      const updateData: any = {};
      if (time1Id) updateData.time1Id = TypeHelpers.toInt(time1Id);
      if (time2Id) updateData.time2Id = TypeHelpers.toInt(time2Id);
      if (modalidadeId) updateData.modalidadeId = TypeHelpers.toInt(modalidadeId);
      if (dataHora) {
        const parsedDate = DateHelper.parseDate(dataHora);
        if (!parsedDate) {
          return ResponseHandler.badRequest(res, 'Data e hora inválidas');
        }
        // Validate that the new date is in the future (for scheduled games)
        if (parsedDate < new Date()) {
          return ResponseHandler.badRequest(res, 'A data do jogo deve ser futura');
        }
        updateData.dataHora = parsedDate;
      }
      if (local !== undefined) updateData.local = local;
      if (descricao !== undefined) updateData.descricao = descricao;

      // Check for schedule conflicts if changing teams or date/time
      if ((time1Id || time2Id || dataHora) && updateData.dataHora) {
        const newTime1Id = time1Id || jogoExistente.time1Id;
        const newTime2Id = time2Id || jogoExistente.time2Id;
        const newDataHora = updateData.dataHora || jogoExistente.dataHora;

        const conflito = await JogoModel.hasScheduleConflict(newTime1Id, newTime2Id, newDataHora, idNum);
        if (conflito) {
          return ResponseHandler.conflict(res, 'Já existe um jogo agendado para um dos times nesse horário');
        }
      }

      const jogoAtualizado = await JogoModel.update(idNum, updateData, {
        userId: req.user?.id,
        reason: 'Jogo atualizado via API'
      });

      // Invalidate cache for this game
      JogosController.gameCache.invalidateGameCache(idNum);

      logger.info(`Game ${idNum} updated successfully by user ${req.user?.id}`);

      return ResponseHandler.success(res, {
        ...jogoAtualizado,
        message: 'Jogo atualizado com sucesso'
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        gameId: req.params.id,
        userId: req.user?.id
      }, 'Error updating game');

      if (error instanceof Error && error.message.includes('Transição inválida')) {
        return ResponseHandler.badRequest(res, error.message);
      }

      return ResponseHandler.error(res, 'Erro ao atualizar jogo');
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const { status, reason } = req.body;
      const userId = req.user?.id;

      // Validate status
      const validStatuses = ['AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO'];
      if (!validStatuses.includes(status)) {
        return ResponseHandler.badRequest(res, 'Status inválido');
      }

      const jogoAtualizado = await JogoModel.update(idNum, { status }, { userId, reason });

      // Invalidate cache for this game
      JogosController.gameCache.invalidateGameCache(idNum);

      // Automatically update team statistics when game status is changed to FINALIZADO
      if (status === 'FINALIZADO') {
        try {
          const jogoCompleto = await JogoModel.findById(idNum);
          await EstatisticasService.atualizarEstatisticasTime(jogoCompleto);

          logger.info(`Statistics updated for finalized game`);
        } catch (statsError) {
          logger.error({
            error: statsError instanceof Error ? statsError.message : String(statsError),
            gameId: idNum
          }, 'Error updating statistics for finalized game');
          // We don't fail the request if statistics update fails
        }
      }

      return ResponseHandler.success(res, {
        ...jogoAtualizado,
        validTransitions: GameStateMachine.getValidTransitions(jogoAtualizado.status)
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        gameId: req.params.id,
        userId: req.user?.id
      }, 'Error updating game status');

      if (error instanceof Error) {
        if (error.message.includes('Transição inválida')) {
          return ResponseHandler.badRequest(res, error.message);
        }
        if (error.message.includes('Jogo não encontrado')) {
          return ResponseHandler.notFound(res, 'Jogo não encontrado');
        }
      }
      return ResponseHandler.error(res, 'Erro ao atualizar status do jogo');
    }
  }

  static async getEventos(req: Request, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.jogoId);
      const { summary, fields, include, limit, offset } = req.query;
      
      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(jogoId);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Get events for this game
      const eventos = await JogoModel.getEventos(jogoId);

      // Check if summary mode is requested
      const isSummary = summary === 'true' || summary === '1';
      
      if (isSummary) {
        // Return ultra-lean response for event lists
        const eventosLean = eventos.map(evento => ({
          id: evento.id,
          minuto: evento.minuto,
          tipo: evento.tipo,
          jogadorId: evento.jogadorId,
          timeId: evento.timeId
        }));

        // Add ETag support
        const eTag = JogosController.generateETag(eventosLean);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, eventosLean)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, eventosLean);
      } else {
        // Return optimized full event details
        let finalEventos = eventos;

        // Apply pagination if requested
        const limitNum = limit ? (TypeHelpers.toInt(limit) || 50) : 50; // Default limit
        const offsetNum = offset ? (TypeHelpers.toInt(offset) || 0) : 0;
        if (limit || offset) {
          finalEventos = eventos.slice(offsetNum, offsetNum + limitNum);
        }

        // Apply field filtering if requested
        if (fields) {
          const fieldList = (fields as string).split(',');
          finalEventos = finalEventos.map(evento => {
            const filteredEvento: any = {};
            fieldList.forEach(field => {
              if (field in evento) {
                filteredEvento[field] = (evento as any)[field];
              }
            });
            return filteredEvento;
          });
        }

        // Apply include filtering if requested
        if (include) {
          const includeList = (include as string).split(',');
          // For For now, we'll just return the full response as the implementation
          // would depend on the specific requirements for include filtering
        }

        // Add ETag support
        const eTag = JogosController.generateETag(finalEventos);
        res.set('ETag', eTag);
        res.set('Last-Modified', new Date().toUTCString());

        // Check if client's ETag matches
        if (JogosController.checkETag(req, finalEventos)) {
          return res.status(304).send(); // Not Modified
        }

        return ResponseHandler.success(res, finalEventos);
      }
    } catch (error) {
      console.error('Error in JogosController.getEventos:', error);
      return ResponseHandler.error(res, 'Erro ao buscar eventos do jogo');
    }
  }

  static async addEvento(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.jogoId);
      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(jogoId);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Check if body exists and has required fields
      const { tipo, minuto, timeId, jogadorId, jogadorSubstituidoId, descricao } = req.body;

      // Validate required fields
      if (!tipo || minuto === undefined || !timeId) {
        return ResponseHandler.badRequest(res, 'Dados incompletos para criação de evento');
      }

      // Add event
      const evento = await JogoModel.adicionarEvento(jogoId, {
        tipo,
        minuto,
        timeId,
        jogadorId,
        jogadorSubstituidoId,
        descricao
      });

      return ResponseHandler.created(res, evento);
    } catch (error) {
      console.error('Error in JogosController.addEvento:', error);
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return ResponseHandler.notFound(res, error.message);
      }
      if (error instanceof Error && error.message.includes('não pertence')) {
        return ResponseHandler.badRequest(res, error.message);
      }
      return ResponseHandler.error(res, 'Erro ao adicionar evento ao jogo');
    }
  }

  static async updateEvento(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.jogoId);
      const eventoId = TypeHelpers.toInt(req.params.eventoId);

      if (!jogoId || !eventoId) {
        return ResponseHandler.badRequest(res, 'IDs inválidos');
      }

      const { tipo, minuto, timeId, jogadorId, jogadorSubstituidoId, descricao } = req.body;

      // Check if game exists
      const jogo = await JogoModel.findById(jogoId);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Update event
      const evento = await JogoModel.atualizarEvento(eventoId, {
        tipo,
        minuto,
        timeId,
        jogadorId,
        jogadorSubstituidoId,
        descricao
      });

      return ResponseHandler.success(res, evento);
    } catch (error) {
      console.error('Error in JogosController.updateEvento:', error);
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return ResponseHandler.notFound(res, error.message);
      }
      if (error instanceof Error && error.message.includes('não pertence')) {
        return ResponseHandler.badRequest(res, error.message);
      }
      return ResponseHandler.error(res, 'Erro ao atualizar evento do jogo');
    }
  }

  static async removeEvento(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.jogoId);
      const eventoId = TypeHelpers.toInt(req.params.eventoId);

      if (!jogoId || !eventoId) {
        return ResponseHandler.badRequest(res, 'IDs inválidos');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(jogoId);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Remove event
      const evento = await JogoModel.removerEvento(eventoId);

      return ResponseHandler.success(res, evento);
    } catch (error) {
      console.error('Error in JogosController.removeEvento:', error);
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return ResponseHandler.notFound(res, error.message);
      }
      return ResponseHandler.error(res, 'Erro ao remover evento do jogo');
    }
  }

  static async pauseGame(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(idNum);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Only allow pausing games that are in progress
      if (jogo.status !== 'EM_ANDAMENTO') {
        return ResponseHandler.badRequest(res, 'O jogo não está em andamento');
      }

      // Record the pause event
      await JogoModel.recordPause(idNum);

      // Update game status to PAUSADO (paused)
      const jogoAtualizado = await JogoModel.update(idNum, { status: 'PAUSADO' });

      return ResponseHandler.success(res, {
        message: 'Jogo pausado com sucesso',
        status: jogoAtualizado.status
      });
    } catch (error) {
      console.error('Error in JogosController.pauseGame:', error);
      return ResponseHandler.error(res, 'Erro ao pausar jogo');
    }
  }

  static async resumeGame(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(idNum);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Only allow resuming games that are paused
      if (jogo.status !== 'PAUSADO') {
        return ResponseHandler.badRequest(res, 'O jogo não está pausado');
      }

      // Record the resume event
      await JogoModel.recordResume(idNum);

      // Update game status to EM_ANDAMENTO (in progress)
      const jogoAtualizado = await JogoModel.update(idNum, { status: 'EM_ANDAMENTO' });

      return ResponseHandler.success(res, {
        message: 'Jogo retomado com sucesso',
        status: jogoAtualizado.status
      });
    } catch (error) {
      console.error('Error in JogosController.resumeGame:', error);
      return ResponseHandler.error(res, 'Erro ao retomar jogo');
    }
  }

  static async finalizeGame(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      // Check if game exists
      const jogo = await JogoModel.findById(idNum);
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Update game status to FINALIZADO (finalized)
      const jogoAtualizado = await JogoModel.update(idNum, { status: 'FINALIZADO' });

      // Automatically update team statistics when game is finalized
      try {
        await EstatisticasService.atualizarEstatisticasTime(jogoAtualizado);
      } catch (statsError) {
        console.error('Error updating statistics:', statsError);
        // We don't fail the request if statistics update fails
      }

      return ResponseHandler.success(res, {
        message: 'Jogo finalizado com sucesso',
        status: jogoAtualizado.status
      });
    } catch (error) {
      console.error('Error in JogosController.finalizeGame:', error);
      return ResponseHandler.error(res, 'Erro ao finalizar jogo');
    }
  }

  /**
   * Reagenda um jogo (apenas data/horário) - endpoint simplificado
   */
  static async reschedule(req: AuthenticatedRequest, res: Response) {
    try {
      const idNum = TypeHelpers.toInt(req.params.id);
      if (!idNum) {
        return ResponseHandler.badRequest(res, 'ID inválido');
      }

      const { dataHora, motivo } = req.body;

      if (!dataHora) {
        return ResponseHandler.badRequest(res, 'Nova data e horário são obrigatórios');
      }

      const jogoExistente = await JogoModel.findById(idNum);

      if (!jogoExistente) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Check if game can be rescheduled
      if (!GameStateMachine.canEditGame(jogoExistente.status)) {
        return ResponseHandler.badRequest(res,
          `Não é possível reagendar jogo com status ${jogoExistente.status}. Apenas jogos AGENDADOS podem ser reagendados.`
        );
      }

      const parsedDate = DateHelper.parseDate(dataHora);
      if (!parsedDate) {
        return ResponseHandler.badRequest(res, 'Data e hora inválidas');
      }

      // Validate that the new date is in the future
      if (parsedDate < new Date()) {
        return ResponseHandler.badRequest(res, 'A nova data do jogo deve ser futura');
      }

      // Check for schedule conflicts
      const conflito = await JogoModel.hasScheduleConflict(
        jogoExistente.time1Id,
        jogoExistente.time2Id,
        parsedDate,
        idNum
      );

      if (conflito) {
        return ResponseHandler.conflict(res, 'Já existe um jogo agendado para um dos times nesse horário');
      }

      // Update only the date/time
      const jogoAtualizado = await JogoModel.update(idNum, {
        dataHora: parsedDate
      }, {
        userId: req.user?.id,
        reason: motivo || 'Jogo reagendado via API'
      });

      // Invalidate cache for this game
      JogosController.gameCache.invalidateGameCache(idNum);

      logger.info(`Game ${idNum} rescheduled successfully by user ${req.user?.id}`);

      return ResponseHandler.success(res, {
        id: jogoAtualizado.id,
        dataHoraAnterior: jogoExistente.dataHora,
        dataHoraNova: jogoAtualizado.dataHora,
        motivo: motivo || 'Reagendamento solicitado',
        message: 'Jogo reagendado com sucesso'
      });
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        gameId: req.params.id,
        userId: req.user?.id
      }, 'Error rescheduling game');

      return ResponseHandler.error(res, 'Erro ao reagendar jogo');
    }
  }

  static async activateScheduledGames(req: AuthenticatedRequest, res: Response) {
    try {
      // Get the scheduler instance and force activation
      const scheduler = GameScheduler.getInstance();
      const activatedCount = await scheduler.forceActivation();

      return ResponseHandler.success(res, {
        message: `Successfully activated ${activatedCount} games`,
        activatedCount
      });
    } catch (error) {
      console.error('Error in JogosController.activateScheduledGames:', error);
      return ResponseHandler.error(res, 'Erro ao ativar jogos agendados');
    }
  }

  /**
   * Get players for a specific game with their jersey numbers
   */
  static async getPlayersForGame(req: Request, res: Response) {
    try {
      const gameId = TypeHelpers.toInt(req.params.id);
      
      if (!gameId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      const players = await JogoModel.getPlayersForGame(gameId);

      return ResponseHandler.success(res, players);
    } catch (error) {
      console.error('Error in JogosController.getPlayersForGame:', error);
      
      if (error instanceof Error && error.message.includes('não encontrado')) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }
      
      return ResponseHandler.error(res, 'Erro ao buscar jogadores do jogo');
    }
  }
}