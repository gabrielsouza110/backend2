import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminGeral } from '../middlewares/permissions';

const router = Router();

// All routes require authentication and general admin permission
router.use(authenticateToken);
router.use(requireAdminGeral);

// ===== USER MANAGEMENT ROUTES =====

// List all users
router.get('/users', AdminController.listUsers);

// User statistics
router.get('/users/stats', AdminController.getUserStats);

export default router;