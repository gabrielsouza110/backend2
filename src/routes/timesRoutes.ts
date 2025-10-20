import { Router } from 'express';
import { TimesController } from '../controllers/timesController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireTurmaAccess } from '../middlewares/turmaAccess';
import {
  createTimeSchema,
  updateTimeSchema,
  addJogadorTimeSchema,
  removeJogadorTimeSchema,
  timeIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', TimesController.getAll);
router.get('/:id', TimesController.getById);

// Protected routes
router.post('/',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  validate(createTimeSchema),
  TimesController.create
);

// Update by id
router.put('/:id',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  validate(updateTimeSchema),
  TimesController.update
);

// Delete
router.delete('/:id',
  authenticateToken,
  validate(timeIdParamSchema),
  TimesController.delete
);

router.post('/:id/players',
  authenticateToken,
  validate(addJogadorTimeSchema),
  TimesController.addJogador
);

router.delete('/:id/players/:jogadorId',
  authenticateToken,
  validate(removeJogadorTimeSchema),
  TimesController.removeJogador
);

// Routes for managing relationship with classes
router.get('/:id/classes',
  authenticateToken,
  TimesController.getTurmasForTime
);

// Route to list players of a team
router.get('/:id/players',
  authenticateToken,
  TimesController.getJogadoresByTime
);

router.post('/:id/add-class',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  TimesController.addTurmaToTime
);

router.delete('/:id/remove-class/:turmaId',
  authenticateToken,
  requireTurmaAccess('turmaId'),
  TimesController.removeTurmaFromTime
);

export default router;