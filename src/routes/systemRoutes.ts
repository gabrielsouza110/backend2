import { Router } from 'express';
import { SystemController } from '../controllers/systemController';
import { authenticateToken } from '../middlewares/auth';
import { requireAdminGeral } from '../middlewares/permissions';

const router = Router();

// Public routes
router.get('/info', SystemController.getSystemInfo);
router.get('/time-periods', SystemController.getTimePeriods);
router.get('/game-states', SystemController.getGameStates);

// Admin-only routes
router.get('/cache/stats', 
  authenticateToken, 
  requireAdminGeral, 
  SystemController.getCacheStats
);

router.post('/cache/clear', 
  authenticateToken, 
  requireAdminGeral, 
  SystemController.clearCache
);

router.get('/scheduler/info', 
  authenticateToken, 
  requireAdminGeral, 
  SystemController.getSmartSchedulerInfo
);

router.post('/scheduler/force-activation', 
  authenticateToken, 
  requireAdminGeral, 
  SystemController.forceGameActivation
);

export default router;