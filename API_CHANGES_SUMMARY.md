# API Changes Summary - Group-Based Match Definitions

## Overview
This document summarizes the new API endpoints and modifications introduced to support the automatic game scheduling system with group-based match definitions.

## New Endpoints

### Group Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/grupos` | List all groups for a modality |
| GET | `/api/grupos/table` | Get group standings table |
| GET | `/api/grupos/qualified` | Get qualified teams from a group |
| PUT | `/api/grupos/teams/:timeId/group` | Update team group assignment |

### Automatic Game Generation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/grupos/games/generate-group-stage` | Generate round-robin matches for all groups |
| POST | `/api/grupos/games/generate-semifinals` | Generate semifinals based on group standings |
| POST | `/api/grupos/games/generate-semifinals-manual` | Generate semifinals by specifying team IDs |
| POST | `/api/grupos/games/generate-final` | Generate final match based on semifinal results |
| POST | `/api/grupos/games/generate-all` | Generate all matches in sequence |

## Modified Endpoints

### Game Management
| Method | Endpoint | Changes |
|--------|----------|---------|
| POST | `/api/jogos` | Added support for `tipoJogo` field |
| PATCH | `/api/jogos/:id/score` | Enhanced score validation |
| PATCH | `/api/jogos/:id/status` | Added state transition validation |
| PATCH | `/api/jogos/:id/pause` | New endpoint for pausing games |
| PATCH | `/api/jogos/:id/resume` | New endpoint for resuming games |
| PATCH | `/api/jogos/:id/finalize` | New endpoint for finalizing games |
| PATCH | `/api/jogos/:id/reschedule` | New endpoint for rescheduling games |

## New Data Models

### Time Model Enhancements
- Added `grupo` field (String, optional) for group assignments

### Jogo Model Enhancements
- Added `tipoJogo` field (TipoJogo enum: FASE_GRUPOS, SEMIFINAL, FINAL)
- Enhanced `descricao` field to include group information

## Request/Response Formats

### Group Management Requests

#### Update Team Group
```json
{
  "grupo": "A"
}
```

### Automatic Game Generation Requests

#### Generate Group Stage
```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicio": "2025-03-01T09:00:00.000Z",
  "local": "Quadra Principal"
}
```

#### Generate Semifinals
```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicio": "2025-03-15T15:00:00.000Z",
  "local": "Quadra Principal"
}
```

#### Generate Semifinals Manual
```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicio": "2025-03-15T15:00:00.000Z",
  "local": "Quadra Principal",
  "semifinais": {
    "jogo1": {
      "time1Id": 1,
      "time2Id": 4
    },
    "jogo2": {
      "time1Id": 2,
      "time2Id": 3
    }
  }
}
```

#### Generate Final
```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataFinal": "2025-03-20T15:00:00.000Z",
  "local": "Quadra Principal"
}
```

#### Generate All Games
```json
{
  "modalidadeId": 1,
  "genero": "Masculino",
  "edicaoId": 1,
  "dataInicioGrupos": "2025-03-01T09:00:00.000Z",
  "dataInicioSemifinais": "2025-03-15T15:00:00.000Z",
  "dataFinal": "2025-03-20T15:00:00.000Z",
  "local": "Quadra Principal"
}
```

## Response Formats

### Group Listing
```json
{
  "success": true,
  "data": {
    "grupos": ["A", "B"]
  }
}
```

### Group Standings
```json
{
  "success": true,
  "data": {
    "tabela": [
      {
        "timeId": 1,
        "time": {
          "id": 1,
          "nome": "Time Alpha",
          "grupo": "A"
        },
        "posicao": 1,
        "pontos": 6,
        "jogos": 2,
        "vitorias": 2,
        "empates": 0,
        "derrotas": 0,
        "golsPro": 5,
        "golsContra": 2,
        "saldoGols": 3
      }
    ]
  }
}
```

### Qualified Teams
```json
{
  "success": true,
  "data": {
    "classificados": [
      {
        "timeId": 1,
        "time": {
          "id": 1,
          "nome": "Time Alpha",
          "grupo": "A"
        },
        "posicao": 1,
        "pontos": 6,
        "jogos": 2,
        "vitorias": 2,
        "empates": 0,
        "derrotas": 0,
        "golsPro": 5,
        "golsContra": 2,
        "saldoGols": 3
      }
    ]
  }
}
```

### Game Generation Responses
```json
{
  "success": true,
  "data": {
    "message": "Jogos de fase de grupos gerados com sucesso"
  }
}
```

## Validation Rules

### Group Stage Generation
- Requires exactly 3 or more teams per group
- All teams must be assigned to groups
- Start date must be in the future
- Modality and edition must exist

### Semifinal Generation
- Requires exactly 2 groups
- Each group must have at least 2 teams
- All group stage games must be finalized
- Start date must be in the future

### Final Generation
- Requires exactly 2 semifinal games
- Both semifinals must be finalized
- Final date must be in the future

## Error Responses

### Bad Request (400)
```json
{
  "success": false,
  "error": "modalidadeId, genero, edicaoId e dataInicio são obrigatórios"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Jogo não encontrado"
}
```

### Conflict (409)
```json
{
  "success": false,
  "error": "Já existe um jogo agendado para um dos times nesse horário"
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

## Authentication Requirements

All endpoints except group listing require authentication:
- Admin Geral: Full access to all endpoints
- Admin Turma: Limited access based on team assignments
- User: Read-only access to public endpoints

## Rate Limiting

API endpoints are protected by rate limiting:
- 100 requests per 15 minutes per IP
- Exceeding limits returns 429 status code

## Caching

Group standings and qualified teams are cached for performance:
- Cache TTL: 5 minutes
- Cache is invalidated when games are updated
- Manual cache clearing available for admins

## Testing

### Test Data Setup
1. Create edition
2. Create modality
3. Create teams and assign to groups
4. Generate matches
5. Simulate game completion

### Example Test Sequence
```bash
# 1. Create teams
curl -X POST "/api/times" -d '{"nome": "Time Alpha", "grupo": "A", ...}'

# 2. Generate group stage
curl -X POST "/api/grupos/games/generate-group-stage" -d '{...}'

# 3. Update scores for group games
curl -X PATCH "/api/jogos/1/score" -d '{"placarTime1": 3, "placarTime2": 1}'

# 4. Finalize group games
curl -X PATCH "/api/jogos/1/status" -d '{"status": "FINALIZADO"}'

# 5. Generate semifinals
curl -X POST "/api/grupos/games/generate-semifinals" -d '{...}'

# 6. Generate final
curl -X POST "/api/grupos/games/generate-final" -d '{...}'
```

## Monitoring

### Logging
All operations are logged with:
- Timestamp
- User ID (if authenticated)
- Operation type
- Success/failure status
- Error details (if applicable)

### Performance Metrics
- Response times for each endpoint
- Cache hit/miss ratios
- Error rates
- Usage statistics

## Security Considerations

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection protection through Prisma ORM
- XSS prevention through output encoding

### Access Control
- Role-based access control (RBAC)
- Team-level permissions for admin turma
- Audit trails for all modifications

### Data Protection
- HTTPS required for all endpoints
- Sensitive data encryption at rest
- Regular security audits