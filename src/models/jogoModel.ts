import { prisma } from './database';
import { EstatisticaModel } from './estatisticaModel';
import { DateHelper } from '../utils/dateHelper';
import { GameStateMachine } from '../services/gameStateMachine';
import { logger } from '../utils/logger';
import { GamePeriodHelper, PeriodoJogo } from '../utils/gamePeriodHelper';
import { GameTimeHelper } from '../utils/gameTimeHelper';



// Type for creating a new Jogo
type CreateJogoInput = {
  time1Id: number;
  time2Id: number;
  modalidadeId: number;
  dataHora: Date;
  local?: string | null;
  descricao?: string | null;
  edicaoId?: number | null;
  periodo?: PeriodoJogo | null;
  tipoJogo?: 'FASE_GRUPOS' | 'SEMIFINAL' | 'FINAL' | null;
};

// Type for Jogo filters
type JogoFilters = {
  modalidadeId?: number;
  dataHora?: Date | { gte?: Date; lte?: Date; lt?: Date };
  edicaoId?: number;
};

export class JogoModel {
  // Helper method to parse set scores from database string
  private static parseSetScores(scores: string | null): number[] {
    if (!scores) return [0, 0, 0];
    try {
      return scores.split(',').map(Number);
    } catch (error) {
      console.error('Error parsing set scores:', error);
      return [0, 0, 0];
    }
  }

  // Helper method to format set scores for database storage
  private static formatSetScores(scores: number[]): string {
    return scores.join(',');
  }

  // Helper method to parse game scores from database string
  private static parseGameScores(scores: string | null): number[] {
    if (!scores) return [0, 0, 0];
    try {
      return scores.split(',').map(Number);
    } catch (error) {
      console.error('Error parsing game scores:', error);
      return [0, 0, 0];
    }
  }

  // Helper method to format game scores for database storage
  private static formatGameScores(scores: number[]): string {
    return scores.join(',');
  }

  // Method to update volleyball set scores
  static async atualizarPlacarVolei(
    id: number,
    setsTime1: number[],
    setsTime2: number[]
  ) {
    try {
      const jogo = await prisma.jogo.findUnique({
        where: { id }
      });
      
      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }
      
      // Validate that both teams have the same number of sets
      if (setsTime1.length !== setsTime2.length) {
        throw new Error('Ambos os times devem ter o mesmo número de sets');
      }
      
      // Validate maximum number of sets
      if (setsTime1.length > 5) {
        throw new Error('Número máximo de sets é 5');
      }
      
      // Update the set scores using raw query since Prisma client doesn't recognize the new fields
      await prisma.$executeRaw`
        UPDATE jogos 
        SET "setsTime1" = ${this.formatSetScores(setsTime1)}, 
            "setsTime2" = ${this.formatSetScores(setsTime2)}
        WHERE id = ${id}
      `;
      
      // Fetch the updated jogo to return
      const updatedJogo = await prisma.jogo.findUnique({
        where: { id }
      });
      
      // Add the setsTime1 and setsTime2 properties to the returned object
      // This is a workaround for Prisma client not recognizing the new fields
      const jogoWithSets = {
        ...updatedJogo,
        setsTime1: this.formatSetScores(setsTime1),
        setsTime2: this.formatSetScores(setsTime2)
      };
      
      return jogoWithSets;
    } catch (error) {
      console.error('Error in JogoModel.atualizarPlacarVolei:', error);
      throw error;
    }
  }

  // Method to update table tennis game scores
  static async atualizarPlacarTenisMesa(
    id: number,
    gamesTime1: number[],
    gamesTime2: number[]
  ) {
    try {
      const jogo = await prisma.jogo.findUnique({
        where: { id }
      });
      
      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }
      
      // Validate that both teams have the same number of games
      if (gamesTime1.length !== gamesTime2.length) {
        throw new Error('Ambos os times devem ter o mesmo número de games');
      }
      
      // Validate maximum number of games
      if (gamesTime1.length > 7) {
        throw new Error('Número máximo de games é 7');
      }
      
      // Update the game scores using raw query since Prisma client doesn't recognize the new fields
      await prisma.$executeRaw`
        UPDATE jogos 
        SET "gamesTime1" = ${this.formatGameScores(gamesTime1)}, 
            "gamesTime2" = ${this.formatGameScores(gamesTime2)}
        WHERE id = ${id}
      `;
      
      // Fetch the updated jogo to return
      const updatedJogo = await prisma.jogo.findUnique({
        where: { id }
      });
      
      // Add the gamesTime1 and gamesTime2 properties to the returned object
      // This is a workaround for Prisma client not recognizing the new fields
      const jogoWithGames = {
        ...updatedJogo,
        gamesTime1: this.formatGameScores(gamesTime1),
        gamesTime2: this.formatGameScores(gamesTime2)
      };
      
      return jogoWithGames;
    } catch (error) {
      console.error('Error in JogoModel.atualizarPlacarTenisMesa:', error);
      throw error;
    }
  }
  /**
   * Busca todos os jogos com base nos filtros fornecidos (dados simplificados)
   */
  static async findAll(filters: JogoFilters = {}) {
    try {
      const where: any = {};
      
      if (filters.modalidadeId) where.modalidadeId = filters.modalidadeId;
      
      if (filters.dataHora) {
        if (filters.dataHora instanceof Date) {
          // Single date - create range for the day
          const dataInicio = new Date(filters.dataHora);
          const dataFim = new Date(dataInicio);
          dataFim.setDate(dataFim.getDate() + 1);
          
          where.dataHora = {
            gte: dataInicio,
            lt: dataFim
          };
        } else {
          // Range object - use as is
          where.dataHora = filters.dataHora;
        }
      }
      
      if (filters.edicaoId) {
        where.edicaoId = filters.edicaoId;
      }
      
      console.log('Querying jogos with filters:', where);
      
      const jogos = await prisma.jogo.findMany({
        where,
        orderBy: { dataHora: 'asc' },
        include: {
          jogoTimes: true
        }
      });
      
      console.log('Found', jogos.length, 'jogos');
      
      // Ensure jogoTimes is always an array
      return jogos.map(jogo => ({
        ...jogo,
        jogoTimes: Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : []
      }));
    } catch (error) {
      console.error('Error in JogoModel.findAll:', error);
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in JogoModel.findAll');
      throw error;
    }
  }
  
  /**
   * Busca um jogo pelo ID (dados simplificados)
   */
  static async findById(id: number) {
    try {
      // Validate the ID parameter
      if (!id || isNaN(id) || id <= 0) {
        throw new Error('ID inválido');
      }
      
      console.log(`Searching for game with ID: ${id}`);
      
      const jogo = await prisma.jogo.findUnique({
        where: { id },
        include: {
          jogoTimes: true
        }
      });
      
      // Ensure jogoTimes is always an array
      if (jogo) {
        return {
          ...jogo,
          jogoTimes: Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : []
        };
      }
      
      return jogo;
    } catch (error) {
      console.error('Error in JogoModel.findById:', error);
      throw error;
    }
  }
  
  /**
   * Cria um novo jogo
   */
  static async create(data: CreateJogoInput) {
    const createData: any = {
      dataHora: data.dataHora,
      local: data.local || null,
      modalidadeId: data.modalidadeId,
      edicaoId: data.edicaoId || null,
      time1Id: data.time1Id,
      time2Id: data.time2Id,
      tipoJogo: data.tipoJogo || 'FASE_GRUPOS'
    };

    // Only include descricao if it's provided
    if (data.descricao !== undefined) {
      createData.descricao = data.descricao;
    }

    // Include periodo if provided, otherwise infer from dataHora
    if (data.periodo !== undefined) {
      createData.periodo = data.periodo;
    } else if (data.dataHora) {
      createData.periodo = GamePeriodHelper.getPeriodFromDate(data.dataHora);
    }

    const jogo = await prisma.jogo.create({
      data: createData
    });

    // Create jogoTimes entries for both teams
    await prisma.jogoTime.createMany({
      data: [
        {
          jogoId: jogo.id,
          timeId: data.time1Id,
          gols: 0
        },
        {
          jogoId: jogo.id,
          timeId: data.time2Id,
          gols: 0
        }
      ]
    });

    return jogo;
  }
  
  /**
   * Atualiza um jogo existente com validação de estado
   */
  static async update(id: number, data: {
    time1Id?: number;
    time2Id?: number;
    modalidadeId?: number;
    dataHora?: Date;
    local?: string | null;
    descricao?: string | null;
    status?: any;
    periodo?: PeriodoJogo | null;
    tipoJogo?: 'FASE_GRUPOS' | 'SEMIFINAL' | 'FINAL' | null;
  }, context?: { userId?: number; reason?: string }) {
    try {
      // Se está atualizando o status, validar transição
      if (data.status !== undefined) {
        const currentGame = await prisma.jogo.findUnique({
          where: { id },
          select: { status: true }
        });

        if (!currentGame) {
          throw new Error('Jogo não encontrado');
        }

        const validation = GameStateMachine.validateTransition(
          currentGame.status,
          data.status,
          context
        );

        if (!validation.valid) {
          throw new Error(validation.error || 'Transição de estado inválida');
        }

        logger.info(`Game state transition validated for game ${id}`);
      }

      // Filtrar campos undefined para evitar erros do Prisma
      const updateData: any = {};
      if (data.time1Id !== undefined) updateData.time1Id = data.time1Id;
      if (data.time2Id !== undefined) updateData.time2Id = data.time2Id;
      if (data.modalidadeId !== undefined) updateData.modalidadeId = data.modalidadeId;
      if (data.dataHora !== undefined) {
        updateData.dataHora = data.dataHora;
        // Se está atualizando a data/hora e não foi fornecido período, inferir automaticamente
        if (data.periodo === undefined) {
          updateData.periodo = GamePeriodHelper.getPeriodFromDate(data.dataHora);
        }
      }
      if (data.local !== undefined) updateData.local = data.local;
      if (data.descricao !== undefined) updateData.descricao = data.descricao;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.periodo !== undefined) updateData.periodo = data.periodo;
      if (data.tipoJogo !== undefined) updateData.tipoJogo = data.tipoJogo;

      const updatedGame = await prisma.jogo.update({
        where: { id },
        data: updateData
      });

      logger.info(`Game ${id} updated successfully`);

      return updatedGame;
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        gameId: id,
        updateData: data
      }, 'Error updating game');
      throw error;
    }
  }
  
  /**
   * Atualiza o placar de um jogo e recalcula as estatísticas
   */
  static async atualizarPlacar(
    id: number, 
    placarTime1: number, 
    placarTime2: number
  ) {
    try {
      // Get the jogoTimes entries for this game
      const jogoTimes = await prisma.jogoTime.findMany({
        where: { jogoId: id },
        include: { jogo: true }
      });
      
      if (jogoTimes.length !== 2) {
        throw new Error('O jogo deve ter exatamente 2 times');
      }
      
      const jogo = jogoTimes[0].jogo;
      
      // Update the scores in the jogoTimes table
      const [time1, time2] = jogoTimes;
      
      // Update scores in a transaction
      await prisma.$transaction([
        prisma.jogoTime.update({
          where: { id: time1.id },
          data: { gols: placarTime1 }
        }),
        prisma.jogoTime.update({
          where: { id: time2.id },
          data: { gols: placarTime2 }
        })
      ]);
      
      // Create goal events for the updated scores
      // We now create events for all games, not just those in specific statuses
      console.log(`Creating goal events for game ${id}`);
      await this.createGoalEventsForGame(id, time1, time2, placarTime1, placarTime2);
      
      // Return the updated game
      const jogoAtualizado = await this.findById(id);
      
      if (!jogoAtualizado) {
        throw new Error('Erro ao buscar o jogo atualizado');
      }
      
      logger.info(`Score updated for game ${id}: ${placarTime1} x ${placarTime2}`);
      return jogoAtualizado;
    } catch (error) {
      console.error('Error in JogoModel.atualizarPlacar:', error);
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        gameId: id,
        placarTime1,
        placarTime2
      }, 'Error updating game score');
      throw error;
    }
  }
  
  /**
   * Creates goal events when scores are updated
   */
  static async createGoalEventsForGame(
    jogoId: number,
    time1: any,
    time2: any,
    newScoreTime1: number,
    newScoreTime2: number
  ) {
    try {
      console.log(`Creating goal events for game ${jogoId}`);
      console.log(`Time1:`, time1);
      console.log(`Time2:`, time2);
      console.log(`New scores: ${newScoreTime1} x ${newScoreTime2}`);
      
      // Get current goal events for this game to determine the difference
      const currentGoalEvents = await prisma.eventoJogo.findMany({
        where: {
          jogoId: jogoId,
          tipo: 'GOL'
        }
      });
      
      console.log(`Current goal events:`, currentGoalEvents);
      
      // Count goals per team from existing events
      const time1Goals = currentGoalEvents.filter(e => e.timeId === time1.timeId).length;
      const time2Goals = currentGoalEvents.filter(e => e.timeId === time2.timeId).length;
      
      console.log(`Current goals - Time1: ${time1Goals}, Time2: ${time2Goals}`);
      
      // Calculate how many new goals need to be created
      const newGoalsTime1 = Math.max(0, newScoreTime1 - time1Goals);
      const newGoalsTime2 = Math.max(0, newScoreTime2 - time2Goals);
      
      console.log(`New goals to create - Time1: ${newGoalsTime1}, Time2: ${newGoalsTime2}`);
      
      // Create new goal events for time 1
      for (let i = 0; i < newGoalsTime1; i++) {
        await prisma.eventoJogo.create({
          data: {
            jogoId: jogoId,
            timeId: time1.timeId,
            tipo: 'GOL',
            minuto: 0, // We don't have the exact minute, so we set it to 0
            descricao: `Gol do ${time1.time?.nome || 'Time 1'}`
          }
        });
      }
      
      // Create new goal events for time 2
      for (let i = 0; i < newGoalsTime2; i++) {
        await prisma.eventoJogo.create({
          data: {
            jogoId: jogoId,
            timeId: time2.timeId,
            tipo: 'GOL',
            minuto: 0, // We don't have the exact minute, so we set it to 0
            descricao: `Gol do ${time2.time?.nome || 'Time 2'}`
          }
        });
      }
      
      console.log(`Created ${newGoalsTime1} goal events for time 1 and ${newGoalsTime2} goal events for time 2 in game ${jogoId}`);
      
      // Log the total events for verification
      const totalGoalEvents = await prisma.eventoJogo.count({
        where: {
          jogoId: jogoId,
          tipo: 'GOL'
        }
      });
      
      logger.info(`Total goal events for game ${jogoId}: ${totalGoalEvents}`);
    } catch (error) {
      console.error('Error creating goal events:', error);
      // We don't throw the error as this is supplementary functionality
      // But we should log it for debugging purposes
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        jogoId,
        time1,
        time2,
        newScoreTime1,
        newScoreTime2
      }, 'Error creating goal events for game');
    }
  }
  
  /**
   * Adiciona um evento a um jogo (gol, cartão, substituição, etc.)
   * @param jogoId ID do jogo
   * @param data Dados do evento
   * @returns O evento criado
   */
  static async adicionarEvento(
    jogoId: number,
    data: {
      tipo: 'GOL' | 'CARTAO_AMARELO' | 'CARTAO_VERMELHO' | 'SUBSTITUICAO' | 'LESAO' | 'OUTRO';
      minuto?: number; // Agora opcional - será calculado automaticamente se não fornecido
      jogadorId: number;
      timeId: number;
      descricao?: string;
      jogadorSubstituidoId?: number;
      eventTime?: Date; // Timestamp do evento (opcional, usa horário atual se não fornecido)
    }
  ) {
    try {
      // Check if the game exists and get game info
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId },
        select: { 
          id: true, 
          time1Id: true, 
          time2Id: true, 
          dataHora: true, 
          status: true 
        }
      });

      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }

      // Calculate automatic minute if not provided
      let eventoMinuto = data.minuto;
      if (eventoMinuto === undefined) {
        const eventTime = data.eventTime || new Date();
        
        // Validate if event can be added
        const validation = await GameTimeHelper.canAddEvent(jogoId, jogo.dataHora, jogo.status, eventTime);
        if (!validation.canAdd) {
          throw new Error(`Não é possível adicionar evento: ${validation.reason}`);
        }
        
        eventoMinuto = validation.suggestedMinute!;
        logger.info(`Auto-calculated event minute: ${eventoMinuto} for game ${jogoId}`);
      } else {
        // Validate manual minute if provided
        const validation = await GameTimeHelper.validateManualMinute(jogoId, jogo.dataHora, eventoMinuto, jogo.status);
        if (!validation.isValid && validation.warning) {
          logger.warn(`Manual minute validation warning for game ${jogoId}: ${validation.warning}`);
        }
      }

      // Check if the team is one of the teams in the game
      if (jogo.time1Id !== data.timeId && jogo.time2Id !== data.timeId) {
        throw new Error('O time informado não está participando deste jogo');
      }

      // Check if the player exists and belongs to the team
      if (data.jogadorId) {
        const jogador = await prisma.jogador.findUnique({
          where: { id: data.jogadorId },
          include: { timeJogadores: { where: { timeId: data.timeId } } }
        });

        if (!jogador || !jogador.timeJogadores || jogador.timeJogadores.length === 0) {
          throw new Error('O jogador informado não pertence ao time');
        }
      }

      // If it's a substitution, check if the substituted player exists and belongs to the team
      if (data.tipo === 'SUBSTITUICAO' && data.jogadorSubstituidoId) {
        const jogadorSubstituido = await prisma.jogador.findUnique({
          where: { id: data.jogadorSubstituidoId },
          include: { timeJogadores: { where: { timeId: data.timeId } } }
        });

        if (!jogadorSubstituido || !jogadorSubstituido.timeJogadores || jogadorSubstituido.timeJogadores.length === 0) {
          throw new Error('O jogador substituído não pertence ao time');
        }
      }

      // Create the event with calculated minute
      const createdEvent = await prisma.eventoJogo.create({
        data: {
          tipo: data.tipo,
          minuto: eventoMinuto,
          descricao: data.descricao || null,
          jogoId,
          jogadorId: data.jogadorId || null,
          jogadorSubstituidoId: data.jogadorSubstituidoId || null,
          timeId: data.timeId
        }
      });

      logger.info(`Event created for game ${jogoId}: ${data.tipo} at minute ${eventoMinuto}`);
      
      return createdEvent;
    } catch (error) {
      console.error('Error in JogoModel.adicionarEvento:', error);
      throw error;
    }
  }

  /**
   * Remove um evento de um jogo
   * @param eventoId ID do evento a ser removido
   * @returns O evento removido
   */
  static async removerEvento(eventoId: number) {
    try {
      // Check if the event exists
      const evento = await prisma.eventoJogo.findUnique({
        where: { id: eventoId }
      });

      if (!evento) {
        throw new Error('Evento não encontrado');
      }

      // Delete the event
      await prisma.eventoJogo.delete({
        where: { id: eventoId }
      });

      return evento;
    } catch (error) {
      console.error('Error in JogoModel.removerEvento:', error);
      throw error;
    }
  }

  /**
   * Atualiza um evento de um jogo
   * @param eventoId ID do evento a ser atualizado
   * @param eventoData Dados a serem atualizados
   * @returns O evento atualizado
   */
  static async atualizarEvento(
    eventoId: number,
    eventoData: {
      tipo?: 'GOL' | 'CARTAO_AMARELO' | 'CARTAO_VERMELHO' | 'SUBSTITUICAO' | 'LESAO' | 'OUTRO';
      minuto?: number;
      jogadorId?: number;
      timeId?: number | null;
      descricao?: string | null;
      jogadorSubstituidoId?: number | null;
    }
  ) {
    try {
      // Check if the event exists and get the game info
      const existingEvent = await prisma.eventoJogo.findUnique({
        where: { id: eventoId },
        include: {
          jogo: {
            select: {
              id: true,
              time1Id: true,
              time2Id: true
            }
          }
        }
      });

      if (!existingEvent) {
        throw new Error('Evento não encontrado');
      }

      // If updating the team, verify it's one of the teams in the game
      if (eventoData.timeId && 
          existingEvent.jogo.time1Id !== eventoData.timeId && 
          existingEvent.jogo.time2Id !== eventoData.timeId) {
        throw new Error('O time informado não está participando deste jogo');
      }

      const targetTimeId = eventoData.timeId || existingEvent.timeId;
      
      // If updating the player, verify they belong to the team
      if (eventoData.jogadorId) {
        const jogador = await prisma.jogador.findUnique({
          where: { id: eventoData.jogadorId },
          include: { timeJogadores: { where: { timeId: targetTimeId } } }
        });

        if (!jogador?.timeJogadores?.length) {
          throw new Error('O jogador informado não pertence ao time');
        }
      }

      // If it's a substitution, check if the substituted player exists and belongs to the team
      if (eventoData.tipo === 'SUBSTITUICAO' && eventoData.jogadorSubstituidoId) {
        const jogadorSubstituido = await prisma.jogador.findUnique({
          where: { id: eventoData.jogadorSubstituidoId },
          include: { timeJogadores: { where: { timeId: targetTimeId } } }
        });

        if (!jogadorSubstituido?.timeJogadores?.length) {
          throw new Error('O jogador substituído não pertence ao time');
        }
      }

      // Prepare the update data
      const updateData: any = {};
      if (eventoData.tipo !== undefined) updateData.tipo = eventoData.tipo;
      if (eventoData.minuto !== undefined) updateData.minuto = eventoData.minuto;
      if (eventoData.descricao !== undefined) updateData.descricao = eventoData.descricao;
      if (eventoData.jogadorId !== undefined) updateData.jogadorId = eventoData.jogadorId;
      if (eventoData.jogadorSubstituidoId !== undefined) updateData.jogadorSubstituidoId = eventoData.jogadorSubstituidoId;
      if (eventoData.timeId !== undefined) updateData.timeId = eventoData.timeId;

      // Update the event
      const updatedEvent = await prisma.eventoJogo.update({
        where: { id: eventoId },
        data: updateData
      });

      return updatedEvent;
    } catch (error) {
      console.error('Error in JogoModel.atualizarEvento:', error);
      throw error;
    }
  }
  
  /**
   * Busca todos os eventos de um jogo
   * @param jogoId ID do jogo
   * @returns Lista de eventos do jogo
   */
  static async getEventos(jogoId: number) {
    try {
      // Check if the game exists
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId }
      });

      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }

      // Get all events for this game
      const eventos = await prisma.eventoJogo.findMany({
        where: { jogoId },
        include: {
          jogador: true,
          jogadorSubstituido: true,
          time: true
        },
        orderBy: { minuto: 'asc' }
      });

      return eventos;
    } catch (error) {
      console.error('Error in JogoModel.getEventos:', error);
      throw error;
    }
  }
  
  /**
   * Exclui um jogo e seus eventos associados
   */
  static async delete(id: number) {
    // Primeiro, excluir os eventos do jogo
    await prisma.eventoJogo.deleteMany({
      where: { jogoId: id }
    });
    
    // Depois, excluir o jogo
    return prisma.jogo.delete({
      where: { id }
    });
  }

  /**
   * Verifica se já existe um jogo agendado para um dos times no mesmo horário
   */
  static async hasScheduleConflict(time1Id: number, time2Id: number, dataHora: Date, excludeGameId?: number): Promise<boolean> {
    const inicio = new Date(dataHora);
    inicio.setMinutes(0, 0, 0);
    const fim = new Date(inicio);
    fim.setHours(fim.getHours() + 2); // Considera conflito em até 2 horas

    const whereClause: any = {
      dataHora: {
        gte: inicio,
        lt: fim
      },
      OR: [
        { time1Id: Number(time1Id) },
        { time2Id: Number(time1Id) },
        { time1Id: Number(time2Id) },
        { time2Id: Number(time2Id) }
      ]
    };

    // Exclude the current game from conflict check (for updates)
    if (excludeGameId) {
      whereClause.id = {
        not: excludeGameId
      };
    }

    const conflito = await prisma.jogo.findFirst({
      where: whereClause
    });
    return !!conflito;
  }
  
  /**
   * Busca jogos por data específica (versão otimizada)
   */
  static async findByDate(date: Date, modalidadeId?: number, genero?: string, horario?: string) {
    try {
      // Usar o DateHelper para criar range de data mais preciso
      const { start, end } = DateHelper.getDayRangeWithBuffer(date, 12);
      
      const where: any = {
        dataHora: {
          gte: start,
          lte: end
        }
      };
      
      // Add modalidade filter if provided
      if (modalidadeId) {
        where.modalidadeId = modalidadeId;
      }
      
      // Add gender filter if provided
      if (genero) {
        where.modalidade = {
          genero: {
            equals: genero.charAt(0).toUpperCase() + genero.slice(1).toLowerCase()
          }
        };
      }
      
      const jogos = await prisma.jogo.findMany({
        where,
        orderBy: { dataHora: 'asc' },
        include: {
          jogoTimes: true,
          modalidade: true,
          time1: { select: { id: true, nome: true } },
          time2: { select: { id: true, nome: true } }
        }
      });
      
      // Filter games that actually fall on the requested local date
      let filteredJogos = jogos.filter(jogo => 
        DateHelper.isSameLocalDay(new Date(jogo.dataHora), date)
      );
      
      // Filter by time of day using DateHelper
      if (horario) {
        filteredJogos = DateHelper.filterByTimeOfDay(filteredJogos, horario);
      }
      
      // Ensure jogoTimes is always an array
      const result = filteredJogos.map(jogo => ({
        ...jogo,
        jogoTimes: Array.isArray(jogo.jogoTimes) ? jogo.jogoTimes : []
      }));

      logger.debug(`Found ${result.length} games for date ${DateHelper.formatDate(date, false)}`);

      return result;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in JogoModel.findByDate');
      throw error;
    }
  }
  
  /**
   * Busca jogos de hoje
   */
  static async findToday(modalidadeId?: number, genero?: string, horario?: string) {
    return this.findByDate(DateHelper.getToday(), modalidadeId, genero, horario);
  }
  
  /**
   * Busca jogos de ontem
   */
  static async findYesterday(modalidadeId?: number, genero?: string, horario?: string) {
    return this.findByDate(DateHelper.getYesterday(), modalidadeId, genero, horario);
  }
  
  /**
   * Busca jogos de amanhã
   */
  static async findTomorrow(modalidadeId?: number, genero?: string, horario?: string) {
    return this.findByDate(DateHelper.getTomorrow(), modalidadeId, genero, horario);
  }

  /**
   * Busca jogos que começarão em breve (para notificações)
   */
  static async findUpcomingGames(minutesAhead: number = 15) {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + (minutesAhead * 60 * 1000));

      const games = await prisma.jogo.findMany({
        where: {
          dataHora: {
            gte: now,
            lte: futureTime
          },
          status: 'AGENDADO'
        },
        include: {
          time1: { select: { id: true, nome: true } },
          time2: { select: { id: true, nome: true } },
          modalidade: { select: { id: true, nome: true } }
        },
        orderBy: { dataHora: 'asc' }
      });

      logger.debug(`Found ${games.length} upcoming games in next ${minutesAhead} minutes`);
      return games;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error finding upcoming games');
      throw error;
    }
  }
  
  /**
   * Ativa jogos baseado na nova lógica de períodos
   * @param currentTime Horário atual (opcional)
   */
  static async activateGamesByPeriod(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      // Buscar jogos agendados do dia atual
      const { start, end } = DateHelper.getDayRange(now);
      
      const candidateGames = await prisma.jogo.findMany({
        where: {
          dataHora: {
            gte: start,
            lte: end
          },
          status: 'AGENDADO'
        }
      });
      
      // Filtrar jogos que podem ser ativados baseado no período
      const gamesToActivate = candidateGames.filter(game => {
        return GamePeriodHelper.canActivateGame(
          game.periodo as PeriodoJogo | null,
          game.dataHora,
          now
        );
      });
      
      // Ativar os jogos
      const updatePromises = gamesToActivate.map(game => 
        prisma.jogo.update({
          where: { id: game.id },
          data: { status: 'EM_ANDAMENTO' }
        })
      );
      
      await Promise.all(updatePromises);
      
      logger.info(`Activated ${gamesToActivate.length} games by period logic at ${now.toISOString()}`);
      return gamesToActivate.length;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in activateGamesByPeriod');
      throw error;
    }
  }
  
  /**
   * Cancela jogos que perderam o período de ativação
   * @param currentTime Horário atual (opcional)
   */
  static async cancelExpiredGames(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      // Buscar jogos agendados
      const candidateGames = await prisma.jogo.findMany({
        where: {
          status: 'AGENDADO'
        }
      });
      
      // Filtrar jogos que devem ser cancelados
      const gamesToCancel = candidateGames.filter(game => {
        return GamePeriodHelper.shouldCancelGame(
          game.periodo as PeriodoJogo | null,
          game.dataHora,
          now
        );
      });
      
      // Cancelar os jogos
      const updatePromises = gamesToCancel.map(game => 
        prisma.jogo.update({
          where: { id: game.id },
          data: { status: 'CANCELADO' }
        })
      );
      
      await Promise.all(updatePromises);
      
      logger.info(`Cancelled ${gamesToCancel.length} expired games at ${now.toISOString()}`);
      return gamesToCancel.length;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in cancelExpiredGames');
      throw error;
    }
  }

  /**
   * Finaliza jogos que estão em andamento há mais de 2 horas
   * @param currentTime Horário atual (opcional)
   */
  static async finalizeOverdueGames(currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      const duasHorasAtras = new Date(now.getTime() - (2 * 60 * 60 * 1000)); // 2 horas atrás

      // Buscar jogos que deveriam ter sido finalizados
      const candidateGames = await prisma.jogo.findMany({
        where: {
          status: {
            in: ['EM_ANDAMENTO', 'PAUSADO']
          },
          dataHora: {
            lt: duasHorasAtras // Jogos que começaram há mais de 2 horas
          }
        }
      });

      // Finalizar os jogos
      const updatePromises = candidateGames.map(game => 
        prisma.jogo.update({
          where: { id: game.id },
          data: { 
            status: 'FINALIZADO',
            updatedAt: now
          }
        })
      );

      await Promise.all(updatePromises);

      logger.info(`Finalized ${candidateGames.length} overdue games at ${now.toISOString()}`);
      return candidateGames.length;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error in finalizeOverdueGames');
      throw error;
    }
  }

  /**
   * Método de compatibilidade - mantém a interface antiga mas usa nova lógica
   * @param windowMinutes Não usado na nova lógica, mantido para compatibilidade
   */
  static async activateGamesInTimeWindow(windowMinutes: number = 5): Promise<number> {
    return this.activateGamesByPeriod();
  }

  /**
   * Obtém informações de tempo de um jogo
   * @param jogoId ID do jogo
   * @returns Informações de tempo do jogo
   */
  static async getGameTimeInfo(jogoId: number) {
    try {
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId },
        select: {
          id: true,
          dataHora: true,
          status: true
        }
      });

      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }

      const timeInfo = await GameTimeHelper.getGameTimeInfo(jogoId, jogo.dataHora, jogo.status);
      const gameStats = await GameTimeHelper.getGameStats(jogoId, jogo.dataHora, jogo.status);

      return {
        ...timeInfo,
        ...gameStats,
        gameId: jogo.id
      };
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting game time info');
      throw error;
    }
  }

  /**
   * Adiciona evento com cálculo automático de minutagem (método simplificado)
   * @param jogoId ID do jogo
   * @param tipo Tipo do evento
   * @param jogadorId ID do jogador
   * @param timeId ID do time
   * @param descricao Descrição opcional
   * @returns O evento criado
   */
  static async adicionarEventoAutomatico(
    jogoId: number,
    tipo: 'GOL' | 'CARTAO_AMARELO' | 'CARTAO_VERMELHO' | 'SUBSTITUICAO' | 'LESAO' | 'OUTRO',
    jogadorId: number,
    timeId: number,
    descricao?: string
  ) {
    return this.adicionarEvento(jogoId, {
      tipo,
      jogadorId,
      timeId,
      descricao
      // minuto será calculado automaticamente
    });
  }

  /**
   * Fetch players that participate in a specific game (players of both teams) with their jersey numbers
   */
  static async getPlayersForGame(gameId: number) {
    const jogo = await prisma.jogo.findUnique({
      where: { id: gameId },
      select: { 
        time1Id: true, 
        time2Id: true,
        time1: {
          include: {
            timeJogadores: {
              include: {
                jogador: true
              }
            }
          }
        },
        time2: {
          include: {
            timeJogadores: {
              include: {
                jogador: true
              }
            }
          }
        }
      }
    });

    if (!jogo) {
      throw new Error('Jogo não encontrado');
    }

    // Extract players from both teams
    const players = [];
    
    // Players from team 1
    if (jogo.time1?.timeJogadores) {
      for (const timeJogador of jogo.time1.timeJogadores) {
        if (timeJogador.jogador) {
          players.push({
            id: timeJogador.jogador.id,
            nome: timeJogador.jogador.nome,
            numeroCamisa: timeJogador.jogador.numeroCamisa
          });
        }
      }
    }
    
    // Players from team 2
    if (jogo.time2?.timeJogadores) {
      for (const timeJogador of jogo.time2.timeJogadores) {
        if (timeJogador.jogador) {
          players.push({
            id: timeJogador.jogador.id,
            nome: timeJogador.jogador.nome,
            numeroCamisa: timeJogador.jogador.numeroCamisa
          });
        }
      }
    }

    return players;
  }

  /**
   * Records when a game is paused
   * @param jogoId ID of the game being paused
   */
  static async recordPause(jogoId: number): Promise<void> {
    try {
      // Check if there's already an active pause (no fim timestamp)
      const activePause = await prisma.jogoPausa.findFirst({
        where: {
          jogoId: jogoId,
          fim: null
        }
      });

      // If there's no active pause, create a new one
      if (!activePause) {
        await prisma.jogoPausa.create({
          data: {
            jogoId: jogoId,
            inicio: new Date()
          }
        });
        logger.info(`Recorded pause start for game ${jogoId}`);
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        gameId: jogoId
      }, 'Error recording game pause');
      // Don't throw error as this is supplementary functionality
    }
  }

  /**
   * Records when a game is resumed
   * @param jogoId ID of the game being resumed
   */
  static async recordResume(jogoId: number): Promise<void> {
    try {
      // Find the most recent active pause (no fim timestamp)
      const activePause = await prisma.jogoPausa.findFirst({
        where: {
          jogoId: jogoId,
          fim: null
        },
        orderBy: {
          inicio: 'desc'
        }
      });

      // If there's an active pause, record the end time
      if (activePause) {
        await prisma.jogoPausa.update({
          where: {
            id: activePause.id
          },
          data: {
            fim: new Date()
          }
        });
        logger.info(`Recorded pause end for game ${jogoId}`);
      }
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        gameId: jogoId
      }, 'Error recording game resume');
      // Don't throw error as this is supplementary functionality
    }
  }

  /**
   * Calculates the total paused time for a game
   * @param jogoId ID of the game
   * @param currentTime Optional current time for calculation (defaults to now)
   * @returns Total paused time in milliseconds
   */
  static async calculatePausedTime(jogoId: number, currentTime?: Date): Promise<number> {
    try {
      const now = currentTime || new Date();
      
      // Get all pause records for this game
      const pauseRecords = await prisma.jogoPausa.findMany({
        where: {
          jogoId: jogoId
        },
        orderBy: {
          inicio: 'asc'
        }
      });

      let totalPausedMs = 0;

      for (const pause of pauseRecords) {
        const startTime = pause.inicio.getTime();
        const endTime = pause.fim ? pause.fim.getTime() : now.getTime();
        
        totalPausedMs += (endTime - startTime);
      }

      return totalPausedMs;
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        gameId: jogoId
      }, 'Error calculating paused time');
      return 0; // Return 0 if there's an error
    }
  }

  /**
   * Adds a goal event with player information
   * @param jogoId ID of the game
   * @param jogadorId ID of the player who scored
   * @param timeId ID of the team
   * @param minuto Minute of the goal (optional)
   * @returns The created event
   */
  static async adicionarGol(
    jogoId: number,
    jogadorId: number,
    timeId: number,
    minuto?: number
  ) {
    try {
      // Check if the game exists
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId }
      });

      if (!jogo) {
        throw new Error('Jogo não encontrado');
      }

      // Check if the player exists and belongs to the team
      const jogador = await prisma.jogador.findUnique({
        where: { id: jogadorId },
        include: { timeJogadores: { where: { timeId: timeId } } }
      });

      if (!jogador || !jogador.timeJogadores || jogador.timeJogadores.length === 0) {
        throw new Error('O jogador informado não pertence ao time');
      }

      // Check if the team is one of the teams in the game
      if (jogo.time1Id !== timeId && jogo.time2Id !== timeId) {
        throw new Error('O time informado não está participando deste jogo');
      }

      // Create the goal event
      const createdEvent = await prisma.eventoJogo.create({
        data: {
          tipo: 'GOL',
          minuto: minuto || 0,
          descricao: `Gol de ${jogador.nome}`,
          jogoId,
          jogadorId: jogadorId,
          timeId: timeId
        },
        include: {
          jogador: true,
          time: true
        }
      });

      logger.info(`Goal scored by player ${jogadorId} in game ${jogoId} at minute ${minuto || 0}`);
      
      // Update the game score automatically
      const jogoTimes = await prisma.jogoTime.findMany({
        where: { jogoId: jogoId }
      });
      
      if (jogoTimes.length === 2) {
        const jogoTime = jogoTimes.find(jt => jt.timeId === timeId);
        if (jogoTime) {
          await prisma.jogoTime.update({
            where: { id: jogoTime.id },
            data: { gols: { increment: 1 } }
          });
          logger.info(`Updated score for team ${timeId} in game ${jogoId}`);
        }
      }
      
      return createdEvent;
    } catch (error) {
      console.error('Error in JogoModel.adicionarGol:', error);
      logger.error({ 
        error: error instanceof Error ? error.message : String(error),
        jogoId,
        jogadorId,
        timeId,
        minuto
      }, 'Error adding goal event');
      throw error;
    }
  }
}
