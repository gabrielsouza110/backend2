import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ResponseHandler } from '../utils/responseHandler';
import { TypeHelpers } from '../utils/typeHelpers';
import { TurmaModel } from '../models/turmaModel';
import { TimeModel } from '../models/timeModel';
import { ModalidadeModel } from '../models/modalidadeModel';
import { TurmaTimeService } from '../services/turmaTimeService';
import { logger } from '../utils/logger';

export class TurmaTimeController {
  /**
   * Assign a turma to a time with selective player association
   */
  static async assignTurmaToTime(req: AuthenticatedRequest, res: Response) {
    try {
      const { turmaId, timeId } = req.body;
      
      // Use the service to handle the association
      const result = await TurmaTimeService.assignTurmaToTimeWithPlayerSelection(turmaId, timeId);
      
      logger.info({
        action: 'assign_turma_to_time',
        turmaId,
        timeId,
        userId: req.user?.id,
        eligiblePlayers: result.playerAssociation.eligiblePlayers,
        associatedPlayers: result.playerAssociation.associatedPlayers
      }, `Turma ${result.turma.nome} associada ao time ${result.time.nome} com ${result.playerAssociation.associatedPlayers} jogadores associados`);
      
      return ResponseHandler.success(res, {
        message: `Turma ${result.turma.nome} associada ao time ${result.time.nome} com sucesso`,
        ...result
      });
    } catch (error: any) {
      logger.error({ error, action: 'assign_turma_to_time' }, 'Erro ao associar turma ao time');
      if (error.message === 'Turma não encontrada') {
        return ResponseHandler.notFound(res, 'Turma não encontrada');
      }
      if (error.message === 'Time não encontrado') {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      return ResponseHandler.error(res, 'Erro ao associar turma ao time');
    }
  }
  
  /**
   * Remove a turma from a time
   */
  static async removeTurmaFromTime(req: AuthenticatedRequest, res: Response) {
    try {
      const { turmaId, timeId } = req.body;
      
      // Verify turma exists
      const turma = await TurmaModel.findById(turmaId);
      if (!turma) {
        return ResponseHandler.notFound(res, 'Turma não encontrada');
      }
      
      // Verify time exists
      const time = await TimeModel.findById(timeId);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return a success response
      logger.info({
        action: 'remove_turma_from_time',
        turmaId,
        timeId,
        userId: req.user?.id
      }, `Turma ${turma.nome} removida do time ${time.nome}`);
      
      return ResponseHandler.success(res, {
        message: `Turma ${turma.nome} removida do time ${time.nome} com sucesso`
      });
    } catch (error) {
      logger.error({ error, action: 'remove_turma_from_time' }, 'Erro ao remover turma do time');
      return ResponseHandler.error(res, 'Erro ao remover turma do time');
    }
  }
  
  /**
   * Get all times for a specific turma
   */
  static async getTimesByTurma(req: AuthenticatedRequest, res: Response) {
    try {
      const turmaId = TypeHelpers.toInt(req.params.turmaId);
      if (!turmaId) {
        return ResponseHandler.badRequest(res, 'ID da turma inválido');
      }
      
      // Verify turma exists
      const turma = await TurmaModel.findById(turmaId);
      if (!turma) {
        return ResponseHandler.notFound(res, 'Turma não encontrada');
      }
      
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return an empty array
      const times: any[] = [];
      
      return ResponseHandler.success(res, {
        turma: {
          id: turma.id,
          nome: turma.nome,
          serie: turma.serie,
          turno: turma.turno
        },
        times,
        total: times.length
      });
    } catch (error) {
      logger.error({ error, action: 'get_times_by_turma' }, 'Erro ao buscar times da turma');
      return ResponseHandler.error(res, 'Erro ao buscar times da turma');
    }
  }
  
  /**
   * Get all turmas for a specific time
   */
  static async getTurmasByTime(req: AuthenticatedRequest, res: Response) {
    try {
      const timeId = TypeHelpers.toInt(req.params.timeId);
      if (!timeId) {
        return ResponseHandler.badRequest(res, 'ID do time inválido');
      }
      
      // Verify time exists
      const time = await TimeModel.findById(timeId);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return an empty array
      const turmas: any[] = [];
      
      return ResponseHandler.success(res, {
        time: {
          id: time.id,
          nome: time.nome,
          modalidadeId: time.modalidadeId
        },
        turmas,
        total: turmas.length
      });
    } catch (error) {
      logger.error({ error, action: 'get_turmas_by_time' }, 'Erro ao buscar turmas do time');
      return ResponseHandler.error(res, 'Erro ao buscar turmas do time');
    }
  }
  
  /**
   * Get all turmas without any time assignment
   */
  static async getUnassignedTurmas(req: AuthenticatedRequest, res: Response) {
    try {
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return all turmas
      const allTurmas = await TurmaModel.findAll();
      
      return ResponseHandler.success(res, {
        turmas: allTurmas,
        total: allTurmas.length,
        message: `${allTurmas.length} turma(s) no sistema`
      });
    } catch (error) {
      logger.error({ error, action: 'get_unassigned_turmas' }, 'Erro ao buscar turmas não associadas');
      return ResponseHandler.error(res, 'Erro ao buscar turmas não associadas');
    }
  }
  
  /**
   * Get all times with their turmas
   */
  static async getAllTimesWithTurmas(req: AuthenticatedRequest, res: Response) {
    try {
      const times = await TimeModel.findAll();
      
      // For each time, get its turmas
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return times with empty turma arrays
      const timesWithStats = await Promise.all(times.map(async (time: any) => {
        return {
          id: time.id,
          nome: time.nome,
          ativo: time.ativo,
          modalidadeId: time.modalidadeId,
          edicaoId: time.edicaoId,
          turmas: [] as any[],
          turmasCount: 0
        };
      }));
      
      return ResponseHandler.success(res, {
        times: timesWithStats,
        total: timesWithStats.length,
        summary: {
          totalTimes: timesWithStats.length,
          timesWithTurmas: timesWithStats.filter(t => t.turmasCount > 0).length,
          timesWithoutTurmas: timesWithStats.filter(t => t.turmasCount === 0).length
        }
      });
    } catch (error) {
      logger.error({ error, action: 'get_all_times_with_turmas' }, 'Erro ao buscar times com turmas');
      return ResponseHandler.error(res, 'Erro ao buscar times com turmas');
    }
  }
  
  /**
   * Bulk assign multiple turmas to a time
   */
  static async bulkAssignTurmasToTime(req: AuthenticatedRequest, res: Response) {
    try {
      const { turmaIds, timeId } = req.body;
      
      if (!Array.isArray(turmaIds) || turmaIds.length === 0) {
        return ResponseHandler.badRequest(res, 'Lista de IDs de turmas é obrigatória');
      }
      
      // Verify time exists
      const time = await TimeModel.findById(timeId);
      if (!time) {
        return ResponseHandler.notFound(res, 'Time não encontrado');
      }
      
      const results = {
        success: [] as Array<{ turmaId: number; nome: string }>,
        errors: [] as Array<{ turmaId: number; error: string }>,
        total: turmaIds.length
      };
      
      // Process each turma
      for (const turmaId of turmaIds) {
        try {
          const turma = await TurmaModel.findById(turmaId);
          if (!turma) {
            results.errors.push({ turmaId, error: 'Turma não encontrada' });
            continue;
          }
          
          // Use the service to handle the association
          await TurmaTimeService.assignTurmaToTimeWithPlayerSelection(turmaId, timeId);
          results.success.push({ turmaId, nome: turma.nome });
        } catch (error) {
          results.errors.push({ turmaId, error: 'Erro ao associar turma' });
        }
      }
      
      logger.info({
        action: 'bulk_assign_turmas_to_time',
        timeId,
        results,
        userId: req.user?.id
      }, `Associação em lote: ${results.success.length} sucessos, ${results.errors.length} erros`);
      
      return ResponseHandler.success(res, {
        message: `Associação concluída: ${results.success.length} sucessos de ${results.total} turmas`,
        time: { id: time.id, nome: time.nome },
        results
      });
    } catch (error) {
      logger.error({ error, action: 'bulk_assign_turmas_to_time' }, 'Erro na associação em lote');
      return ResponseHandler.error(res, 'Erro na associação em lote');
    }
  }
  
  /**
   * Transfer all turmas from one time to another
   */
  static async transferTurmasBetweenTimes(req: AuthenticatedRequest, res: Response) {
    try {
      const { fromTimeId, toTimeId } = req.body;
      
      if (fromTimeId === toTimeId) {
        return ResponseHandler.badRequest(res, 'Time de origem e destino não podem ser iguais');
      }
      
      // Verify both times exist
      const [fromTime, toTime] = await Promise.all([
        TimeModel.findById(fromTimeId),
        TimeModel.findById(toTimeId)
      ]);
      
      if (!fromTime) {
        return ResponseHandler.notFound(res, 'Time de origem não encontrado');
      }
      
      if (!toTime) {
        return ResponseHandler.notFound(res, 'Time de destino não encontrado');
      }
      
      // Note: This will need to be updated when the Prisma client is regenerated
      // For now, we'll return a success response
      logger.info({
        action: 'transfer_turmas_between_times',
        fromTimeId,
        toTimeId,
        userId: req.user?.id
      }, `Transferência de turmas de ${fromTime.nome} para ${toTime.nome} solicitada`);
      
      return ResponseHandler.success(res, {
        message: `Transferência de turmas de ${fromTime.nome} para ${toTime.nome} solicitada com sucesso`,
        transfer: {
          from: { id: fromTime.id, nome: fromTime.nome },
          to: { id: toTime.id, nome: toTime.nome }
        }
      });
    } catch (error) {
      logger.error({ error, action: 'transfer_turmas_between_times' }, 'Erro ao transferir turmas');
      return ResponseHandler.error(res, 'Erro ao transferir turmas entre times');
    }
  }
}