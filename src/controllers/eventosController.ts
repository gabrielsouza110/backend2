import { Request, Response } from 'express';
import { JogoModel } from '../models/jogoModel';
import { GameTimeHelper } from '../utils/gameTimeHelper';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';

export class EventosController {
    /**
     * Adiciona um evento ao jogo com cálculo automático de minutagem
     */
    static async adicionarEvento(req: Request, res: Response) {
        try {
            const { jogoId } = req.params;
            const {
                tipo,
                jogadorId,
                timeId,
                descricao,
                jogadorSubstituidoId,
                minuto, // Opcional - será calculado se não fornecido
                eventTime // Opcional - timestamp do evento
            } = req.body;

            // Validações básicas
            if (!tipo || !jogadorId || !timeId) {
                return ResponseHandler.badRequest(res, 'Tipo, jogadorId e timeId são obrigatórios');
            }

            const gameId = parseInt(jogoId);
            if (isNaN(gameId)) {
                return ResponseHandler.badRequest(res, 'ID do jogo inválido');
            }

            // Adicionar evento (com cálculo automático de minutagem se necessário)
            const evento = await JogoModel.adicionarEvento(gameId, {
                tipo,
                jogadorId: parseInt(jogadorId),
                timeId: parseInt(timeId),
                descricao,
                jogadorSubstituidoId: jogadorSubstituidoId ? parseInt(jogadorSubstituidoId) : undefined,
                minuto: minuto ? parseInt(minuto) : undefined,
                eventTime: eventTime ? new Date(eventTime) : undefined
            });

            // Obter informações de tempo do jogo para resposta
            const gameTimeInfo = await JogoModel.getGameTimeInfo(gameId);

            return ResponseHandler.success(res, {
                evento,
                gameTimeInfo: {
                    currentMinute: gameTimeInfo.elapsedMinutes,
                    formattedTime: GameTimeHelper.formatGameTime(gameTimeInfo.elapsedMinutes),
                    gameStatus: gameTimeInfo.gameStatus,
                    isOvertime: gameTimeInfo.isOvertime
                }
            });

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                jogoId: req.params.jogoId,
                body: req.body
            }, 'Error adding event to game');

            if (error instanceof Error) {
                return ResponseHandler.badRequest(res, error.message);
            }

            return ResponseHandler.error(res, 'Erro interno do servidor');
        }
    }

    /**
     * Adiciona evento com método simplificado (sempre calcula minutagem automaticamente)
     */
    static async adicionarEventoAutomatico(req: Request, res: Response) {
        try {
            const { jogoId } = req.params;
            const { tipo, jogadorId, timeId, descricao } = req.body;

            // Validações básicas
            if (!tipo || !jogadorId || !timeId) {
                return ResponseHandler.badRequest(res, 'Tipo, jogadorId e timeId são obrigatórios');
            }

            const gameId = parseInt(jogoId);
            if (isNaN(gameId)) {
                return ResponseHandler.badRequest(res, 'ID do jogo inválido');
            }

            // Adicionar evento com cálculo automático
            const evento = await JogoModel.adicionarEventoAutomatico(
                gameId,
                tipo,
                parseInt(jogadorId),
                parseInt(timeId),
                descricao
            );

            // Obter informações de tempo do jogo
            const gameTimeInfo = await JogoModel.getGameTimeInfo(gameId);

            return ResponseHandler.success(res, {
                evento,
                gameTimeInfo: {
                    currentMinute: gameTimeInfo.elapsedMinutes,
                    formattedTime: GameTimeHelper.formatGameTime(gameTimeInfo.elapsedMinutes),
                    gameStatus: gameTimeInfo.gameStatus,
                    isOvertime: gameTimeInfo.isOvertime
                }
            });

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                jogoId: req.params.jogoId,
                body: req.body
            }, 'Error adding automatic event to game');

            if (error instanceof Error) {
                return ResponseHandler.badRequest(res, error.message);
            }

            return ResponseHandler.error(res, 'Erro interno do servidor');
        }
    }

    /**
     * Obtém informações de tempo do jogo
     */
    static async getGameTimeInfo(req: Request, res: Response) {
        try {
            const { jogoId } = req.params;
            const gameId = parseInt(jogoId);

            if (isNaN(gameId)) {
                return ResponseHandler.badRequest(res, 'ID do jogo inválido');
            }

            const gameTimeInfo = await JogoModel.getGameTimeInfo(gameId);

            return ResponseHandler.success(res, {
                gameId,
                currentMinute: gameTimeInfo.elapsedMinutes,
                formattedTime: GameTimeHelper.formatGameTime(gameTimeInfo.elapsedMinutes),
                gameStatus: gameTimeInfo.gameStatus,
                isGameActive: gameTimeInfo.isGameActive,
                isOvertime: gameTimeInfo.isOvertime,
                totalDuration: gameTimeInfo.totalDuration,
                expectedEndTime: gameTimeInfo.expectedEndTime,
                gameStartTime: gameTimeInfo.gameStartTime
            });

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                jogoId: req.params.jogoId
            }, 'Error getting game time info');

            if (error instanceof Error) {
                return ResponseHandler.badRequest(res, error.message);
            }

            return ResponseHandler.error(res, 'Erro interno do servidor');
        }
    }

    /**
     * Lista eventos de um jogo com informações de tempo
     */
    static async listarEventos(req: Request, res: Response) {
        try {
            const { jogoId } = req.params;
            const gameId = parseInt(jogoId);

            if (isNaN(gameId)) {
                return ResponseHandler.badRequest(res, 'ID do jogo inválido');
            }

            // Obter eventos do jogo
            const eventos = await JogoModel.getEventos(gameId);

            // Obter informações de tempo do jogo
            const gameTimeInfo = await JogoModel.getGameTimeInfo(gameId);

            // Enriquecer eventos com informações de tempo formatadas
            const eventosEnriquecidos = await Promise.all(eventos.map(async evento => ({
                ...evento,
                minutoFormatado: GameTimeHelper.formatGameTime(evento.minuto),
                timestampEstimado: GameTimeHelper.minuteToTimestamp(gameTimeInfo.gameStartTime, evento.minuto)
            })));

            return ResponseHandler.success(res, {
                eventos: eventosEnriquecidos,
                gameTimeInfo: {
                    currentMinute: gameTimeInfo.elapsedMinutes,
                    formattedTime: GameTimeHelper.formatGameTime(gameTimeInfo.elapsedMinutes),
                    gameStatus: gameTimeInfo.gameStatus,
                    isGameActive: gameTimeInfo.isGameActive,
                    totalEvents: eventos.length
                }
            });

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                jogoId: req.params.jogoId
            }, 'Error listing game events');

            if (error instanceof Error) {
                return ResponseHandler.badRequest(res, error.message);
            }

            return ResponseHandler.error(res, 'Erro interno do servidor');
        }
    }

    /**
     * Valida um minuto informado manualmente
     */
    static async validarMinuto(req: Request, res: Response) {
        try {
            const { jogoId } = req.params;
            const { minuto } = req.body;

            const gameId = parseInt(jogoId);
            if (isNaN(gameId) || isNaN(minuto)) {
                return ResponseHandler.badRequest(res, 'ID do jogo e minuto devem ser números válidos');
            }

            // Obter informações do jogo
            const jogo = await JogoModel.findById(gameId);
            if (!jogo) {
                return ResponseHandler.notFound(res, 'Jogo não encontrado');
            }

            // Validar minuto
            const validation = await GameTimeHelper.validateManualMinute(
                gameId,
                jogo.dataHora,
                minuto,
                jogo.status
            );

            return ResponseHandler.success(res, {
                validation,
                suggestions: {
                    autoCalculatedMinute: validation.autoCalculatedMinute,
                    formattedAutoTime: GameTimeHelper.formatGameTime(validation.autoCalculatedMinute),
                    formattedManualTime: GameTimeHelper.formatGameTime(minuto)
                }
            });

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                jogoId: req.params.jogoId,
                body: req.body
            }, 'Error validating minute');

            if (error instanceof Error) {
                return ResponseHandler.badRequest(res, error.message);
            }

            return ResponseHandler.error(res, 'Erro interno do servidor');
        }
    }
}
