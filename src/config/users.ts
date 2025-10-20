import { AdminType } from '../types/admin';

export interface UserConfig {
  nome: string;
  email: string;
  senha: string;
  tipo: AdminType;
  turmaId?: number;
  ativo?: boolean;
}

// Configuração de usuários para desenvolvimento
export const USERS_CONFIG: UserConfig[] = [
  {
    nome: 'Admin Geral',
    email: 'admin@escola.com',
    senha: 'admin123',
    tipo: AdminType.ADMIN_GERAL,
    ativo: true
  },
  {
    nome: 'Admin Turma A',
    email: 'turma-a@escola.com',
    senha: 'turma123',
    tipo: AdminType.ADMIN_TURMA,
    turmaId: 1, // Assumindo que existe uma turma com ID 1
    ativo: true
  },
  {
    nome: 'Admin Turma B', 
    email: 'turma-b@escola.com',
    senha: 'turma123',
    tipo: AdminType.ADMIN_TURMA,
    turmaId: 2, // Assumindo que existe uma turma com ID 2
    ativo: true
  }
];

// Tipos válidos para validação
export const VALID_USER_TYPES = [
  AdminType.ADMIN_GERAL,
  AdminType.ADMIN_TURMA
] as const;