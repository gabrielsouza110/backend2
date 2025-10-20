import { prisma } from './database';
import { logger } from '../utils/logger';

export interface PosicaoGrupo {
    timeId: number;
    time: {
        id: number;
        nome: string;
        grupo: string | null;
    };
    posicao: number;
    pontos: number;
    jogos: number;
    vitorias: number;
    empates: number;
    derrotas: number;
    golsPro: number;
    golsContra: number;
    saldoGols: number;
}

export interface CriteriosDesempate {
    pontos: number;
    confrontoDireto?: {
        vitorias: number;
        saldoGols: number;
        golsPro: number;
    };
    saldoGols: number;
    golsPro: number;
    golsContra: number;
}

export class GrupoModel {
    /**
     * Calcula a tabela de classificação de um grupo
     */
    static async calcularTabelaGrupo(
        modalidadeId: number,
        genero: string,
        grupo: string,
        edicaoId?: number
    ): Promise<PosicaoGrupo[]> {
        try {
            // Buscar times do grupo
            const times = await prisma.time.findMany({
                where: {
                    modalidadeId,
                    grupo,
                    ativo: true,
                    ...(edicaoId && { edicaoId }),
                    modalidade: {
                        genero: genero as any
                    }
                },
                select: {
                    id: true,
                    nome: true,
                    grupo: true
                }
            });

            if (times.length === 0) {
                return [];
            }

            const timeIds = times.map(t => t.id);

            // Buscar jogos do grupo (apenas fase de grupos)
            const jogos = await prisma.jogo.findMany({
                where: {
                    modalidadeId,
                    tipoJogo: 'FASE_GRUPOS',
                    status: 'FINALIZADO',
                    OR: [
                        { time1Id: { in: timeIds } },
                        { time2Id: { in: timeIds } }
                    ],
                    AND: [
                        { time1Id: { in: timeIds } },
                        { time2Id: { in: timeIds } }
                    ],
                    ...(edicaoId && { edicaoId })
                },
                include: {
                    jogoTimes: true,
                    time1: { select: { id: true, nome: true } },
                    time2: { select: { id: true, nome: true } }
                }
            });

            // Calcular estatísticas para cada time
            const estatisticas = new Map<number, {
                pontos: number;
                jogos: number;
                vitorias: number;
                empates: number;
                derrotas: number;
                golsPro: number;
                golsContra: number;
            }>();

            // Inicializar estatísticas
            times.forEach(time => {
                estatisticas.set(time.id, {
                    pontos: 0,
                    jogos: 0,
                    vitorias: 0,
                    empates: 0,
                    derrotas: 0,
                    golsPro: 0,
                    golsContra: 0
                });
            });

            // Processar jogos
            jogos.forEach(jogo => {
                const jogoTime1 = jogo.jogoTimes.find(jt => jt.timeId === jogo.time1Id);
                const jogoTime2 = jogo.jogoTimes.find(jt => jt.timeId === jogo.time2Id);

                if (!jogoTime1 || !jogoTime2) return;

                const stats1 = estatisticas.get(jogo.time1Id)!;
                const stats2 = estatisticas.get(jogo.time2Id)!;

                stats1.jogos++;
                stats2.jogos++;
                stats1.golsPro += jogoTime1.gols;
                stats1.golsContra += jogoTime2.gols;
                stats2.golsPro += jogoTime2.gols;
                stats2.golsContra += jogoTime1.gols;

                if (jogoTime1.gols > jogoTime2.gols) {
                    // Time 1 venceu
                    stats1.vitorias++;
                    stats1.pontos += 3;
                    stats2.derrotas++;
                } else if (jogoTime2.gols > jogoTime1.gols) {
                    // Time 2 venceu
                    stats2.vitorias++;
                    stats2.pontos += 3;
                    stats1.derrotas++;
                } else {
                    // Empate
                    stats1.empates++;
                    stats2.empates++;
                    stats1.pontos += 1;
                    stats2.pontos += 1;
                }
            });

            // Criar array de posições
            const posicoes: PosicaoGrupo[] = times.map(time => {
                const stats = estatisticas.get(time.id)!;
                return {
                    timeId: time.id,
                    time,
                    posicao: 0, // Será calculado após ordenação
                    pontos: stats.pontos,
                    jogos: stats.jogos,
                    vitorias: stats.vitorias,
                    empates: stats.empates,
                    derrotas: stats.derrotas,
                    golsPro: stats.golsPro,
                    golsContra: stats.golsContra,
                    saldoGols: stats.golsPro - stats.golsContra
                };
            });

            // Ordenar por critérios de desempate
            const posicaoOrdenada = await this.aplicarCriteriosDesempate(posicoes, jogos);

            // Atribuir posições
            posicaoOrdenada.forEach((pos, index) => {
                pos.posicao = index + 1;
            });

            return posicaoOrdenada;
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating group table');
            throw error;
        }
    }

    /**
     * Aplica critérios de desempate
     */
    private static async aplicarCriteriosDesempate(
        posicoes: PosicaoGrupo[],
        jogos: any[]
    ): Promise<PosicaoGrupo[]> {
        return posicoes.sort((a, b) => {
            // 1º critério: Pontos
            if (a.pontos !== b.pontos) {
                return b.pontos - a.pontos;
            }

            // 2º critério: Confronto direto (se houver)
            const confrontoDireto = this.calcularConfrontoDireto(a.timeId, b.timeId, jogos);
            if (confrontoDireto) {
                if (confrontoDireto.pontosA !== confrontoDireto.pontosB) {
                    return confrontoDireto.pontosB - confrontoDireto.pontosA;
                }
                if (confrontoDireto.saldoGolsA !== confrontoDireto.saldoGolsB) {
                    return confrontoDireto.saldoGolsB - confrontoDireto.saldoGolsA;
                }
                if (confrontoDireto.golsProA !== confrontoDireto.golsProB) {
                    return confrontoDireto.golsProB - confrontoDireto.golsProA;
                }
            }

            // 3º critério: Saldo de gols
            if (a.saldoGols !== b.saldoGols) {
                return b.saldoGols - a.saldoGols;
            }

            // 4º critério: Gols pró
            if (a.golsPro !== b.golsPro) {
                return b.golsPro - a.golsPro;
            }

            // 5º critério: Menos gols contra
            return a.golsContra - b.golsContra;
        });
    }

    /**
     * Calcula confronto direto entre dois times
     */
    private static calcularConfrontoDireto(timeA: number, timeB: number, jogos: any[]) {
        const confrontos = jogos.filter(jogo =>
            (jogo.time1Id === timeA && jogo.time2Id === timeB) ||
            (jogo.time1Id === timeB && jogo.time2Id === timeA)
        );

        if (confrontos.length === 0) return null;

        let pontosA = 0, pontosB = 0;
        let golsProA = 0, golsProB = 0;

        confrontos.forEach(jogo => {
            const jogoTime1 = jogo.jogoTimes.find((jt: any) => jt.timeId === jogo.time1Id);
            const jogoTime2 = jogo.jogoTimes.find((jt: any) => jt.timeId === jogo.time2Id);

            if (!jogoTime1 || !jogoTime2) return;

            if (jogo.time1Id === timeA) {
                golsProA += jogoTime1.gols;
                golsProB += jogoTime2.gols;

                if (jogoTime1.gols > jogoTime2.gols) {
                    pontosA += 3;
                } else if (jogoTime2.gols > jogoTime1.gols) {
                    pontosB += 3;
                } else {
                    pontosA += 1;
                    pontosB += 1;
                }
            } else {
                golsProA += jogoTime2.gols;
                golsProB += jogoTime1.gols;

                if (jogoTime2.gols > jogoTime1.gols) {
                    pontosA += 3;
                } else if (jogoTime1.gols > jogoTime2.gols) {
                    pontosB += 3;
                } else {
                    pontosA += 1;
                    pontosB += 1;
                }
            }
        });

        return {
            pontosA,
            pontosB,
            saldoGolsA: golsProA - golsProB,
            saldoGolsB: golsProB - golsProA,
            golsProA,
            golsProB
        };
    }

    /**
     * Obtém os classificados de um grupo
     */
    static async getClassificados(
        modalidadeId: number,
        genero: string,
        grupo: string,
        quantidadeClassificados: number = 2,
        edicaoId?: number
    ): Promise<PosicaoGrupo[]> {
        const tabela = await this.calcularTabelaGrupo(modalidadeId, genero, grupo, edicaoId);
        return tabela.slice(0, quantidadeClassificados);
    }

    /**
     * Lista todos os grupos de uma modalidade
     */
    static async listarGrupos(modalidadeId: number, genero: string, edicaoId?: number): Promise<string[]> {
        try {
            const grupos = await prisma.time.findMany({
                where: {
                    modalidadeId,
                    ativo: true,
                    grupo: { not: null },
                    ...(edicaoId && { edicaoId }),
                    modalidade: {
                        genero: genero as any
                    }
                },
                select: {
                    grupo: true
                },
                distinct: ['grupo']
            });

            return grupos
                .map(g => g.grupo)
                .filter((grupo): grupo is string => grupo !== null)
                .sort();
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error listing groups');
            throw error;
        }
    }

    /**
     * Atualiza o grupo de um time
     */
    static async atualizarGrupoTime(timeId: number, grupo: string | null): Promise<void> {
        try {
            await prisma.time.update({
                where: { id: timeId },
                data: { grupo }
            });

            logger.info(`Updated team ${timeId} group to ${grupo}`);
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error updating team group');
            throw error;
        }
    }
}