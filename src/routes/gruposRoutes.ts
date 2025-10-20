import { Router } from 'express';
import { GruposController } from '../controllers/gruposController';

const router = Router();

// Group management routes
router.get('/', GruposController.listarGrupos);
router.get('/table', GruposController.obterTabelaGrupo);
router.get('/qualified', GruposController.obterClassificados);
router.put('/teams/:timeId/group', GruposController.atualizarGrupoTime);

// Automatic game generation routes
router.post('/games/generate-group-stage', GruposController.gerarJogosFaseGrupos);
router.post('/games/generate-semifinals', GruposController.gerarSemifinais);
router.post('/games/generate-semifinals-manual', GruposController.gerarSemifinaisManual);
router.post('/games/generate-final', GruposController.gerarFinal);
router.post('/games/generate-all', GruposController.gerarTodosJogos);

export default router;