import { prisma } from './database';

export class TurmaModel {
  /**
   * Busca todas as turmas (dados simplificados)
   * @returns Lista de turmas
   */
  static async findAll() {
    return await prisma.turma.findMany();
  }

  /**
   * Busca uma turma pelo ID (dados simplificados)
   * @param id ID da turma
   * @returns Turma encontrada ou null
   */
  static async findById(id: number) {
    return await prisma.turma.findUnique({
      where: { id }
    });
  }

  /**
   * Busca uma turma pelo nome
   * @param nome Nome da turma
   * @returns Turma encontrada ou null
   */
  static async findByNome(nome: string) {
    return await prisma.turma.findFirst({
      where: { nome }
    });
  }

  /**
   * Busca uma turma pelo nome excluindo um ID específico
   * @param nome Nome da turma
   * @param excludeId ID a ser excluído da busca
   * @returns Turma encontrada ou null
   */
  static async findByNomeExcluindoId(nome: string, excludeId: number) {
    return await prisma.turma.findFirst({
      where: {
        nome,
        id: { not: excludeId }
      }
    });
  }

  /**
   * Cria uma nova turma
   * @param nome Nome da turma
   * @param serie Série da turma
   * @param turno Turno da turma
   * @param edicaoId ID da edição (opcional)
   * @returns Turma criada
   */
  static async create(nome: string, serie: number, turno: string, edicaoId?: number) {
    return await prisma.turma.create({
      data: {
        nome,
        serie,
        turno,
        edicaoId
      }
    });
  }

  /**
   * Atualiza uma turma existente
   * @param id ID da turma
   * @param nome Novo nome da turma
   * @param serie Nova série da turma
   * @param turno Novo turno da turma
   * @param edicaoId Novo ID da edição
   * @returns Turma atualizada
   */
  static async update(id: number, nome?: string, serie?: number, turno?: string, edicaoId?: number) {
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (serie !== undefined) updateData.serie = serie;
    if (turno !== undefined) updateData.turno = turno;
    if (edicaoId !== undefined) updateData.edicaoId = edicaoId;

    return await prisma.turma.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Busca uma turma com suas relações para verificação antes da exclusão
   * @param id ID da turma
   * @returns Turma com relações
   */
  static async findByIdWithRelations(id: number) {
    return await prisma.turma.findUnique({
      where: { id },
      include: {
        edicao: true,
        alunos: true
      }
    });
  }

  /**
   * Exclui uma turma pelo ID
   * @param id ID da turma
   * @returns Resultado da operação
   */
  static async delete(id: number) {
    return await prisma.turma.delete({
      where: { id }
    });
  }

  /**
   * Get eligible players for association with a specific time
   * @param turmaId ID da turma
   * @param timeId ID do time
   * @returns Lista de jogadores elegíveis para associação
   */
  static async getEligiblePlayersForTime(turmaId: number, timeId: number) {
    // Get the time's modality
    const time = await prisma.time.findUnique({
      where: { id: timeId },
      include: { modalidade: true }
    });

    if (!time || !time.modalidade) {
      return [];
    }

    // Get all players from the turma
    const jogadores = await prisma.jogador.findMany({
      where: { turmaId },
      include: {
        jogadorModalidades: {
          include: {
            modalidade: true
          }
        }
      }
    });

    // Filter players based on modality and gender
    const eligiblePlayers = jogadores.filter(jogador => {
      // Check if player has the same modality as the time
      const hasMatchingModality = jogador.jogadorModalidades.some(jm =>
        jm.modalidadeId === time.modalidadeId
      );

      // NEW LOGIC: Check gender compatibility using player's own gender field
      let isGenderCompatible = false;

      if (jogador.genero) {
        // Player has gender field - use new compatibility matrix
        // Implementation of gender compatibility matrix:
        // - Misto modality accepts any player gender
        // - Misto player can play in any modality gender
        // - Otherwise, genders must match exactly
        isGenderCompatible =
          time.modalidade.genero === 'Misto' || // Time accepts any gender
          jogador.genero === 'Misto' || // Player is mixed (can play in any modality)
          jogador.genero === time.modalidade.genero; // Genders match exactly
      } else {
        // BACKWARD COMPATIBILITY: Player without gender field - use old logic
        // Check if player's modality gender matches the time's modality gender
        isGenderCompatible = time.modalidade.genero === 'Misto' ||
          jogador.jogadorModalidades.some(jm => jm.modalidade.genero === time.modalidade.genero);
      }

      return hasMatchingModality && isGenderCompatible;
    });

    return eligiblePlayers;
  }
}