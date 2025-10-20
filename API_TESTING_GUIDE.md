# 🧪 Dashboard Esportivo - Guia de Testes da API

## 📋 **Informações da Aplicação**

- **URL Base**: <https://backend-24oo.onrender.com> (Produção) | `http://localhost:3000` (Desenvolvimento)
- **Ambiente**: Production/Development
- **Database**: PostgreSQL (populado com seed)
- **Autenticação**: JWT Bearer Token

## 🚀 **Melhorias Recentes Implementadas**

### ✅ **Sistema de Gerenciamento de Jogos Aprimorado**
- **Máquina de Estados**: Controle rigoroso de transições de status de jogos
- **Cache Inteligente**: Sistema de cache com TTL e invalidação automática
- **Scheduler Automático**: Ativação automática de jogos por minuto
- **Tratamento de Datas**: Suporte robusto a timezone e múltiplos formatos
- **Filtros Avançados**: Filtros por período do dia (manhã, tarde, noite)

### ✅ **Novos Endpoints do Sistema**
- `/api/system/info` - Informações do sistema e cache
- `/api/system/time-periods` - Períodos do dia disponíveis
- `/api/system/game-states` - Estados de jogo e transições válidas
- `/api/system/cache/stats` - Estatísticas do cache (admin)

### ✅ **Rotas de Atualização de Jogos**
- `PUT /api/games/:id` - Atualização completa de jogos
- `PATCH /api/games/:id/reschedule` - Reagendamento rápido (NOVO!)

### ✅ **Scripts de Migração de Dados**
- **Migração de Gênero**: `npm run migrate-gender-inference` - Infere gênero baseado nas modalidades
- **Migração de Modalidades**: `npm run migrate-player-modalities` - Adiciona modalidades padrão para jogadores sem modalidades
- **Migração Completa**: `npm run migrate-players` - Executa ambas as migrações em sequência

### ✅ **Validações Robustas**
- Parsing de datas com suporte a timezone
- Validação de estados de jogo
- Detecção de conflitos de horário
- Logs de auditoria completos

### ✅ **Otimizações de Performance**
- **Modo Resumo**: Endpoints com parâmetro `summary` para respostas enxutas
- **Paginação**: Endpoints com paginação para evitar carregamento de datasets inteiros
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados
- **Endpoints Granulares**: Dashboard com endpoints separados para diferentes blocos de dados
- **Endpoints Batch**: Endpoint `/api/batch` para múltiplas consultas em uma única requisição
- **Projeção de Campos**: Endpoints com parâmetro `fields` para filtrar campos retornados

### ✅ **Otimizações para Rotas de Alto Risco**
- **Modo Resumo para Jogos**: Endpoints de listagem de jogos com parâmetro `summary=true` para respostas enxutas
- **Paginação para Jogadores**: Endpoint de listagem de jogadores com paginação (`page` e `limit`)
- **Modo Resumo para Eventos**: Endpoint de eventos com parâmetro `summary=true` para respostas enxutas
- **Endpoints Granulares do Dashboard**: Endpoints separados para diferentes blocos de dados do dashboard
- **Modo Resumo para Usuários Admin**: Endpoint de listagem de usuários com parâmetro `summary=true` para respostas enxutas
- **Suporte a ETag/Last-Modified**: Todos os endpoints passíveis de cache agora suportam ETag e Last-Modified
- **Projeção de Campos**: Endpoints com parâmetro `fields` para filtrar campos retornados

---

## 🔧 **Scripts de Migração de Dados**

### **📋 Contexto**

O sistema foi atualizado para tornar obrigatórios os campos `genero` e `modalidades` para jogadores. Os scripts de migração garantem que jogadores existentes tenham essas informações preenchidas automaticamente.

### **🔄 Script de Migração de Modalidades**: `npm run migrate-player-modalities`

**Propósito**: Adiciona modalidades padrão para jogadores que não possuem nenhuma modalidade associada.

**Comandos Disponíveis**:
```bash
# Análise (dry run) - não aplica mudanças
npm run migrate-player-modalities analyze

# Aplicar mudanças no banco de dados
npm run migrate-player-modalities apply

# Validar estado atual dos jogadores
npm run migrate-player-modalities validate
```

**Lógica de Seleção de Modalidades**:
- **Jogadores com gênero definido** → Modalidades compatíveis com o gênero
- **Jogadores sem gênero** → Modalidades mistas (se disponíveis)
- **Fallback** → Primeira modalidade disponível no sistema

**Compatibilidade de Gênero**:
- **Masculino** → Modalidades Masculinas + Mistas
- **Feminino** → Modalidades Femininas + Mistas
- **Misto** → Todas as modalidades

**Exemplo de Saída**:
```bash
🔍 Jogador 277 (Flavin Silva): Sugeridas modalidades [BASQUETE (Misto)] - Modalidades mistas (jogador sem gênero definido)

📊 Estatísticas da Migração de Modalidades:
🔍 Jogadores analisados: 1
✅ Jogadores com modalidades já definidas: 0
❓ Jogadores sem modalidades: 1
➕ Modalidades adicionadas: 1
❌ Erros: 0
```

### **🎭 Script de Migração de Gênero**: `npm run migrate-gender-inference`

**Propósito**: Infere e define o gênero para jogadores baseado em suas modalidades associadas.

**Comandos Disponíveis**:
``bash
# Análise (dry run) - não aplica mudanças
npm run migrate-gender-inference analyze

# Aplicar mudanças no banco de dados
npm run migrate-gender-inference apply

# Validar estado atual dos jogadores
npm run migrate-gender-inference validate
```

**Lógica de Inferência**:
- **Modalidades de gêneros diferentes** → `Misto`
- **Modalidades Misto** → `Misto`
- **Modalidades do mesmo gênero** → Esse gênero
- **Sem modalidades** → `Misto` (padrão)

### **🚀 Processo Recomendado de Migração**

**1. Análise Inicial**:
```bash
# Verificar estado atual
npm run migrate-player-modalities validate
npm run migrate-gender-inference validate

# Analisar mudanças (sem aplicar)
npm run migrate-gender-inference analyze
npm run migrate-player-modalities analyze
```

**2. Aplicação das Migrações**:
```bash
# Primeiro: migrar gênero (baseado nas modalidades existentes)
npm run migrate-gender-inference apply

# Segundo: adicionar modalidades para jogadores sem modalidades
npm run migrate-player-modalities apply
```

**3. Validação Final**:
```bash
# Verificar se todos os jogadores têm gênero e modalidades
npm run migrate-player-modalities validate
npm run migrate-gender-inference validate
```

### **⚠️ Considerações Importantes**

- **Sempre execute `analyze` primeiro** para ver o que será alterado
- **Crie backups** antes de aplicar mudanças em produção
- **Teste em ambiente de desenvolvimento** antes de aplicar em produção
- **Ordem das migrações**: Execute primeiro a migração de gênero, depois a de modalidades
- **Compatibilidade**: Jogadores existentes continuam funcionando normalmente

### **📊 Validação do Sistema**

Após as migrações, todos os novos jogadores devem ter:
- ✅ **Gênero obrigatório**: `masculino`, `feminino` ou `misto`
- ✅ **Modalidades obrigatórias**: Pelo menos uma modalidade associada
- ✅ **Compatibilidade**: Modalidades compatíveis com o gênero do jogador

---

## 🔍 **1. Health Check (Público)**

### **Endpoint**: `GET /api/health`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "status": "UP",
  "timestamp": "2025-08-31T12:31:29.227Z",
  "uptime": 42.95,
  "environment": "production",
  "version": "1.0.0",
  "database": {
    "status": "healthy",
    "latency": 103
  }
}
```

## 🚀 **19. Otimizações de Performance para Rotas de Alto Risco**

### **Visão Geral**

Para melhorar o desempenho e reduzir a carga nas rotas com maior risco de sobrecarga, implementamos várias otimizações:

1. **Modo Resumo**: Endpoints com parâmetro `summary=true` para respostas enxutas
2. **Paginação**: Endpoints com paginação para evitar carregamento de datasets inteiros
3. **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados
4. **Endpoints Granulares**: Dashboard com endpoints separados para diferentes blocos de dados
5. **Endpoints Batch**: Endpoint `/api/batch` para múltiplas consultas em uma única requisição
6. **Projeção de Campos**: Endpoints com parâmetro `fields` para filtrar campos retornados

### **Rotas Otimizadas**

#### **1. Listagem de Jogos (`GET /api/games*`)**
- **Modo Resumo**: Use `summary=true` para retornar apenas campos essenciais
- **Projeção de Campos**: Use `fields=id,dataHora,local,status` para filtrar campos específicos
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados

#### **2. Listagem de Jogadores (`GET /api/players`)**
- **Paginação**: Use `page` e `limit` para paginação (padrão: page=1, limit=20)
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados

#### **3. Eventos de Jogos (`GET /api/jogos/{id}/events`)**
- **Modo Resumo**: Use `summary=true` para retornar apenas campos essenciais
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados

#### **4. Dashboard de Estatísticas (`GET /api/statistics/dashboard*`)**
- **Endpoints Granulares**:
  - `GET /api/statistics/dashboard/summary` - Resumo do dashboard
  - `GET /api/statistics/dashboard/top-scorers` - Artilheiros
  - `GET /api/statistics/dashboard/chart-data` - Dados de gráficos
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados

#### **5. Listagem de Usuários Admin (`GET /api/admin/users`)**
- **Modo Resumo**: Use `summary=true` para retornar apenas campos essenciais
- **ETag/Last-Modified**: Suporte a cache HTTP para reduzir transferência de dados

### **Exemplos de Uso**

#### **Modo Resumo para Jogos**
```bash
# Listagem normal (com todos os campos)
GET /api/games/today

# Listagem enxuta (apenas campos essenciais)
GET /api/games/today?summary=true
```

#### **Paginação para Jogadores**
``bash
# Primeira página com 20 itens
GET /api/players

# Segunda página com 10 itens
GET /api/players?page=2&limit=10
```

#### **Endpoints Granulares do Dashboard**
```bash
# Obter apenas o resumo do dashboard
GET /api/statistics/dashboard/summary

# Obter apenas os artilheiros
GET /api/statistics/dashboard/top-scorers

# Obter apenas dados de gráficos
GET /api/statistics/dashboard/chart-data
```

#### **Endpoint Batch para Múltiplas Consultas**
```bash
# Obter jogos, jogadores e times em uma única requisição
POST /api/batch
Body: {
  "queries": [
    {"type": "games", "params": {"filters": {"modalidadeId": 1}}},
    {"type": "players", "params": {"filters": {"edicaoId": 2}}},
    {"type": "teams", "params": {"id": 1}}
  ]
}
```

#### **Projeção de Campos**
```bash
# Obter apenas campos específicos dos jogos
GET /api/games/today?fields=id,dataHora,local,status
```

### **Benefícios das Otimizações**

- **Redução de Largura de Banda**: Respostas enxutas reduzem significativamente o tamanho dos dados transferidos
- **Melhor Desempenho**: Menos dados = carregamento mais rápido e menor tempo de resposta
- **Menor Carga no Servidor**: Menos processamento necessário para gerar respostas menores
- **Cache Eficiente**: ETags permitem respostas 304 (Not Modified) que são muito menores
- **Flexibilidade**: Clientes podem solicitar apenas os dados que realmente precisam
- **Experiência do Usuário**: Interface mais responsiva devido a tempos de carregamento mais rápidos

```

---

## 🏆 **2. Edições (Público)**

### **Listar Edições**: `GET /api/editions`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
[
  {
    "id": 2,
    "ano": 2025,
    "nome": "Interclasse 2025",
    "descricao": "Campeonato Interclasse do Ensino Médio 2025",
    "ativa": true,
    "dataInicio": "2025-03-01T00:00:00.000Z",
    "dataFim": "2025-11-30T00:00:00.000Z"
  }
]
```

### **Obter Edição Atual (Dinâmica)**: `GET /api/editions/current`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "id": 2,
  "ano": 2025,
  "nome": "Interclasse 2025",
  "descricao": "Campeonato Interclasse do Ensino Médio 2025",
  "ativa": true,
  "dataInicio": "2025-03-01T00:00:00.000Z",
  "dataFim": "2025-11-30T00:00:00.000Z"
}
```

> **Nota**: Este endpoint retorna automaticamente a edição do ano corrente. Se não existir, cria uma nova edição para o ano atual.

### **Obter Edição por ID**: `GET /api/editions/{id}`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

---

## 🔐 **3. Autenticação**

### **Login**: `POST /api/auth/login`

**Headers**:

```json
{
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "email": "admin@escola.com",
  "senha": "admin123"
}
```

**Resposta Esperada**:

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Coordenador Geral",
    "email": "admin@escola.com",
    "tipo": "admin_geral",
    "ativo": true
  }
}
```

### **Header para Requisições Autenticadas**

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### **Registrar Usuário (Admin)**: `POST /api/auth/register`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (Admin Geral criando outro Admin Geral):

```json
{
  "nome": "Novo Coordenador",
  "email": "coordenador2@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "admin_geral"
}
```

**Body** (Admin Geral criando Admin Turma):

```json
{
  "nome": "Professor de Turma",
  "email": "professor.turma@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "admin_turma",
  "turmaId": 1
}
```

**Body** (Admin Turma criando usuário para sua própria turma):

```json
{
  "nome": "Novo Jogador",
  "email": "jogador1a@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "jogador",
  "turmaId": 1
}
```

> **Nota**: Apenas administradores podem registrar usuários. Admin Turma só pode criar usuários para sua própria turma.

---

## ⚽ **4. Modalidades (Público)**

### **Listar Modalidades**: `GET /api/modalities`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
[
  {
    "id": 1,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Masculino",
    "icone": "⚽",
    "descricao": "Futsal categoria masculina"
  },
  {
    "id": 2,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Feminino",
    "icone": "⚽",
    "descricao": "Futsal categoria feminina"
  },
  {
    "id": 3,
    "nome": "VOLEI",
    "tipo": "VOLEI",
    "genero": "Misto",
    "icone": " volunte",
    "descricao": "Vôlei categoria mista"
  }
]
```

> **Nota**: As modalidades agora usam um campo `tipo` do tipo enum (FUTSAL, VOLEI, etc.) e um campo separado `genero` para especificar o gênero.

### **Obter Modalidade por ID**: `GET /api/modalities/{id}`

**Headers**:

```json
{}
```

**Body**:

``json
```

---

## 🔑 **5. Turmas (Admin Turma)**

### **Listar Turmas**: `GET /api/turmas`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "nome": "Turma 1A",
    "ano": 2025,
    "ativo": true,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Obter Turma por ID**: `GET /api/turmas/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Criar Turma**: `POST /api/turmas`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Turma 1B",
  "ano": 2025
}

```

### **Atualizar Turma**: `PUT /api/turmas/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Turma 2A",
  "ano": 2026
}

```

### **Excluir Turma**: `DELETE /api/turmas/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **6. Jogadores (Admin Turma)**

### **Listar Jogadores**: `GET /api/jogadores`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "nome": "Jogador 1A",
    "email": "jogador1a@escola.com",
    "tipo": "jogador",
    "ativo": true,
    "turmaId": 1,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Obter Jogador por ID**: `GET /api/jogadores/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Criar Jogador**: `POST /api/jogadores`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Jogador 2A",
  "email": "jogador2a@escola.com",
  "senha": "SenhaForte123!",
  "tipo": "jogador",
  "turmaId": 1
}

```

### **Atualizar Jogador**: `PUT /api/jogadores/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Jogador 2B",
  "email": "jogador2b@escola.com",
  "ativo": false
}

```

### **Excluir Jogador**: `DELETE /api/jogadores/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **7. Jogos (Admin Turma)**

### **Listar Jogos**: `GET /api/jogos`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "data": "2025-10-01T10:00:00.000Z",
    "local": "Quadra 1",
    "modalidadeId": 1,
    "equipe1Id": 1,
    "equipe2Id": 2,
    "resultado": "1-0",
    "ativo": true,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Obter Jogo por ID**: `GET /api/jogos/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Criar Jogo**: `POST /api/jogos`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "data": "2025-10-02T10:00:00.000Z",
  "local": "Quadra 2",
  "modalidadeId": 1,
  "equipe1Id": 1,
  "equipe2Id": 2,
  "resultado": "2-1",
  "ativo": true
}

```

### **Atualizar Jogo**: `PUT /api/jogos/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "data": "2025-10-03T10:00:00.000Z",
  "local": "Quadra 3",
  "modalidadeId": 1,
  "equipe1Id": 1,
  "equipe2Id": 2,
  "resultado": "3-2",
  "ativo": true
}

```

### **Excluir Jogo**: `DELETE /api/jogos/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **8. Equipes (Admin Turma)**

### **Listar Equipes**: `GET /api/equipes`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "nome": "Equipe 1",
    "turmaId": 1,
    "modalidadeId": 1,
    "ativo": true,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Obter Equipe por ID**: `GET /api/equipes/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Criar Equipe**: `POST /api/equipes`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Equipe 2",
  "turmaId": 1,
  "modalidadeId": 1,
  "ativo": true
}

```

### **Atualizar Equipe**: `PUT /api/equipes/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Equipe 3",
  "turmaId": 1,
  "modalidadeId": 1,
  "ativo": true
}

```

### **Excluir Equipe**: `DELETE /api/equipes/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **9. Jogadores por Equipe (Admin Turma)**

### **Listar Jogadores de uma Equipe**: `GET /api/equipes/{equipeId}/jogadores`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "nome": "Jogador 1A",
    "email": "jogador1a@escola.com",
    "tipo": "jogador",
    "ativo": true,
    "turmaId": 1,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Adicionar Jogador a uma Equipe**: `POST /api/equipes/{equipeId}/jogadores/{jogadorId}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Remover Jogador de uma Equipe**: `DELETE /api/equipes/{equipeId}/jogadores/{jogadorId}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **10. Jogos por Equipe (Admin Turma)**

### **Listar Jogos de uma Equipe**: `GET /api/equipes/{equipeId}/jogos`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "data": "2025-10-01T10:00:00.000Z",
    "local": "Quadra 1",
    "modalidadeId": 1,
    "equipe1Id": 1,
    "equipe2Id": 2,
    "resultado": "1-0",
    "ativo": true,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

---

## 🔑 **11. Jogadores por Jogo (Admin Turma)**

### **Listar Jogadores de um Jogo**: `GET /api/jogos/{jogoId}/jogadores`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
[
  {
    "id": 1,
    "nome": "Jogador 1A",
    "email": "jogador1a@escola.com",
    "tipo": "jogador",
    "ativo": true,
    "turmaId": 1,
    "criadoEm": "2025-09-15T10:00:00.000Z",
    "atualizadoEm": "2025-09-15T10:00:00.000Z"
  }
]

```

### **Adicionar Jogador a um Jogo**: `POST /api/jogos/{jogoId}/jogadores/{jogadorId}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

### **Remover Jogador de um Jogo**: `DELETE /api/jogos/{jogoId}/jogadores/{jogadorId}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

---

## 🔑 **12. Administração de Usuários (Apenas Admin Geral)**

### **Listar Usuários**: `GET /api/admin/users`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Query Parameters**:
- `summary` (opcional): Modo resumo (true/false) - Retorna apenas campos essenciais (id, nome, tipo, ativo)

**Body**:

``json
{}
```

**Resposta Esperada (Completa)**:

```json
{
  "total": 3,
  "usersByType": {
    "admin_geral": [
      {
        "id": 1,
        "nome": "Admin Geral",
        "email": "admin@escola.com",
        "tipo": "admin_geral",
        "ativo": true,
        "criadoEm": "2025-09-15T10:00:00.000Z",
        "ultimoLogin": "2025-09-16T10:00:00.000Z",
        "turmaId": null
      }
    ],
    "admin_turma": [
      {
        "id": 2,
        "nome": "Professor 1A",
        "email": "professor1a@escola.com",
        "tipo": "admin_turma",
        "ativo": true,
        "criadoEm": "2025-09-15T10:00:00.000Z",
        "ultimoLogin": "2025-09-16T10:00:00.000Z",
        "turmaId": 1
      }
    ]
  },
  "message": "Usuários listados com sucesso"
}
```

**Resposta Esperada (Modo Resumo)** - `GET /api/admin/users?summary=true`:

```json
{
  "total": 3,
  "usersByType": {
    "admin_geral": [
      {
        "id": 1,
        "nome": "Admin Geral",
        "tipo": "admin_geral",
        "ativo": true
      }
    ],
    "admin_turma": [
      {
        "id": 2,
        "nome": "Professor 1A",
        "tipo": "admin_turma",
        "ativo": true
      }
    ]
  },
  "message": "Usuários listados com sucesso (resumo)"
}
```

### **Obter Estatísticas de Usuários**: `GET /api/admin/users/stats`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

**Resposta Esperada**:

``json
{
  "total": 3,
  "ativos": 3,
  "inativos": 0,
  "porTipo": {
    "admin_geral": 1,
    "admin_turma": 1,
    "jogador": 1
  },
  "ultimoLogin": "2025-09-16T10:00:00.000Z",
  "message": "Estatísticas de usuários obtidas com sucesso"
}
```

### **Obter Usuário por ID**: `GET /api/admin/users/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
```

**Resposta Esperada**:

``json
{
  "id": 1,
  "nome": "Admin Geral",
  "email": "admin@escola.com",
  "tipo": "admin_geral",
  "ativo": true,
  "criadoEm": "2025-09-15T10:00:00.000Z",
  "ultimoLogin": "2025-09-16T10:00:00.000Z",
  "turmaId": null
}

```

### **Atualizar Usuário**: `PUT /api/admin/users/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{
  "nome": "Admin Geral Atualizado",
  "email": "admin.atualizado@escola.com",
  "ativo": false
}

```

### **Excluir Usuário**: `DELETE /api/admin/users/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🏆 **5. Groups and Tournament Management (Admin)**

### **List Groups**: `GET /api/groups/groups`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Query Parameters**:
- `modalidadeId` (required): Modality ID
- `genero` (required): Gender ("Masculino", "Feminino", "Misto")
- `edicaoId` (optional): Edition ID

**Example**: `GET /api/groups/groups?modalidadeId=1&genero=Masculino&edicaoId=1`

**Expected Response**:

```json
{
  "grupos": ["A", "B"]
}
```

### **Get Group Table**: `GET /api/groups/groups/table`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Query Parameters**:
- `modalidadeId` (required): Modality ID
- `genero` (required): Gender ("Masculino", "Feminino", "Misto")
- `grupo` (required): Group letter ("A", "B", "C")
- `edicaoId` (optional): Edition ID

**Example**: `GET /api/groups/groups/table?modalidadeId=1&genero=Masculino&grupo=A&edicaoId=1`

**Expected Response**:

```json
{
  "tabela": [
    {
      "posicao": 1,
      "timeId": 15,
      "time": {
        "id": 15,
        "nome": "Team A",
        "grupo": "A"
      },
      "pontos": 9,
      "jogos": 3,
      "vitorias": 3,
      "empates": 0,
      "derrotas": 0,
      "golsPro": 8,
      "golsContra": 2,
      "saldoGols": 6
    }
  ]
}
```

### **Get Qualified Teams**: `GET /api/groups/groups/qualified`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Query Parameters**:
- `modalidadeId` (required): Modality ID
- `genero` (required): Gender ("Masculino", "Feminino", "Misto")
- `grupo` (required): Group letter ("A", "B", "C")
- `quantidade` (optional): Number of qualified teams (default: 2)
- `edicaoId` (optional): Edition ID

**Example**: `GET /api/groups/groups/qualified?modalidadeId=1&genero=Masculino&grupo=A&quantidade=2&edicaoId=1`

**Expected Response**:

```json
{
  "classificados": [
    {
      "posicao": 1,
      "timeId": 15,
      "time": { "id": 15, "nome": "Team A" },
      "pontos": 9
    },
    {
      "posicao": 2,
      "timeId": 16,
      "time": { "id": 16, "nome": "Team B" },
      "pontos": 6
    }
  ]
}
```

### **Update Team Group**: `PUT /api/groups/teams/{timeId}/group`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "grupo": "A"
}
```

**Expected Response**:

```json
{
  "message": "Grupo do time atualizado com sucesso"
}
```

### **Generate Group Stage Games**: `POST /api/groups/games/generate-group-stage`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicio": "2024-03-01T08:00:00Z",
  "local": "Quadra Principal"
}
```

**Expected Response**:

```json
{
  "message": "Jogos de fase de grupos gerados com sucesso"
}
```

### **Generate Semifinals**: `POST /api/groups/games/generate-semifinals`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicio": "2024-03-15T14:00:00Z",
  "local": "Quadra Principal"
}
```

**Expected Response**:

```json
{
  "message": "Semifinais geradas com sucesso"
}
```

### **Generate Final**: `POST /api/groups/games/generate-final`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataFinal": "2024-03-20T16:00:00Z",
  "local": "Quadra Principal"
}
```

**Expected Response**:

```json
{
  "message": "Final gerada com sucesso"
}
```

### **Generate All Games**: `POST /api/groups/games/generate-all`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicioGrupos": "2024-03-01T08:00:00Z",
  "dataInicioSemifinais": "2024-03-15T14:00:00Z",
  "dataFinal": "2024-03-20T16:00:00Z",
  "local": "Quadra Principal"
}
```

**Expected Response**:

```json
{
  "message": "Todos os jogos gerados com sucesso"
}
```

### **🎯 Tournament Configuration (Dynamic)**

The system now automatically detects tournament format based on your data:

#### **With Group Stage** (if teams have groups assigned)
- ✅ Group stage: Round-robin within each group
- ✅ Semifinals: 1st Group A × 2nd Group B, 1st Group B × 2nd Group A
- ✅ Final: Winners of semifinals

#### **Without Group Stage** (if teams don't have groups)
- ✅ Direct semifinals: Uses first 4 teams automatically
  - Semifinal 1: 1st team × 4th team
  - Semifinal 2: 2nd team × 3rd team
- ✅ Final: Winners of semifinals

#### **Manual Configuration** (for custom matchups)
- ✅ Use `/games/generate-semifinals-manual` to specify exact team IDs
- ✅ Full control over semifinal matchups

### **⚠️ Important Notes**

- **Gender is case-sensitive**: Use "Masculino", "Feminino", "Misto" (not lowercase)
- **modalidadeId must exist** in the database
- **edicaoId is optional** but recommended to filter by specific edition
- **Only GROUP_STAGE games count points** for classification
- **Tiebreaker criteria**: Points → Head-to-head → Goal difference → Goals for → Goals against

---

## 🏫 **6. Turmas (Público)**

### **Listar Turmas**: `GET /api/classes`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
[
  {
    "id": 1,
    "nome": "1°A",
    "serie": 1,
    "turno": "Matutino",
    "ativa": true,
    "edicaoId": 2
  },
  {
    "id": 2,
    "nome": "1°B",
    "serie": 1,
    "turno": "Vespertino",
    "ativa": true,
    "edicaoId": 2
  }
]
```

### **Obter Turma por ID**: `GET /api/classes/{id}`

**Headers**:

```json
{}
```

**Body**:

``json
{}
```

### **Criar Turma (Admin Geral)**: `POST /api/classes`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (com `edicaoId`):

```json
{
  "nome": "2°C",
  "serie": 2,
  "turno": "Noturno",
  "edicaoId": 2
}
```

**Body** (sem `edicaoId` - usará a edição atual automaticamente):

```json
{
  "nome": "2°C",
  "serie": 2,
  "turno": "Noturno"
}
```

> **Nota**: Se `edicaoId` não for fornecido, o sistema usará automaticamente a edição do ano corrente.

---

## 👥 **6. Jogadores** ⭐ **ATUALIZADO COM GÊNERO E MODALIDADES OBRIGATÓRIOS**

> **📋 Documentação Completa**: Para documentação detalhada da API de Jogadores, consulte: [JOGADORES_API.md](./JOGADORES_API.md)

### **🔄 Mudanças Importantes**

- **Gênero obrigatório**: Todo novo jogador deve ter um gênero definido (masculino, feminino ou misto)
- **Modalidades obrigatórias**: Todo novo jogador deve ter pelo menos uma modalidade associada
- **Compatibilidade**: Jogadores existentes sem esses campos continuam funcionando normalmente
- **Associação seletiva**: A lógica agora usa o gênero do próprio jogador
- **Migração automática**: Use os scripts de migração para atualizar jogadores existentes (ver seção "Scripts de Migração")

### **Criar Jogador (Novo Formato)**: `POST /api/players` ⭐ **OBRIGATÓRIO**

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (Campos Obrigatórios):

```json
{
  "nome": "Maria Santos",
  "genero": "feminino",
  "turmaId": 1,
  "modalidades": [2, 3],
  "numeroCamisa": 7,
  "edicaoId": 2
}
```

**Body** (Sem edicaoId - usará edição atual):

```json
{
  "nome": "João Silva",
  "genero": "masculino",
  "turmaId": 1,
  "modalidades": [1, 4],
  "numeroCamisa": 10
}
```

**Campos**:
- `nome` (string, **obrigatório**): Nome completo do jogador (3-100 caracteres)
- `genero` (string, **obrigatório**): `"masculino"`, `"feminino"` ou `"misto"`
- `turmaId` (number, **obrigatório**): ID da turma do jogador
- `modalidades` (array, **obrigatório**): Array com IDs das modalidades (mínimo 1, máximo 10)
- `numeroCamisa` (number, opcional): Número da camisa (1-99)
- `edicaoId` (number, opcional): ID da edição (usa edição atual se omitido)

**Resposta de Sucesso** (201):

```json
{
  "success": true,
  "message": "Jogador criado com sucesso",
  "data": {
    "id": 15,
    "nome": "Maria Santos",
    "genero": "Feminino",
    "numeroCamisa": 7,
    "turmaId": 1,
    "edicaoId": 2,
    "modalidades": [2, 3]
  }
}
```

**Resposta de Erro - Campos Obrigatórios** (400):

```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": {
    "genero": ["Gênero é obrigatório e deve ser masculino, feminino ou misto"],
    "modalidades": ["Pelo menos uma modalidade é obrigatória"]
  }
}
```

> **💡 Dica**: Se você tem jogadores existentes sem gênero ou modalidades, use os scripts de migração para atualizá-los automaticamente. Consulte a seção "Scripts de Migração de Dados" no início deste documento.

### **Atualizar Jogador**: `PUT /api/players/{id}` ⭐ **ATUALIZADO**

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (Atualização com novos campos):

```json
{
  "nome": "Jogador Atualizado",
  "genero": "misto",
  "modalidades": [1, 3],
  "numeroCamisa": 11
}
```

### **Outros Endpoints**

Para documentação completa de todos os endpoints de jogadores, incluindo:
- Listar jogadores
- Obter jogador por ID
- Listar jogadores por turma
- Associar/desassociar modalidades
- Deletar jogador
- Exemplos de uso
- Códigos de erro
- Regras de validação

**Consulte**: [JOGADORES_API.md](./JOGADORES_API.md)

---

## ⚽ **7. Times**

### **Listar Times**: `GET /api/teams`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

```json
{}
```

### **Obter Time por ID**: `GET /api/teams/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

```json
{}
```

### **Criar Time (Admin Geral)**: `POST /api/teams`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (com `edicaoId`):

```json
{
  "nome": "Novo Time",
  "modalidadeId": 1,
  "edicaoId": 2
}
```

**Body** (sem `edicaoId` - usará a edição atual automaticamente):

```json
{
  "nome": "Novo Time",
  "modalidadeId": 1
}
```

> **Nota**: Se `edicaoId` não for fornecido, o sistema usará automaticamente a edição do ano corrente.

### **Criar Time (Admin Turma - Turma Correta)**: `POST /api/teams`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (com `edicaoId`):

```json
{
  "nome": "Time Turma 1A",
  "modalidadeId": 1,
  "edicaoId": 2,
  "turmaId": 1
}
```

**Body** (sem `edicaoId` - usará a edição atual automaticamente):

```json
{
  "nome": "Time Turma 1A",
  "modalidadeId": 1,
  "turmaId": 1
}
```

### **Atualizar Time**: `PUT /api/teams/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "nome": "Time Atualizado"
}
```

### **Deletar Time**: `DELETE /api/teams/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🔄 **8. Associação Turma-Time (Novo)**

### **Associar Turma a Time**: `POST /api/turma-time`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "turmaId": 1,
  "timeId": 1
}
```

> **Nota**: Este endpoint associa uma turma a um time. Ao fazer isso, automaticamente associa apenas os jogadores dessa turma que pertencem à mesma modalidade e gênero do time.

### **Desassociar Turma de Time**: `DELETE /api/turma-time`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "turmaId": 1,
  "timeId": 1
}
```

### **Listar Associações Turma-Time**: `GET /api/turma-time`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

### **Listar Times de uma Turma**: `GET /api/turma-time/turma/{turmaId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

### **Listar Turmas de um Time**: `GET /api/turma-time/time/{timeId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🎮 **9. Jogos (Sistema Aprimorado)**

### **Listar Jogos**: `GET /api/games`

**Headers**:

```json
{}
```

**Query Parameters**:
- `modalidade` (opcional): ID da modalidade para filtrar
- `horario` (opcional): Período do dia (manha, tarde, noite, meio-dia)
- `edicao` (opcional): ID da edição para filtrar
- `summary` (opcional): Modo resumo (true/false) - Retorna apenas campos essenciais
- `fields` (opcional): Lista de campos separados por vírgula para filtrar a resposta

**Body**:

```json
{}
```

**Resposta Esperada** (com campos computados):

```json
[
  {
    "id": 1,
    "time1Id": 1,
    "time2Id": 2,
    "modalidadeId": 1,
    "dataHora": "2025-09-16T15:00:00.000Z",
    "local": "Quadra Principal",
    "status": "AGENDADO",
    "placar": {
      "time1": 0,
      "time2": 0
    },
    "isFinished": false,
    "isInProgress": false,
    "isPaused": false,
    "canEdit": true,
    "canUpdateScore": false,
    "canAddEvents": false,
    "validTransitions": ["EM_ANDAMENTO", "CANCELADO"]
  }
]
```

**Resposta Esperada (Modo Resumo)** - `GET /api/games?summary=true`:

```json
[
  {
    "id": 13,
    "dataHora": "2025-09-16T11:00:00.000Z",
    "local": "Quadra Principal",
    "status": "EM_ANDAMENTO",
    "placar": {
      "time1": 2,
      "time2": 1
    },
    "time1Id": 1,
    "time2Id": 2
  }
]
```

### **Obter Jogos de Hoje**: `GET /api/games/today` ⭐ **MELHORADO**

**Headers**:

```json
{}
```

**Query Parameters**:
- `modalidade` (opcional): ID da modalidade para filtrar
- `genero` (opcional): Gênero para filtrar (masculino, feminino, misto)
- `horario` (opcional): Período do dia para filtrar (manha, meio-dia, tarde, noite)
- `summary` (opcional): Modo resumo (true/false) - Retorna apenas campos essenciais
- `fields` (opcional): Lista de campos separados por vírgula para filtrar a resposta

**Body**:

```json
{}
```

**Resposta Esperada** (com cache e campos computados):

```json
[
  {
    "id": 13,
    "dataHora": "2025-09-16T11:00:00.000Z",
    "local": "Quadra Principal",
    "status": "EM_ANDAMENTO",
    "placar": {
      "time1": 2,
      "time2": 1
    },
    "isFinished": false,
    "isInProgress": true,
    "isPaused": false,
    "canEdit": false,
    "canUpdateScore": true,
    "canAddEvents": true,
    "validTransitions": ["PAUSADO", "FINALIZADO", "CANCELADO"]
  }
]
```

**Resposta Esperada (Modo Resumo)** - `GET /api/games/today?summary=true`:

```json
[
  {
    "id": 13,
    "dataHora": "2025-09-16T11:00:00.000Z",
    "local": "Quadra Principal",
    "status": "EM_ANDAMENTO",
    "placar": {
      "time1": 2,
      "time2": 1
    },
    "time1Id": 1,
    "time2Id": 2
  }
]
```

**Exemplos de Filtros**:
```bash
# Jogos da manhã
GET /api/games/today?horario=manha

# Jogos de basquete da tarde
GET /api/games/today?modalidade=3&horario=tarde

# Jogos femininos
GET /api/games/today?genero=feminino

# Jogos em modo resumo
GET /api/games/today?summary=true

# Jogos com campos específicos
GET /api/games/today?fields=id,dataHora,local,status
```

### **Obter Jogos de Ontem**: `GET /api/games/yesterday`

**Headers**:

``json
{}
```

**Query Parameters**:

- `modalidade` (opcional): ID da modalidade para filtrar
- `genero` (opcional): Gênero para filtrar (masculino, feminino, misto)
- `horario` (opcional): Período do dia para filtrar (manha, meio-dia, tarde, noite)

**Body**:

```json
{}
```

### **Obter Jogos de Amanhã**: `GET /api/games/tomorrow`

**Headers**:

``json
{}
```

**Query Parameters**:

- `modalidade` (opcional): ID da modalidade para filtrar
- `genero` (opcional): Gênero para filtrar (masculino, feminino, misto)
- `horario` (opcional): Período do dia para filtrar (manha, meio-dia, tarde, noite)

**Body**:

``json
{}
```

### **Obter Jogos por Data**: `GET /api/games/date` ⭐ **MELHORADO**

**Headers**:

```json
{}
```

**Query Parameters**:
- `date` (obrigatório): Data em múltiplos formatos
  - ISO: `2025-09-16`
  - Brasileiro: `16/09/2025`
  - Americano: `09/16/2025`
- `modalidade` (opcional): ID da modalidade para filtrar
- `genero` (opcional): Gênero para filtrar (masculino, feminino, misto)
- `horario` (opcional): Período do dia para filtrar (manha, meio-dia, tarde, noite)

**Body**:

```json
{}
```

**Exemplos de Uso**:
```bash
# Data ISO
GET /api/games/date?date=2025-09-16

# Data brasileira
GET /api/games/date?date=16/09/2025

# Data com filtros
GET /api/games/date?date=2025-09-16&horario=tarde&modalidade=1
```

**Resposta Esperada** (com cache e timezone correto):

```json
[
  {
    "id": 5,
    "dataHora": "2025-09-16T15:00:00.000Z",
    "local": "Quadra Principal",
    "status": "AGENDADO",
    "placar": {
      "time1": 0,
      "time2": 0
    },
    "time1": {
      "id": 37,
      "nome": "Time A"
    },
    "time2": {
      "id": 38,
      "nome": "Time B"
    },
    "modalidade": {
      "id": 38,
      "nome": "BASQUETE",
      "genero": "Misto"
    }
  }
]
```

### **Obter Jogo por ID**: `GET /api/games/{id}`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

```json
{}
```

### **🕐 Filtragem por Horário do Dia (Sistema Aprimorado)**

O parâmetro `horario` permite filtrar os jogos por período do dia com **validação inteligente**:

- `manha` ou `manhã`: Jogos da manhã (6:00 - 11:59)
- `meio-dia` ou `meiodia`: Jogos do meio-dia (12:00 - 13:59)
- `tarde`: Jogos da tarde (14:00 - 17:59)
- `noite`: Jogos da noite (18:00 - 23:59)

**Exemplos de uso**:
```bash
# Filtros funcionando em todos os endpoints
GET /api/games?horario=manha                    # ✅ 4 jogos
GET /api/games/today?horario=tarde              # ✅ 4 jogos
GET /api/games/date?date=2025-09-16&horario=noite  # ✅ 0 jogos

# Suporte a acentos
GET /api/games/today?horario=manhã              # ✅ Funciona
GET /api/games/today?horario=meio-dia           # ✅ Funciona
```

**Validação de Períodos**:
```bash
# Verificar períodos disponíveis
GET /api/system/time-periods
```

**Resposta**:
```json
{
  "periods": [
    {"name": "Manhã", "startHour": 6, "endHour": 12},
    {"name": "Meio-dia", "startHour": 12, "endHour": 14},
    {"name": "Tarde", "startHour": 14, "endHour": 18},
    {"name": "Noite", "startHour": 18, "endHour": 24}
  ]
}
```

### **Criar Jogo (Admin Geral)**: `POST /api/games`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (com `edicaoId`):

``json
{
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-15T15:00:00Z",
  "local": "Ginásio Principal",
  "descricao": "Quartas de Final - Futsal Masculino",
  "edicaoId": 2
}
```

**Body** (sem `edicaoId` - usará a edição atual automaticamente):

``json
{
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-15T15:00:00Z",
  "local": "Ginásio Principal",
  "descricao": "Quartas de Final - Futsal Masculino"
}
```

> **Nota**: Se `edicaoId` não for fornecido, o sistema usará automaticamente a edição do ano corrente.

### **Criar Jogo (Admin Turma - Time da Turma)**: `POST /api/games`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (com `edicaoId`):

``json
{
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-15T15:00:00Z",
  "local": "Ginásio Principal",
  "descricao": "Jogo da Turma 1A",
  "edicaoId": 2
}
```

**Body** (sem `edicaoId` - usará a edição atual automaticamente):

``json
{
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-15T15:00:00Z",
  "local": "Ginásio Principal",
  "descricao": "Jogo da Turma 1A"
}
```

### **Atualizar Placar**: `PATCH /api/jogos/{id}/score`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{
  "placarTime1": 2,
  "placarTime2": 1
}
```

### **Atualizar Status do Jogo**: `PATCH /api/jogos/{id}/status`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{
  "status": "EM_ANDAMENTO"
}
```

> **Nota**: Valores possíveis para status: AGENDADO, EM_ANDAMENTO, PAUSADO, FINALIZADO, CANCELADO

### **Pausar Jogo**: `PATCH /api/jogos/{id}/pause`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
{
  "message": "Jogo pausado com sucesso",
  "status": "PAUSADO"
}
```

> **Nota**: Só é possível pausar jogos que estão em andamento (status EM_ANDAMENTO)

### **Retomar Jogo**: `PATCH /api/jogos/{id}/resume`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
{
  "message": "Jogo retomado com sucesso",
  "status": "EM_ANDAMENTO"
}
```

> **Nota**: Só é possível retomar jogos que estão pausados (status PAUSADO)

### **Finalizar Jogo**: `PATCH /api/jogos/{id}/finalize`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

``json
{
  "message": "Jogo finalizado com sucesso",
  "status": "FINALIZADO"
}
```

> **Nota**: Ao finalizar um jogo, as estatísticas são automaticamente atualizadas para ambos os times com base no resultado do jogo

### **Ativar Jogos Agendados**: `POST /api/jogos/activate-scheduled`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{}
```

**Resposta Esperada**:

```
{
  "message": "Successfully activated 3 games",
  "activatedCount": 3
}
```

> **Nota**: Este endpoint ativa todos os jogos agendados cuja data/hora já passou, mudando seu status de AGENDADO para EM_ANDAMENTO

### **🔄 Atualizar Jogo Completo**: `PUT /api/games/{id}` ⭐ **MELHORADO**

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (atualização completa):

```json
{
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-19T14:30:00.000Z",
  "local": "Quadra Principal - Ginásio",
  "descricao": "Final do campeonato - Jogo decisivo"
}
```

**Body** (atualização parcial):

```json
{
  "dataHora": "2025-09-18T16:00:00.000Z",
  "local": "Nova Quadra"
}
```

**Resposta Esperada**:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "time1Id": 1,
    "time2Id": 2,
    "modalidadeId": 1,
    "dataHora": "2025-09-19T14:30:00.000Z",
    "local": "Quadra Principal - Ginásio",
    "descricao": "Final do campeonato - Jogo decisivo",
    "status": "AGENDADO",
    "updatedAt": "2025-09-16T23:30:00.000Z",
    "message": "Jogo atualizado com sucesso"
  }
}

**Validações**:
- ✅ Apenas jogos AGENDADOS podem ser editados
- ✅ Nova data deve ser futura
- ✅ Verificação de conflitos de horário
- ✅ Requer autenticação e permissões

### **⏰ Reagendar Jogo**: `PATCH /api/games/{id}/reschedule` ⭐ **NOVO**

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "dataHora": "2025-09-20T16:00:00.000Z",
  "motivo": "Conflito com outro evento"
}
```

**Resposta Esperada**:

```json
{
  "success": true,
  "data": {
    "id": 5,
    "dataHoraAnterior": "2025-09-16T18:00:00.000Z",
    "dataHoraNova": "2025-09-20T16:00:00.000Z",
    "motivo": "Conflito com outro evento",
    "message": "Jogo reagendado com sucesso"
  }
}
```

**Vantagens do Reagendamento**:
- 🚀 **Mais rápido**: Apenas data/hora
- 📝 **Com motivo**: Registra razão do reagendamento
- 📊 **Comparativo**: Mostra data anterior vs nova
- 🔒 **Mesmas validações**: Segurança mantida

**Exemplos com curl**:
# Reagendamento rápido
curl -X PATCH "http://localhost:3000/api/games/5/reschedule" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dataHora": "2025-09-20T16:00:00.000Z", "motivo": "Chuva"}'

# Atualização completa
curl -X PUT "http://localhost:3000/api/games/5" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dataHora": "2025-09-19T14:30:00.000Z", "local": "Nova Quadra"}'
```

### **Deletar Jogo**: `DELETE /api/jogos/{id}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🎮 **10. Eventos de Jogos**

### **Listar Eventos de um Jogo**: `GET /api/jogos/{jogoId}/events`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Query Parameters**:
- `summary` (opcional): Modo resumo (true/false) - Retorna apenas campos essenciais

**Body**:

``json
{}
```

**Exemplo de Resposta (Completa)**:

``json
[
  {
    "id": 1,
    "jogoId": 1,
    "tipo": "GOL",
    "minuto": 45,
    "descricao": "Gol de falta",
    "timeId": 1,
    "jogadorId": 5,
    "jogadorSubstituidoId": null,
    "metadados": null,
    "createdAt": "2025-09-15T15:45:00.000Z",
    "updatedAt": "2025-09-15T15:45:00.000Z",
    "jogador": {
      "id": 5,
      "nome": "Jogador 1"
    },
    "jogadorSubstituido": null,
    "time": {
      "id": 1,
      "nome": "Time A"
    }
  }
]
```

**Exemplo de Resposta (Modo Resumo)** - `GET /api/jogos/1/events?summary=true`:

``json
[
  {
    "id": 1,
    "tipo": "GOL",
    "minuto": 45,
    "timeId": 1,
    "jogadorId": 5
  }
]
```

### **Adicionar Evento a um Jogo**: `POST /api/jogos/{jogoId}/events`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body** (exemplo de gol):

``json
{
  "tipo": "GOL",
  "minuto": 45,
  "timeId": 1,
  "jogadorId": 5,
  "descricao": "Gol de falta"
}
```

### **Atualizar Placar**: `PATCH /api/jogos/{id}/score`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "placarTime1": 2,
  "placarTime2": 1
}
```

**Response**:

```json
{
  "placar": {
    "time1": 2,
    "time2": 1
  }
}
```

### **Marcar Gol com Informações do Jogador**: `POST /api/jogos/{id}/score-goal`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "jogadorId": 5,
  "timeId": 1,
  "minuto": 45
}
```

**Response**:

```json
{
  "message": "Gol marcado com sucesso",
  "event": {
    "id": 10,
    "jogoId": 1,
    "tipo": "GOL",
    "minuto": 45,
    "descricao": "Gol de Jogador Silva",
    "timeId": 1,
    "jogadorId": 5,
    "jogadorSubstituidoId": null,
    "metadados": null,
    "createdAt": "2025-10-12T15:45:00.000Z",
    "updatedAt": "2025-10-12T15:45:00.000Z",
    "jogador": {
      "id": 5,
      "nome": "Jogador Silva"
    },
    "time": {
      "id": 1,
      "nome": "Time A"
    }
  }
}
```

### **Pausar Jogo**: `PATCH /api/jogos/{id}/pause`


**Body** (exemplo de substituição):

``json
{
  "tipo": "SUBSTITUICAO",
  "minuto": 70,
  "timeId": 1,
  "jogadorId": 10,
  "jogadorSubstituidoId": 5,
  "descricao": "Substituição"
}
```

**Body** (exemplo de cartão amarelo):

``json
{
  "tipo": "CARTAO_AMARELO",
  "minuto": 30,
  "timeId": 2,
  "jogadorId": 8,
  "descricao": "Falta"
}
```

> **Nota**: Tipos de eventos possíveis: GOL, CARTAO_AMARELO, CARTAO_VERMELHO, SUBSTITUICAO, LESAO, OUTRO

### **Atualizar Evento de um Jogo**: `PUT /api/jogos/{jogoId}/events/{eventoId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

``json
{
  "minuto": 46,
  "descricao": "Gol de falta direta"
}
```

### **Remover Evento de um Jogo**: `DELETE /api/jogos/{jogoId}/events/{eventoId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 📊 **11. Estatísticas**

### **Classificação por Modalidade**: `GET /api/statistics/ranking/{modeId}`

**Headers**:

``json
{}
```

**Body**:

``json
{}
```

**Exemplo de Resposta**:

``json
[
  {
    "posicao": 1,
    "time": {
      "id": 1,
      "nome": "Time A"
    },
    "modalidadeId": 1,
    "jogos": 3,
    "vitorias": 2,
    "empates": 1,
    "derrotas": 0,
    "golsPro": 5,
    "golsContra": 2,
    "saldoGols": 3,
    "pontos": 7
  },
  {
    "posicao": 2,
    "time": {
      "id": 2,
      "nome": "Time B"
    },
    "modalidadeId": 1,
    "jogos": 3,
    "vitorias": 1,
    "empates": 1,
    "derrotas": 1,
    "golsPro": 4,
    "golsContra": 4,
    "saldoGols": 0,
    "pontos": 4
  }
]
```

### **Artilheiros por Modalidade**: `GET /api/statistics/top-scorers/{modeId}`

**Headers**:

``json
{}
```

**Body**:

``json
{}
```

**Parâmetros Opcionais**:

- `edicaoId`: Filtrar por edição específica
- `limit`: Número máximo de artilheiros a retornar (padrão: 10)

**Exemplo de Resposta**:

``json
[
  {
    "id": 1,
    "nome": "Jogador 1",
    "turmaId": 1,
    "modalidadeId": 1,
    "gols": 5,
    "assistencias": 2,
    "jogos": 3
  },
  {
    "id": 2,
    "nome": "Jogador 2",
    "turmaId": 2,
    "modalidadeId": 1,
    "gols": 4,
    "assistencias": 1,
    "jogos": 3
  }
]
```

### **Estatísticas de Jogador**: `GET /api/statistics/player/{playerId}` ⭐ **ATUALIZADO**

**Headers**:

``json
{}
```

**Body**:

``json
{}
```

**Parâmetros Opcionais**:

- `modalidadeId`: Filtrar por modalidade específica

**Exemplo de Resposta (sem modalidadeId - todas as modalidades)**:

``json
[
  {
    "id": 1,
    "jogadorId": 1,
    "modalidadeId": 1,
    "gols": 5,
    "assistencias": 2,
    "cartoesAmarelos": 1,
    "cartoesVermelhos": 0,
    "jogos": 3,
    "modalidade": {
      "id": 1,
      "nome": "FUTSAL",
      "tipo": "FUTSAL",
      "genero": "Masculino",
      "icone": "⚽",
      "descricao": "Futsal categoria masculina"
    }
  },
  {
    "id": 2,
    "jogadorId": 1,
    "modalidadeId": 2,
    "gols": 3,
    "assistencias": 4,
    "cartoesAmarelos": 0,
    "cartoesVermelhos": 0,
    "jogos": 2,
    "modalidade": {
      "id": 2,
      "nome": "FUTSAL",
      "tipo": "FUTSAL",
      "genero": "Feminino",
      "icone": "⚽",
      "descricao": "Futsal categoria feminina"
    }
  }
]
```

**Exemplo de Resposta (com modalidadeId - modalidade específica)**:

``json
{
  "id": 1,
  "jogadorId": 1,
  "modalidadeId": 1,
  "gols": 5,
  "assistencias": 2,
  "cartoesAmarelos": 1,
  "cartoesVermelhos": 0,
  "jogos": 3,
  "jogador": {
    "id": 1,
    "nome": "Jogador 1",
    "edicaoId": 2,
    "turmaId": 1,
    "numeroCamisa": 10
  },
  "modalidade": {
    "id": 1,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Masculino",
    "icone": "⚽",
    "descricao": "Futsal categoria masculina"
  }
}
```

### **Estatísticas de Time**: `GET /api/statistics/team/{teamId}`

**Headers**:

``json
{}
```

**Body**:

``json
{}
```


## 👥 **Players API**

### Get All Players

```http
GET /api/players
```

**Query Parameters**:
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Número de itens por página (padrão: 20, máximo: 100)
- `edicaoId` (opcional): ID da edição para filtrar
- `modalidadeId` (opcional): ID da modalidade para filtrar

**Resposta Esperada**:

```json
{
  "data": [
    {
      "id": 1,
      "nome": "Jogador 1",
      "genero": "Masculino",
      "edicaoId": 2,
      "turmaId": 1,
      "numeroCamisa": 10
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "pageSize": 20
  }
}
```

### Get Player by ID

```http
GET /api/players/:id
```

```

**Parâmetros Opcionais**:

- `modalidadeId`: Filtrar por modalidade específica

**Exemplo de Resposta (sem modalidadeId - todas as modalidades)**:

``json
[
  {
    "vitorias": 5,
    "empates": 2,
    "derrotas": 1,
    "pontos": 17,
    "golsPro": 15,
    "golsContra": 8,
    "modalidadeId": 1,
    "timeId": 1,
    "modalidade": {
      "id": 1,
      "nome": "FUTSAL",
      "tipo": "FUTSAL",
      "genero": "Masculino",
      "icone": "⚽",
      "descricao": "Futsal categoria masculina"
    }
  },
  {
    "vitorias": 3,
    "empates": 1,
    "derrotas": 4,
    "pontos": 10,
    "golsPro": 12,
    "golsContra": 15,
    "modalidadeId": 2,
timeId": 1,
    "modalidade": {
      "id": 2,
      "nome": "FUTSAL",
      "tipo": "FUTSAL",
      "genero": "Feminino",
      "icone": "⚽",
      "descricao": "Futsal categoria feminina"
    }
  }
]
```

**Exemplo de Resposta (com modalidadeId - modalidade específica)**:

```json
{
  "vitorias": 5,
  "empates": 2,
  "derrotas": 1,
  "pontos": 17,
  "golsPro": 15,
  "golsContra": 8,
  "modalidadeId": 1,
  "timeId": 1,
  "time": {
    "id": 1,
    "nome": "Time A",
    "ativo": true,
    "edicaoId": 2,
    "modalidadeId": 1
  },
  "modalidade": {
    "id": 1,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Masculino",
    "icone": "⚽",
    "descricao": "Futsal categoria masculina"
  }
}
```

### **Estatísticas do Dashboard**: `GET /api/statistics/dashboard`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

## 📊 **Endpoints Granulares do Dashboard**

### **Resumo do Dashboard**: `GET /api/statistics/dashboard/summary`

**Headers**:

```json
{}
```

**Query Parameters**:
Nenhum

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "summary": {
    "totalGames": 42,
    "gamesByStatus": {
      "AGENDADO": 15,
      "EM_ANDAMENTO": 3,
      "PAUSADO": 1,
      "FINALIZADO": 20,
      "CANCELADO": 3
    },
    "topTeams": [
      {
        "time": {
          "id": 1,
          "nome": "Time A"
        },
        "modalidade": {
          "id": 1,
          "nome": "FUTSAL"
        },
        "pontos": 17,
        "vitorias": 5,
        "empates": 2,
        "derrotas": 1,
        "golsPro": 15,
        "golsContra": 8
      }
    ]
  }
}
```

### **Artilheiros do Dashboard**: `GET /api/statistics/dashboard/top-scorers`

**Headers**:

```json
{}
```

**Query Parameters**:
- `limit` (opcional): Número máximo de artilheiros a retornar (padrão: 10)

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "topScorers": [
    {
      "jogador": {
        "id": 1,
        "nome": "Jogador 1"
      },
      "modalidade": {
        "id": 1,
        "nome": "FUTSAL"
      },
      "gols": 8,
      "assistencias": 3,
      "jogos": 5
    }
  ]
}
```

### **Dados de Gráficos do Dashboard**: `GET /api/statistics/dashboard/chart-data`

**Headers**:

```json
{}
```

**Query Parameters**:
- `metric` (opcional): Métrica para os dados do gráfico (padrão: "goals")
- `period` (opcional): Período para os dados do gráfico (padrão: "month")

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "chartData": {
    "metric": "goals",
    "period": "month",
    "data": [
      {
        "period": "Dia 1",
        "value": 2
      },
      {
        "period": "Dia 2",
        "value": 5
      }
    ]
  }
}
```

### **Estatísticas por Modalidade**: `GET /api/statistics/mode/{modeId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

### **Estatísticas por Turma**: `GET /api/statistics/class/{classId}`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🔒 **12. Administração de Usuários (Apenas Admin Geral)**

### **Listar Usuários**: `GET /api/admin/users`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

### **Obter Estatísticas de Usuários**: `GET /api/admin/users/stats`

**Headers**:

``json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

``json
{}
```

---

## 🧪 **13. Cenários de Teste Adicionais**

### **Cenário 1: Teste de Permissões de Admin Turma**

1. Faça login como admin turma
2. Tente acessar endpoints restritos a admin geral (deve falhar com 403)
3. Tente criar/atualizar recursos em turmas diferentes (deve falhar com 403)
4. Tente criar/atualizar recursos na própria turma (deve funcionar)

### **Cenário 2: Teste de Edições Dinâmicas**

1. Faça uma requisição para `GET /api/edicoes/current` no ano atual
2. Verifique se retorna a edição correta
3. Mude o sistema para um ano diferente (simulando passagem de ano)
4. Faça a requisição novamente e verifique se cria uma nova edição automaticamente

### **Cenário 3: Teste de Criação Automática de Edição**

1. Faça uma requisição para criar um jogador sem especificar `edicaoId`
2. Verifique se o sistema usa automaticamente a edição do ano corrente
3. Faça o mesmo para times e jogos

### **Cenário 4: Teste de Rate Limiting**

1. Faça mais de 100 requisições em 15 minutos
2. Verifique se recebe 429 Too Many Requests

### **Cenário 5: Teste de Validação de Dados**

1. Tente criar um jogador sem nome (deve falhar com 400)
2. Tente criar um jogo com data passada (deve falhar com 400)
3. Tente criar um usuário com email inválido (deve falhar com 400)

### **Cenário 6: Teste de Recursos Não Encontrados**

1. Tente acessar um jogador com ID inexistente (deve falhar com 404)
2. Tente atualizar um time com ID inexistente (deve falhar com 404)

### **Cenário 7: Teste de Autenticação**

1. Tente acessar endpoint protegido sem token (deve falhar com 401)
2. Tente acessar endpoint protegido com token inválido (deve falhar com 401)
3. Tente acessar endpoint protegido com token expirado (deve falhar com 401)

### **Cenário 8: Teste de Associação Turma-Time com Filtragem**

1. Crie uma turma com jogadores de diferentes modalidades
2. Crie times para diferentes modalidades
3. Associe a turma a um time específico
4. Verifique que apenas os jogadores da mesma modalidade e gênero foram associados ao time
5. Tente associar a turma a um time de modalidade/gênero diferente
6. Verifique que apenas os jogadores compatíveis foram associados

---

## ⚠️ **Códigos de Status Comuns**

- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos
- **401 Unauthorized**: Token JWT ausente ou inválido
- **403 Forbidden**: Permissões insuficientes
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito de dados (ex: email duplicado)
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro interno do servidor

---

## 🔧 **Troubleshooting**

### **Erro 401 - Token Inválido**

- Verifique se o token está no formato: `Bearer {token}`
- Confirme se o token não expirou (24h de validade)
- Refaça o login para obter novo token

### **Erro 429 - Rate Limit**

- Aguarde alguns minutos antes de fazer nova requisição
- Em produção: 1000 requests per 15 minutes

### **Erro 403 - Forbidden**

- Verifique se o usuário tem permissões adequadas
- Admin geral: acesso total ao sistema
- Admin turma: acesso restrito à sua turma

---

## 👤 **Credenciais de Teste**

**Admin Geral:**

- Email: `admin@escola.com`
- Senha: `admin123`
- Tipo: `admin_geral`
- Permissões: Acesso total ao sistema

**Admin Turma (1°A):**

- Email: `professor1a@escola.com`
- Senha: `turma123`
- Tipo: `admin_turma`
- Turma: 1°A (ID: 1)
- Permissões: Acesso restrito à turma 1

**Admin Turma (1°B):**

- Email: `professor1b@escola.com`
- Senha: `turma123`
- Tipo: `admin_turma`
- Turma: 1°B (ID: 2)
- Permissões: Acesso restrito à turma 2

---

## 🎯 **Fluxo de Teste Completo**

1. **Health Check** → Verificar se API está online
2. **Login** → Obter token JWT
3. **Listar Dados Públicos** → Edições, Modalidades, Turmas
4. **Testar Edições Dinâmicas** → Verificar se `GET /api/editions/current` funciona corretamente
5. **Testar Criação Automática de Edição** → Criar jogadores, times e jogos sem `edicaoId`
6. **Testar Endpoints Protegidos** → Com token de autenticação
7. **Testar Operações CRUD** → Criar, ler, atualizar, deletar
8. **Testar Permissões** → Verificar acesso restrito por turma
9. **Testar Associação Turma-Time com Filtragem** → Verificar que apenas jogadores compatíveis são associados
10. **Testar Cenários de Erro** → Validação, autenticação, etc.

**Status da API: ✅ FUNCIONANDO PERFEITAMENTE**

---

## 🔐 **Authentication**

Most endpoints require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🎮 **Games API**

### Get All Games

``http
GET /api/games
```

## 🎯 **Example Usage**

### 1. Scheduling a Match
Retrieves all games with their scores.

### Get Games for Today

```http
GET /api/games/today
```

Retrieves all games scheduled for today.

**Query Parameters:**

- `modalidade` (optional): Filter by modality ID
- `genero` (optional): Filter by gender (masculino, feminino, misto)
- `horario` (optional): Filter by time of day (manha, meio-dia, tarde, noite)

### Get Games for Yesterday

```http
GET /api/games/yesterday
```

Retrieves all games scheduled for yesterday.

**Query Parameters:**

- `modalidade` (optional): Filter by modality ID
- `genero` (optional): Filter by gender (masculino, feminino, misto)
- `horario` (optional): Filter by time of day (manha, meio-dia, tarde, noite)

### Get Games for Tomorrow

```http
GET /api/games/tomorrow
```

Retrieves all games scheduled for tomorrow.

**Query Parameters:**

- `modalidade` (optional): Filter by modality ID
- `genero` (optional): Filter by gender (masculino, feminino, misto)
- `horario` (optional): Filter by time of day (manha, meio-dia, tarde, noite)

### Get Games by Date

``http
GET /api/games/date
```

Retrieves all games scheduled for a specific date.

**Query Parameters:**

- `date` (required): Date in ISO format (e.g., 2025-09-15)
- `modalidade` (optional): Filter by modality ID
- `genero` (optional): Filter by gender (masculino, feminino, misto)
- `horario` (optional): Filter by time of day (manha, meio-dia, tarde, noite)

### Get Game by ID

``http
GET /api/games/:id
```

Retrieves a specific game with its scores.

### **Time of Day Filtering**

The `horario` parameter allows filtering games by time of day:

- `manha`: Morning games (6:00 AM - 11:59 AM)
- `meio-dia`: Noon games (12:00 PM - 1:59 PM)
- `tarde`: Afternoon games (2:00 PM - 5:59 PM)
- `noite`: Night games (6:00 PM - 5:59 AM)

Example usage:
```
GET /api/games/today?horario=manha
GET /api/games/date?date=2025-09-15&horario=tarde
```

### Create Game

``http
POST /api/games
```

Creates a new game.

### Update Game

``http
PUT /api/games/:id
```

Updates game details.

### Update Game Score

``http
PATCH /api/games/:id/score
```

Updates the score of a game.

**Request Body:**

```json
{
  "placarTime1": 2,
  "placarTime2": 1
}
```

**Response:**

```json
{
  "placar": {
    "time1": 2,
    "time2": 1
  }
}
```

### Pause Game

``http
PATCH /api/games/:id/pause
```

Pauses a game that is currently in progress (status "EM_ANDAMENTO").

### Resume Game

``http
PATCH /api/games/:id/resume
```

Resumes a game that is currently paused (status "PAUSADO").

### Finalize Game

``http
PATCH /api/games/:id/finalize
```

Finalizes a game, setting its status to "FINALIZADO".

### Update Game Status

``http
PATCH /api/games/:id/status
```

Updates the status of a game (AGENDADO, EM_ANDAMENTO, PAUSADO, FINALIZADO, CANCELADO).

**Request Body:**

```json
{
  "status": "FINALIZADO"
}
```

### Activate Scheduled Games

``http
POST /api/games/activate-scheduled
```

Manually triggers activation of all scheduled games that should be active now.

### Delete Game

```http
DELETE /api/games/:id
```

Deletes a game.

## 🎮 **Game Events API**

During a match, you can track events such as goals, cards, and substitutions.

### Get Game Events

```http
GET /api/games/:jogoId/events
```

Retrieves all events for a specific game.

### Add Game Event

```http
POST /api/games/:jogoId/events
```

Adds a new event to a game (e.g., goal, card, substitution).

### Update Game Event

```http
PUT /api/games/:jogoId/events/:eventoId
```

Updates an existing game event.

### Remove Game Event

```http
DELETE /api/games/:jogoId/events/:eventoId
```

Removes a game event.

For detailed information about the Events API, see [EVENTS_API.md](EVENTS_API.md).

## ⚽ **Teams API**

### Get All Teams

```http
GET /api/teams
```

### Get Team by ID

```http
GET /api/teams/:id
```

### Create Team

```http
POST /api/teams
```

### Update Team

```http
PUT /api/teams/:id
```

### Delete Team

```http
DELETE /api/teams/:id
```

## 👥 **Players API**

### Get All Players

```http
GET /api/players
```

### Get Player by ID

```http
GET /api/players/:id
```

### Create Player

```http
POST /api/players
```

### Update Player

```http
PUT /api/players/:id
```

### Delete Player

```http
DELETE /api/players/:id
```

## 🔄 **Turma-Time Association API (New)**

### Associate Class with Team

```
POST /api/associations/class-team
```

**Headers**:

```
Authorization: Bearer <your-jwt-token>
```

**Body**:

```
{
  "turmaId": 1,
  "timeId": 1
}
```

### Dissociate Class with Team

```
DELETE /api/associations/class-team
```

**Headers**:

```
Authorization: Bearer <your-jwt-token>
```

**Body**:

```
{
  "turmaId": 1,
  "timeId": 1
}
```

## 📦 **Batch API**

### Processar Múltiplas Consultas: `POST /api/batch`

Processa múltiplas consultas em uma única requisição, reduzindo o número de requests necessários.

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**:

```json
{
  "queries": [
    {
      "type": "games",
      "params": {
        "filters": {
          "modalidadeId": 1
        }
      }
    },
    {
      "type": "players",
      "params": {
        "filters": {
          "edicaoId": 2
        }
      }
    },
    {
      "type": "teams",
      "params": {
        "id": 1
      }
    }
  ]
}
```

**Tipos Suportados**:
- `games`: Consulta de jogos
- `players`: Consulta de jogadores
- `teams`: Consulta de times
- `modalities`: Consulta de modalidades
- `classes`: Consulta de turmas
- `editions`: Consulta de edições

**Resposta Esperada**:

```json
{
  "results": [
    {
      "index": 0,
      "success": true,
      "data": [
        {
          "id": 1,
          "time1Id": 1,
          "time2Id": 2,
          "modalidadeId": 1,
          "dataHora": "2025-09-16T15:00:00.000Z",
          "local": "Quadra Principal",
          "status": "AGENDADO"
        }
      ]
    },
    {
      "index": 1,
      "success": true,
      "data": [
        {
          "id": 1,
          "nome": "Jogador 1",
          "genero": "Masculino",
          "edicaoId": 2,
          "turmaId": 1,
          "numeroCamisa": 10
        }
      ]
    },
    {
      "index": 2,
      "success": true,
      "data": {
        "id": 1,
        "nome": "Time A",
        "modalidadeId": 1,
        "edicaoId": 2
      }
    }
  ]
}
```

## 🎯 **Example Usage**
```http
POST /api/turma-time
```

Associates a class with a team. Only players from the class who belong to the same modality and gender as the team will be automatically associated with the team.

### Disassociate Class from Team

```http
DELETE /api/turma-time
```

Removes the association between a class and a team.

### Get All Class-Team Associations

```http
GET /api/turma-time
```

Retrieves all class-team associations.

### Get Teams for a Class

```http
GET /api/turma-time/turma/:turmaId
```

Retrieves all teams associated with a specific class.

### Get Classes for a Team

```http
GET /api/turma-time/time/:timeId
```

Retrieves all classes associated with a specific team.

## 🎯 **Example Usage**

### 1. Scheduling a Match

1. Create a game with a future date/time:

   ```json
   POST /api/games
   {
     "time1Id": 10,
     "time2Id": 15,
     "modalidadeId": 5,
     "dataHora": "2025-09-12T10:00:00Z",
     "local": "Quadra Principal"
   }
   ```

### 2. Automatic Activation

At the scheduled time (September 12, 2025 at 10:00 AM), the system will automatically:

- Change the game status from "AGENDADO" to "EM_ANDAMENTO"
- This allows recording of events and score updates

### 3. Manual Activation (if needed)

If automatic activation doesn't work or for testing:

```http
POST /api/games/activate-scheduled
```

### 4. Recording a Goal During the Match

1. Add a goal event:

   ```json
   POST /api/games/1/events
   {
     "tipo": "GOL",
     "minuto": 45,
     "timeId": 10,
     "jogadorId": 5,
     "descricao": "Gol de falta"
   }
   ```

### 5. Updating the Score After a Goal

1. Update the game score:

   ```json
   PATCH /api/games/1/score
   {
     "placarTime1": 1,
     "placarTime2": 0
   }
   ```

   Response:

   ```json
   {
     "placar": {
       "time1": 1,
       "time2": 0
     }
   }
   ```

### 6. Pausing the Game (for interval)

1. Pause the game:

   ```http
   PATCH /api/games/1/pause
   ```

### 7. Resuming the Game

1. Resume the game:

   ```http
   PATCH /api/games/1/resume
   ```

### 8. Recording a Substitution

1. Add a substitution event:

   ```json
   POST /api/games/1/events
   {
     "tipo": "SUBSTITUICAO",
     "minuto": 75,
     "timeId": 10,
     "jogadorId": 8,
     "jogadorSubstituidoId": 5,
     "descricao": "Substituição no segundo tempo"
   }
   ```

### 9. Finalizing the Match

1. Finalize the game:

   ```http
   PATCH /api/games/1/finalize
   ```

### 10. Associating a Class with a Team (with automatic player filtering)

1. Associate a class with a team:

   ```json
   POST /api/turma-time
   {
     "turmaId": 1,
     "timeId": 5
   }
   ```

   The system will automatically associate only players from class 1 who belong to the same modality and gender as team 5.

## 📅 **Game Scheduling**

For detailed information about game scheduling and automatic activation, see [GAME_SCHEDULING.md](GAME_SCHEDULING.md).{
 
     "id": 1,
      "nome": "FUTSAL",
      "tipo": "FUTSAL",
      "genero": "Masculino"
    }
  }
]
```

**Exemplo de Resposta (com modalidadeId específica)**:

```json
{
  "id": 1,
  "jogadorId": 1,
  "modalidadeId": 1,
  "gols": 5,
  "assistencias": 2,
  "cartoesAmarelos": 1,
  "cartoesVermelhos": 0,
  "jogos": 3,
  "modalidade": {
    "id": 1,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Masculino"
  }
}
```

### **Estatísticas de Time**: `GET /api/statistics/team/{teamId}`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Parâmetros Opcionais**:

- `edicaoId`: Filtrar por edição específica

**Exemplo de Resposta**:

```json
{
  "id": 1,
  "timeId": 1,
  "modalidadeId": 1,
  "jogos": 3,
  "vitorias": 2,
  "empates": 1,
  "derrotas": 0,
  "golsPro": 5,
  "golsContra": 2,
  "saldoGols": 3,
  "pontos": 7,
  "time": {
    "id": 1,
    "nome": "Time A"
  },
  "modalidade": {
    "id": 1,
    "nome": "FUTSAL",
    "tipo": "FUTSAL",
    "genero": "Masculino"
  }
}
```

---

## 🔧 **12. Sistema e Monitoramento** ⭐ **NOVO**

### **Informações do Sistema**: `GET /api/system/info`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "system": {
    "name": "Dashboard Esportivo API",
    "version": "2.0.0",
    "environment": "production",
    "uptime": "2 days, 14 hours, 32 minutes",
    "timestamp": "2025-09-16T23:45:00.000Z"
  },
  "cache": {
    "status": "active",
    "entries": 15,
    "hitRate": "87.3%",
    "totalHits": 234,
    "totalMisses": 34,
    "lastCleanup": "2025-09-16T23:30:00.000Z"
  },
  "scheduler": {
    "status": "running",
    "lastExecution": "2025-09-16T23:44:00.000Z",
    "gamesActivated": 3,
    "nextExecution": "2025-09-16T23:46:00.000Z"
  }
}
```

### **Períodos do Dia**: `GET /api/system/time-periods`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "periods": [
    {
      "name": "Manhã",
      "key": "manha",
      "startHour": 6,
      "endHour": 12,
      "description": "Jogos matutinos (6:00 - 11:59)"
    },
    {
      "name": "Meio-dia",
      "key": "meio-dia",
      "startHour": 12,
      "endHour": 14,
      "description": "Jogos do meio-dia (12:00 - 13:59)"
    },
    {
      "name": "Tarde",
      "key": "tarde",
      "startHour": 14,
      "endHour": 18,
      "description": "Jogos vespertinos (14:00 - 17:59)"
    },
    {
      "name": "Noite",
      "key": "noite",
      "startHour": 18,
      "endHour": 24,
      "description": "Jogos noturnos (18:00 - 23:59)"
    }
  ]
}
```

### **Estados de Jogo**: `GET /api/system/game-states`

**Headers**:

```json
{}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "states": [
    {
      "name": "AGENDADO",
      "description": "Jogo agendado para o futuro",
      "canTransitionTo": ["EM_ANDAMENTO", "CANCELADO"]
    },
    {
      "name": "EM_ANDAMENTO",
      "description": "Jogo em andamento",
      "canTransitionTo": ["PAUSADO", "FINALIZADO", "CANCELADO"]
    },
    {
      "name": "PAUSADO",
      "description": "Jogo pausado temporariamente",
      "canTransitionTo": ["EM_ANDAMENTO", "FINALIZADO", "CANCELADO"]
    },
    {
      "name": "FINALIZADO",
      "description": "Jogo finalizado",
      "canTransitionTo": []
    },
    {
      "name": "CANCELADO",
      "description": "Jogo cancelado",
      "canTransitionTo": []
    }
  ]
}
```

### **Estatísticas do Cache (Admin)**: `GET /api/system/cache/stats`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "cache": {
    "status": "active",
    "totalEntries": 15,
    "hitRate": 87.3,
    "totalHits": 234,
    "totalMisses": 34,
    "lastCleanup": "2025-09-16T23:30:00.000Z",
    "entries": [
      {
        "key": "games_today_2025-09-16",
        "size": "2.3KB",
        "ttl": "14m 32s",
        "hits": 45,
        "lastAccess": "2025-09-16T23:44:30.000Z"
      },
      {
        "key": "games_date_2025-09-16",
        "size": "1.8KB",
        "ttl": "8m 15s",
        "hits": 23,
        "lastAccess": "2025-09-16T23:41:45.000Z"
      }
    ]
  }
}
```

### **Limpar Cache (Admin)**: `DELETE /api/system/cache`

**Headers**:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body**:

```json
{}
```

**Resposta Esperada**:

```json
{
  "success": true,
  "message": "Cache limpo com sucesso",
  "clearedEntries": 15
}
```

---

## 🧪 **13. Testes e Validações**

### **🔍 Testes de Filtros por Horário**

**Cenário 1: Filtro Manhã**
```bash
GET /api/games/today?horario=manha
```

**Resultado Esperado**: ✅ 4 jogos (6:00 - 11:59)

**Cenário 2: Filtro Tarde**
```bash
GET /api/games/today?horario=tarde
```

**Resultado Esperado**: ✅ 4 jogos (14:00 - 17:59)

**Cenário 3: Filtro Noite**
```bash
GET /api/games/today?horario=noite
```

**Resultado Esperado**: ✅ 0 jogos (18:00 - 23:59)

### **📅 Testes de Parsing de Datas**

**Cenário 1: Data ISO**
```bash
GET /api/games/date?date=2025-09-16
```

**Resultado Esperado**: ✅ Jogos do dia 16/09/2025

**Cenário 2: Data Brasileira**
```bash
GET /api/games/date?date=16/09/2025
```

**Resultado Esperado**: ✅ Jogos do dia 16/09/2025

**Cenário 3: Data Americana**
```bash
GET /api/games/date?date=09/16/2025
```

**Resultado Esperado**: ✅ Jogos do dia 16/09/2025

### **🔄 Testes de Máquina de Estados**

**Cenário 1: Transição Válida (AGENDADO → EM_ANDAMENTO)**
```bash
PATCH /api/jogos/1/status
Body: {"status": "EM_ANDAMENTO"}
```

**Resultado Esperado**: ✅ Status atualizado com sucesso

**Cenário 2: Transição Inválida (FINALIZADO → AGENDADO)**
```bash
PATCH /api/jogos/1/status
Body: {"status": "AGENDADO"}
```

**Resultado Esperado**: ❌ Erro 400 - Transição inválida

### **⚡ Testes de Performance do Cache**

**Cenário 1: Primeira Consulta (Cache Miss)**
```bash
GET /api/games/today
```

**Resultado Esperado**: 
- ✅ Resposta em ~200ms
- ✅ Cache criado
- ✅ Header: X-Cache: MISS

**Cenário 2: Segunda Consulta (Cache Hit)**
```bash
GET /api/games/today
```

**Resultado Esperado**: 
- ✅ Resposta em ~50ms
- ✅ Dados do cache
- ✅ Header: X-Cache: HIT

---

## 🚀 **14. Melhorias Implementadas - Resumo**

### **✅ Sistema de Estados de Jogos**
- **Máquina de Estados**: Controle rigoroso de transições
- **Validações**: Apenas transições válidas são permitidas
- **Campos Computados**: `isFinished`, `isInProgress`, `canEdit`, etc.
- **Transições Automáticas**: Scheduler ativa jogos automaticamente

### **✅ Sistema de Cache Inteligente**
- **TTL Configurável**: 15 minutos para jogos de hoje
- **Invalidação Automática**: Cache limpo quando necessário
- **Cleanup Automático**: Remoção de entradas expiradas
- **Estatísticas**: Monitoramento de hit rate e performance

### **✅ Scheduler Aprimorado**
- **Execução por Minuto**: Verificação constante de jogos
- **Ativação Automática**: Jogos AGENDADOS → EM_ANDAMENTO
- **Logs de Auditoria**: Registro de todas as ativações
- **Notificações**: Sistema de alertas para administradores

### **✅ Tratamento Robusto de Datas**
- **Múltiplos Formatos**: ISO, brasileiro, americano
- **Timezone Local**: Parsing correto sem conversão UTC
- **Validação de Períodos**: Filtros por manhã, tarde, noite
- **Datas Futuras**: Validação para agendamentos

### **✅ Novos Endpoints do Sistema**
- **Informações**: `/api/system/info` - Status geral
- **Períodos**: `/api/system/time-periods` - Horários disponíveis
- **Estados**: `/api/system/game-states` - Transições válidas
- **Cache**: `/api/system/cache/stats` - Estatísticas detalhadas

### **✅ Rotas de Atualização de Jogos**
- **PUT /api/games/:id**: Atualização completa
- **PATCH /api/games/:id/reschedule**: Reagendamento rápido
- **Validações Robustas**: Conflitos, datas futuras, permissões
- **Logs de Auditoria**: Registro de todas as alterações

---

## 🔧 **15. Configuração e Ambiente**

### **Variáveis de Ambiente**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dashboard_esportivo

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Cache
CACHE_TTL_MINUTES=15
CACHE_CLEANUP_INTERVAL_MINUTES=30

# Scheduler
SCHEDULER_INTERVAL_MINUTES=1
SCHEDULER_ENABLED=true

# Environment
NODE_ENV=production
PORT=3000
```

### **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Testes
npm test

# Seed do banco
npm run seed

# Migrations
npm run migrate
```

### **Estrutura do Banco de Dados**

```sql
-- Principais tabelas
- edicoes (editions)
- modalidades (modalities)
- turmas (classes)
- usuarios (users)
- jogadores (players)
- times (teams)
- jogos (games)
- eventos_jogos (game_events)
- estatisticas_jogadores (player_statistics)
- estatisticas_times (team_statistics)
- turma_time (class_team associations)
```

---

## 📝 **16. Logs e Auditoria**

### **Tipos de Logs**

1. **Sistema**: Inicialização, cache, scheduler
2. **Autenticação**: Login, logout, falhas
3. **Jogos**: Criação, atualização, mudanças de status
4. **Eventos**: Gols, cartões, substituições
5. **Erros**: Falhas de validação, erros de servidor

### **Formato dos Logs**

```json
{
  "timestamp": "2025-09-16T23:45:00.000Z",
  "level": "info",
  "message": "Game status updated",
  "data": {
    "gameId": 5,
    "oldStatus": "AGENDADO",
    "newStatus": "EM_ANDAMENTO",
    "userId": 1,
    "userType": "admin_geral"
  }
}
```

---

## 🛡️ **17. Segurança e Permissões**

### **Níveis de Acesso**

1. **Público**: Health check, edições, modalidades, turmas
2. **Autenticado**: Jogadores, times, jogos (leitura)
3. **Admin Turma**: Gerenciar apenas sua turma
4. **Admin Geral**: Acesso completo ao sistema

### **Validações de Segurança**

- ✅ JWT Token obrigatório para operações sensíveis
- ✅ Validação de permissões por tipo de usuário
- ✅ Rate limiting para APIs públicas
- ✅ Sanitização de inputs
- ✅ Validação de schemas com Joi

### **Headers de Segurança**

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000"
}
```

## 🔁 **18. Suporte a ETags e Cache HTTP**

### **Como funciona**

Todos os endpoints passíveis de cache agora suportam ETags e cabeçalhos Last-Modified para reduzir a transferência de dados e melhorar o desempenho. Quando um cliente faz uma requisição, o servidor retorna:

- `ETag`: Um identificador único para a versão atual do recurso
- `Last-Modified`: A data/hora da última modificação do recurso

### **Como usar**

1. **Requisição inicial**: O cliente faz uma requisição normal e recebe os dados com os cabeçalhos ETag e Last-Modified
2. **Requisições subsequentes**: O cliente envia os cabeçalhos `If-None-Match` (para ETag) ou `If-Modified-Since` (para Last-Modified)
3. **Resposta condicional**: Se os dados não mudaram, o servidor retorna 304 (Not Modified) sem o corpo da resposta

### **Exemplo de uso com ETag**

**Requisição inicial**:
```http
GET /api/games/today
```

**Resposta**:
```http
HTTP/1.1 200 OK
ETag: "16ad8f20c7c244a319e47d8e45b9d8a3"
Last-Modified: Wed, 16 Sep 2025 23:45:00 GMT
Content-Type: application/json

[... dados do jogo ...]
```

**Requisição condicional**:
```http
GET /api/games/today
If-None-Match: "16ad8f20c7c244a319e47d8e45b9d8a3"
```

**Resposta condicional**:
```http
HTTP/1.1 304 Not Modified
ETag: "16ad8f20c7c244a319e47d8e45b9d8a3"
Last-Modified: Wed, 16 Sep 2025 23:45:00 GMT
```

### **Benefícios**

- **Redução de largura de banda**: Respostas 304 são muito menores que respostas 200
- **Melhor desempenho**: Menos dados transferidos = carregamento mais rápido
- **Menor carga no servidor**: Menos processamento necessário para respostas 304

---

## 🎯 **19. Casos de Uso Comuns**

### **Caso 1: Criar um Jogo Completo**

```bash
# 1. Criar times
POST /api/teams
Body: {"nome": "Time A", "modalidadeId": 1}

POST /api/teams  
Body: {"nome": "Time B", "modalidadeId": 1}

# 2. Criar jogo
POST /api/games
Body: {
  "time1Id": 1,
  "time2Id": 2,
  "modalidadeId": 1,
  "dataHora": "2025-09-20T15:00:00.000Z",
  "local": "Quadra Principal"
}
```

### **Caso 2: Gerenciar um Jogo em Andamento**

```bash
# 1. Iniciar jogo
PATCH /api/jogos/1/status
Body: {"status": "EM_ANDAMENTO"}

# 2. Adicionar gol
POST /api/jogos/1/events
Body: {
  "tipo": "GOL",
  "minuto": 15,
  "timeId": 1,
  "jogadorId": 5
}

# 3. Atualizar placar
PATCH /api/jogos/1/score
Body: {"placarTime1": 1, "placarTime2": 0}

# 4. Finalizar jogo
PATCH /api/jogos/1/finalize
```

### **Caso 3: Consultar Estatísticas**

```bash
# 1. Classificação geral
GET /api/statistics/ranking/1

# 2. Artilheiros
GET /api/statistics/top-scorers/1

# 3. Estatísticas de jogador
GET /api/statistics/player/5

# 4. Estatísticas de time
GET /api/statistics/team/1
```

---

## 🔍 **20. Troubleshooting**

### **Problemas Comuns**

**Erro 401 - Unauthorized**
- ✅ Verificar se o token JWT está presente
- ✅ Verificar se o token não expirou
- ✅ Verificar formato: `Bearer TOKEN`

**Erro 403 - Forbidden**
- ✅ Verificar permissões do usuário
- ✅ Admin Turma só pode gerenciar sua turma
- ✅ Algumas operações requerem Admin Geral

**Erro 400 - Bad Request**
- ✅ Verificar formato dos dados enviados
- ✅ Verificar se campos obrigatórios estão presentes
- ✅ Verificar validações de schema

**Erro 500 - Internal Server Error**
- ✅ Verificar logs do servidor
- ✅ Verificar conexão com banco de dados
- ✅ Verificar se o seed foi executado

### **Comandos de Diagnóstico**

```bash
# Verificar status da API
curl -X GET "http://localhost:3000/api/health"

# Verificar informações do sistema
curl -X GET "http://localhost:3000/api/system/info"

# Verificar cache
curl -X GET "http://localhost:3000/api/system/cache/stats" \
  -H "Authorization: Bearer SEU_TOKEN"

# Limpar cache se necessário
curl -X DELETE "http://localhost:3000/api/system/cache" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📚 **21. Recursos Adicionais**

### **Documentação Técnica**
- `docs/GAME_SYSTEM_IMPROVEMENTS.md` - Detalhes das melhorias
- `MELHORIAS_IMPLEMENTADAS.md` - Resumo das implementações
- `src/services/` - Código dos serviços principais

### **Arquivos de Teste**
- `test-improvements.js` - Testes das melhorias
- `test-date-helper.js` - Testes de parsing de datas
- `test-game-schedules.js` - Testes de agendamento
- `test-today-games.js` - Testes de jogos de hoje

### **Postman Collection**
Uma collection do Postman está disponível com todos os endpoints documentados e exemplos de requisições.

### **Swagger/OpenAPI**
A documentação interativa da API está disponível em:
- Desenvolvimento: `http://localhost:3000/api-docs`
- Produção: `https://backend-24oo.onrender.com/api-docs`

---

## 🎉 **Conclusão**

Este guia documenta um sistema robusto e completo para gerenciamento de jogos esportivos, com:

- ✅ **26 endpoints** documentados
- ✅ **Sistema de estados** com máquina de estados
- ✅ **Cache inteligente** com TTL e cleanup automático
- ✅ **Scheduler automático** com execução por minuto
- ✅ **Tratamento robusto** de datas e timezones
- ✅ **Filtros avançados** por período do dia
- ✅ **Validações completas** de segurança e dados
- ✅ **Logs de auditoria** para todas as operações
- ✅ **Monitoramento** com endpoints de sistema
- ✅ **Otimizações de performance** para rotas de alto risco
- ✅ **Modo resumo** para respostas enxutas
- ✅ **Paginação** para evitar carregamento de datasets inteiros
- ✅ **Endpoints granulares** para dashboard
- ✅ **Endpoints batch** para múltiplas consultas
- ✅ **Suporte a ETags** para cache HTTP

O sistema está pronto para produção e oferece uma experiência completa para gerenciamento de campeonatos esportivos escolares, com otimizações de performance que reduzem significativamente a carga nas rotas de maior risco de sobrecarga.

---

**Última atualização**: 20 de setembro de 2025  
**Versão da API**: 2.1.0  
**Status**: ✅ Produção
-
--

## 📚 **Documentação Adicional**

- **[API de Jogadores](./JOGADORES_API.md)**: Documentação completa dos endpoints de jogadores com gênero e modalidades obrigatórios
- **[Mensagens de Erro](./ERROR_MESSAGES.md)**: Lista completa de todas as mensagens de erro da API, incluindo novas validações
- **[Associação Seletiva](./SELECTIVE_PLAYER_ASSOCIATION.md)**: Documentação da lógica de associação de jogadores a times

---

**Desenvolvido para o Dashboard Esportivo - Interclasse 2025** 🏆