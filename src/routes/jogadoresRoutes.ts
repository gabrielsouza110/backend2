import { Router } from 'express';
import { JogadoresController } from '../controllers/jogadoresController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireTurmaAccess } from '../middlewares/turmaAccess';
import {
  createJogadorSchema,
  updateJogadorSchema,
  jogadorIdParamSchema,
  jogadorTurmaIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', JogadoresController.getAll);
router.get('/class/:turmaId', validate(jogadorTurmaIdParamSchema), JogadoresController.getByTurma);
router.get('/team/:timeId', JogadoresController.getByTeam);
router.get('/game/:gameId', JogadoresController.getByGame);
router.get('/:id', JogadoresController.getById);

// Protected routes
router.post('/',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  validate(createJogadorSchema),
  JogadoresController.create
);

router.put('/:id',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  validate(updateJogadorSchema),
  JogadoresController.update
);

router.delete('/:id',
  authenticateToken,
  validate(jogadorIdParamSchema),
  JogadoresController.delete
);

// Modalidade association routes
router.post('/:id/modalities',
  authenticateToken,
  validate(jogadorIdParamSchema),
  JogadoresController.addModalidade
);

router.delete('/:id/modalities/:modalidadeId',
  authenticateToken,
  validate(jogadorIdParamSchema),
  JogadoresController.removeModalidade
);

export default router;