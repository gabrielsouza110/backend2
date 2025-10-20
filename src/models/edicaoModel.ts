import { prisma } from './database';

export class EdicaoModel {
  /**
   * Busca todas as edições ordenadas por ano em ordem decrescente (dados simplificados)
   * @returns Lista de edições
   */
  static async findAll() {
    return prisma.edicao.findMany({
      orderBy: { ano: 'desc' }
    });
  }
  
  /**
   * Busca uma edição pelo ID (dados simplificados)
   * @param id ID da edição
   * @returns Edição encontrada ou null
   */
  static async findById(id: number) {
    return prisma.edicao.findUnique({
      where: { id }
    });
  }
  
  /**
   * Verifica se já existe uma edição com o mesmo ano
   * @param ano Ano da edição
   * @returns true se já existir, false caso contrário
   */
  static async existsByAno(ano: number) {
    const count = await prisma.edicao.count({
      where: { ano }
    });
    return count > 0;
  }
  
  /**
   * Cria uma nova edição
   * @param ano Ano da edição
   * @param nome Nome da edição
   * @param dataInicio Data de início da edição
   * @param dataFim Data de fim da edição
   * @param descricao Descrição da edição (opcional)
   * @returns Nova edição criada
   */
  static async create(ano: number, nome: string, dataInicio: Date, dataFim: Date, descricao?: string) {
    return prisma.edicao.create({
      data: {
        ano,
        nome,
        dataInicio,
        dataFim,
        descricao: descricao || null
      }
    });
  }
  
  /**
   * Atualiza uma edição existente
   * @param id ID da edição
   * @param data Dados para atualização
   * @returns Edição atualizada
   */
  static async update(id: number, data: { ano?: number; descricao?: string | null }) {
    return prisma.edicao.update({
      where: { id },
      data: {
        ...(data.ano !== undefined && { ano: data.ano }),
        ...(data.descricao !== undefined && { descricao: data.descricao })
      }
    });
  }
  
  /**
   * Exclui uma edição pelo ID
   * @param id ID da edição
   * @returns true se a exclusão foi bem-sucedida
   */
  static async delete(id: number) {
    await prisma.edicao.delete({
      where: { id }
    });
    return true;
  }
}