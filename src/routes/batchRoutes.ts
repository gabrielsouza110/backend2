import { Router } from 'express';
import { BatchController } from '../controllers/batchController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Batch processing endpoint
router.post('/',
  authenticateToken,
  BatchController.processBatch
);

export default router;