import { Router } from 'express';
import { UsuariosController } from '../controllers/usuariosController';
import { authenticateToken, requireAdminGeral } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireAnyAdmin } from '../middlewares/permissions';
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  usuarioIdParamSchema
} from '../schemas/validationSchemas';

const router = Router();

// Public routes
router.get('/', UsuariosController.getAll);
router.get('/admins/class/:turmaId', UsuariosController.getAdminsByTurma);
router.get('/:id', UsuariosController.getById);

// Administrative routes (require admin authentication)
router.get('/admin/all',
  authenticateToken,
  requireAdminGeral,
  UsuariosController.getAllAdmin
);

// Protected routes (require admin authentication)
router.post('/',
  authenticateToken,
  requireAnyAdmin,
  validate(createUsuarioSchema),
  UsuariosController.create
);

router.put('/:id',
  authenticateToken,
  requireAnyAdmin,
  validate(updateUsuarioSchema),
  UsuariosController.update
);

router.delete('/:id',
  authenticateToken,
  requireAnyAdmin,
  validate(usuarioIdParamSchema),
  UsuariosController.delete
);

export default router;