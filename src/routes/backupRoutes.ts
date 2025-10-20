import { Router } from 'express';
import { BackupController } from '../controllers/backupController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';

const router = Router();

// Get backup service status
router.get('/status',
  authenticateToken,
  BackupController.getStatus
);

// Trigger an immediate backup
router.post('/trigger',
  authenticateToken,
  BackupController.triggerBackup
);

// List available backups
router.get('/list',
  authenticateToken,
  BackupController.listBackups
);

// Restore database from backup
router.post('/restore',
  authenticateToken,
  BackupController.restoreBackup
);

export default router;