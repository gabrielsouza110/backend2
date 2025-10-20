import { z } from 'zod';

// ===== SCHEMAS PARA ADMIN =====

export const createUserSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim(),
    email: z.string()
      .email('Email deve ser válido')
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(100, 'Email deve ter no máximo 100 caracteres')
      .toLowerCase()
      .trim(),
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(50, 'Senha deve ter no máximo 50 caracteres'),
    tipo: z.enum(['admin_geral', 'admin_turma']),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo')
      .optional(),
    ativo: z.boolean().optional().default(true)
  }).refine((data) => {
    // admin_turma deve ter turmaId
    if (data.tipo === 'admin_turma' && !data.turmaId) {
      return false;
    }
    // admin_geral não deve ter turmaId
    if (data.tipo === 'admin_geral' && data.turmaId) {
      return false;
    }
    return true;
  }, {
    message: 'Admin de turma deve ter turmaId. Admin geral não deve ter turmaId.',
    path: ['turmaId']
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    email: z.string()
      .email('Email deve ser válido')
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(100, 'Email deve ter no máximo 100 caracteres')
      .toLowerCase()
      .trim()
      .optional(),
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(50, 'Senha deve ter no máximo 50 caracteres')
      .optional(),
    tipo: z.enum(['admin_geral', 'admin_turma']).optional(),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo')
      .optional()
      .nullable(),
    ativo: z.boolean().optional()
  }).refine((data) => {
    // Se tipo for admin_turma, deve ter turmaId
    if (data.tipo === 'admin_turma' && !data.turmaId) {
      return false;
    }
    // Se tipo for admin_geral, não deve ter turmaId
    if (data.tipo === 'admin_geral' && data.turmaId) {
      return false;
    }
    return true;
  }, {
    message: 'Admin de turma deve ter turmaId. Admin geral não deve ter turmaId.',
    path: ['turmaId']
  })
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA TIMES =====

export const createTimeSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome do time é obrigatório e deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim(),
    modalidadeId: z.number()
      .int('ID da modalidade deve ser um número inteiro')
      .positive('ID da modalidade deve ser positivo'),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo'),
    jogadores: z.array(z.number().int().positive('ID do jogador deve ser positivo'))
      .optional()
      .default([])
  }),
});

export const updateTimeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome do time deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    modalidadeId: z.number()
      .int('ID da modalidade deve ser um número inteiro')
      .positive('ID da modalidade deve ser positivo')
      .optional(),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional()
  })
});

export const timeIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

export const addJogadorTimeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID do time deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    jogadorId: z.number()
      .int('ID do jogador deve ser um número inteiro')
      .positive('ID do jogador deve ser positivo')
  })
});

export const removeJogadorTimeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID do time deve ser um número')
      .transform((val) => parseInt(val)),
    jogadorId: z.string()
      .regex(/^\d+$/, 'ID do jogador deve ser um número')
      .transform((val) => parseInt(val))
  })
});

// ===== SCHEMAS PARA JOGOS =====

export const createJogoSchema = z.object({
  body: z.object({
    time1Id: z.number()
      .int('ID do time 1 deve ser um número inteiro')
      .positive('ID do time 1 deve ser positivo'),
    time2Id: z.number()
      .int('ID do time 2 deve ser um número inteiro')
      .positive('ID do time 2 deve ser positivo'),
    modalidadeId: z.number()
      .int('ID da modalidade deve ser um número inteiro')
      .positive('ID da modalidade deve ser positivo'),
    dataHora: z.string()
      .datetime('Data e hora devem estar em formato ISO válido'),
    local: z.string()
      .max(200, 'Local deve ter no máximo 200 caracteres')
      .optional(),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional()
  }).refine((data) => data.time1Id !== data.time2Id, {
    message: 'Time 1 e Time 2 não podem ser iguais',
    path: ['time2Id']
  })
});

export const updateJogoSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    time1Id: z.number()
      .int('ID do time 1 deve ser um número inteiro')
      .positive('ID do time 1 deve ser positivo')
      .optional(),
    time2Id: z.number()
      .int('ID do time 2 deve ser um número inteiro')
      .positive('ID do time 2 deve ser positivo')
      .optional(),
    modalidadeId: z.number()
      .int('ID da modalidade deve ser um número inteiro')
      .positive('ID da modalidade deve ser positivo')
      .optional(),
    dataHora: z.string()
      .datetime('Data e hora devem estar em formato ISO válido')
      .optional(),
    local: z.string()
      .max(200, 'Local deve ter no máximo 200 caracteres')
      .optional(),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    status: z.enum(['AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO'])
      .optional()
  }).refine((data) => {
    if (data.time1Id && data.time2Id) {
      return data.time1Id !== data.time2Id;
    }
    return true;
  }, {
    message: 'Time 1 e Time 2 não podem ser iguais',
    path: ['time2Id']
  })
});

export const jogoIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

export const rescheduleJogoSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    dataHora: z.string()
      .datetime('Data e hora devem estar em formato ISO válido'),
    motivo: z.string()
      .max(200, 'Motivo deve ter no máximo 200 caracteres')
      .optional()
  })
});

export const updatePlacarSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    placarTime1: z.number()
      .int('Placar do time 1 deve ser um número inteiro')
      .min(0, 'Placar do time 1 não pode ser negativo'),
    placarTime2: z.number()
      .int('Placar do time 2 deve ser um número inteiro')
      .min(0, 'Placar do time 2 não pode ser negativo')
  })
});

export const scoreGoalSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    jogadorId: z.number()
      .int('ID do jogador deve ser um número inteiro')
      .positive('ID do jogador deve ser positivo'),
    timeId: z.number()
      .int('ID do time deve ser um número inteiro')
      .positive('ID do time deve ser positivo'),
    minuto: z.number()
      .int('Minuto deve ser um número inteiro')
      .min(0, 'Minuto não pode ser negativo')
      .max(120, 'Minuto não pode ser maior que 120')
      .optional()
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    status: z.enum(['AGENDADO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO'], {
      message: 'Status deve ser um dos valores: AGENDADO, EM_ANDAMENTO, PAUSADO, FINALIZADO, CANCELADO'
    }),
    reason: z.string()
      .max(500, 'Motivo deve ter no máximo 500 caracteres')
      .optional()
  })
});

// ===== SCHEMAS PARA TURMAS =====

export const createTurmaSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(2, 'Nome da turma deve ter pelo menos 2 caracteres')
      .max(50, 'Nome da turma deve ter no máximo 50 caracteres')
      .trim(),
    serie: z.number()
      .int('Série deve ser um número inteiro')
      .min(1, 'Série deve ser pelo menos 1')
      .max(12, 'Série deve ser no máximo 12'),
    turno: z.string()
      .min(3, 'Turno deve ter pelo menos 3 caracteres')
      .max(20, 'Turno deve ter no máximo 20 caracteres')
      .trim(),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional()
  })
});

export const updateTurmaSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(2, 'Nome da turma deve ter pelo menos 2 caracteres')
      .max(50, 'Nome da turma deve ter no máximo 50 caracteres')
      .trim()
      .optional(),
    serie: z.number()
      .int('Série deve ser um número inteiro')
      .min(1, 'Série deve ser pelo menos 1')
      .max(12, 'Série deve ser no máximo 12')
      .optional(),
    turno: z.string()
      .min(3, 'Turno deve ter pelo menos 3 caracteres')
      .max(20, 'Turno deve ter no máximo 20 caracteres')
      .trim()
      .optional(),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional()
  })
});

export const turmaIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA MODALIDADES =====

export const createModalidadeSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome da modalidade deve ter pelo menos 3 caracteres')
      .max(100, 'Nome da modalidade deve ter no máximo 100 caracteres')
      .trim(),
    tipo: z.enum([
      'FUTSAL',
      'VOLEI',
      'BASQUETE',
      'HANDBALL'
    ]).optional(),
    icone: z.string()
      .max(255, 'Ícone deve ter no máximo 255 caracteres')
      .optional(),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    genero: z.enum(['masculino', 'feminino', 'misto'])
      .optional().default('masculino')
  })
});

export const updateModalidadeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome da modalidade deve ter pelo menos 3 caracteres')
      .max(100, 'Nome da modalidade deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    tipo: z.enum([
      'FUTSAL',
      'VOLEI',
      'BASQUETE',
      'HANDBALL'
    ]).optional(),
    icone: z.string()
      .max(255, 'Ícone deve ter no máximo 255 caracteres')
      .optional(),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    genero: z.enum(['masculino', 'feminino', 'misto'])
      .optional()
  })
});

export const modalidadeIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA EDIÇÕES =====

export const createEdicaoSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(5, 'Nome da edição deve ter pelo menos 5 caracteres')
      .max(100, 'Nome da edição deve ter no máximo 100 caracteres')
      .trim(),
    ano: z.number()
      .int('Ano deve ser um número inteiro')
      .min(2020, 'Ano deve ser pelo menos 2020')
      .max(2050, 'Ano deve ser no máximo 2050'),
    dataInicio: z.string()
      .datetime('Data de início deve estar em formato ISO válido'),
    dataFim: z.string()
      .datetime('Data de fim deve estar em formato ISO válido'),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    ativa: z.boolean().optional().default(true)
  }).refine((data) => {
    const inicio = new Date(data.dataInicio);
    const fim = new Date(data.dataFim);
    return inicio < fim;
  }, {
    message: 'Data de início deve ser anterior à data de fim',
    path: ['dataFim']
  })
});

export const updateEdicaoSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(5, 'Nome da edição deve ter pelo menos 5 caracteres')
      .max(100, 'Nome da edição deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    ano: z.number()
      .int('Ano deve ser um número inteiro')
      .min(2020, 'Ano deve ser pelo menos 2020')
      .max(2050, 'Ano deve ser no máximo 2050')
      .optional(),
    dataInicio: z.string()
      .datetime('Data de início deve estar em formato ISO válido')
      .optional(),
    dataFim: z.string()
      .datetime('Data de fim deve estar em formato ISO válido')
      .optional(),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    ativa: z.boolean().optional()
  }).refine((data) => {
    if (data.dataInicio && data.dataFim) {
      const inicio = new Date(data.dataInicio);
      const fim = new Date(data.dataFim);
      return inicio < fim;
    }
    return true;
  }, {
    message: 'Data de início deve ser anterior à data de fim',
    path: ['dataFim']
  })
});

export const edicaoIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA JOGADORES =====

export const createJogadorSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome do jogador deve ter pelo menos 3 caracteres')
      .max(100, 'Nome do jogador deve ter no máximo 100 caracteres')
      .trim(),
    genero: z.enum(['masculino', 'feminino', 'misto'], {
      message: 'Gênero é obrigatório e deve ser masculino, feminino ou misto'
    }),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo'),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional(),
    modalidades: z.array(z.number().int().positive('ID da modalidade deve ser positivo'))
      .min(1, 'Pelo menos uma modalidade é obrigatória')
      .max(10, 'Máximo de 10 modalidades permitidas'),
    numeroCamisa: z.number()
      .int('Número da camisa deve ser um número inteiro')
      .min(1, 'Número da camisa deve ser pelo menos 1')
      .max(99, 'Número da camisa deve ser no máximo 99')
      .optional()
  })
});

export const updateJogadorSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome do jogador deve ter pelo menos 3 caracteres')
      .max(100, 'Nome do jogador deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    genero: z.enum(['masculino', 'feminino', 'misto'], {
      message: 'Gênero deve ser masculino, feminino ou misto'
    }).optional(),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo')
      .optional(),
    edicaoId: z.number()
      .int('ID da edição deve ser um número inteiro')
      .positive('ID da edição deve ser positivo')
      .optional(),
    modalidades: z.array(z.number().int().positive('ID da modalidade deve ser positivo'))
      .max(10, 'Máximo de 10 modalidades permitidas')
      .optional(),
    numeroCamisa: z.number()
      .int('Número da camisa deve ser um número inteiro')
      .min(1, 'Número da camisa deve ser pelo menos 1')
      .max(99, 'Número da camisa deve ser no máximo 99')
      .optional()
      .nullable()
  }).refine((data) => {
    // If modalidades is provided, it must have at least one item
    // This ensures data integrity while allowing partial updates
    if (data.modalidades !== undefined && data.modalidades.length === 0) {
      return false;
    }
    return true;
  }, {
    message: 'Se modalidades for fornecido, deve conter pelo menos uma modalidade',
    path: ['modalidades']
  })
});

export const jogadorIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

export const jogadorTurmaIdParamSchema = z.object({
  params: z.object({
    turmaId: z.string()
      .regex(/^\d+$/, 'ID da turma deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA USUÁRIOS =====

export const createUsuarioSchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim(),
    email: z.string()
      .email('Email deve ser válido')
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(100, 'Email deve ter no máximo 100 caracteres')
      .toLowerCase()
      .trim(),
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(50, 'Senha deve ter no máximo 50 caracteres'),
    tipo: z.enum(['admin_geral', 'admin_turma'])
      .default('admin_turma'),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo')
      .optional(),
    ativo: z.boolean().optional().default(true)
  }).refine((data) => {
    // admin_turma deve ter turmaId
    if (data.tipo === 'admin_turma' && !data.turmaId) {
      return false;
    }
    // admin_geral não deve ter turmaId
    if (data.tipo === 'admin_geral' && data.turmaId) {
      return false;
    }
    return true;
  }, {
    message: 'Admin de turma deve ter turmaId. Admin geral não deve ter turmaId.',
    path: ['turmaId']
  })
});

// ===== SCHEMAS PARA RELACIONAMENTO TURMA-TIME =====

export const assignTurmaToTimeSchema = z.object({
  body: z.object({
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo'),
    timeId: z.number()
      .int('ID do time deve ser um número inteiro')
      .positive('ID do time deve ser positivo')
  })
});

export const removeTurmaFromTimeSchema = z.object({
  body: z.object({
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo'),
    timeId: z.number()
      .int('ID do time deve ser um número inteiro')
      .positive('ID do time deve ser positivo')
  })
});

export const transferTurmasSchema = z.object({
  body: z.object({
    fromTimeId: z.number()
      .int('ID do time de origem deve ser um número inteiro')
      .positive('ID do time de origem deve ser positivo'),
    toTimeId: z.number()
      .int('ID do time de destino deve ser um número inteiro')
      .positive('ID do time de destino deve ser positivo')
  })
});

export const updateUsuarioSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .trim()
      .optional(),
    email: z.string()
      .email('Email deve ser válido')
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(100, 'Email deve ter no máximo 100 caracteres')
      .toLowerCase()
      .trim()
      .optional(),
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(50, 'Senha deve ter no máximo 50 caracteres')
      .optional(),
    tipo: z.enum(['admin_geral', 'admin_turma']).optional(),
    turmaId: z.number()
      .int('ID da turma deve ser um número inteiro')
      .positive('ID da turma deve ser positivo')
      .optional()
      .nullable(),
    ativo: z.boolean().optional()
  }).refine((data) => {
    // Se tipo for admin_turma, deve ter turmaId
    if (data.tipo === 'admin_turma' && !data.turmaId) {
      return false;
    }
    // Se tipo for admin_geral, não deve ter turmaId
    if (data.tipo === 'admin_geral' && data.turmaId) {
      return false;
    }
    return true;
  }, {
    message: 'Admin de turma deve ter turmaId. Admin geral não deve ter turmaId.',
    path: ['turmaId']
  })
});

export const usuarioIdParamSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA ESTATÍSTICAS =====

export const estatisticaModalidadeIdParamSchema = z.object({
  params: z.object({
    modalidadeId: z.string()
      .regex(/^\d+$/, 'ID da modalidade deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS PARA EVENTOS DE JOGOS =====

export const createEventoJogoSchema = z.object({
  params: z.object({
    jogoId: z.string()
      .regex(/^\d+$/, 'ID do jogo deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    tipo: z.enum([
      'GOL', 'ASSISTENCIA', 'CARTAO_AMARELO', 'CARTAO_VERMELHO', 
      'SUBSTITUICAO', 'LESAO', 'FALTA', 'PENALTI', 'FALTA_GRAVE', 
      'FALTA_GRAVISSIMA', 'IMPEDIMENTO', 'MAO_BOLA', 'ESCANTIO', 
      'LATERAL', 'TIRO_META', 'TIRO_LIVRE', 'GOL_CONTRA', 
      'GOL_DE_PENALTI', 'GOL_DE_FALTA', 'GOL_DE_ESQUINA', 
      'GOL_DE_LATERAL', 'GOL_DE_TIRO_DE_META', 'GOL_DE_TIRO_LIVRE', 'OUTRO'
    ]),
    minuto: z.number()
      .int('Minuto deve ser um número inteiro')
      .min(0, 'Minuto não pode ser negativo')
      .max(120, 'Minuto não pode ser maior que 120'),
    timeId: z.number()
      .int('ID do time deve ser um número inteiro')
      .positive('ID do time deve ser positivo'),
    jogadorId: z.number()
      .int('ID do jogador deve ser um número inteiro')
      .positive('ID do jogador deve ser positivo')
      .optional(),
    jogadorSubstituidoId: z.number()
      .int('ID do jogador substituído deve ser um número inteiro')
      .positive('ID do jogador substituído deve ser positivo')
      .optional(),
    descricao: z.string()
      .max(255, 'Descrição deve ter no máximo 255 caracteres')
      .optional()
  }).refine((data) => {
    // Para substituições, jogadorSubstituidoId é obrigatório
    if (data.tipo === 'SUBSTITUICAO' && !data.jogadorSubstituidoId) {
      return false;
    }
    // Para substituições, jogadorId é obrigatório
    if (data.tipo === 'SUBSTITUICAO' && !data.jogadorId) {
      return false;
    }
    return true;
  }, {
    message: 'Para substituições, tanto jogadorId quanto jogadorSubstituidoId são obrigatórios',
    path: ['jogadorId']
  })
});

export const eventoJogoIdParamSchema = z.object({
  params: z.object({
    jogoId: z.string()
      .regex(/^\d+$/, 'ID do jogo deve ser um número')
      .transform((val) => parseInt(val)),
    eventoId: z.string()
      .regex(/^\d+$/, 'ID do evento deve ser um número')
      .transform((val) => parseInt(val))
  }),
});

// ===== SCHEMAS FOR PLAYER-MODALITY ASSOCIATION =====

export const addPlayerModalidadeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID do jogador deve ser um número')
      .transform((val) => parseInt(val))
  }),
  body: z.object({
    modalidadeId: z.number()
      .int('ID da modalidade deve ser um número inteiro')
      .positive('ID da modalidade deve ser positivo')
  })
});

export const removePlayerModalidadeSchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^\d+$/, 'ID do jogador deve ser um número')
      .transform((val) => parseInt(val)),
    modalidadeId: z.string()
      .regex(/^\d+$/, 'ID da modalidade deve ser um número')
      .transform((val) => parseInt(val))
  })
});

// ===== SCHEMAS PARA AUTH =====

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Email é obrigatório e deve ser válido')
      .toLowerCase()
      .trim(),
    senha: z.string()
      .min(1, 'Senha é obrigatória')
      .max(50, 'Senha deve ter no máximo 50 caracteres')
  }),
});

// ===== SCHEMAS PARA JOGOS DE VÔLEI =====

export const createVoleiGameSchema = z.object({
  body: z.object({
    // Set scores - maximum of 5 sets
    setsTime1: z.array(z.number().int().min(0)).max(5).default([0, 0, 0]),
    setsTime2: z.array(z.number().int().min(0)).max(5).default([0, 0, 0]),
    
    // Validate that there are exactly 3 or 5 sets
    _validSetsCount: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    }),
    
    // Validate set scores (25 points to win, except 5th set which is 15)
    _validSetScores: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    }),
    
    // Validate match winner (must win 3 sets in a best-of-5, or 2 sets in a best-of-3)
    _validMatchWinner: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    })
  }).refine((data) => {
    // Validate that there are exactly 3 or 5 sets
    const maxSets = Math.max(data.setsTime1.length, data.setsTime2.length);
    return maxSets === 3 || maxSets === 5;
  }, {
    message: 'O jogo de vôlei deve ter exatamente 3 ou 5 sets',
    path: ['setsTime1']
  }).refine((data) => {
    // Ensure both teams have the same number of sets
    return data.setsTime1.length === data.setsTime2.length;
  }, {
    message: 'Ambos os times devem ter o mesmo número de sets',
    path: ['setsTime1']
  }).refine((data) => {
    // Validate match winner (must win 3 sets in a best-of-5, or 2 sets in a best-of-3)
    const maxSets = Math.max(data.setsTime1.length, data.setsTime2.length);
    
    // Count sets won by each team
    let setsWonTime1 = 0;
    let setsWonTime2 = 0;
    
    for (let i = 0; i < data.setsTime1.length; i++) {
      const score1 = data.setsTime1[i];
      const score2 = data.setsTime2[i];
      
      // Determine winning score based on set number
      const winningScore = (i === 4 && maxSets === 5) ? 15 : 25;
      
      if (score1 >= winningScore && (score1 - score2) >= 2) {
        setsWonTime1++;
      } else if (score2 >= winningScore && (score2 - score1) >= 2) {
        setsWonTime2++;
      }
    }
    
    // Determine required sets to win
    const setsToWin = maxSets === 5 ? 3 : 2;
    
    // Check if match has a valid winner
    const team1Wins = setsWonTime1 >= setsToWin;
    const team2Wins = setsWonTime2 >= setsToWin;
    
    if (team1Wins && team2Wins) {
      return false;
    }
    
    // In a completed match, there must be a winner
    if ((setsWonTime1 + setsWonTime2) === maxSets && !team1Wins && !team2Wins) {
      return false;
    }
    
    // No more sets should be played after a team has won
    // Only check this if all sets have been played
    if ((team1Wins || team2Wins) && data.setsTime1.length === maxSets) {
      // Check if there are more wins than needed
      if ((team1Wins && setsWonTime1 > setsToWin) || (team2Wins && setsWonTime2 > setsToWin)) {
        return false;
      }
    }
    
    return true;
  }, {
    message: 'O jogo deve ter um vencedor válido',
    path: ['setsTime1']
  }).refine((data) => {
    // Validate that each set (except the last) has a winner
    const maxSets = Math.max(data.setsTime1.length, data.setsTime2.length);
    
    for (let i = 0; i < data.setsTime1.length - 1; i++) {
      const score1 = data.setsTime1[i];
      const score2 = data.setsTime2[i];
      
      // Determine winning score based on set number
      const winningScore = (i === 4 && maxSets === 5) ? 15 : 25;
      
      // Check if either team won the set
      const team1Won = score1 >= winningScore && (score1 - score2) >= 2;
      const team2Won = score2 >= winningScore && (score2 - score1) >= 2;
      
      // At least one team must have won the set
      if (!team1Won && !team2Won) {
        return false;
      }
    }
    return true;
  }, {
    message: 'Cada set (exceto o último) deve ter um vencedor com pelo menos os pontos necessários e diferença mínima de 2 pontos',
    path: ['setsTime1']
  }).refine((data) => {
    // Validate last set scoring rules
    const maxSets = Math.max(data.setsTime1.length, data.setsTime2.length);
    const i = data.setsTime1.length - 1;
    
    if (i >= 0) {
      const score1 = data.setsTime1[i];
      const score2 = data.setsTime2[i];
      
      // Determine winning score based on set number
      const winningScore = (i === 4 && maxSets === 5) ? 15 : 25;
      
      // Check if either team won the set
      const team1Won = score1 >= winningScore && (score1 - score2) >= 2;
      const team2Won = score2 >= winningScore && (score2 - score1) >= 2;
      
      // For the last set, if scores are provided, ensure valid scoring
      if (score1 > 0 || score2 > 0) {
        // If the game is in progress, ensure valid scoring
        if (score1 < winningScore && score2 < winningScore) {
          // Allow close games
          if (Math.abs(score1 - score2) >= 2 || (score1 + score2) === 0) {
            // This is ok for ongoing games
          } else if (score1 >= winningScore || score2 >= winningScore) {
            // One team must win by at least 2 points
            if (!(team1Won || team2Won)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }, {
    message: 'Para vencer um set, um time precisa ter pelo menos os pontos necessários e vantagem mínima de 2 pontos',
    path: ['setsTime1']
  })
});

// ===== SCHEMAS PARA JOGOS DE TÊNIS DE MESA =====

export const createTenisMesaGameSchema = z.object({
  body: z.object({
    // Game scores - maximum of 5 or 7 games depending on format
    gamesTime1: z.array(z.number().int().min(0)).max(7).default([0, 0, 0]),
    gamesTime2: z.array(z.number().int().min(0)).max(7).default([0, 0, 0]),
    
    // Validate game format (best of 5 or best of 7)
    _validGamesCount: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    }),
    
    // Validate game scores (11 points to win, must win by 2 points)
    _validGameScores: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    }),
    
    // Validate match winner (must win 3 out of 5, or 4 out of 7)
    _validMatchWinner: z.any().superRefine((val, ctx) => {
      // In superRefine, we can't directly access parent, so we'll validate at the object level
      // This validation will be handled by the object-level refine instead
    })
  }).refine((data) => {
    // Validate game format (best of 5 or best of 7)
    const maxGames = Math.max(data.gamesTime1.length, data.gamesTime2.length);
    return maxGames === 5 || maxGames === 7;
  }, {
    message: 'O jogo de tênis de mesa deve ter exatamente 5 ou 7 games',
    path: ['gamesTime1']
  }).refine((data) => {
    // Ensure both teams have the same number of games
    return data.gamesTime1.length === data.gamesTime2.length;
  }, {
    message: 'Ambos os times devem ter o mesmo número de games',
    path: ['gamesTime1']
  }).refine((data) => {
    // Validate match winner (must win 3 out of 5, or 4 out of 7)
    const maxGames = Math.max(data.gamesTime1.length, data.gamesTime2.length);
    
    // Count games won by each team
    let gamesWonTime1 = 0;
    let gamesWonTime2 = 0;
    
    for (let i = 0; i < data.gamesTime1.length; i++) {
      const score1 = data.gamesTime1[i];
      const score2 = data.gamesTime2[i];
      
      if (score1 >= 11 && (score1 - score2) >= 2) {
        gamesWonTime1++;
      } else if (score2 >= 11 && (score2 - score1) >= 2) {
        gamesWonTime2++;
      }
    }
    
    // Determine required games to win
    const gamesToWin = maxGames === 7 ? 4 : 3;
    
    // Check if match has a valid winner
    const team1Wins = gamesWonTime1 >= gamesToWin;
    const team2Wins = gamesWonTime2 >= gamesToWin;
    
    if (team1Wins && team2Wins) {
      return false;
    }
    
    // In a completed match, there must be a winner
    if ((gamesWonTime1 + gamesWonTime2) === maxGames && !team1Wins && !team2Wins) {
      return false;
    }
    
    // No more games should be played after a team has won
    // Only check this if all games have been played
    if ((team1Wins || team2Wins) && data.gamesTime1.length === maxGames) {
      // Check if there are more wins than needed
      if ((team1Wins && gamesWonTime1 > gamesToWin) || (team2Wins && gamesWonTime2 > gamesToWin)) {
        return false;
      }
    }
    
    return true;
  }, {
    message: 'O jogo deve ter um vencedor válido',
    path: ['gamesTime1']
  }).refine((data) => {
    // Validate that each game (except the last) has a winner
    const maxGames = Math.max(data.gamesTime1.length, data.gamesTime2.length);
    
    for (let i = 0; i < data.gamesTime1.length - 1; i++) {
      const score1 = data.gamesTime1[i];
      const score2 = data.gamesTime2[i];
      
      // Check if either team won the game
      const team1Won = score1 >= 11 && (score1 - score2) >= 2;
      const team2Won = score2 >= 11 && (score2 - score1) >= 2;
      
      // At least one team must have won the game
      if (!team1Won && !team2Won) {
        return false;
      }
    }
    return true;
  }, {
    message: 'Cada game (exceto o último) deve ter um vencedor com pelo menos 11 pontos e diferença mínima de 2 pontos',
    path: ['gamesTime1']
  }).refine((data) => {
    // Validate last game scoring rules
    const i = data.gamesTime1.length - 1;
    
    if (i >= 0) {
      const score1 = data.gamesTime1[i];
      const score2 = data.gamesTime2[i];
      
      // Check if either team won the game
      const team1Won = score1 >= 11 && (score1 - score2) >= 2;
      const team2Won = score2 >= 11 && (score2 - score1) >= 2;
      
      // For the last game, if scores are provided, ensure valid scoring
      if (score1 > 0 || score2 > 0) {
        // If the game is in progress, ensure valid scoring
        if (score1 < 11 && score2 < 11) {
          // Allow close games
          if (Math.abs(score1 - score2) >= 2 || (score1 + score2) === 0) {
            // This is ok for ongoing games
          } else if (score1 >= 11 || score2 >= 11) {
            // One team must win by at least 2 points
            if (!(team1Won || team2Won)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }, {
    message: 'Para vencer um game, um jogador precisa ter pelo menos 11 pontos e vantagem mínima de 2 pontos',
    path: ['gamesTime1']
  })
});