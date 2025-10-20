import { prisma } from './database';

export class EstatisticaModel {
  /**
   * Obtém a classificação dos times em uma modalidade (dados simplificados)
   * @param modalidadeId ID da modalidade
   * @param edicaoId ID opcional da edição para filtrar
   * @returns Lista de estatísticas de times ordenadas por classificação
   */
  static async getClassificacao(modalidadeId: number, edicaoId?: number) {
    try {
      // Construir a consulta base
      const where: any = { modalidadeId };

      // Adicionar filtro por edição se fornecido
      if (edicaoId) {
        where.time = { edicaoId };
      }

      // Buscar todas as estatísticas da modalidade
      const estatisticas = await prisma.estatisticaTime.findMany({
        where,
        include: {
          time: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [
          { pontos: 'desc' },           // Ordenar por pontos (decrescente)
          { golsPro: 'desc' },          // Em caso de empate, ordenar por gols pró (decrescente)
          { golsContra: 'asc' },        // Em caso de empate, ordenar por gols contra (crescente)
          { time: { nome: 'asc' } }     // Em caso de empate, ordenar por nome do time
        ]
      });

      // Mapear os resultados para o formato desejado
      const classificacao = estatisticas.map((estatistica: any, index) => ({
        posicao: index + 1,
        time: {
          id: estatistica.timeId,
          nome: estatistica.time?.nome || 'Time desconhecido'
        },
        modalidadeId: estatistica.modalidadeId,
        modalidade: estatistica.modalidade?.nome || 'Modalidade desconhecida',
        jogos: (estatistica.vitorias || 0) + (estatistica.empates || 0) + (estatistica.derrotas || 0),
        vitorias: estatistica.vitorias || 0,
        empates: estatistica.empates || 0,
        derrotas: estatistica.derrotas || 0,
        golsPro: estatistica.golsPro || 0,
        golsContra: estatistica.golsContra || 0,
        saldoGols: (estatistica.golsPro || 0) - (estatistica.golsContra || 0),
        pontos: estatistica.pontos || 0
      }));

      return classificacao;
    } catch (error) {
      console.error('Erro ao buscar classificação:', error);
      throw error;
    }
  }

  /**
   * Reseta todas as estatísticas de uma modalidade
   * @param modalidadeId ID da modalidade
   * @returns Número de registros atualizados
   */
  static async resetEstatisticas(modalidadeId: number) {
    try {
      // Buscar todas as estatísticas da modalidade
      const estatisticas = await prisma.estatisticaTime.findMany({
        where: { modalidadeId }
      });

      // Resetar cada estatística individualmente
      const updates = estatisticas.map(estatistica =>
        prisma.estatisticaTime.update({
          where: {
            timeId_modalidadeId: {
              timeId: estatistica.timeId,
              modalidadeId: estatistica.modalidadeId
            }
          },
          data: {
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            golsPro: 0,
            golsContra: 0,
            pontos: 0 // 0 * 3 + 0 * 1 = 0
          }
        })
      );

      await Promise.all(updates);

      return { count: estatisticas.length };
    } catch (error) {
      console.error('Erro ao resetar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de um time específico (dados simplificados)
   * @param timeId ID do time
   * @param modalidadeId ID da modalidade
   * @returns Estatísticas do time ou null se não encontrado
   */
  static async findByTimeEModalidade(timeId: number, modalidadeId: number) {
    try {
      return await prisma.estatisticaTime.findUnique({
        where: {
          timeId_modalidadeId: {
            timeId,
            modalidadeId
          }
        },
        include: {
          time: true,
          modalidade: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do time:', error);
      throw error;
    }
  }

  /**
   * Busca todas as estatísticas de um time em todas as modalidades
   * @param timeId ID do time
   * @returns Lista de estatísticas do time em todas as modalidades
   */
  static async findAllByTime(timeId: number) {
    try {
      return await prisma.estatisticaTime.findMany({
        where: {
          timeId
        },
        include: {
          modalidade: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do time:', error);
      throw error;
    }
  }

  /**
   * Atualiza as estatísticas de um time (apenas para jogos de fase de grupos)
   * @param timeId ID do time
   * @param modalidadeId ID da modalidade
   * @param data Dados para atualização (incremental values)
   * @param tipoJogo Tipo do jogo (apenas FASE_GRUPOS conta para pontos)
   * @returns Estatísticas atualizadas
   */
  static async atualizarEstatisticas(
    timeId: number,
    modalidadeId: number,
    data: {
      vitorias?: number;  // Incremental value
      empates?: number;   // Incremental value
      derrotas?: number;  // Incremental value
      golsPro?: number;   // Incremental value
      golsContra?: number; // Incremental value
      pontos?: number;    // Incremental value
    },
    tipoJogo: 'FASE_GRUPOS' | 'SEMIFINAL' | 'FINAL' = 'FASE_GRUPOS'
  ) {
    try {
      // Verificar se já existe uma estatística para este time e modalidade
      const existingStat = await prisma.estatisticaTime.findUnique({
        where: {
          timeId_modalidadeId: {
            timeId,
            modalidadeId
          }
        }
      });

      if (existingStat) {
        // Prepare update data with increments
        const updateData: any = {};
        
        // Handle incremental updates for all fields
        if (data.vitorias !== undefined) {
          updateData.vitorias = { increment: data.vitorias };
        }
        if (data.empates !== undefined) {
          updateData.empates = { increment: data.empates };
        }
        if (data.derrotas !== undefined) {
          updateData.derrotas = { increment: data.derrotas };
        }
        if (data.golsPro !== undefined) {
          updateData.golsPro = { increment: data.golsPro };
        }
        if (data.golsContra !== undefined) {
          updateData.golsContra = { increment: data.golsContra };
        }
        
        // Handle points calculation (apenas para jogos de fase de grupos)
        if (tipoJogo === 'FASE_GRUPOS') {
          if (data.pontos !== undefined) {
            updateData.pontos = { increment: data.pontos };
          } else if (data.vitorias !== undefined || data.empates !== undefined) {
            // Calculate points incrementally
            const vitoriasIncrement = data.vitorias || 0;
            const empatesIncrement = data.empates || 0;
            const pontosIncrement = vitoriasIncrement * 3 + empatesIncrement * 1;
            updateData.pontos = { increment: pontosIncrement };
          }
        }

        // Update existing record using composite key
        return prisma.estatisticaTime.update({
          where: {
            timeId_modalidadeId: {
              timeId,
              modalidadeId
            }
          },
          data: updateData
        });
      }

      // Create new record if it doesn't exist
      // For new records, we use the values directly (not increments)
      // Pontos apenas para jogos de fase de grupos
      const pontos = tipoJogo === 'FASE_GRUPOS' 
        ? (data.pontos || ((data.vitorias || 0) * 3 + (data.empates || 0) * 1))
        : 0;
      
      return prisma.estatisticaTime.create({
        data: {
          timeId,
          modalidadeId,
          vitorias: data.vitorias || 0,
          empates: data.empates || 0,
          derrotas: data.derrotas || 0,
          golsPro: data.golsPro || 0,
          golsContra: data.golsContra || 0,
          pontos
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      throw error;
    }
  }

  /**
   * Obtém os artilheiros de uma modalidade (dados simplificados)
   * @param modalidadeId ID da modalidade
   * @param edicaoId ID opcional da edição para filtrar
   * @param limit Número máximo de artilheiros a retornar (padrão: 10)
   * @returns Lista de jogadores ordenados por gols
   */
  static async getArtilheiros(modalidadeId: number, edicaoId?: number, limit: number = 10) {
    try {
      // Construir a consulta base
      const where: any = {
        modalidadeId,
        gols: { gt: 0 } // Apenas jogadores que marcaram pelo menos 1 gol
      };

      // Adicionar filtro por edição se fornecido
      if (edicaoId) {
        where.jogador = { edicaoId };
      }

      // Buscar os artilheiros
      const artilheiros = await prisma.estatisticaJogador.findMany({
        where,
        include: {
          jogador: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [
          { gols: 'desc' },     // Ordenar por gols (decrescente)
          { jogador: { nome: 'asc' } } // Em caso de empate, ordenar por nome
        ],
        take: limit // Limitar o número de resultados
      });

      // Mapear os resultados para o formato desejado
      return artilheiros.map((artilheiro: any) => ({
        id: artilheiro.jogadorId,
        nome: artilheiro.jogador?.nome || 'Jogador desconhecido',
        modalidadeId: artilheiro.modalidadeId,
        modalidade: artilheiro.modalidade?.nome || 'Modalidade desconhecida',
        gols: artilheiro.gols,
        assistencias: artilheiro.assistencias || 0,
        cartoesAmarelos: artilheiro.cartoesAmarelos || 0,
        cartoesVermelhos: artilheiro.cartoesVermelhos || 0,
        jogos: artilheiro.jogos || 0
      }));
    } catch (error) {
      console.error('Erro ao buscar artilheiros:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de um jogador específico em uma modalidade
   * @param jogadorId ID do jogador
   * @param modalidadeId ID da modalidade
   * @returns Estatísticas do jogador ou null se não encontrado
   */
  static async findByJogadorEModalidade(jogadorId: number, modalidadeId: number) {
    try {
      return await prisma.estatisticaJogador.findUnique({
        where: {
          jogadorId_modalidadeId: {
            jogadorId,
            modalidadeId
          }
        },
        include: {
          jogador: true,
          modalidade: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do jogador:', error);
      throw error;
    }
  }

  /**
   * Busca todas as estatísticas de um jogador em todas as modalidades
   * @param jogadorId ID do jogador
   * @returns Lista de estatísticas do jogador em todas as modalidades
   */
  static async findAllByJogador(jogadorId: number) {
    try {
      return await prisma.estatisticaJogador.findMany({
        where: {
          jogadorId
        },
        include: {
          modalidade: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do jogador:', error);
      throw error;
    }
  }

  // Dashboard methods implementation

  /**
   * Count total games
   * @returns Total number of games
   */
  static async countGames() {
    try {
      return await prisma.jogo.count();
    } catch (error) {
      console.error('Erro ao contar jogos:', error);
      throw error;
    }
  }

  /**
   * Get games grouped by status
   * @returns Games count by status
   */
  static async getGamesByStatus() {
    try {
      const games = await prisma.jogo.groupBy({
        by: ['status'],
        _count: {
          _all: true
        }
      });

      // Transform to a more readable format
      const result: Record<string, number> = {};
      games.forEach(game => {
        result[game.status] = game._count._all;
      });

      return result;
    } catch (error) {
      console.error('Erro ao buscar jogos por status:', error);
      throw error;
    }
  }

  /**
   * Get top teams by points
   * @param limit Number of teams to return
   * @returns Top teams ordered by points
   */
  static async getTopTeams(limit: number) {
    try {
      const topTeams = await prisma.estatisticaTime.findMany({
        take: limit,
        orderBy: {
          pontos: 'desc'
        },
        include: {
          time: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      // Transform to a more readable format
      return topTeams.map(team => ({
        time: {
          id: team.timeId,
          nome: team.time?.nome || 'Time desconhecido'
        },
        modalidade: {
          id: team.modalidadeId,
          nome: team.modalidade?.nome || 'Modalidade desconhecida'
        },
        pontos: team.pontos,
        vitorias: team.vitorias,
        empates: team.empates,
        derrotas: team.derrotas,
        golsPro: team.golsPro,
        golsContra: team.golsContra
      }));
    } catch (error) {
      console.error('Erro ao buscar top times:', error);
      throw error;
    }
  }

  /**
   * Get top scorers
   * @param limit Number of players to return
   * @returns Top scorers ordered by goals
   */
  static async getTopScorers(limit: number) {
    try {
      const topScorers = await prisma.estatisticaJogador.findMany({
        take: limit,
        where: {
          gols: {
            gt: 0
          }
        },
        orderBy: {
          gols: 'desc'
        },
        include: {
          jogador: {
            select: {
              id: true,
              nome: true
            }
          },
          modalidade: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      // Transform to a more readable format
      return topScorers.map(scorer => ({
        jogador: {
          id: scorer.jogadorId,
          nome: scorer.jogador?.nome || 'Jogador desconhecido'
        },
        modalidade: {
          id: scorer.modalidadeId,
          nome: scorer.modalidade?.nome || 'Modalidade desconhecida'
        },
        gols: scorer.gols,
        assistencias: scorer.assistencias,
        jogos: scorer.jogos
      }));
    } catch (error) {
      console.error('Erro ao buscar artilheiros:', error);
      throw error;
    }
  }

  /**
   * Get chart data based on metric and period
   * @param metric Metric to retrieve (goals, matches, etc.)
   * @param period Time period (day, week, month, year)
   * @returns Chart data
   */
  static async getChartData(metric: string, period: string) {
    try {
      // For now, we'll return mock data as the implementation would depend on
      // the specific requirements for chart data
      // In a real implementation, this would query the database for time-series data
      
      // Mock data for demonstration
      const mockData = [];
      const periods = period === 'day' ? 24 : 
                     period === 'week' ? 7 : 
                     period === 'month' ? 30 : 12;
      
      for (let i = 0; i < periods; i++) {
        mockData.push({
          period: period === 'day' ? `Hora ${i}` : 
                  period === 'week' ? `Dia ${i+1}` : 
                  period === 'month' ? `Dia ${i+1}` : `Mês ${i+1}`,
          value: Math.floor(Math.random() * 100)
        });
      }
      
      return {
        metric,
        period,
        data: mockData
      };
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      throw error;
    }
  }
}
