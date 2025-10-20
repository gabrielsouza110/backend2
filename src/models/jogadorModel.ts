import { prisma } from './database';

export class JogadorModel {
  /**
   * Validates and normalizes gender input to match database enum values
   * @param genero Gender input string
   * @returns Normalized gender value compatible with GeneroJogador enum
   * @throws Error if gender is invalid
   */
  private static validateAndNormalizeGender(genero: string): 'Masculino' | 'Feminino' | 'Misto' {
    // Validate that gender was provided and is a string
    if (typeof genero !== 'string') {
      throw new Error('Gênero é obrigatório e deve ser uma string válida');
    }

    // Trim whitespace and handle empty strings
    const trimmedGenero = genero.trim();
    if (trimmedGenero === '') {
      throw new Error('Gênero não pode ser uma string vazia');
    }

    // Normalize gender input to match enum values
    // Handle common variations and case insensitivity
    const lowerGenero = trimmedGenero.toLowerCase();
    let normalizedGenero: string;

    switch (lowerGenero) {
      case 'masculino':
      case 'masc':
      case 'm':
      case 'male':
      case 'homem': {
        normalizedGenero = 'Masculino';
        break;
      }
      case 'feminino':
      case 'fem':
      case 'f':
      case 'female':
      case 'mulher': {
        normalizedGenero = 'Feminino';
        break;
      }
      case 'misto':
      case 'mixed':
      case 'unissex':
      case 'ambos': {
        normalizedGenero = 'Misto';
        break;
      }
      default: {
        // If no match found, try the original capitalization approach as fallback
        const capitalizedGenero = trimmedGenero.charAt(0).toUpperCase() + trimmedGenero.slice(1).toLowerCase();
        if (['Masculino', 'Feminino', 'Misto'].includes(capitalizedGenero)) {
          normalizedGenero = capitalizedGenero;
        } else {
          throw new Error(`Gênero inválido: "${genero}". Valores aceitos: Masculino, Feminino, Misto (ou suas variações: m/masc/male, f/fem/female, misto/mixed/unissex)`);
        }
      }
    }

    return normalizedGenero as 'Masculino' | 'Feminino' | 'Misto';
  }
  /**
   * Busca todos os jogadores (dados simplificados)
   * @param edicaoId ID opcional da edição para filtrar
   * @param modalidadeId ID opcional da modalidade para filtrar
   * @returns Lista de jogadores
   */
  static async findAll(edicaoId?: number, modalidadeId?: number) {
    const where: any = {};
    if (edicaoId) where.edicaoId = edicaoId;

    const jogadores = await prisma.jogador.findMany({
      where
    });

    // Filtrar por modalidade se necessário
    if (modalidadeId) {
      // Para manter a funcionalidade de filtragem, precisamos buscar as relações
      const jogadoresWithModalidades = await prisma.jogador.findMany({
        where,
        include: {
          jogadorModalidades: true
        }
      });

      return jogadoresWithModalidades
        .filter(jogador =>
          jogador.jogadorModalidades.some(jm => jm.modalidadeId === modalidadeId)
        )
        .map(({ jogadorModalidades, ...jogador }) => jogador); // Remover as relações do retorno
    }

    return jogadores;
  }

  /**
   * Conta o número total de jogadores com base nos filtros
   * @param edicaoId ID opcional da edição para filtrar
   * @param modalidadeId ID opcional da modalidade para filtrar
   * @returns Número total de jogadores
   */
  static async count(edicaoId?: number, modalidadeId?: number) {
    const where: any = {};
    if (edicaoId) where.edicaoId = edicaoId;

    if (modalidadeId) {
      // Para contagem com filtro de modalidade, precisamos fazer uma query mais complexa
      const jogadoresWithModalidades = await prisma.jogador.findMany({
        where,
        include: {
          jogadorModalidades: true
        }
      });

      return jogadoresWithModalidades
        .filter(jogador =>
          jogador.jogadorModalidades.some(jm => jm.modalidadeId === modalidadeId)
        ).length;
    }

    return prisma.jogador.count({
      where
    });
  }

  /**
   * Busca todos os jogadores com paginação
   * @param edicaoId ID opcional da edição para filtrar
   * @param modalidadeId ID opcional da modalidade para filtrar
   * @param offset Posição inicial para paginação
   * @param limit Número máximo de registros por página
   * @returns Lista de jogadores paginada
   */
  static async findAllPaginated(edicaoId?: number, modalidadeId?: number, offset: number = 0, limit: number = 20) {
    const where: any = {};
    if (edicaoId) where.edicaoId = edicaoId;

    if (modalidadeId) {
      // Para paginação com filtro de modalidade, precisamos fazer uma query mais complexa
      const jogadoresWithModalidades = await prisma.jogador.findMany({
        where,
        include: {
          jogadorModalidades: true
        }
      });

      const filteredJogadores = jogadoresWithModalidades
        .filter(jogador =>
          jogador.jogadorModalidades.some(jm => jm.modalidadeId === modalidadeId)
        )
        .map(({ jogadorModalidades, ...jogador }) => jogador); // Remover as relações do retorno

      // Aplicar paginação
      return filteredJogadores.slice(offset, offset + limit);
    }

    return prisma.jogador.findMany({
      where,
      skip: offset,
      take: limit
    });
  }

  /**
   * Busca um jogador pelo ID (dados simplificados)
   * @param id ID do jogador
   * @returns Jogador encontrado ou null
   */
  static async findById(id: number) {
    return prisma.jogador.findUnique({
      where: { id }
    });
  }

  /**
   * Busca jogadores por turma (dados simplificados)
   * @param turmaId ID da turma
   * @param edicaoId ID opcional da edição
   * @returns Lista de jogadores da turma
   */
  static async findByTurma(turmaId: number, edicaoId?: number) {
    const where: any = { turmaId };
    if (edicaoId) where.edicaoId = edicaoId;

    return prisma.jogador.findMany({
      where
    });
  }

  /**
   * Fetch players by team (via time_jogador join table)
   */
  static async findByTime(timeId: number) {
    return prisma.jogador.findMany({
      where: {
        timeJogadores: {
          some: { timeId }
        }
      }
    });
  }

  /**
   * Fetch players that participate in a specific game (players of both teams)
   */
  static async findByGame(gameId: number) {
    const jogo = await prisma.jogo.findUnique({
      where: { id: gameId },
      select: { time1Id: true, time2Id: true }
    });
    if (!jogo) return [];
    const teamIds = [jogo.time1Id, jogo.time2Id];
    return prisma.jogador.findMany({
      where: {
        timeJogadores: {
          some: {
            timeId: { in: teamIds }
          }
        }
      }
    });
  }

  /**
   * Verifica se um jogador com o mesmo nome já existe na mesma turma e edição
   * @param nome Nome do jogador
   * @param turmaId ID da turma
   * @param edicaoId ID da edição
   * @returns Jogador encontrado ou null
   */
  static async findByNomeTurmaEdicao(nome: string, turmaId: number | null, edicaoId: number | null) {
    // If turmaId or edicaoId is null, we can't check for duplicates
    if (turmaId === null || edicaoId === null) {
      return null;
    }

    // Using a more generic approach since the specific constraint name might not be recognized
    return prisma.jogador.findFirst({
      where: {
        nome,
        turmaId,
        edicaoId
      }
    });
  }

  /**
   * Cria um novo jogador
   * @param nome Nome do jogador
   * @param genero Gênero do jogador (obrigatório)
   * @param modalidades IDs das modalidades (obrigatório - pelo menos 1)
   * @param turmaId ID da turma (opcional)
   * @param edicaoId ID da edição (opcional)
   * @param numeroCamisa Número da camisa do jogador (opcional)
   * @returns Jogador criado
   */
  static async create(nome: string, genero: string, modalidades: number[], turmaId?: number, edicaoId?: number, numeroCamisa?: number) {
    // Validar que modalidades não está vazio
    if (!modalidades || !Array.isArray(modalidades) || modalidades.length === 0) {
      throw new Error('Pelo menos uma modalidade é obrigatória');
    }

    // Validar e normalizar gênero
    const normalizedGenero = this.validateAndNormalizeGender(genero);

    // Criar o jogador
    const jogador = await prisma.jogador.create({
      data: {
        nome,
        genero: normalizedGenero,
        turmaId: turmaId || null,
        edicaoId: edicaoId || null,
        // Using a more generic approach for the numeroCamisa field
        ...(numeroCamisa !== undefined && { numeroCamisa: numeroCamisa || null })
      } as any
    });

    // Adicionar modalidades (agora obrigatório)
    await Promise.all(modalidades.map(modalidadeId =>
      prisma.jogadorModalidade.create({
        data: {
          jogadorId: jogador.id,
          modalidadeId
        }
      })
    ));

    return jogador;
  }

  /**
   * Busca um jogador completo após criação
   * @param id ID do jogador
   * @returns Jogador com suas relações
   */
  static async findCompleteById(id: number) {
    return prisma.jogador.findUnique({
      where: { id },
      include: {
        turma: true,
        edicao: true,
        timeJogadores: {
          include: {
            time: true
          }
        },
        jogadorModalidades: {
          include: {
            modalidade: true
          }
        }
      }
    });
  }

  /**
   * Atualiza um jogador existente
   * @param id ID do jogador
   * @param nome Novo nome do jogador (opcional)
   * @param genero Novo gênero do jogador (opcional)
   * @param turmaId Nova turma do jogador (opcional)
   * @param edicaoId Nova edição do jogador (opcional)
   * @param numeroCamisa Novo número da camisa do jogador (opcional)
   * @returns Jogador atualizado
   */
  static async update(id: number, nome?: string, genero?: string, turmaId?: number, edicaoId?: number, numeroCamisa?: number) {
    const data: any = {};

    if (nome !== undefined) data.nome = nome;
    if (turmaId !== undefined) data.turmaId = turmaId;
    if (edicaoId !== undefined) data.edicaoId = edicaoId;
    if (numeroCamisa !== undefined) data.numeroCamisa = numeroCamisa;

    // Handle gender update with validation
    if (genero !== undefined) {
      if (genero === null) {
        // Allow setting gender to null for backward compatibility
        data.genero = null;
      } else {
        // Validate and normalize gender using the same logic as create method
        data.genero = this.validateAndNormalizeGender(genero);
      }
    }

    return prisma.jogador.update({
      where: { id },
      data
    });
  }

  /**
   * Exclui um jogador
   * @param id ID do jogador
   * @returns Resultado da operação
   */
  static async delete(id: number) {
    return prisma.jogador.delete({
      where: { id }
    });
  }

  /**
   * Busca um jogador pelo ID com relações específicas para exclusão
   * @param id ID do jogador
   * @returns Jogador com relações para exclusão ou null
   */
  static async findByIdWithRelationsForDelete(id: number) {
    return prisma.jogador.findUnique({
      where: { id },
      include: {
        timeJogadores: true,
        jogadorModalidades: true
      }
    });
  }

  /**
   * Exclui todas as associações de times de um jogador
   * @param jogadorId ID do jogador
   * @returns Resultado da operação
   */
  static async deleteTimeJogadores(jogadorId: number) {
    return prisma.timeJogador.deleteMany({
      where: { jogadorId }
    });
  }

  /**
   * Exclui todas as associações de modalidades de um jogador
   * @param jogadorId ID do jogador
   * @returns Resultado da operação
   */
  static async deleteJogadorModalidades(jogadorId: number) {
    return prisma.jogadorModalidade.deleteMany({
      where: { jogadorId }
    });
  }

  /**
   * Adiciona uma modalidade a um jogador
   * @param jogadorId ID do jogador
   * @param modalidadeId ID da modalidade
   * @returns Associação criada
   */
  static async addModalidade(jogadorId: number, modalidadeId: number) {
    return prisma.jogadorModalidade.create({
      data: {
        jogadorId,
        modalidadeId
      }
    });
  }

  /**
   * Verifica se um jogador já está associado a uma modalidade
   * @param jogadorId ID do jogador
   * @param modalidadeId ID da modalidade
   * @returns Associação encontrada ou null
   */
  static async findJogadorModalidade(jogadorId: number, modalidadeId: number) {
    return prisma.jogadorModalidade.findFirst({
      where: {
        jogadorId,
        modalidadeId
      }
    });
  }

  /**
   * Remove uma modalidade de um jogador
   * @param id ID da associação jogador-modalidade
   * @returns Resultado da operação
   */
  static async removeModalidade(id: number, modalidadeIdNum: number) {
    return prisma.jogadorModalidade.delete({
      where: { id }
    });
  }

  /**
   * Atualiza as modalidades de um jogador (substitui todas as modalidades existentes)
   * @param jogadorId ID do jogador
   * @param modalidades Array de IDs das modalidades
   * @returns Resultado da operação
   */
  static async updateModalidades(jogadorId: number, modalidades: number[]) {
    // Validate input parameters
    if (!modalidades || !Array.isArray(modalidades)) {
      throw new Error('Modalidades deve ser um array válido');
    }

    // For backward compatibility, allow empty array in updates (but not in creation)
    // This maintains compatibility with existing players that might not have modalidades
    if (modalidades.length === 0) {
      // Just remove all existing modalidades - maintain backward compatibility
      return prisma.jogadorModalidade.deleteMany({
        where: { jogadorId }
      });
    }

    // Usar transação para garantir consistência
    return prisma.$transaction(async (tx) => {
      // Remover todas as modalidades existentes
      await tx.jogadorModalidade.deleteMany({
        where: { jogadorId }
      });

      // Adicionar as novas modalidades
      await Promise.all(modalidades.map(modalidadeId =>
        tx.jogadorModalidade.create({
          data: {
            jogadorId,
            modalidadeId
          }
        })
      ));

      return { success: true };
    });
  }
}