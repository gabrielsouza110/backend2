import { Router } from 'express';
import { EdicoesController } from '../controllers/edicoesController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import {
  createEdicaoSchema,
  updateEdicaoSchema,
  edicaoIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', EdicoesController.getAll);
router.get('/current', EdicoesController.getCurrent);
router.get('/:id', EdicoesController.getById);

// Protected routes
router.post('/',
  authenticateToken,
  validate(createEdicaoSchema),
  EdicoesController.create
);

router.put('/:id',
  authenticateToken,
  validate(updateEdicaoSchema),
  EdicoesController.update
);

router.delete('/:id',
  authenticateToken,
  validate(edicaoIdParamSchema),
  EdicoesController.delete
);

export default router;