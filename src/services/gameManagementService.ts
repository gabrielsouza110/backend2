import { prisma } from '../models/database';
import { GrupoModel } from '../models/grupoModel';
import { logger } from '../utils/logger';

export class GameManagementService {
  /**
   * Gera automaticamente os jogos de fase de grupos
   */
  static async gerarJogosFaseGrupos(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicio: Date,
    local: string = 'Quadra Principal'
  ): Promise<void> {
    try {
      const grupos = await GrupoModel.listarGrupos(modalidadeId, genero, edicaoId);
      
      for (const grupo of grupos) {
        const times = await prisma.time.findMany({
          where: {
            modalidadeId,
            grupo,
            ativo: true,
            edicaoId,
            modalidade: {
              genero: genero as any
            }
          }
        });

        // Gerar jogos entre todos os times do grupo (todos contra todos)
        const jogos = this.gerarJogosRoundRobin(times);
        
        let dataJogo = new Date(dataInicio);
        
        for (const jogo of jogos) {
          await prisma.jogo.create({
            data: {
              time1Id: jogo.time1Id,
              time2Id: jogo.time2Id,
              modalidadeId,
              edicaoId,
              dataHora: new Date(dataJogo),
              local,
              tipoJogo: 'FASE_GRUPOS',
              descricao: `Fase de Grupos - Grupo ${grupo}`
            }
          });

          // Incrementar data para próximo jogo (exemplo: 1 hora depois)
          dataJogo = new Date(dataJogo.getTime() + 60 * 60 * 1000);
        }
      }

      logger.info(`Generated group stage games for modalidade ${modalidadeId}, genero ${genero}`);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating group stage games');
      throw error;
    }
  }

  /**
   * Gera jogos em formato round-robin (todos contra todos)
   */
  private static gerarJogosRoundRobin(times: any[]): { time1Id: number; time2Id: number }[] {
    const jogos: { time1Id: number; time2Id: number }[] = [];
    
    for (let i = 0; i < times.length; i++) {
      for (let j = i + 1; j < times.length; j++) {
        jogos.push({
          time1Id: times[i].id,
          time2Id: times[j].id
        });
      }
    }
    
    return jogos;
  }

  /**
   * Gera automaticamente as semifinais baseado nos classificados ou times disponíveis
   */
  static async gerarSemifinais(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicio: Date,
    local: string = 'Quadra Principal'
  ): Promise<void> {
    try {
      // Verificar se tem fase de grupos baseado na existência de grupos
      const temGrupos = await this.verificarSeTemGrupos(modalidadeId, genero, edicaoId);

      if (temGrupos) {
        // Modalidades com fase de grupos
        await this.gerarSemifinaisComGrupos(modalidadeId, genero, edicaoId, dataInicio, local);
      } else {
        // Modalidades sem fase de grupos - usar todos os times disponíveis
        await this.gerarSemifinaisSemGrupos(modalidadeId, genero, edicaoId, dataInicio, local);
      }

      logger.info(`Generated semifinals for modalidade ${modalidadeId}, genero ${genero}`);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating semifinals');
      throw error;
    }
  }

  /**
   * Verifica se uma modalidade tem grupos definidos
   */
  private static async verificarSeTemGrupos(modalidadeId: number, genero: string, edicaoId?: number): Promise<boolean> {
    const timesComGrupo = await prisma.time.findMany({
      where: {
        modalidadeId,
        ativo: true,
        grupo: { not: null },
        ...(edicaoId && { edicaoId }),
        modalidade: {
          genero: genero as any
        }
      }
    });

    return timesComGrupo.length > 0;
  }

  /**
   * Gera semifinais para modalidades com fase de grupos
   */
  private static async gerarSemifinaisComGrupos(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicio: Date,
    local: string
  ): Promise<void> {
    const grupos = await GrupoModel.listarGrupos(modalidadeId, genero, edicaoId);
    
    if (grupos.length !== 2) {
      throw new Error('Esperado exatamente 2 grupos para gerar semifinais');
    }

    const [grupoA, grupoB] = grupos.sort();
    
    // Obter os 2 primeiros colocados de cada grupo
    const classificadosA = await GrupoModel.getClassificados(modalidadeId, genero, grupoA, 2, edicaoId);
    const classificadosB = await GrupoModel.getClassificados(modalidadeId, genero, grupoB, 2, edicaoId);

    if (classificadosA.length < 2 || classificadosB.length < 2) {
      throw new Error('Não há classificados suficientes para gerar semifinais');
    }

    const dataJogo1 = new Date(dataInicio);
    const dataJogo2 = new Date(dataInicio.getTime() + 60 * 60 * 1000); // 1 hora depois

    // Semifinal 1: 1º do Grupo A x 2º do Grupo B
    await prisma.jogo.create({
      data: {
        time1Id: classificadosA[0].timeId,
        time2Id: classificadosB[1].timeId,
        modalidadeId,
        edicaoId,
        dataHora: dataJogo1,
        local,
        tipoJogo: 'SEMIFINAL',
        descricao: `Semifinal 1: 1º ${grupoA} x 2º ${grupoB}`
      }
    });

    // Semifinal 2: 1º do Grupo B x 2º do Grupo A
    await prisma.jogo.create({
      data: {
        time1Id: classificadosB[0].timeId,
        time2Id: classificadosA[1].timeId,
        modalidadeId,
        edicaoId,
        dataHora: dataJogo2,
        local,
        tipoJogo: 'SEMIFINAL',
        descricao: `Semifinal 2: 1º ${grupoB} x 2º ${grupoA}`
      }
    });
  }

  /**
   * Gera semifinais para modalidades sem fase de grupos
   * Usa os primeiros 4 times disponíveis e os organiza automaticamente
   */
  private static async gerarSemifinaisSemGrupos(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicio: Date,
    local: string
  ): Promise<void> {
    const times = await prisma.time.findMany({
      where: {
        modalidadeId,
        ativo: true,
        edicaoId,
        modalidade: {
          genero: genero as any
        }
      },
      orderBy: { nome: 'asc' } // Ordenar por nome para consistência
    });

    if (times.length < 4) {
      throw new Error(`Necessário pelo menos 4 times para gerar semifinais. Encontrados: ${times.length}`);
    }

    console.log(`📋 Times disponíveis para semifinais:`, times.map(t => `${t.id}: ${t.nome}`));

    const dataJogo1 = new Date(dataInicio);
    const dataJogo2 = new Date(dataInicio.getTime() + 60 * 60 * 1000);

    // Usar os primeiros 4 times e organizá-los automaticamente
    // Semifinal 1: 1º time x 4º time
    // Semifinal 2: 2º time x 3º time
    await prisma.jogo.create({
      data: {
        time1Id: times[0].id,
        time2Id: times[3].id,
        modalidadeId,
        edicaoId,
        dataHora: dataJogo1,
        local,
        tipoJogo: 'SEMIFINAL',
        descricao: `Semifinal 1: ${times[0].nome} x ${times[3].nome}`
      }
    });

    await prisma.jogo.create({
      data: {
        time1Id: times[1].id,
        time2Id: times[2].id,
        modalidadeId,
        edicaoId,
        dataHora: dataJogo2,
        local,
        tipoJogo: 'SEMIFINAL',
        descricao: `Semifinal 2: ${times[1].nome} x ${times[2].nome}`
      }
    });

    console.log(`✅ Semifinais geradas automaticamente:`);
    console.log(`   Semifinal 1: ${times[0].nome} x ${times[3].nome}`);
    console.log(`   Semifinal 2: ${times[1].nome} x ${times[2].nome}`);
  }

  /**
   * Gera semifinais manualmente especificando os IDs dos times
   */
  static async gerarSemifinaisManual(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicio: Date,
    local: string,
    semifinais: {
      jogo1: { time1Id: number; time2Id: number };
      jogo2: { time1Id: number; time2Id: number };
    }
  ): Promise<void> {
    try {
      const dataJogo1 = new Date(dataInicio);
      const dataJogo2 = new Date(dataInicio.getTime() + 60 * 60 * 1000);

      // Verificar se os times existem
      const timeIds = [semifinais.jogo1.time1Id, semifinais.jogo1.time2Id, semifinais.jogo2.time1Id, semifinais.jogo2.time2Id];
      const times = await prisma.time.findMany({
        where: {
          id: { in: timeIds },
          modalidadeId,
          ativo: true,
          edicaoId
        }
      });

      if (times.length !== 4) {
        throw new Error('Nem todos os times especificados foram encontrados');
      }

      // Semifinal 1
      await prisma.jogo.create({
        data: {
          time1Id: semifinais.jogo1.time1Id,
          time2Id: semifinais.jogo1.time2Id,
          modalidadeId,
          edicaoId,
          dataHora: dataJogo1,
          local,
          tipoJogo: 'SEMIFINAL',
          descricao: 'Semifinal 1'
        }
      });

      // Semifinal 2
      await prisma.jogo.create({
        data: {
          time1Id: semifinais.jogo2.time1Id,
          time2Id: semifinais.jogo2.time2Id,
          modalidadeId,
          edicaoId,
          dataHora: dataJogo2,
          local,
          tipoJogo: 'SEMIFINAL',
          descricao: 'Semifinal 2'
        }
      });

      logger.info(`Generated manual semifinals for modalidade ${modalidadeId}, genero ${genero}`);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating manual semifinals');
      throw error;
    }
  }

  /**
   * Gera automaticamente a final baseado nos vencedores das semifinais
   */
  static async gerarFinal(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataFinal: Date,
    local: string = 'Quadra Principal'
  ): Promise<void> {
    try {
      // Buscar semifinais finalizadas
      const semifinais = await prisma.jogo.findMany({
        where: {
          modalidadeId,
          edicaoId,
          tipoJogo: 'SEMIFINAL',
          status: 'FINALIZADO',
          modalidade: {
            genero: genero as any
          }
        },
        include: {
          jogoTimes: true,
          time1: { select: { id: true, nome: true } },
          time2: { select: { id: true, nome: true } }
        }
      });

      if (semifinais.length !== 2) {
        throw new Error('É necessário ter exatamente 2 semifinais finalizadas para gerar a final');
      }

      const vencedores: number[] = [];

      // Determinar vencedores das semifinais
      semifinais.forEach(semifinal => {
        const jogoTime1 = semifinal.jogoTimes.find(jt => jt.timeId === semifinal.time1Id);
        const jogoTime2 = semifinal.jogoTimes.find(jt => jt.timeId === semifinal.time2Id);

        if (!jogoTime1 || !jogoTime2) {
          throw new Error('Dados inconsistentes na semifinal');
        }

        if (jogoTime1.gols > jogoTime2.gols) {
          vencedores.push(semifinal.time1Id);
        } else if (jogoTime2.gols > jogoTime1.gols) {
          vencedores.push(semifinal.time2Id);
        } else {
          throw new Error('Semifinal não pode terminar empatada. É necessário definir o vencedor.');
        }
      });

      if (vencedores.length !== 2) {
        throw new Error('Não foi possível determinar os finalistas');
      }

      // Criar a final
      await prisma.jogo.create({
        data: {
          time1Id: vencedores[0],
          time2Id: vencedores[1],
          modalidadeId,
          edicaoId,
          dataHora: dataFinal,
          local,
          tipoJogo: 'FINAL',
          descricao: 'Final'
        }
      });

      logger.info(`Generated final for modalidade ${modalidadeId}, genero ${genero}`);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating final');
      throw error;
    }
  }

  /**
   * Processo completo de geração de jogos para uma modalidade
   */
  static async gerarTodosJogos(
    modalidadeId: number,
    genero: string,
    edicaoId: number,
    dataInicioGrupos: Date,
    dataInicioSemifinais: Date,
    dataFinal: Date,
    local: string = 'Quadra Principal'
  ): Promise<void> {
    try {
      // Verificar se tem grupos para decidir se gera fase de grupos
      const temGrupos = await this.verificarSeTemGrupos(modalidadeId, genero, edicaoId);

      // Gerar fase de grupos se necessário
      if (temGrupos) {
        await this.gerarJogosFaseGrupos(modalidadeId, genero, edicaoId, dataInicioGrupos, local);
      }

      // Gerar semifinais
      await this.gerarSemifinais(modalidadeId, genero, edicaoId, dataInicioSemifinais, local);

      logger.info(`Generated all games for modalidade ${modalidadeId}, genero ${genero}`);
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error generating all games');
      throw error;
    }
  }
}