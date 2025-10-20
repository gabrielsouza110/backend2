import { Request, Response } from 'express';
import { EdicaoModel } from '../models/edicaoModel';
import { AuthenticatedRequest } from '../middlewares/auth';
import { EditionUtils } from '../utils/editionUtils';

export class EdicoesController {
  static async getAll(req: Request, res: Response) {
    try {
      const edicoes = await EdicaoModel.findAll();
      return res.json(edicoes);
    } catch (error) {
      console.error('Erro ao buscar edições:', error);
      return res.status(500).json({ error: 'Erro ao buscar edições' });
    }
  }
  
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      const edicao = await EdicaoModel.findById(idNum);
      
      if (!edicao) {
        return res.status(404).json({ error: 'Edição não encontrada' });
      }
      
      return res.json(edicao);
    } catch (error) {
      console.error('Erro ao buscar edição:', error);
      return res.status(500).json({ error: 'Erro ao buscar edição' });
    }
  }
  
  /**
   * Gets the current edition (current year)
   * This endpoint will automatically create the current year's edition if it doesn't exist
   */
  static async getCurrent(req: Request, res: Response) {
    try {
      const currentEdition = await EditionUtils.getCurrentEdition();
      return res.json(currentEdition);
    } catch (error) {
      console.error('Erro ao buscar edição atual:', error);
      return res.status(500).json({ error: 'Erro ao buscar edição atual' });
    }
  }
  
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { ano, nome, dataInicio, dataFim, descricao } = req.body;
      
      // Validar dados obrigatórios
      if (!ano || !nome || !dataInicio || !dataFim) {
        return res.status(400).json({ 
          error: 'Ano, nome, dataInicio e dataFim são obrigatórios' 
        });
      }
      
      const anoNum = parseInt(ano);
      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim);
      
      // Verificar se as datas são válidas
      if (isNaN(dataInicioDate.getTime()) || isNaN(dataFimDate.getTime())) {
        return res.status(400).json({ error: 'Datas inválidas' });
      }
      
      // Verificar se a data de fim é posterior à data de início
      if (dataFimDate <= dataInicioDate) {
        return res.status(400).json({ 
          error: 'A data de fim deve ser posterior à data de início' 
        });
      }
      
      // Verificar se já existe uma edição com o mesmo ano
      const existeEdicao = await EdicaoModel.existsByAno(anoNum);
      
      if (existeEdicao) {
        return res.status(400).json({ error: 'Já existe uma edição para este ano' });
      }
      
      const novaEdicao = await EdicaoModel.create(anoNum, nome, dataInicioDate, dataFimDate, descricao);
      
      return res.status(201).json(novaEdicao);
    } catch (error) {
      console.error('Erro ao criar edição:', error);
      return res.status(500).json({ error: 'Erro ao criar edição' });
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      const { ano, descricao } = req.body;
      
      // Verificar se a edição existe
      const edicao = await EdicaoModel.findById(idNum);
      
      if (!edicao) {
        return res.status(404).json({ error: 'Edição não encontrada' });
      }
      
      // Verificar se já existe outra edição com o mesmo ano
      if (ano !== undefined && ano !== edicao.ano) {
        const existeOutraEdicao = await EdicaoModel.existsByAno(parseInt(ano));
        
        if (existeOutraEdicao) {
          return res.status(400).json({ error: 'Já existe outra edição para este ano' });
        }
      }
      
      const dadosAtualizacao: { ano?: number; descricao?: string | null } = {};
      if (ano !== undefined) dadosAtualizacao.ano = parseInt(ano);
      if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
      
      const edicaoAtualizada = await EdicaoModel.update(idNum, dadosAtualizacao);
      
      return res.json(edicaoAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar edição:', error);
      return res.status(500).json({ error: 'Erro ao atualizar edição' });
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Verificar se a edição existe
      const edicao = await EdicaoModel.findById(idNum);
      
      if (!edicao) {
        return res.status(404).json({ error: 'Edição não encontrada' });
      }
      
      await EdicaoModel.delete(idNum);
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir edição:', error);
      return res.status(500).json({ error: 'Erro ao excluir edição' });
    }
  }
}