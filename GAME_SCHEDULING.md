# Game Scheduling System - Group-Based Match Definitions

## Overview

The automatic game scheduling system supports tournament structures with group-based match definitions, where teams are organized into groups and play a round-robin format within their groups. After the group stage, qualified teams advance to elimination rounds (semifinals and finals).

## System Components

### Database Models

#### Time Model
The [Time](file:///d:/node/main/backend/prisma/schema.prisma#L75-L106) model has been enhanced with a `grupo` field to support group assignments:
- `grupo` (String, optional) - Group identifier (e.g., "A", "B")

#### Jogo Model
The [Jogo](file:///d:/node/main/backend/prisma/schema.prisma#L172-L223) model includes new fields for tournament structure:
- `tipoJogo` (TipoJogo, default: FASE_GRUPOS) - Game type (FASE_GRUPOS, SEMIFINAL, FINAL)
- `descricao` (String, optional) - Game description including group information

### Services

#### GameManagementService
Located in [src/services/gameManagementService.ts](file:///d:/node/main/backend/src/services/gameManagementService.ts), this service handles all automatic game generation logic:

1. **[gerarJogosFaseGrupos](file:///d:/node/main/backend/src/services/gameManagementService.ts#L11-L51)** - Generates round-robin matches for all groups
2. **[gerarSemifinais](file:///d:/node/main/backend/src/services/gameManagementService.ts#L103-L134)** - Generates semifinal matches based on group standings
3. **[gerarFinal](file:///d:/node/main/backend/src/services/gameManagementService.ts#L304-L357)** - Generates the final match based on semifinal results
4. **[gerarTodosJogos](file:///d:/node/main/backend/src/services/gameManagementService.ts#L359-L391)** - Generates all games in sequence

#### GrupoModel
Located in [src/models/grupoModel.ts](file:///d:/node/main/backend/src/models/grupoModel.ts), this model handles group-related operations:

1. **[calcularTabelaGrupo](file:///d:/node/main/backend/src/models/grupoModel.ts#L63-L179)** - Calculates group standings based on match results
2. **[getClassificados](file:///d:/node/main/backend/src/models/grupoModel.ts#L249-L259)** - Gets qualified teams from a group
3. **[listarGrupos](file:///d:/node/main/backend/src/models/grupoModel.ts#L262-L286)** - Lists all groups for a modality
4. **[atualizarGrupoTime](file:///d:/node/main/backend/src/models/grupoModel.ts#L289-L304)** - Updates a team's group assignment

## Tournament Structure

### Group Stage
- Teams are divided into groups (typically 2-4 groups)
- Each team plays every other team in its group once (round-robin)
- Group standings are calculated based on points (3 for win, 1 for draw, 0 for loss)
- Tiebreakers: direct confrontation, goal difference, goals scored, goals conceded

### Elimination Stage
- Top teams from each group advance to semifinals
- Semifinal 1: 1st place Group A vs 2nd place Group B
- Semifinal 2: 1st place Group B vs 2nd place Group A
- Final: Winners of both semifinals face each other

## API Endpoints

### Group Management
- `GET /api/grupos` - List groups
- `GET /api/grupos/table` - Get group standings
- `GET /api/grupos/qualified` - Get qualified teams
- `PUT /api/grupos/teams/:timeId/group` - Update team group assignment

### Automatic Game Generation
- `POST /api/grupos/games/generate-group-stage` - Generate group stage matches
- `POST /api/grupos/games/generate-semifinals` - Generate semifinals
- `POST /api/grupos/games/generate-semifinals-manual` - Generate semifinals manually
- `POST /api/grupos/games/generate-final` - Generate final
- `POST /api/grupos/games/generate-all` - Generate all matches in sequence

## Implementation Details

### Round-Robin Algorithm
The [gerarJogosRoundRobin](file:///d:/node/main/backend/src/services/gameManagementService.ts#L54-L67) function generates all possible pairings within a group:
```typescript
private static gerarJogosRoundRobin(times: any[]): { time1Id: number; time2Id: number }[] {
  const jogos: { time1Id: number; time2Id: number }[] = [];
  
  for (let i = 0; i < times.length; i++) {
    for (let j = i + 1; j < times.length; j++) {
      jogos.push({
        time1Id: times[i].id,
        time2Id: times[j].id
      });
    }
  }
  
  return jogos;
}
```

### Group Standings Calculation
The [calcularTabelaGrupo](file:///d:/node/main/backend/src/models/grupoModel.ts#L63-L179) function calculates standings with these rules:
1. Points (3 for win, 1 for draw, 0 for loss)
2. Direct confrontation
3. Goal difference
4. Goals scored
5. Fewer goals conceded

### Semifinal Generation Logic
For group-based tournaments:
- System identifies exactly 2 groups
- Gets top 2 teams from each group
- Creates semifinal matchups:
  - Semifinal 1: 1st Group A vs 2nd Group B
  - Semifinal 2: 1st Group B vs 2nd Group A

## Configuration

### Required Parameters
All automatic generation functions require:
- `modalidadeId` - Sport modality ID
- `genero` - Gender category
- `edicaoId` - Tournament edition ID
- `dataInicio` - Start date/time for matches
- `local` - Game location (default: "Quadra Principal")

### Game Types
The system supports three game types:
- `FASE_GRUPOS` - Group stage matches
- `SEMIFINAL` - Semifinal matches
- `FINAL` - Final match

## Usage Examples

### Setting Up a Tournament
1. Create teams and assign to groups:
```typescript
// Create teams
const team1 = await prisma.time.create({
  data: {
    nome: 'Time Alpha',
    grupo: 'A',
    edicaoId: 1,
    modalidadeId: 1
  }
});
```

2. Generate group stage matches:
```typescript
await GameManagementService.gerarJogosFaseGrupos(
  1,           // modalidadeId
  'Masculino', // genero
  1,           // edicaoId
  new Date('2025-03-01T09:00:00'),
  'Quadra Principal'
);
```

3. After matches are played, generate semifinals:
```typescript
await GameManagementService.gerarSemifinais(
  1,           // modalidadeId
  'Masculino', // genero
  1,           // edicaoId
  new Date('2025-03-15T15:00:00'),
  'Quadra Principal'
);
```

4. After semifinals are played, generate the final:
```typescript
await GameManagementService.gerarFinal(
  1,           // modalidadeId
  'Masculino', // genero
  1,           // edicaoId
  new Date('2025-03-20T15:00:00'),
  'Quadra Principal'
);
```

## Error Handling

The system includes comprehensive error handling:
- Validates required parameters
- Checks for sufficient teams in groups
- Ensures proper group structure (exactly 2 groups for elimination stage)
- Handles database errors gracefully
- Provides meaningful error messages

Common error scenarios:
- Insufficient teams in groups for elimination stage
- Missing group assignments
- Invalid dates or parameters
- Database connection issues

## Best Practices

1. **Group Structure**: Use 3-4 teams per group for balanced competition
2. **Scheduling**: Allow sufficient time between matches for the same teams
3. **Data Validation**: Always verify group assignments before generating matches
4. **Status Management**: Properly update game statuses as matches progress
5. **Backup**: Keep backups of tournament data before major operations

## Testing

The system includes simulation utilities in [src/utils/tournamentSimulation.ts](file:///d:/node/main/backend/src/utils/tournamentSimulation.ts) that demonstrate:
- Complete tournament setup
- Automatic match generation
- Score simulation
- Standings calculation
- Elimination stage generation

To run the simulation:
```bash
npm run simulate:tournament
```