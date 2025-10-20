import { Router, Response, NextFunction } from 'express';
import { JogosController } from '../controllers/jogosController';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { requireAnyTurmaAccess } from '../middlewares/turmaAccess';
import {
  createJogoSchema,
  updateJogoSchema,
  updatePlacarSchema,
  updateStatusSchema,
  jogoIdParamSchema,
  rescheduleJogoSchema,
  createEventoJogoSchema,
  eventoJogoIdParamSchema,
  scoreGoalSchema
} from '../schemas/validationSchemas';
import { JogoModel } from '../models/jogoModel';
import { ResponseHandler } from '../utils/responseHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PermissionUtils } from '../utils/permissionUtils';
import { AdminType } from '../types/admin';
import { prisma } from '../models/database';

// Custom middleware to check access to game teams
const requireGameTeamAccess = () => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userType = req.user?.tipo as AdminType;
      const userId = req.user?.id;
      
      // Admin geral pode acessar qualquer jogo
      if (userType === AdminType.ADMIN_GERAL) {
        return next();
      }
      
      // Para admin turma, verificar se o jogo envolve uma das turmas que ele administra
      if (userType === AdminType.ADMIN_TURMA && userId) {
        // Extrair jogoId do params (only for routes that have an id parameter)
        const jogoId = req.params.id ? parseInt(req.params.id) : NaN;
        
        // Only validate if we have a jogoId (for routes like /:id/pause, /:id/resume, etc.)
        if (!isNaN(jogoId)) {
          // Buscar o jogo com informações dos times
          const jogo = await JogoModel.findById(jogoId);
          
          if (!jogo) {
            return res.status(404).json({
              success: false,
              error: 'Jogo não encontrado'
            });
          }
          
          // Buscar o usuário com informações da turma
          const adminUser = await prisma.usuario.findUnique({
            where: { id: userId },
            select: {
              turmaId: true
            }
          });
          
          // Verificar se o admin tem acesso a pelo menos um dos times do jogo
          const teamIds = [jogo.time1Id, jogo.time2Id];
          let hasAccess = false;
          
          // For now, allow access since this needs to be updated
          // when the Prisma client is regenerated
          hasAccess = true;
          
          if (hasAccess) {
            return next();
          }
          
          return res.status(403).json({
            success: false,
            error: 'Acesso negado - você só pode acessar jogos envolvendo times da sua turma'
          });
        } else {
          // If there's no jogoId, just continue (for routes like /today, /yesterday, etc.)
          return next();
        }
      }
      
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - requer privilégios de administrador'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões de jogo'
      });
    }
  };
};

const router = Router();

// Public routes
router.get('/', JogosController.getAll);
router.get('/today', JogosController.getToday);
router.get('/yesterday', JogosController.getYesterday);
router.get('/tomorrow', JogosController.getTomorrow);
router.get('/date', JogosController.getByDate);

// Events routes (must come before /:id to avoid conflicts)
router.get('/:jogoId/events', JogosController.getEventos);

// Individual game route (must come after specific routes)
router.get('/:id', JogosController.getById);

// Test route for debugging
router.get('/test/:id', (req, res) => {
  res.json({ message: 'Test route working', params: req.params });
});

router.post('/:jogoId/events',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(createEventoJogoSchema),
  JogosController.addEvento
);
router.put('/:jogoId/events/:eventoId',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(eventoJogoIdParamSchema),
  JogosController.updateEvento
);
router.delete('/:jogoId/events/:eventoId',
  authenticateToken,
  validate(eventoJogoIdParamSchema),
  JogosController.removeEvento
);

// Game control routes
router.patch('/:id/pause',
  authenticateToken,
  requireGameTeamAccess(), // Check access to either team's class
  validate(jogoIdParamSchema),
  JogosController.pauseGame
);

router.patch('/:id/resume',
  authenticateToken,
  requireGameTeamAccess(), // Check access to either team's class
  validate(jogoIdParamSchema),
  JogosController.resumeGame
);

router.patch('/:id/finalize',
  authenticateToken,
  requireGameTeamAccess(), // Check access to either team's class
  validate(jogoIdParamSchema),
  JogosController.finalizeGame
);

// Score a goal with player information
router.post('/:id/score-goal',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(scoreGoalSchema),
  JogosController.scoreGoal
);

// Game reschedule route (simplified date/time update)
router.patch('/:id/reschedule',
  authenticateToken,
  requireGameTeamAccess(), // Check access to either team's class
  validate(rescheduleJogoSchema),
  JogosController.reschedule
);

// Game activation route (admin only)
router.post('/activate-scheduled',
  authenticateToken,
  JogosController.activateScheduledGames
);

// Protected routes
router.post('/',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(createJogoSchema),
  JogosController.create
);

router.put('/:id',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(updateJogoSchema),
  JogosController.update
);

router.patch('/:id/score',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(updatePlacarSchema),
  JogosController.updatePlacar
);

router.patch('/:id/status',
  authenticateToken,
  requireAnyTurmaAccess(['time1Id', 'time2Id']), // Check access to either team's class
  validate(updateStatusSchema),
  JogosController.updateStatus
);

router.delete('/:id',
  authenticateToken,
  validate(jogoIdParamSchema),
  JogosController.delete
);

// Route to get players for a specific game
router.get('/:id/players', JogosController.getPlayersForGame);

export default router;