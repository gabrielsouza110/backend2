export enum AdminType {
  ADMIN_GERAL = 'admin_geral',
  ADMIN_TURMA = 'admin_turma'
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageAllTurmas: boolean;
  canManageAllTimes: boolean;
  canManageAllJogos: boolean;
  canViewStatistics: boolean;
  canManageEdicoes: boolean;
  canManageModalidades: boolean;
  canDeleteRecords: boolean;
}

export const ADMIN_PERMISSIONS: Record<AdminType, AdminPermissions> = {
  [AdminType.ADMIN_GERAL]: {
    canManageUsers: true,
    canManageAllTurmas: true,
    canManageAllTimes: true,
    canManageAllJogos: true,
    canViewStatistics: true,
    canManageEdicoes: true,
    canManageModalidades: true,
    canDeleteRecords: true
  },
  [AdminType.ADMIN_TURMA]: {
    canManageUsers: false,
    canManageAllTurmas: false,
    canManageAllTimes: false,
    canManageAllJogos: false,
    canViewStatistics: true,
    canManageEdicoes: false,
    canManageModalidades: false,
    canDeleteRecords: false
  }
};

export interface UserWithPermissions {
  id: number;
  nome: string;
  email: string;
  tipo: AdminType;
  ativo: boolean;
  permissions: AdminPermissions;
}
