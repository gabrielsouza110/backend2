import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ModalidadeModel, ModalidadeEnum } from '../models/modalidadeModel';

export class ModalidadesController {
  static async getAll(req: Request, res: Response) {
    try {
      const modalidades = await ModalidadeModel.findAll();
      return res.json(modalidades);
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error);
      return res.status(500).json({ error: 'Erro ao buscar modalidades' });
    }
  }
  
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const modalidade = await ModalidadeModel.findById(parseInt(id));
      
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      return res.json(modalidade);
    } catch (error) {
      console.error('Erro ao buscar modalidade:', error);
      return res.status(500).json({ error: 'Erro ao buscar modalidade' });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, tipo, icone, descricao, genero } = req.body;
      
      // Verificar se já existe uma modalidade com o mesmo nome
      const modalidadeExistente = await ModalidadeModel.findByNome(nome);
      
      if (modalidadeExistente) {
        return res.status(400).json({ error: 'Já existe uma modalidade com este nome' });
      }
      
      // If tipo is provided, check if it already exists
      if (tipo) {
        // Note: This will need to be updated when the Prisma client is regenerated
        // For now, we'll skip this check
      }
      
      const modalidade = await ModalidadeModel.create({
        nome,
        tipo: tipo as ModalidadeEnum,
        icone,
        descricao,
        genero: genero || undefined
      });
      
      return res.status(201).json(modalidade);
    } catch (error) {
      console.error('Erro ao criar modalidade:', error);
      return res.status(500).json({ error: 'Erro ao criar modalidade' });
    }
  }
  
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, tipo, icone, descricao, genero } = req.body;
      const idNum = parseInt(id);
      
      // Verificar se a modalidade existe
      const modalidade = await ModalidadeModel.findById(idNum);
      
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      // Verificar se já existe outra modalidade com o mesmo nome
      if (nome && nome !== modalidade.nome) {
        const modalidadeExistente = await ModalidadeModel.findByNomeExcluindoId(nome, idNum);
        
        if (modalidadeExistente) {
          return res.status(400).json({ error: 'Já existe outra modalidade com este nome' });
        }
      }
      
      // If tipo is provided, check if it already exists (for other modalidades)
      if (tipo) {
        // Note: This will need to be updated when the Prisma client is regenerated
        // For now, we'll skip this check
      }
      
      // Atualizar a modalidade
      const modalidadeAtualizada = await ModalidadeModel.update(idNum, {
        nome: nome !== undefined ? nome : undefined,
        tipo: tipo !== undefined ? tipo as ModalidadeEnum : undefined,
        icone: icone !== undefined ? icone : undefined,
        descricao: descricao !== undefined ? descricao : undefined,
        genero: genero !== undefined ? genero : undefined
      });
      
      return res.json(modalidadeAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar modalidade:', error);
      return res.status(500).json({ error: 'Erro ao atualizar modalidade' });
    }
  }
  
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const idNum = parseInt(id);
      
      // Verificar se a modalidade existe com suas relações
      const modalidade = await ModalidadeModel.findByIdWithRelations(idNum);
      
      if (!modalidade) {
        return res.status(404).json({ error: 'Modalidade não encontrada' });
      }
      
      // Verificar se há jogos associados
      if (modalidade.jogos.length > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir a modalidade pois existem jogos associados a ela' 
        });
      }
      
      // Excluir as relações primeiro
      if (modalidade.estatisticasTimes.length > 0) {
        await ModalidadeModel.deleteEstatisticasTimes(idNum);
      }
      
      if (modalidade.jogadorModalidades.length > 0) {
        await ModalidadeModel.deleteJogadorModalidades(idNum);
      }
      
      // Excluir a modalidade
      await ModalidadeModel.delete(idNum);
      
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir modalidade:', error);
      return res.status(500).json({ error: 'Erro ao excluir modalidade' });
    }
  }
}