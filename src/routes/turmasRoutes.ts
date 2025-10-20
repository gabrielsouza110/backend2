import { Router } from 'express';
import { TurmasController } from '../controllers/turmasController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireTurmaAccess } from '../middlewares/turmaAccess';
import {
  createTurmaSchema,
  updateTurmaSchema,
  turmaIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', TurmasController.getAll);
router.get('/:id', TurmasController.getById);

// Protected routes
router.post('/',
  authenticateToken,
  validate(createTurmaSchema),
  TurmasController.create
);

router.put('/:id',
  authenticateToken,
  requireTurmaAccess(),
  validate(updateTurmaSchema),
  TurmasController.update
);

router.delete('/:id',
  authenticateToken,
  requireTurmaAccess(),
  validate(turmaIdParamSchema),
  TurmasController.delete
);

// Routes for managing relationship with teams
router.get('/:id/teams',
  authenticateToken,
  requireTurmaAccess(),
  TurmasController.getTimeForTurma
);

router.post('/:id/assign-teams',
  authenticateToken,
  requireTurmaAccess(),
  TurmasController.assignTimeToTurma
);

router.delete('/:id/remove-teams',
  authenticateToken,
  requireTurmaAccess(),
  TurmasController.removeTimeFromTurma
);

// Route to list players in a turma
router.get('/:id/players',
  authenticateToken,
  requireTurmaAccess(),
  TurmasController.getPlayersByTurma
);

export default router;