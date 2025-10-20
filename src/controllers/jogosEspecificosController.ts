import { Request, Response } from 'express';
import { JogoModel } from '../models/jogoModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { TypeHelpers } from '../utils/typeHelpers';
import { prisma } from '../models/database';

// Type definition for Jogo with set and game scores
interface JogoWithScores {
  id: number;
  time1Id: number;
  time2Id: number;
  setsTime1?: string | null;
  setsTime2?: string | null;
  gamesTime1?: string | null;
  gamesTime2?: string | null;
  [key: string]: any; // Allow other properties
}

// Type definition for Updated Jogo response
interface UpdatedJogoResponse {
  id: number;
  setsTime1?: string | null;
  setsTime2?: string | null;
  gamesTime1?: string | null;
  gamesTime2?: string | null;
  [key: string]: any; // Allow other properties
}

export class JogosEspecificosController {
  /**
   * Score a point in a volleyball game by providing the player ID who scored
   */
  static async scoreVoleiPoint(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.id);
      const { jogadorId } = req.body;

      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      if (!jogadorId) {
        return ResponseHandler.badRequest(res, 'ID do jogador é obrigatório');
      }

      // Find the game
      const jogo = await JogoModel.findById(jogoId) as JogoWithScores;
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Find the player and their team
      const jogador = await prisma.jogador.findUnique({
        where: { id: jogadorId },
        include: { timeJogadores: true }
      });

      if (!jogador) {
        return ResponseHandler.notFound(res, 'Jogador não encontrado');
      }

      // Check if the player is in one of the teams playing
      const jogadorTime = jogador.timeJogadores.find(tj => 
        tj.timeId === jogo.time1Id || tj.timeId === jogo.time2Id
      );

      if (!jogadorTime) {
        return ResponseHandler.badRequest(res, 'Jogador não pertence a nenhum dos times do jogo');
      }

      // Get current set scores
      const setsTime1 = jogo.setsTime1 ? jogo.setsTime1.split(',').map(Number) : [0, 0, 0];
      const setsTime2 = jogo.setsTime2 ? jogo.setsTime2.split(',').map(Number) : [0, 0, 0];

      // Determine which team scored
      const scoringTeamId = jogadorTime.timeId;
      
      // Increment the score for the current (last) set
      const currentSetIndex = setsTime1.length - 1;
      if (scoringTeamId === jogo.time1Id) {
        setsTime1[currentSetIndex] += 1;
      } else {
        setsTime2[currentSetIndex] += 1;
      }

      // Update the game with new set scores
      const updatedJogo = await JogoModel.atualizarPlacarVolei(jogoId, setsTime1, setsTime2) as UpdatedJogoResponse;

      return ResponseHandler.success(res, {
        message: 'Ponto marcado com sucesso',
        setsTime1: updatedJogo.setsTime1,
        setsTime2: updatedJogo.setsTime2
      });
    } catch (error) {
      console.error('Error in JogosEspecificosController.scoreVoleiPoint:', error);
      return ResponseHandler.error(res, 'Erro ao marcar ponto no jogo de vôlei');
    }
  }

  /**
   * Update all set scores for a volleyball game
   */
  static async updateVoleiSets(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.id);
      const { setsTime1, setsTime2 } = req.body;

      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      // Find the game
      const jogo = await JogoModel.findById(jogoId) as JogoWithScores;
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Update the game with new set scores
      const updatedJogo = await JogoModel.atualizarPlacarVolei(jogoId, setsTime1, setsTime2) as UpdatedJogoResponse;

      return ResponseHandler.success(res, {
        message: 'Sets atualizados com sucesso',
        setsTime1: updatedJogo.setsTime1,
        setsTime2: updatedJogo.setsTime2
      });
    } catch (error) {
      console.error('Error in JogosEspecificosController.updateVoleiSets:', error);
      return ResponseHandler.error(res, 'Erro ao atualizar sets do jogo de vôlei');
    }
  }

  /**
   * Score a point in a table tennis game by providing the player ID who scored
   */
  static async scoreTenisMesaPoint(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.id);
      const { jogadorId } = req.body;

      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      if (!jogadorId) {
        return ResponseHandler.badRequest(res, 'ID do jogador é obrigatório');
      }

      // Find the game
      const jogo = await JogoModel.findById(jogoId) as JogoWithScores;
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Find the player and their team
      const jogador = await prisma.jogador.findUnique({
        where: { id: jogadorId },
        include: { timeJogadores: true }
      });

      if (!jogador) {
        return ResponseHandler.notFound(res, 'Jogador não encontrado');
      }

      // Check if the player is in one of the teams playing
      const jogadorTime = jogador.timeJogadores.find(tj => 
        tj.timeId === jogo.time1Id || tj.timeId === jogo.time2Id
      );

      if (!jogadorTime) {
        return ResponseHandler.badRequest(res, 'Jogador não pertence a nenhum dos times do jogo');
      }

      // Get current game scores
      const gamesTime1 = jogo.gamesTime1 ? jogo.gamesTime1.split(',').map(Number) : [0, 0, 0];
      const gamesTime2 = jogo.gamesTime2 ? jogo.gamesTime2.split(',').map(Number) : [0, 0, 0];

      // Determine which team scored
      const scoringTeamId = jogadorTime.timeId;
      
      // Increment the score for the current (last) game
      const currentGameIndex = gamesTime1.length - 1;
      if (scoringTeamId === jogo.time1Id) {
        gamesTime1[currentGameIndex] += 1;
      } else {
        gamesTime2[currentGameIndex] += 1;
      }

      // Update the game with new game scores
      const updatedJogo = await JogoModel.atualizarPlacarTenisMesa(jogoId, gamesTime1, gamesTime2) as UpdatedJogoResponse;

      return ResponseHandler.success(res, {
        message: 'Ponto marcado com sucesso',
        gamesTime1: updatedJogo.gamesTime1,
        gamesTime2: updatedJogo.gamesTime2
      });
    } catch (error) {
      console.error('Error in JogosEspecificosController.scoreTenisMesaPoint:', error);
      return ResponseHandler.error(res, 'Erro ao marcar ponto no jogo de tênis de mesa');
    }
  }

  /**
   * Update all game scores for a table tennis game
   */
  static async updateTenisMesaGames(req: AuthenticatedRequest, res: Response) {
    try {
      const jogoId = TypeHelpers.toInt(req.params.id);
      const { gamesTime1, gamesTime2 } = req.body;

      if (!jogoId) {
        return ResponseHandler.badRequest(res, 'ID do jogo inválido');
      }

      // Find the game
      const jogo = await JogoModel.findById(jogoId) as JogoWithScores;
      if (!jogo) {
        return ResponseHandler.notFound(res, 'Jogo não encontrado');
      }

      // Update the game with new game scores
      const updatedJogo = await JogoModel.atualizarPlacarTenisMesa(jogoId, gamesTime1, gamesTime2) as UpdatedJogoResponse;

      return ResponseHandler.success(res, {
        message: 'Games atualizados com sucesso',
        gamesTime1: updatedJogo.gamesTime1,
        gamesTime2: updatedJogo.gamesTime2
      });
    } catch (error) {
      console.error('Error in JogosEspecificosController.updateTenisMesaGames:', error);
      return ResponseHandler.error(res, 'Erro ao atualizar games do jogo de tênis de mesa');
    }
  }
}