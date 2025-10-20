import { prisma } from './database';

export class TimeModel {
  /**
   * Busca todos os times (dados simplificados)
   * @param edicaoId ID opcional da edição para filtrar
   * @param modalidadeId ID opcional da modalidade para filtrar
   * @returns Lista de times
   */
  static async findAll(edicaoId?: number, modalidadeId?: number) {
    const where: any = {};
    if (edicaoId) where.edicaoId = edicaoId;
    
    const times = await prisma.time.findMany({
      where
    });
    
    // Filtrar por modalidade se necessário
    if (modalidadeId) {
      // Para filtrar por modalidade, precisamos fazer um join
      const timesWithModalidade = await prisma.time.findMany({
        where: {
          ...where,
          modalidadeId: modalidadeId
        }
      });
      return timesWithModalidade;
    }
    
    return times;
  }
  
  /**
   * Busca um time pelo ID (dados simplificados)
   * @param id ID do time
   * @returns Time encontrado ou null
   */
  static async findById(id: number) {
    return prisma.time.findUnique({
      where: { id }
    });
  }
  
  /**
   * Busca um time pelo ID com relações específicas para exclusão
   * @param id ID do time
   * @returns Time com relações para exclusão ou null
   */
  static async findByIdWithRelationsForDelete(id: number) {
    return prisma.time.findUnique({
      where: { id },
      include: {
        timeJogadores: true,
        jogoTimes: true,
        estatisticasTimes: true
        // turmas: true - Removed due to new relationship model
      }
    });
  }
  
  /**
   * Cria um novo time
   * @param nome Nome do time
   * @param modalidadeId ID opcional da modalidade
   * @param edicaoId ID opcional da edição
   * @returns Time criado
   */
  static async create(nome: string, modalidadeId: number, edicaoId: number) {
    return prisma.time.create({
      data: {
        nome,
        modalidadeId,
        edicaoId
      }
    });
  }
  
  /**
   * Busca um time completo após criação
   * @param id ID do time
   * @returns Time com suas relações
   */
  static async findCompleteById(id: number) {
    return prisma.time.findUnique({
      where: { id }
    });
  }
  
  /**
   * Atualiza um time existente
   * @param id ID do time
   * @param nome Novo nome do time (opcional)
   * @param edicaoId Nova edição do time (opcional)
   * @returns Time atualizado
   */
  static async update(id: number, nome?: string, edicaoId?: number) {
    return prisma.time.update({
      where: { id },
      data: {
        nome: nome !== undefined ? nome : undefined,
        edicaoId: edicaoId !== undefined ? edicaoId : undefined
      }
    });
  }
  
  /**
   * Exclui um time
   * @param id ID do time
   * @returns Resultado da operação
   */
  static async delete(id: number) {
    return prisma.time.delete({
      where: { id }
    });
  }
  
  /**
   * Exclui todas as associações de jogadores de um time
   * @param timeId ID do time
   * @returns Resultado da operação
   */
  static async deleteTimeJogadores(timeId: number) {
    return prisma.timeJogador.deleteMany({
      where: { timeId }
    });
  }
  
  /**
   * Exclui todas as associações de jogos de um time
   * @param timeId ID do time
   * @returns Resultado da operação
   */
  static async deleteJogoTimes(timeId: number) {
    return prisma.jogoTime.deleteMany({
      where: { timeId }
    });
  }
  
  /**
   * Exclui todas as estatísticas de um time
   * @param timeId ID do time
   * @returns Resultado da operação
   */
  static async deleteEstatisticasTimes(timeId: number) {
    return prisma.estatisticaTime.deleteMany({
      where: { timeId }
    });
  }
  
  /**
   * Adiciona um jogador a um time
   * @param timeId ID do time
   * @param jogadorId ID do jogador
   * @param numeroCamisa Número da camisa do jogador (opcional)
   * @param posicao Posição do jogador no time (opcional)
   * @param capitao Se o jogador é capitão do time (opcional)
   * @returns Associação criada
   */
  static async addJogador(timeId: number, jogadorId: number, numeroCamisa?: number, posicao?: string, capitao?: boolean) {
    return prisma.timeJogador.create({
      data: {
        timeId,
        jogadorId,
        numeroCamisa: numeroCamisa || null,
        posicao: posicao || null,
        capitao: capitao || false
      },
      include: {
        time: true,
        jogador: true
      }
    });
  }
  
  /**
   * Verifica se um jogador já está associado a um time
   * @param timeId ID do time
   * @param jogadorId ID do jogador
   * @returns Associação encontrada ou null
   */
  static async findTimeJogador(timeId: number, jogadorId: number) {
    return prisma.timeJogador.findFirst({
      where: {
        timeId,
        jogadorId
      }
    });
  }
  
  /**
   * Remove um jogador de um time
   * @param id ID da associação time-jogador
   * @returns Resultado da operação
   */
  static async removeJogador(id: number) {
    return prisma.timeJogador.delete({
      where: { id }
    });
  }

  /**
   * Busca todos os jogadores de um time específico
   * @param timeId ID do time
   * @returns Lista de jogadores do time
   */
  static async getJogadoresByTime(timeId: number) {
    const timeJogadores = await prisma.timeJogador.findMany({
      where: {
        timeId: timeId,
        ativo: true
      },
      include: {
        jogador: {
          include: {
            turma: true,
            jogadorModalidades: {
              include: {
                modalidade: true
              }
            }
          }
        }
      },
      orderBy: {
        numeroCamisa: 'asc'
      }
    });

    return timeJogadores.map(tj => ({
      id: tj.jogador.id,
      nome: tj.jogador.nome,
      turma: tj.jogador.turma,
      modalidades: tj.jogador.jogadorModalidades.map(jm => jm.modalidade),
      timeJogador: {
        id: tj.id,
        numeroCamisa: tj.numeroCamisa,
        posicao: tj.posicao,
        capitao: tj.capitao,
        ativo: tj.ativo,
        dataEntrada: tj.dataEntrada,
        dataSaida: tj.dataSaida
      }
    }));
  }
}