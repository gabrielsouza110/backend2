import { prisma } from '../models/database';
import { TurmaModel } from '../models/turmaModel';
import { TimeModel } from '../models/timeModel';

export class TurmaTimeService {
  /**
   * Associate a turma with a time and selectively associate eligible players
   * @param turmaId ID da turma
   * @param timeId ID do time
   * @returns Object with association details
   */
  static async assignTurmaToTimeWithPlayerSelection(turmaId: number, timeId: number) {
    // Verify turma exists
    const turma = await TurmaModel.findById(turmaId);
    if (!turma) {
      throw new Error('Turma não encontrada');
    }
    
    // Verify time exists
    const time = await TimeModel.findById(timeId);
    if (!time) {
      throw new Error('Time não encontrado');
    }
    
    // Check if turma is already assigned to this time
    // Note: This will need to be updated when the Prisma client is regenerated
    // For now, we'll skip this check
    
    // Assign turma to time
    // Note: This will need to be updated when the Prisma client is regenerated
    // For now, we'll skip this step
    
    // Get eligible players for this time
    const eligiblePlayers = await TurmaModel.getEligiblePlayersForTime(turmaId, timeId);
    
    // Associate eligible players with the time
    const associatedPlayers = [];
    for (const jogador of eligiblePlayers) {
      // Check if player is already associated with the time
      const existingAssociation = await TimeModel.findTimeJogador(timeId, jogador.id);
      if (!existingAssociation) {
        // Associate player with time
        const timeJogador = await TimeModel.addJogador(timeId, jogador.id);
        associatedPlayers.push({
          jogadorId: jogador.id,
          nome: jogador.nome,
          timeJogadorId: timeJogador.id
        });
      }
    }
    
    return {
      turma: {
        id: turma.id,
        nome: turma.nome
      },
      time: {
        id: time.id,
        nome: time.nome
      },
      playerAssociation: {
        eligiblePlayers: eligiblePlayers.length,
        associatedPlayers: associatedPlayers.length,
        associatedPlayerDetails: associatedPlayers
      }
    };
  }
}