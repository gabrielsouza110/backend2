import { prisma } from '../models/database';

export class EstatisticasService {
  static async atualizarEstatisticasTime(jogo: any) {
    const { id, time1Id, time2Id, modalidadeId, status } = jogo;
    
    // Verificar se o jogo está finalizado
    if (status !== 'FINALIZADO') {
      console.log(`Jogo ${id} não está finalizado (status: ${status}), pulando atualização de estatísticas`);
      return;
    }
    
    // Buscar os gols dos times através da tabela jogoTimes
    const jogoTimes = await prisma.jogoTime.findMany({
      where: { jogoId: id },
      include: { time: true }
    });
    
    if (jogoTimes.length < 2) {
      console.warn(`Jogo ${id} não possui times suficientes`);
      return;
    }
    
    const time1 = jogoTimes.find(jt => jt.timeId === time1Id);
    const time2 = jogoTimes.find(jt => jt.timeId === time2Id);
    
    if (!time1 || !time2) {
      console.warn(`Jogo ${id} não possui os times esperados`);
      return;
    }
    
    const placarTime1 = time1.gols || 0;
    const placarTime2 = time2.gols || 0;
    
    console.log(`Atualizando estatísticas do jogo ${id}: ${time1.time?.nome || 'Time 1'} ${placarTime1} x ${placarTime2} ${time2.time?.nome || 'Time 2'}`);
    
    // Determinar resultado
    let pontosTime1 = 0, pontosTime2 = 0;
    let vitoriasTime1 = 0, vitoriasTime2 = 0;
    let empatesTime1 = 0, empatesTime2 = 0;
    let derrotasTime1 = 0, derrotasTime2 = 0;
    
    if (placarTime1 > placarTime2) {
      // Time 1 venceu
      pontosTime1 = 3;
      vitoriasTime1 = 1;
      derrotasTime2 = 1;
      console.log(`Resultado: Vitória do Time 1`);
    } else if (placarTime2 > placarTime1) {
      // Time 2 venceu
      pontosTime2 = 3;
      vitoriasTime2 = 1;
      derrotasTime1 = 1;
      console.log(`Resultado: Vitória do Time 2`);
    } else {
      // Empate
      pontosTime1 = pontosTime2 = 1;
      empatesTime1 = empatesTime2 = 1;
      console.log(`Resultado: Empate`);
    }
    
    try {
      // Atualizar estatísticas do time 1
      await prisma.estatisticaTime.upsert({
        where: {
          timeId_modalidadeId: {
            timeId: time1Id,
            modalidadeId
          }
        },
        update: {
          vitorias: { increment: vitoriasTime1 },
          empates: { increment: empatesTime1 },
          derrotas: { increment: derrotasTime1 },
          golsPro: { increment: placarTime1 },
          golsContra: { increment: placarTime2 },
          pontos: { increment: pontosTime1 }
        },
        create: {
          timeId: time1Id,
          modalidadeId,
          vitorias: vitoriasTime1,
          empates: empatesTime1,
          derrotas: derrotasTime1,
          golsPro: placarTime1,
          golsContra: placarTime2,
          pontos: pontosTime1
        }
      });
      
      // Atualizar estatísticas do time 2
      await prisma.estatisticaTime.upsert({
        where: {
          timeId_modalidadeId: {
            timeId: time2Id,
            modalidadeId
          }
        },
        update: {
          vitorias: { increment: vitoriasTime2 },
          empates: { increment: empatesTime2 },
          derrotas: { increment: derrotasTime2 },
          golsPro: { increment: placarTime2 },
          golsContra: { increment: placarTime1 },
          pontos: { increment: pontosTime2 }
        },
        create: {
          timeId: time2Id,
          modalidadeId,
          vitorias: vitoriasTime2,
          empates: empatesTime2,
          derrotas: derrotasTime2,
          golsPro: placarTime2,
          golsContra: placarTime1,
          pontos: pontosTime2
        }
      });
      
      console.log(`Estatísticas dos times atualizadas com sucesso para o jogo ${id}`);
      
      // Atualizar estatísticas dos jogadores com base nos eventos do jogo
      await this.atualizarEstatisticasJogadores(id, modalidadeId);
      
    } catch (error) {
      console.error(`Erro ao atualizar estatísticas do jogo ${id}:`, error);
      throw error;
    }
  }
  
  static async atualizarEstatisticasJogadores(jogoId: number, modalidadeId: number) {
    // Buscar todos os eventos do jogo
    const eventos = await prisma.eventoJogo.findMany({
      where: { jogoId },
      include: { jogador: true }
    });
    
    // Buscar todos os jogadores que participaram do jogo (através dos times)
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        jogoTimes: {
          include: {
            time: {
              include: {
                timeJogadores: {
                  include: {
                    jogador: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!jogo) return;
    
    // Mapear jogadores e seus eventos
    const estatisticasJogadores = new Map();
    
    // Processar os eventos primeiro para identificar os jogadores que realmente participaram
    for (const evento of eventos) {
      if (!evento.jogadorId) continue;
      
      const jogadorId = evento.jogadorId;
      
      // Ensure the player is in our map
      if (!estatisticasJogadores.has(jogadorId)) {
        estatisticasJogadores.set(jogadorId, {
          gols: 0,
          assistencias: 0,
          cartaoAmarelo: 0,
          cartaoVermelho: 0,
          jogos: 1 // Contar este jogo para o jogador
        });
      }
      
      const estatisticas = estatisticasJogadores.get(jogadorId);
      
      // Atualizar estatísticas com base no tipo de evento
      switch (evento.tipo as any) {
        case 'GOL':
          estatisticas.gols += 1;
          break;
        case 'ASSISTENCIA':
          estatisticas.assistencias += 1;
          break;
        case 'CARTAO_AMARELO':
          estatisticas.cartaoAmarelo += 1;
          break;
        case 'CARTAO_VERMELHO':
          estatisticas.cartaoVermelho += 1;
          break;
      }
    }
    
    // Adicionar jogadores que participaram do jogo mas não tiveram eventos
    // (apenas incrementar o contador de jogos)
    for (const jogoTime of jogo.jogoTimes) {
      for (const timeJogador of jogoTime.time.timeJogadores) {
        const jogadorId = timeJogador.jogadorId;
        if (!estatisticasJogadores.has(jogadorId)) {
          estatisticasJogadores.set(jogadorId, {
            gols: 0,
            assistencias: 0,
            cartaoAmarelo: 0,
            cartaoVermelho: 0,
            jogos: 1 // Contar este jogo para o jogador
          });
        }
      }
    }
    
    // Atualizar as estatísticas de cada jogador no banco de dados
    for (const [jogadorId, estatisticas] of estatisticasJogadores.entries()) {
      await prisma.estatisticaJogador.upsert({
        where: {
          jogadorId_modalidadeId: {
            jogadorId,
            modalidadeId
          }
        },
        update: {
          gols: { increment: estatisticas.gols },
          assistencias: { increment: estatisticas.assistencias },
          cartoesAmarelos: { increment: estatisticas.cartaoAmarelo },
          cartoesVermelhos: { increment: estatisticas.cartaoVermelho },
          jogos: { increment: estatisticas.jogos }
        },
        create: {
          jogadorId,
          modalidadeId,
          gols: estatisticas.gols,
          assistencias: estatisticas.assistencias,
          cartoesAmarelos: estatisticas.cartaoAmarelo,
          cartoesVermelhos: estatisticas.cartaoVermelho,
          jogos: estatisticas.jogos
        }
      });
    }
  }
  
  static async recalcularTodasEstatisticas() {
    try {
      // Limpar todas as estatísticas existentes
      await prisma.estatisticaTime.deleteMany({});
      await prisma.estatisticaJogador.deleteMany({});
      
      // Buscar todos os jogos finalizados
      const jogos = await prisma.jogo.findMany({
        where: { status: 'FINALIZADO' } as any,
        include: {
          time1: true,
          time2: true,
          modalidade: true,
          jogoTimes: {
            include: { time: true }
          }
        },
        orderBy: { dataHora: 'asc' }
      });
      
      // Recalcular estatísticas para cada jogo
      for (const jogo of jogos) {
        await this.atualizarEstatisticasTime(jogo);
      }
      
      return { 
        jogosProcessados: jogos.length,
        times: await prisma.estatisticaTime.count(),
        jogadores: await prisma.estatisticaJogador.count()
      };
    } catch (error) {
      console.error('Erro ao recalcular estatísticas:', error);
      throw error;
    }
  }
}
