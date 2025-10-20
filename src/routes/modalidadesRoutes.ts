import { Router } from 'express';
import { ModalidadesController } from '../controllers/modalidadesController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import {
  createModalidadeSchema,
  updateModalidadeSchema,
  modalidadeIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', ModalidadesController.getAll);
router.get('/:id', ModalidadesController.getById);

// Protected routes
router.post('/',
  authenticateToken,
  validate(createModalidadeSchema),
  ModalidadesController.create
);

router.put('/:id',
  authenticateToken,
  validate(updateModalidadeSchema),
  ModalidadesController.update
);

router.delete('/:id',
  authenticateToken,
  validate(modalidadeIdParamSchema),
  ModalidadesController.delete
);

export default router;