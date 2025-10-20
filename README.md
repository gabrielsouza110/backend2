# 🚀 Backend - Dashboard Esportivo Interclasse 2025

## 🔒 Segurança Aprimorada
- **Novos Recursos:**
  - Rate Limiting (100 requests/15min)
  - Headers de Segurança com Helmet
  - Validação de Schema com Zod
  - Logging Centralizado com Pino
  - **Sistema de Permissões Robusto** com tipos de admin
  - **Auditoria Completa** de todas as operações

## 👥 **Sistema de Gerenciamento de Usuários**

### **🔄 Para Desenvolvimento/Teste:**
- **Arquivo de Configuração:** `api/config/users.ts`
- **Script de Sincronização:** `npm run users:sync`
- **Uso:** Edite o arquivo e sincronize com o banco

### **🚀 Para Produção:**
- **API Segura:** `/api/admin/users`
- **Script de Configuração:** `npm run production:setup`
- **Uso:** Endpoints seguros com autenticação JWT

### **🔐 Tipos de Usuário:**
- **`admin_geral`:** Acesso completo ao sistema
- **`admin_turma`:** Gestão de turmas, times e jogos
- **`usuario`:** Acesso básico de visualização

---

## 📋 Principais Endpoints Atualizados
| Método | Endpoint                   | Descrição                        | Middleware           |
|--------|----------------------------|----------------------------------|----------------------|
| GET    | /api/usuarios              | Listar todos usuários            | requireAdminGeral    |
| GET    | /api/admin/users           | Listar usuários (admin)          | requireAdminGeral    |
| POST   | /api/admin/users           | Criar usuário (admin)            | requireAdminGeral    |
| PUT    | /api/admin/users/:id       | Atualizar usuário (admin)        | requireAdminGeral    |
| PATCH  | /api/admin/users/:id/deactivate | Desativar usuário (admin)    | requireAdminGeral    |
| PATCH  | /api/admin/users/:id/reactivate | Reativar usuário (admin)     | requireAdminGeral    |
| **POST**   | **/api/players** ⭐        | **Criar jogador (gênero obrigatório)** | **authenticateToken** |
| **PUT**    | **/api/players/:id** ⭐    | **Atualizar jogador (novos campos)**   | **authenticateToken** |

## 📚 **Documentação da API**

### **Documentação Principal**
- **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)**: Guia completo de testes da API ⭐ **NOVO**
- **[JOGADORES_API.md](./JOGADORES_API.md)**: Documentação específica da API de jogadores ⭐ **NOVO**
- **[ERROR_MESSAGES.md](./ERROR_MESSAGES.md)**: Lista completa de mensagens de erro ⭐ **NOVO**

### **Documentação Técnica**
- **[SELECTIVE_PLAYER_ASSOCIATION.md](./SELECTIVE_PLAYER_ASSOCIATION.md)**: Lógica de associação seletiva
- **[GAME_SCHEDULING.md](./GAME_SCHEDULING.md)**: Sistema de agendamento de jogos ⭐ **NOVO**
- **[EVENTS_API.md](./EVENTS_API.md)**: API de eventos de jogos

### **Resumo de Mudanças**
- **[API_CHANGES_SUMMARY.md](./API_CHANGES_SUMMARY.md)**: Resumo das mudanças na API de jogadores ⭐ **NOVO**

## 🛠️ Como Executar (Atualizado)
```bash
# Criar usuários de exemplo
npx prisma db seed

# Iniciar com logging detalhado
LOG_LEVEL=debug npm run dev

# Gerenciar usuários (desenvolvimento)
npm run users:sync      # Sincronizar usuários
npm run users:list      # Listar usuários do banco
npm run users:clean     # Verificar usuários não configurados

# Configuração de produção
npm run production:setup    # Configuração inicial (APENAS UMA VEZ)
npm run production:security # Verificar configuração de segurança
npm run production:cleanup  # Limpar usuários de teste
```

## 🧪 Exemplos de Usuários
**Roles implementadas:**
- `admin_geral`: Acesso completo
- `admin_turma`: Gestão de turmas/jogos
- `usuario`: Acesso básico

```json
// Seed example
{
  "email": "admin@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "admin_geral"
}
```

## 📊 Monitoramento
Novo sistema de logging armazena:
- Tentativas de acesso não autorizado
- Requisições críticas
- Erros de validação
- **Logs de auditoria** para todas as operações de usuários

**Arquivo de configuração atualizado:**
```typescript
// logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});
```

---

**Status do Sistema:** ✅ Todas as novas funcionalidades integradas e testadas

## 🚀 **Melhorias Recentes no Sistema de Jogos**

### **🎯 Máquina de Estados**
- **Transições validadas**: Sistema robusto que valida todas as mudanças de estado
- **Estados suportados**: AGENDADO → EM_ANDAMENTO → PAUSADO → FINALIZADO
- **Logs de auditoria**: Todas as transições são registradas com usuário e motivo

### **⚡ Cache Inteligente**
- **Cache automático**: Consultas frequentes são automaticamente cacheadas
- **Invalidação inteligente**: Cache é invalidado quando jogos são modificados
- **Estatísticas**: Endpoint para monitorar performance do cache
- **TTL configurável**: Diferentes tempos de vida para diferentes tipos de consulta

### **📅 Melhor Tratamento de Datas**
- **DateHelper**: Classe centralizada para manipulação de datas
- **Timezone aware**: Tratamento correto de fusos horários
- **Períodos do dia**: Filtros inteligentes (manhã, tarde, noite)
- **Consultas otimizadas**: Ranges de data mais precisos

### **🔄 Scheduler Aprimorado**
- **Verificação por minuto**: Ativação mais precisa de jogos
- **Notificações**: Sistema para alertar sobre jogos próximos
- **Configuração flexível**: Intervalos configuráveis
- **Logs detalhados**: Monitoramento completo das ativações

### **📊 Novos Endpoints do Sistema**
```bash
# Informações do sistema
GET /api/system/info

# Estatísticas do cache (admin)
GET /api/system/cache/stats

# Limpar cache (admin)
POST /api/system/cache/clear

# Estados de jogo disponíveis
GET /api/system/game-states

# Períodos do dia
GET /api/system/time-periods

# Forçar ativação de jogos (admin)
POST /api/system/scheduler/force-activation
```
Este é o backend da aplicação Dashboard Esportivo, construído com **Node.js**, **Express**, **TypeScript** e **Prisma ORM**.

## 📁 Estrutura de Pastas

A estrutura segue o padrão MVC, separando responsabilidades para facilitar manutenção e escalabilidade.

```
backend/
├── api/                        # 🎯 Core da API
│   ├── controllers/            # 🎮 Controladores (lógica de negócio)
│   │   └── adminController.ts  # 👥 Gerenciamento de usuários (produção)
│   ├── models/                 # 🗄️ Modelos de dados
│   ├── routes/                 # 🛣️ Definição das rotas
│   │   └── adminRoutes.ts      # 🔐 Rotas administrativas
│   ├── middlewares/            # 🔒 Middlewares (auth, logs, etc)
│   │   └── permissions.ts      # 🚫 Sistema de permissões
│   ├── services/               # ⚙️ Serviços auxiliares
│   ├── utils/                  # 🔧 Funções utilitárias
│   │   ├── responseHandler.ts  # 📤 Centralizador de respostas
│   │   ├── typeHelpers.ts      # 🔄 Conversores de tipos
│   │   └── permissionUtils.ts  # 🎯 Utilitários de permissões
│   ├── types/                  # 📋 Tipos TypeScript
│   │   └── admin.ts            # 👑 Tipos de admin e permissões
│   ├── constants/              # 🏷️ Constantes do sistema
│   │   └── admin.ts            # 🎭 Constantes de admin
│   ├── config/                 # ⚙️ Configurações
│   │   └── users.ts            # 👥 Configuração de usuários (dev)
│   ├── schemas/                # ✅ Schemas de validação Zod
│   └── index.ts                # 🚪 Ponto de entrada do servidor
├── scripts/                    # 🔧 Scripts utilitários
│   ├── sync-users.ts           # 🔄 Sincronização de usuários (dev)
│   └── production-setup.ts     # 🚀 Configuração de produção
├── prisma/                     # 🗃️ Configuração do banco de dados
│   └── schema.prisma           # 📋 Schema do banco
├── config.env                  # 🌍 Variáveis de ambiente
├── package.json                # 📦 Dependências e scripts
├── tsconfig.json               # ⚙️ Configuração TypeScript
├── server.js                   # 🟢 Servidor JavaScript (funcionando)
├── .gitignore                  # 🚫 Arquivos ignorados pelo Git
└── README.md                   # 📖 Este arquivo
```

---

## 🔐 **Sistema de Permissões e Admin**

### **Tipos de Usuário:**
```typescript
enum AdminType {
  ADMIN_GERAL = 'admin_geral',    // Nível 3 - Acesso completo
  ADMIN_TURMA = 'admin_turma',    // Nível 2 - Gestão de turmas
  USUARIO = 'usuario'             // Nível 1 - Acesso básico
}
```

### **Permissões por Tipo:**
- **`admin_geral`:** Todas as funcionalidades
- **`admin_turma`:** Gerenciar times, jogos, estatísticas
- **`usuario`:** Apenas visualização

### **Middleware de Permissões:**
- `requireAdminGeral` - Apenas admin geral
- `requireAdminTurma` - Admin geral ou admin turma
- `requireAnyAdmin` - Qualquer tipo de admin
- `requirePermission` - Permissão específica

---

## 🌐 **API de Gerenciamento de Usuários**

### **Base URL:** `/api/admin`

### **Endpoints Disponíveis:**
- `GET /users` - Listar todos os usuários
- `GET /users/stats` - Estatísticas dos usuários
- `POST /users` - Criar novo usuário
- `PUT /users/:id` - Atualizar usuário existente
- `PATCH /users/:id/deactivate` - Desativar usuário
- `PATCH /users/:id/reactivate` - Reativar usuário

### **Autenticação Necessária:**
- Token JWT válido
- Usuário com tipo `admin_geral`

---

## 🔧 **Scripts de Gerenciamento**

### **Desenvolvimento:**
```bash
# Sincronizar usuários do arquivo de configuração
npm run users:sync

# Listar usuários do banco
npm run users:list

# Verificar usuários não configurados
npm run users:clean

# Executar tudo (sync + list)
npm run users:all
```

### **Produção:**
```bash
# Verificar configuração de segurança
npm run production:security

# Configuração inicial (APENAS UMA VEZ)
npm run production:setup

# Limpeza de usuários de teste
npm run production:cleanup

# Executar todos os comandos
npm run production:all
```

---

## Fluxo da Aplicação

1. **Request** chega pela rota definida em `/api/routes`.
2. **Middleware** de autenticação (quando necessário) valida o token JWT.
3. **Middleware** de permissões verifica se o usuário tem acesso.
4. **Controller** recebe a requisição, executa validações e chama os **models** ou **services**.
5. **Services** realizam lógicas de negócio mais complexas e cálculos (ex: atualização de estatísticas).
6. **Models** acessam o banco de dados via Prisma Client.
7. **Response** é enviada ao cliente, normalmente em JSON.
8. **Logs de auditoria** são registrados para todas as operações críticas.

---

## 🎮 Controllers (`api/controllers/`)

Os **controllers** contêm a lógica de negócio das rotas da API. Cada controller é responsável por uma entidade específica:

### `adminController.ts` ⭐ **NOVO**
- **Função**: Gerenciamento seguro de usuários em produção
- **Rotas**: `/api/admin/users/*`
- **Responsabilidades**:
  - Listar usuários com agrupamento por tipo
  - Criar novos usuários com validações
  - Atualizar usuários existentes
  - Desativar/reativar usuários (soft delete)
  - Estatísticas dos usuários
  - Logs de auditoria para todas as operações

### `authController.ts`
- **Função**: Gerencia autenticação de usuários
- **Rotas**: Login, logout, verificação de token
- **Responsabilidades**:
  - Validar credenciais
  - Gerar tokens JWT
  - Verificar permissões
  - Retornar permissões baseadas no tipo de usuário

### `timesController.ts`
- **Função**: CRUD de times/turmas
- **Rotas**: GET /times, POST /times
- **Responsabilidades**:
  - Listar todos os times
  - Criar novos times
  - Incluir estatísticas e contadores

### `modalidadesController.ts`
- **Função**: CRUD de modalidades esportivas
- **Rotas**: GET /modalidades, POST /modalidades
- **Responsabilidades**:
  - Listar modalidades ativas
  - Criar novas modalidades
  - Incluir contadores de jogos/jogadores

### `jogosController.ts`
- **Função**: Gerenciamento de jogos/partidas
- **Rotas**: GET /jogos, POST /jogos, PATCH /jogos/:id/placar
- **Responsabilidades**:
  - Listar jogos com filtros
  - Criar novos jogos
  - Atualizar placares
  - Integrar com serviço de estatísticas

### `estatisticasController.ts`
- **Função**: Consulta de estatísticas e classificações
- **Rotas**: GET /classificacao/:modalidadeId, GET /artilheiros/:modalidadeId
- **Responsabilidades**:
  - Gerar classificação por modalidade
  - Listar artilheiros
  - Ordenar por pontos/gols

---

## 🗄️ Models (`api/models/`)

Cada model representa uma entidade do domínio esportivo, mapeando diretamente para o schema Prisma.

### `database.ts`
- **Função**: Configuração centralizada do Prisma Client
- **Responsabilidades**:
  - Instanciar PrismaClient
  - Gerenciar conexão com banco
  - Função de desconexão graceful

---

## Principais Endpoints

| Método | Endpoint                                   | Descrição                        | Middleware           |
|--------|--------------------------------------------|----------------------------------|----------------------|
| POST   | /auth/login                               | Login de usuário                 | -                    |
| GET    | /auth/permissions                         | Obter permissões do usuário      | authenticateToken    |
| GET    | /times                                    | Listar times                     | -                    |
| POST   | /times                                    | Criar time                       | authenticateToken    |
| GET    | /modalidades                              | Listar modalidades               | -                    |
| POST   | /modalidades                              | Criar modalidade                 | authenticateToken    |
| GET    | /jogos                                    | Listar jogos                     | -                    |
| POST   | /jogos                                    | Criar jogo                       | authenticateToken    |
| PATCH  | /jogos/:id/placar                         | Atualizar placar                 | authenticateToken    |
| GET    | /estatisticas/classificacao/:modalidadeId  | Classificação por modalidade     | -                    |
| GET    | /estatisticas/artilheiros/:modalidadeId    | Listar artilheiros               | -                    |
| **ADMIN** | **/api/admin/users**                    | **Gerenciar usuários**           | **requireAdminGeral** |

---

## Exemplos Práticos de Uso

### 1. Cadastro de Usuário

**Endpoint:** `POST /usuarios`

**Body esperado:**
```json
{
  "nome": "João Silva",
  "email": "joao@escola.com",
  "senha": "123456",
  "tipo": "admin" // ou "usuario" (opcional, padrão: usuario)
}
```
**Campos:**
- `nome` (string, obrigatório): Nome completo do usuário
- `email` (string, obrigatório): Email único do usuário
- `senha` (string, obrigatório): Senha em texto plano
- `tipo` (string, opcional): Tipo do usuário (`admin` ou `usuario`)

**Exemplo de resposta:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@escola.com",
  "tipo": "usuario",
  "ativo": true
}
```

---

### 2. Login de Usuário

**Endpoint:** `POST /auth/login`

**Body esperado:**
```json
{
  "email": "joao@escola.com",
  "senha": "123456"
}
```
**Resposta:**
```json
{
  "token": "<jwt-token>",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@escola.com",
    "tipo": "usuario",
    "ativo": true,
    "permissions": {
      "canManageUsers": false,
      "canManageAllTurmas": false,
      "canManageAllTimes": false,
      "canManageAllJogos": false,
      "canViewStatistics": false,
      "canManageEdicoes": false,
      "canManageModalidades": false,
      "canDeleteRecords": false
    }
  }
}
```

---

### 3. Gerenciar Usuários (Admin Geral)

**Endpoint:** `POST /api/admin/users`

**Headers:**
```http
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

**Body esperado:**
```json
{
  "nome": "Novo Professor",
  "email": "professor@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "admin_turma",
  "ativo": true
}
```

**Resposta:**
```json
{
  "user": {
    "id": 6,
    "nome": "Novo Professor",
    "email": "professor@escola.com",
    "tipo": "admin_turma",
    "ativo": true,
    "criadoEm": "2025-01-20T10:00:00.000Z"
  },
  "message": "Usuário criado com sucesso"
}
```

---

### 4. Cadastro de Jogador ⭐ **ATUALIZADO**

**Endpoint:** `POST /jogadores`

**Body esperado:**
```json
{
  "nome": "Maria Souza",
  "genero": "feminino",
  "turmaId": 2,
  "edicaoId": 1,
  "modalidades": [1, 2],
  "numeroCamisa": 10
}
```
**Campos:**
- `nome` (string, **obrigatório**): Nome do jogador
- `genero` (string, **obrigatório**): Gênero do jogador (`masculino`, `feminino`, `misto`)
- `turmaId` (int, **obrigatório**): ID da turma
- `edicaoId` (int, opcional): ID da edição (usa edição atual se omitido)
- `modalidades` (array de int, **obrigatório**): IDs das modalidades (mínimo 1, máximo 10)
- `numeroCamisa` (int, opcional): Número da camisa (1-99)

**Resposta:**
```json
{
  "id": 10,
  "nome": "Maria Souza",
  "genero": "Feminino",
  "turmaId": 2,
  "edicaoId": 1,
  "modalidades": [1, 2],
  "numeroCamisa": 10
}
```

> **Nota**: Gênero e modalidades são agora **obrigatórios** para novos jogadores. Jogadores existentes continuam funcionando normalmente.

---

### 5. Cadastro de Time

**Endpoint:** `POST /times`

**Body esperado:**
```json
{
  "nome": "Turma 9A",
  "modalidadeId": 1,
  "edicaoId": 1,
  "jogadores": [10, 11, 12] // IDs dos jogadores (opcional)
}
```
**Campos:**
- `nome` (string, obrigatório)
- `modalidadeId` (int, obrigatório)
- `edicaoId` (int, obrigatório)
- `jogadores` (array de int, opcional)

**Resposta:**
```json
{
  "id": 5,
  "nome": "Turma 9A",
  "modalidadeId": 1,
  "edicaoId": 1,
  "jogadores": [10, 11, 12]
}
```

---

### 6. Cadastro de Turma

**Endpoint:** `POST /turmas`

**Body esperado:**
```json
{
  "nome": "9A",
  "serie": 9,
  "turno": "Manhã",
  "edicaoId": 1
}
```
**Campos:**
- `nome` (string, obrigatório)
- `serie` (int, obrigatório)
- `turno` (string, obrigatório)
- `edicaoId` (int, opcional)

**Resposta:**
```json
{
  "id": 2,
  "nome": "9A",
  "serie": 9,
  "turno": "Manhã",
  "edicaoId": 1
}
```

---

### 7. Cadastro de Modalidade

**Endpoint:** `POST /modalidades`

**Body esperado:**
```json
{
  "nome": "Futsal",
  "icone": "futsal.png",
  "descricao": "Modalidade de futebol de salão",
  "genero": "masculino"
}
```
**Campos:**
- `nome` (string, obrigatório)
- `icone` (string, opcional)
- `descricao` (string, opcional)
- `genero` (string, obrigatório)

**Resposta:**
```json
{
  "id": 1,
  "nome": "Futsal",
  "icone": "futsal.png",
  "descricao": "Modalidade de futebol de salão",
  "genero": "masculino"
}
```

---

### 8. Cadastro de Jogo

**Endpoint:** `POST /jogos`

**Body esperado:**
```json
{
  "time1Id": 5,
  "time2Id": 6,
  "modalidadeId": 1,
  "dataHora": "2025-09-01T10:00:00Z",
  "local": "Quadra Principal",
  "descricao": "Semifinal",
  "edicaoId": 1
}
```
**Campos:**
- `time1Id` (int, obrigatório)
- `time2Id` (int, obrigatório)
- `modalidadeId` (int, obrigatório)
- `dataHora` (string, obrigatório, formato ISO)
- `local` (string, opcional)
- `descricao` (string, opcional)
- `edicaoId` (int, opcional)

**Resposta:**
```json
{
  "id": 20,
  "time1Id": 5,
  "time2Id": 6,
  "modalidadeId": 1,
  "dataHora": "2025-09-01T10:00:00Z",
  "local": "Quadra Principal",
  "descricao": "Semifinal",
  "edicaoId": 1
}
```

---

### 9. Atualizar Placar de Jogo

**Endpoint:** `PATCH /jogos/:id/placar`

**Body esperado:**
```json
{
  "placarTime1": 3,
  "placarTime2": 2
}
```
**Campos:**
- `placarTime1` (int, obrigatório)
- `placarTime2` (int, obrigatório)

**Resposta:**
```json
{
  "id": 20,
  "placarTime1": 3,
  "placarTime2": 2
}
```

---

## Autenticação e Segurança

- Utiliza **JWT** para autenticação de rotas protegidas.
- O middleware `authenticateToken` verifica a validade do token enviado no header `Authorization`.
- **Sistema de permissões robusto** com diferentes níveis de acesso.
- **Middleware de permissões** para controle granular de acesso.
- Tokens inválidos ou ausentes resultam em erro 401/403.
- **Logs de auditoria** para todas as operações críticas.
- Recomenda-se usar HTTPS em produção.

---

## Modelos de Dados (Prisma)

Os principais modelos definidos em `prisma/schema.prisma` são:

- **Time**: times/turmas participantes
- **Modalidade**: esportes disponíveis
- **Jogo**: partidas/jogos
- **Jogador**: atletas
- **Usuario**: usuários do sistema
- **EstatisticaTime**: estatísticas por time/modalidade
- **EstatisticaJogador**: estatísticas individuais

### Exemplo de Relação (Time)
```prisma
model Time {
  id              Int                @id @default(autoincrement())
  nome            String
  edicaoId        Int?
  edicao          Edicao?            @relation(fields: [edicaoId], references: [id])
  timeJogadores   Jogador[]
  jogoTimes       Jogo[]
  estatisticasTimes EstatisticaTime[]
}
```
- Relações válidas: `edicao`, `timeJogadores`, `jogoTimes`, `estatisticasTimes`.
- Campos obrigatórios: `nome`. Opcional: `edicaoId`.

---

## 🛣️ Routes (`api/routes/`)

As **rotas** definem os endpoints da API e conectam URLs aos controllers:

### `index.ts`
- **Função**: Roteador principal da API
- **Responsabilidades**:
  - Centralizar todas as rotas
  - Rota de health check
  - Organizar prefixos (/auth, /times, etc)

### `adminRoutes.ts` ⭐ **NOVO**
- **Rotas**: `/api/admin/users/*`
- **Métodos**: GET, POST, PUT, PATCH
- **Middleware**: `authenticateToken` + `requireAdminGeral`
- **Responsabilidades**: Gerenciamento seguro de usuários

### `authRoutes.ts`
- **Rotas**: `/auth/login`, `/auth/permissions`
- **Métodos**: POST, GET
- **Middleware**: `authenticateToken` para rotas protegidas

### `timesRoutes.ts`
- **Rotas**: `/times`
- **Métodos**: GET (público), POST (autenticado)
- **Middleware**: `authenticateToken` para POST

### `modalidadesRoutes.ts`
- **Rotas**: `/modalidades`
- **Métodos**: GET (público), POST (autenticado)
- **Middleware**: `authenticateToken` para POST

### `jogosRoutes.ts`
- **Rotas**: `/jogos`, `/jogos/:id/placar`
- **Métodos**: GET (público), POST/PATCH (autenticado)
- **Middleware**: `authenticateToken` para modificações

### `estatisticasRoutes.ts`
- **Rotas**: `/estatisticas/classificacao/:modalidadeId`, `/estatisticas/artilheiros/:modalidadeId`
- **Métodos**: GET (público)
- **Middleware**: Nenhum

---

## 🔒 Middlewares (`api/middlewares/`)

### `auth.ts`
- **Função**: Middleware de autenticação JWT
- **Responsabilidades**:
  - Verificar token no header Authorization
  - Validar JWT com secret
  - Adicionar dados do usuário ao request
  - Retornar 401/403 para tokens inválidos

### `permissions.ts` ⭐ **NOVO**
- **Função**: Sistema de permissões e autorização
- **Responsabilidades**:
  - Verificar tipos de usuário
  - Controlar acesso baseado em permissões
  - Middlewares específicos para cada tipo de admin
  - Validação de hierarquia de permissões

### `validation.ts`
- **Função**: Validação de dados com Zod
- **Responsabilidades**:
  - Validar body, query e params das requisições
  - Retornar erros de validação formatados
  - Integrar com schemas Zod

---

## ⚙️ Services (`api/services/`)

Os **services** contêm lógica de negócio complexa que pode ser reutilizada:

### `estatisticasService.ts`
- **Função**: Cálculo e atualização de estatísticas
- **Classe**: `EstatisticasService`
- **Método principal**: `atualizarEstatisticasTime(jogo)`
- **Responsabilidades**:
  - Calcular pontos (vitória=3, empate=1, derrota=0)
  - Atualizar estatísticas de ambos os times
  - Usar upsert para criar/atualizar registros
  - Manter histórico de jogos, vitórias, empates, derrotas

---

## 🔧 Utils (`api/utils/`)

### `responseHandler.ts` ⭐ **NOVO**
- **Função**: Centralizar respostas da API
- **Métodos**: success, created, error, badRequest, notFound, unauthorized, forbidden, conflict
- **Responsabilidades**: Padronizar formato de respostas e códigos de status

### `typeHelpers.ts` ⭐ **NOVO**
- **Função**: Conversores seguros de tipos
- **Métodos**: toInt, toDate, toArray, toBoolean
- **Responsabilidades**: Converter parâmetros de requisição de forma segura

### `permissionUtils.ts` ⭐ **NOVO**
- **Função**: Utilitários para sistema de permissões
- **Métodos**: hasPermission, hasMinHierarchy, filterResourcesByPermission
- **Responsabilidades**: Verificar permissões e filtrar recursos baseado no usuário

---

## 🚪 Arquivos Principais

### `api/index.ts` (TypeScript - Atualizado)
- **Status**: ✅ Integrado e funcionando
- **Função**: Ponto de entrada limpo do servidor
- **Responsabilidades**:
  - Configurar Express app
  - Aplicar middlewares globais (CORS, Helmet, Rate Limiting)
  - Registrar rotas da API
  - Configurar graceful shutdown

### `server.js` (JavaScript - Funcionando)
- **Status**: ✅ Ativo e funcionando
- **Função**: Servidor simplificado para desenvolvimento
- **Porta**: 3001
- **Endpoint**: `/api/health`

### `config.env`
- **Função**: Variáveis de ambiente
- **Configurações**:
  - `PORT=3001`
  - `DATABASE_URL="file:./dev.db"` (SQLite)
  - `JWT_SECRET="sua_chave_secreta_super_forte_aqui"`
  - `NODE_ENV="development"`

### `package.json`
- **Scripts disponíveis**:
  - `npm run dev` - Inicia servidor (usa server.js)
  - `npm run build` - Compila TypeScript
  - `npm run prisma:generate` - Gera cliente Prisma
  - `npm run prisma:migrate` - Executa migrações
  - `npm run prisma:studio` - Interface visual do banco
  - **Usuários (Dev):** `npm run users:sync`, `npm run users:list`
  - **Produção:** `npm run production:setup`, `npm run production:security`

---

## 🗃️ Banco de Dados (Prisma)

### `prisma/schema.prisma`
- **Provider**: SQLite (desenvolvimento)
- **Modelos principais**:
  - `Time` - Times/turmas participantes
  - `Modalidade` - Esportes disponíveis
  - `Jogo` - Partidas/jogos
  - `Jogador` - Atletas
  - `Usuario` - Usuários do sistema
  - `EstatisticaTime` - Estatísticas por time/modalidade
  - `EstatisticaJogador` - Estatísticas individuais

---

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Gerar cliente Prisma**:
   ```bash
   npm run prisma:generate
   ```

3. **Executar migrações** (se necessário):
   ```bash
   npm run prisma:migrate
   ```

4. **Configurar usuários iniciais**:
   ```bash
   # Desenvolvimento
   npm run users:sync
   
   # Produção
   npm run production:setup
   ```

5. **Iniciar servidor**:
   ```bash
   npm run dev
   ```

6. **Testar API**:
   - Health check: http://localhost:3001/api/health
   - Login: POST /api/auth/login

---

## 🔄 Status do Projeto

- ✅ **Estrutura organizada** - Arquitetura MVC implementada
- ✅ **Servidor funcionando** - JavaScript ativo na porta 3001
- ✅ **Integração TypeScript** - Estrutura integrada e funcionando
- ✅ **Banco de dados** - Schema criado e migrações funcionando
- ✅ **Autenticação** - Middleware JWT implementado e testado
- ✅ **CRUD completo** - Controllers criados e integrados
- ✅ **Sistema de permissões** - Admin types e middlewares implementados
- ✅ **Gerenciamento de usuários** - Sistema completo para dev e produção
- ✅ **Validação com Zod** - Schemas implementados em todas as rotas
- ✅ **Logs de auditoria** - Sistema completo de auditoria
- ✅ **Rate limiting e segurança** - Helmet e rate limiting implementados

---

## 📝 Próximos Passos

1. ✅ ~~Implementar sistema de permissões~~
2. ✅ ~~Criar API de gerenciamento de usuários~~
3. ✅ ~~Implementar validação com Zod~~
4. ✅ ~~Adicionar logs de auditoria~~
5. ✅ ~~Configurar segurança (Helmet, Rate Limiting)~~
6. 🔄 **Implementar testes automatizados**
7. 🔄 **Conectar com frontend**
8. 🔄 **Deploy em produção**

---

## 🚫 **Arquivos Ignorados pelo Git**

O sistema inclui arquivos sensíveis e de desenvolvimento que **NÃO** são versionados:

### **Scripts e Configurações:**
- `scripts/sync-users.ts` - Sincronização de usuários (dev)
- `scripts/production-setup.ts` - Configuração de produção
- `api/config/users.ts` - Configuração de usuários (dev)

### **Testes:**
- `__tests__/`, `tests/` - Pastas de testes
- `*.test.js`, `*.test.ts` - Arquivos de teste
- `jest.config.js` - Configuração do Jest

### **Arquivos Temporários:**
- `*.tmp`, `*.temp` - Arquivos temporários
- `.cache/` - Cache do sistema
- `audit.log`, `security.log` - Logs de auditoria

---

**Desenvolvido para o Dashboard Esportivo - Interclasse 2025** 🏆