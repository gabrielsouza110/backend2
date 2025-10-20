import { prisma } from './database';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

export class UsuarioModel {
  /**
   * Busca todos os usuários (dados simplificados)
   * @returns Lista de usuários
   */
  static async findAll() {
    return await prisma.usuario.findMany();
  }

  /**
   * Busca todos os usuários (versão pública - sem informações sensíveis)
   * @returns Lista de usuários com informações seguras
   */
  static async findAllPublic() {
    return await prisma.usuario.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        tipo: true,
        ativo: true
      }
    });
  }

  /**
   * Busca todos os usuários (versão para administradores - com todas as informações)
   * @returns Lista completa de usuários
   */
  static async findAllAdmin() {
    return await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        tipo: true,
        ativo: true,
        ultimoLogin: true,
        criadoEm: true,
        atualizadoEm: true,
        turmaId: true
      }
    });
  }
  static readonly TIPOS = {
    ADMIN_TURMA: 'admin_turma',
    ADMIN_GERAL: 'admin_geral'
  };

  /**
   * Busca um usuário pelo ID (dados simplificados)
   * @param id ID do usuário
   * @returns Usuário encontrado ou null
   */
  static async findById(id: number) {
    return await prisma.usuario.findUnique({
      where: { id }
    });
  }

  /**
   * Busca um usuário pelo email
   * @param email Email do usuário
   * @returns Usuário encontrado ou null
   */
  static async findByEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email }
    });
  }

  /**
   * Busca um usuário pelo email com a senha incluída
   * @param email Email do usuário
   * @returns Usuário encontrado ou null
   */
  static async findByEmailWithPassword(email: string) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        select: {
          id: true,
          nome: true,
          email: true,
          senha: true,
          tipo: true,
          ativo: true,
          ultimoLogin: true,
          criadoEm: true,
          atualizadoEm: true
        }
      });
      
      // Retorna null se usuário não for encontrado (comportamento normal)
      return usuario;
    } catch (error) {
      // Log apenas erros reais de banco de dados
      console.error('❌ Erro crítico ao acessar banco de dados em findByEmailWithPassword:', error);
      // Re-throw para que o controller possa tratar adequadamente
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   * @param nome Nome do usuário
   * @param email Email do usuário
   * @param senha Senha do usuário (será feito hash)
   * @param tipo Tipo do usuário (obrigatório)
   * @param turmaId ID da turma (obrigatório para admin_turma)
   * @returns Usuário criado
   */
  static async create(nome: string, email: string, senha: string, tipo: string, turmaId?: number) {
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);
    
    // Valida o tipo de usuário
    const tiposValidos = Object.values(this.TIPOS);
    if (!tiposValidos.includes(tipo)) {
      throw new Error('Tipo de usuário inválido');
    }
    
    // Validação de negócio: admin_turma deve ter turmaId
    if (tipo === this.TIPOS.ADMIN_TURMA && !turmaId) {
      throw new Error('Admin de turma deve estar associado a uma turma');
    }
    
    // Admin geral não deve ter turmaId
    if (tipo === this.TIPOS.ADMIN_GERAL && turmaId) {
      throw new Error('Admin geral não deve estar associado a uma turma');
    }
    
    // Se for admin_turma, verificar se a turma existe
    if (tipo === this.TIPOS.ADMIN_TURMA && turmaId) {
      const turmaExiste = await prisma.turma.findUnique({
        where: { id: turmaId }
      });
      
      if (!turmaExiste) {
        throw new Error(`Turma com ID ${turmaId} não encontrada`);
      }
    }
    
    return await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        tipo,
        turmaId
      }
    });
  }

  /**
   * Atualiza um usuário existente
   * @param id ID do usuário
   * @param data Dados para atualização
   * @returns Usuário atualizado
   */
  static async update(id: number, data: {
    nome?: string;
    email?: string;
    senha?: string;
    tipo?: string;
    turmaId?: number | null;
    ativo?: boolean;
  }) {
    const updateData: any = {};
    
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.turmaId !== undefined) updateData.turmaId = data.turmaId;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    
    // Validação de negócio para tipo
    if (data.tipo) {
      const tiposValidos = Object.values(this.TIPOS);
      if (!tiposValidos.includes(data.tipo)) {
        throw new Error('Tipo de usuário inválido');
      }
      
      // Admin turma deve ter turmaId
      if (data.tipo === this.TIPOS.ADMIN_TURMA && !data.turmaId) {
        throw new Error('Admin de turma deve estar associado a uma turma');
      }
      
      // Admin geral não deve ter turmaId
      if (data.tipo === this.TIPOS.ADMIN_GERAL && data.turmaId) {
        throw new Error('Admin geral não deve estar associado a uma turma');
      }
    }
    
    // Se turmaId for fornecido, verificar se a turma existe
    if (data.turmaId) {
      const turmaExiste = await prisma.turma.findUnique({
        where: { id: data.turmaId }
      });
      
      if (!turmaExiste) {
        throw new Error(`Turma com ID ${data.turmaId} não encontrada`);
      }
    }
    
    // Se a senha foi fornecida, fazer o hash
    if (data.senha) {
      const salt = await bcrypt.genSalt(10);
      updateData.senha = await bcrypt.hash(data.senha, salt);
    }
    
    return await prisma.usuario.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Exclui um usuário pelo ID
   * @param id ID do usuário
   * @returns Resultado da operação
   */
  static async delete(id: number) {
    return await prisma.usuario.delete({
      where: { id }
    });
  }

  /**
   * Verifica se a senha fornecida corresponde à senha armazenada
   * @param senha Senha fornecida
   * @param senhaHash Hash da senha armazenada
   * @returns true se a senha corresponder, false caso contrário
   */
  static async verificarSenha(senha: string, senhaHash: string) {
    return await bcrypt.compare(senha, senhaHash);
  }

  /**
   * Verifica se o usuário é um administrador de turma
   * @param usuario Usuário a ser verificado
   * @returns true se for admin de turma, false caso contrário
   */
  static isAdminTurma(usuario: { tipo: string }) {
    return usuario.tipo === this.TIPOS.ADMIN_TURMA;
  }

  /**
   * Verifica se o usuário é um administrador geral
   * @param usuario Usuário a ser verificado
   * @returns true se for admin geral, false caso contrário
   */
  static isAdminGeral(usuario: { tipo: string }) {
    return usuario.tipo === this.TIPOS.ADMIN_GERAL;
  }

  /**
   * Verifica se o usuário tem qualquer tipo de privilégio administrativo
   * @param usuario Usuário a ser verificado
   * @returns true se for admin (turma ou geral), false caso contrário
   */
  /**
   * Fetch administrators (admin_turma) for a given class (turma)
   */
  static async findAdminsByTurma(turmaId: number) {
    return prisma.usuario.findMany({
      where: {
        tipo: this.TIPOS.ADMIN_TURMA,
        turmaId
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });
  }

  static isAdmin(usuario: { tipo: string }) {
    return this.isAdminTurma(usuario) || this.isAdminGeral(usuario);
  }
}

export const UsuarioSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  tipo: z.enum([UsuarioModel.TIPOS.ADMIN_TURMA, UsuarioModel.TIPOS.ADMIN_GERAL])
});