export const ADMIN_ROLES = {
  ADMIN_GERAL: 'admin_geral',
  ADMIN_TURMA: 'admin_turma'
} as const;

export const ADMIN_DESCRIPTIONS = {
  [ADMIN_ROLES.ADMIN_GERAL]: 'Administrador Geral - Acesso completo ao sistema',
  [ADMIN_ROLES.ADMIN_TURMA]: 'Administrador de Turma - Gerencia turmas e times'
} as const;

export const ADMIN_HIERARCHY = {
  [ADMIN_ROLES.ADMIN_GERAL]: 2, // Nível mais alto
  [ADMIN_ROLES.ADMIN_TURMA]: 1  // Nível básico
} as const;

export const ADMIN_COLORS = {
  [ADMIN_ROLES.ADMIN_GERAL]: '#dc2626', // Vermelho
  [ADMIN_ROLES.ADMIN_TURMA]: '#ea580c'  // Laranja
} as const;

export const ADMIN_ICONS = {
  [ADMIN_ROLES.ADMIN_GERAL]: '👑',
  [ADMIN_ROLES.ADMIN_TURMA]: '⚽'
} as const;

export const VALID_ADMIN_TYPES = Object.values(ADMIN_ROLES);
