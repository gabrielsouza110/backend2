import { prisma } from './database';
import { Prisma } from '@prisma/client';

// Define the ModalidadeEnum type
export type ModalidadeEnum = 
  | 'FUTSAL'
  | 'VOLEI'
  | 'BASQUETE'
  | 'HANDBALL';

export class ModalidadeModel {
  /**
   * Busca todas as modalidades (dados simplificados)
   */
  static async findAll() {
    return await prisma.modalidade.findMany();
  }

  /**
   * Busca uma modalidade pelo ID (dados simplificados)
   */
  static async findById(id: number) {
    return await prisma.modalidade.findUnique({
      where: { id }
    });
  }

  /**
   * Verifica se existe uma modalidade com o nome especificado
   */
  static async findByNome(nome: string) {
    return await prisma.modalidade.findFirst({
      where: { nome }
    });
  }

  /**
   * Verifica se existe outra modalidade com o mesmo nome (exceto a modalidade com o ID especificado)
   */
  static async findByNomeExcluindoId(nome: string, id: number) {
    return await prisma.modalidade.findFirst({
      where: {
        nome,
        id: { not: id }
      }
    });
  }

  /**
   * Cria uma nova modalidade
   */
  static async create(data: {
    nome: string;
    tipo: ModalidadeEnum;
    icone?: string;
    descricao?: string;
    genero?: any;
  }) {
    return await prisma.modalidade.create({
      data
    });
  }

  /**
   * Atualiza uma modalidade existente
   */
  static async update(id: number, data: {
    nome?: string;
    tipo?: ModalidadeEnum;
    icone?: string;
    descricao?: string;
    genero?: any;
  }) {
    return await prisma.modalidade.update({
      where: { id },
      data
    });
  }

  /**
   * Exclui uma modalidade pelo ID
   */
  static async delete(id: number) {
    return await prisma.modalidade.delete({
      where: { id }
    });
  }

  /**
   * Busca uma modalidade com suas relações para verificação antes da exclusão
   */
  static async findByIdWithRelations(id: number) {
    return await prisma.modalidade.findUnique({
      where: { id },
      include: {
        jogos: true,
        estatisticasTimes: true,
        jogadorModalidades: true
      }
    });
  }

  /**
   * Exclui todas as estatísticas de times relacionadas a uma modalidade
   */
  static async deleteEstatisticasTimes(modalidadeId: number) {
    return await prisma.estatisticaTime.deleteMany({
      where: { modalidadeId }
    });
  }

  /**
   * Exclui todas as relações jogador-modalidade para uma modalidade
   */
  static async deleteJogadorModalidades(modalidadeId: number) {
    return await prisma.jogadorModalidade.deleteMany({
      where: { modalidadeId }
    });
  }
}