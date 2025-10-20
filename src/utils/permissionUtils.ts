import { AdminType, ADMIN_PERMISSIONS, UserWithPermissions } from '../types/admin';
import { ADMIN_HIERARCHY } from '../constants/admin';

export class PermissionUtils {
  /**
   * Verifica se um usuário tem uma permissão específica
   */
  static hasPermission(userType: AdminType, permission: keyof typeof ADMIN_PERMISSIONS[AdminType]): boolean {
    const userPermissions = ADMIN_PERMISSIONS[userType];
    return userPermissions ? userPermissions[permission] : false;
  }

  /**
   * Verifica se um usuário tem pelo menos um nível de hierarquia
   */
  static hasMinHierarchy(userType: AdminType, minLevel: number): boolean {
    const userLevel = ADMIN_HIERARCHY[userType as keyof typeof ADMIN_HIERARCHY] || 1;
    return userLevel >= minLevel;
  }

  /**
   * Verifica se um usuário pode acessar recursos de uma turma específica
   */
  static canAccessTurma(userType: AdminType, userTurmaId?: number, targetTurmaId?: number): boolean {
    // Admin geral pode acessar qualquer turma
    if (userType === AdminType.ADMIN_GERAL) {
      return true;
    }

    // Admin turma só pode acessar sua própria turma
    if (userType === AdminType.ADMIN_TURMA) {
      return userTurmaId === targetTurmaId;
    }

    // Usuário comum não pode acessar turmas
    return false;
  }

  /**
   * Verifica se um usuário pode modificar um recurso
   */
  static canModify(userType: AdminType, resourceOwnerId?: number, userId?: number): boolean {
    // Admin geral pode modificar qualquer coisa
    if (userType === AdminType.ADMIN_GERAL) {
      return true;
    }

    // Admin turma pode modificar recursos da sua turma
    if (userType === AdminType.ADMIN_TURMA) {
      return true; // Assumindo que já foi validado o acesso à turma
    }

    // Usuário comum só pode modificar seus próprios recursos
    return resourceOwnerId === userId;
  }

  /**
   * Retorna todas as permissões de um usuário
   */
  static getUserPermissions(userType: AdminType) {
    return ADMIN_PERMISSIONS[userType as AdminType] || ADMIN_PERMISSIONS[AdminType.ADMIN_TURMA];
  }

  /**
   * Verifica se um tipo de admin é válido
   */
  static isValidAdminType(type: string): type is AdminType {
    return Object.values(AdminType).includes(type as AdminType);
  }

  /**
   * Retorna o nível de hierarquia de um tipo de admin
   */
  static getAdminLevel(userType: AdminType): number {
    return ADMIN_HIERARCHY[userType as keyof typeof ADMIN_HIERARCHY] || 1;
  }

  /**
   * Verifica se um usuário pode ser promovido/rebaixado por outro usuário
   */
  static canChangeUserRole(adminType: AdminType, targetUserType: AdminType): boolean {
    const adminLevel = this.getAdminLevel(adminType);
    const targetLevel = this.getAdminLevel(targetUserType);

    // Só pode alterar usuários de nível igual ou menor
    return adminLevel > targetLevel;
  }

  /**
   * Filtra recursos baseado nas permissões do usuário
   */
  static filterResourcesByPermission<T>(
    resources: T[],
    userType: AdminType,
    permission: keyof typeof ADMIN_PERMISSIONS[AdminType],
    filterFn?: (resource: T) => boolean
  ): T[] {
    if (!this.hasPermission(userType, permission)) {
      return [];
    }

    if (filterFn) {
      return resources.filter(filterFn);
    }

    return resources;
  }
}
