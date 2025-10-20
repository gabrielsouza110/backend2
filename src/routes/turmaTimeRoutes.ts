import { Router } from 'express';
import { TurmaTimeController } from '../controllers/turmaTimeController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireAdminGeral, requireAnyAdmin } from '../middlewares/permissions';
import {
  assignTurmaToTimeSchema,
  removeTurmaFromTimeSchema,
  turmaIdParamSchema,
  timeIdParamSchema,
  transferTurmasSchema
} from '../schemas/validationSchemas';

const router = Router();

// ===== CLASS-TEAM RELATIONSHIP MANAGEMENT =====

// Assign a class to a team
router.post('/assign',
  authenticateToken,
  requireAdminGeral,
  validate(assignTurmaToTimeSchema),
  TurmaTimeController.assignTurmaToTime
);

// Remove a class from a team
router.post('/remove',
  authenticateToken,
  requireAdminGeral,
  validate(removeTurmaFromTimeSchema),
  TurmaTimeController.removeTurmaFromTime
);

// Get all teams for a specific class
router.get('/class/:turmaId/teams',
  authenticateToken,
  requireAnyAdmin,
  validate(turmaIdParamSchema),
  TurmaTimeController.getTimesByTurma
);

// Get all classes for a specific team
router.get('/team/:timeId/classes',
  authenticateToken,
  requireAnyAdmin,
  validate(timeIdParamSchema),
  TurmaTimeController.getTurmasByTime
);

// Get all classes without any team assignment
router.get('/classes/unassigned',
  authenticateToken,
  requireAdminGeral,
  TurmaTimeController.getUnassignedTurmas
);

// Get all teams with their classes
router.get('/teams/with-classes',
  authenticateToken,
  requireAnyAdmin,
  TurmaTimeController.getAllTimesWithTurmas
);

// Bulk assign multiple classes to a team
router.post('/bulk-assign',
  authenticateToken,
  requireAdminGeral,
  validate(assignTurmaToTimeSchema),
  TurmaTimeController.bulkAssignTurmasToTime
);

// Move all classes from one team to another
router.post('/transfer',
  authenticateToken,
  requireAdminGeral,
  validate(transferTurmasSchema),
  TurmaTimeController.transferTurmasBetweenTimes
);

export default router;