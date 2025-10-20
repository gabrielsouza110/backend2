import { Router } from 'express';
import { EventosController } from '../controllers/eventosController';

const router = Router();

// POST /api/eventos/:jogoId - Adicionar evento (com cálculo automático opcional)
router.post('/:jogoId', EventosController.adicionarEvento);

// POST /api/eventos/:jogoId/auto - Adicionar evento com cálculo automático obrigatório
router.post('/:jogoId/auto', EventosController.adicionarEventoAutomatico);

// GET /api/eventos/:jogoId - Listar eventos do jogo
router.get('/:jogoId', EventosController.listarEventos);

// GET /api/eventos/:jogoId/time - Obter informações de tempo do jogo
router.get('/:jogoId/time', EventosController.getGameTimeInfo);

// POST /api/eventos/:jogoId/validate-minute - Validar minuto informado manualmente
router.post('/:jogoId/validate-minute', EventosController.validarMinuto);

export default router;