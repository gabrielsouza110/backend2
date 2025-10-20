import { prisma } from '../models/database';

/**
 * Gets the current edition based on the current year
 * If no edition exists for the current year, creates one automatically
 */
export class EditionUtils {
  /**
   * Gets or creates the current year's edition
   * @returns The current edition
   */
  static async getCurrentEdition() {
    const currentYear = new Date().getFullYear();
    
    // Try to find an existing edition for the current year
    let edition = await prisma.edicao.findUnique({
      where: { ano: currentYear }
    });
    
    // If no edition exists for the current year, create one
    if (!edition) {
      edition = await prisma.edicao.create({
        data: {
          ano: currentYear,
          nome: `Interclasse ${currentYear}`,
          descricao: `Campeonato Interclasse do Ensino Médio ${currentYear}`,
          dataInicio: new Date(currentYear, 2, 1), // March 1st
          dataFim: new Date(currentYear, 10, 30), // November 30th
          ativa: true
        }
      });
      
      console.log(`✅ Created new edition for ${currentYear}`);
    }
    
    return edition;
  }
  
  /**
   * Gets the current edition ID
   * @returns The current edition ID
   */
  static async getCurrentEditionId() {
    const edition = await this.getCurrentEdition();
    return edition.id;
  }
  
  /**
   * Gets the active edition (current year's edition)
   * @returns The active edition or null if none exists
   */
  static async getActiveEdition() {
    const currentYear = new Date().getFullYear();
    
    const edition = await prisma.edicao.findUnique({
      where: { 
        ano: currentYear,
        ativa: true
      }
    });
    
    return edition;
  }
  
  /**
   * Gets all editions ordered by year (newest first)
   * @returns List of editions
   */
  static async getAllEditions() {
    return await prisma.edicao.findMany({
      orderBy: { ano: 'desc' }
    });
  }
  
  /**
   * Gets edition by ID
   * @param id Edition ID
   * @returns Edition or null
   */
  static async getEditionById(id: number) {
    return await prisma.edicao.findUnique({
      where: { id }
    });
  }
}