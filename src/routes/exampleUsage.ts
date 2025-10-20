import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { 
  requireAdminGeral, 
  requireAdminTurma, 
  requireAnyAdmin,
  canManageUsers,
  canManageAllTurmas,
  canDeleteRecords,
  canManageAllJogos
} from '../middlewares/permissions';
import { 
  createUserSchema,
  createTimeSchema,
  createJogoSchema,
  updatePlacarSchema,
  createTurmaSchema
} from '../schemas/validationSchemas';

const router = Router();

// ===== EXEMPLOS DE USO DOS MIDDLEWARES DE PERMISSÃO + VALIDAÇÃO ZOD =====

// 1. Rota que só admin geral pode acessar + validação de dados
router.post('/usuarios', 
  authenticateToken, 
  requireAdminGeral,
  validate(createUserSchema),  // ← Validação Zod
  (req, res) => res.json({ message: 'Criar usuário' })
);

// 2. Rota que admin turma pode acessar + validação de dados
router.post('/times', 
  authenticateToken, 
  requireAdminTurma,
  validate(createTimeSchema),  // ← Validação Zod
  (req, res) => res.json({ message: 'Criar time' })
);

// 3. Rota que qualquer admin pode acessar + validação de dados
router.post('/jogos', 
  authenticateToken, 
  requireAnyAdmin,
  validate(createJogoSchema),  // ← Validação Zod
  (req, res) => res.json({ message: 'Criar jogo' })
);

// 4. Rota baseada em permissão específica + validação
router.patch('/jogos/:id/placar', 
  authenticateToken, 
  canManageAllJogos,
  validate(updatePlacarSchema),  // ← Validação Zod
  (req, res) => res.json({ message: 'Atualizar placar' })
);

// 5. Rota com múltiplas validações
router.put('/turmas/:id', 
  authenticateToken, 
  canManageAllTurmas,
  validate(createTurmaSchema),  // ← Validação Zod
  (req, res) => res.json({ message: 'Atualizar turma' })
);

// 6. Rota que requer permissão de exclusão (sem validação de body)
router.delete('/jogos/:id', 
  authenticateToken, 
  canDeleteRecords,
  (req, res) => res.json({ message: 'Deletar jogo' })
);

// ===== FLUXO COMPLETO DE VALIDAÇÃO =====

// Ordem correta dos middlewares:
// 1. authenticateToken - Verifica se o usuário está logado
// 2. requireAdminGeral/requireAdminTurma/etc - Verifica permissões
// 3. validate(schema) - Valida os dados enviados
// 4. Controller - Executa a lógica de negócio

// ===== HIERARQUIA DE PERMISSÕES =====

// Admin Geral (Nível 3) - Acesso total
// ├── Gerenciar usuários
// ├── Gerenciar todas as turmas
// ├── Gerenciar todos os times
// ├── Gerenciar todos os jogos
// ├── Ver estatísticas
// ├── Gerenciar edições
// ├── Gerenciar modalidades
// └── Deletar registros

// Admin Turma (Nível 2) - Acesso limitado
// ├── ❌ Gerenciar usuários
// ├── ❌ Gerenciar todas as turmas
// ├── ✅ Gerenciar times da sua turma
// ├── ✅ Gerenciar jogos da sua turma
// ├── ✅ Ver estatísticas
// ├── ❌ Gerenciar edições
// ├── ❌ Gerenciar modalidades
// └── ❌ Deletar registros

// Usuário (Nível 1) - Acesso básico
// ├── ❌ Gerenciar usuários
// ├── ❌ Gerenciar turmas
// ├── ❌ Gerenciar times
// ├── ❌ Gerenciar jogos
// ├── ❌ Ver estatísticas
// ├── ❌ Gerenciar edições
// ├── ❌ Gerenciar modalidades
// └── ❌ Deletar registros

export default router;
