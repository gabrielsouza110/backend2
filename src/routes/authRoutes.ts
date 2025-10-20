import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { loginSchema, createUserSchema, updateUsuarioSchema, usuarioIdParamSchema } from '../schemas/validationSchemas';
import { requireAnyAdmin } from '../middlewares/permissions';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), AuthController.login);

// Protected routes for administrators (user registration, update and deletion)
router.post('/register',
  authenticateToken,
  requireAnyAdmin,
  validate(createUserSchema),
  AuthController.register
);

router.put('/users/:id',
  authenticateToken,
  requireAnyAdmin,
  validate(updateUsuarioSchema),
  AuthController.update
);

router.delete('/users/:id',
  authenticateToken,
  requireAnyAdmin,
  validate(usuarioIdParamSchema),
  AuthController.delete
);

// Protected routes for token verification and permissions
router.get('/verify', authenticateToken, AuthController.verifyToken);
router.get('/permissions', authenticateToken, AuthController.getPermissions);

export default router;