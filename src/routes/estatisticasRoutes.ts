import { Router } from 'express';
import { EstatisticasController } from '../controllers/estatisticasController';
import { validate } from '../middlewares/validation';
import { estatisticaModalidadeIdParamSchema } from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/ranking/:modalidadeId',
  validate(estatisticaModalidadeIdParamSchema),
  EstatisticasController.getClassificacao
);

router.get('/top-scorers/:modalidadeId',
  validate(estatisticaModalidadeIdParamSchema),
  EstatisticasController.getArtilheiros
);

// Player and team statistics routes (English)
router.get('/player/:playerId',
  EstatisticasController.getEstatisticasJogador
);

router.get('/team/:teamId',
  EstatisticasController.getEstatisticasTime
);

// Legacy routes (Portuguese) - for backward compatibility
router.get('/jogador/:jogadorId',
  EstatisticasController.getEstatisticasJogador
);

router.get('/time/:timeId',
  EstatisticasController.getEstatisticasTime
);

// Dashboard routes
router.get('/dashboard/summary',
  EstatisticasController.getDashboardSummary
);

router.get('/dashboard/top-scorers',
  EstatisticasController.getDashboardTopScorers
);

router.get('/dashboard/chart-data',
  EstatisticasController.getDashboardChartData
);

export default router;