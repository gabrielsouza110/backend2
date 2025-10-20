import { Router } from 'express';
import { JogosEspecificosController } from '../controllers/jogosEspecificosController';
import { authenticateToken } from '../middlewares/auth';
import { requireAnyTurmaAccess } from '../middlewares/turmaAccess';
import { validate } from '../middlewares/validation';
import { 
  jogoIdParamSchema,
  createVoleiGameSchema,
  createTenisMesaGameSchema
} from '../schemas/validationSchemas';

const router = Router();

// Volleyball game routes
router.patch('/:id/volei/score-point',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(jogoIdParamSchema),
  JogosEspecificosController.scoreVoleiPoint
);

router.patch('/:id/volei/update-sets',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(createVoleiGameSchema),
  JogosEspecificosController.updateVoleiSets
);

// Table tennis game routes
router.patch('/:id/tenis-mesa/score-point',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(jogoIdParamSchema),
  JogosEspecificosController.scoreTenisMesaPoint
);

router.patch('/:id/tenis-mesa/update-games',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(createTenisMesaGameSchema),
  JogosEspecificosController.updateTenisMesaGames
);

export default router;