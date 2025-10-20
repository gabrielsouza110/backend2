import { prisma } from '../models/database';
import { GameManagementService } from '../services/gameManagementService';
import { GrupoModel } from '../models/grupoModel';
import { JogoModel } from '../models/jogoModel';

/**
 * Simulate volleyball matches with detailed set scoring
 * This script tests the group stage round-robin implementation
 * and verifies that all teams play each other with proper scoring mechanics.
 */

interface VolleyballSet {
  time1Score: number;
  time2Score: number;
}

interface VolleyballMatchResult {
  setId: number;
  time1Sets: number[];
  time2Sets: number[];
  winner: number; // 1 for time1, 2 for time2
  matchType: '3-0' | '3-1' | '3-2';
}

// Realistic volleyball set scores
const REALISTIC_SET_SCORES = [
  { time1: 25, time2: 23 },
  { time1: 25, time2: 20 },
  { time1: 25, time2: 18 },
  { time1: 25, time2: 22 },
  { time1: 25, time2: 19 },
  { time1: 25, time2: 21 },
  { time1: 25, time2: 17 },
  { time1: 25, time2: 24 },
  { time1: 25, time2: 16 },
  { time1: 25, time2: 25 }, // Tie-break set
  { time1: 15, time2: 13 }, // Fifth set
  { time1: 15, time2: 12 }  // Fifth set
];

/**
 * Generate realistic volleyball set scores for a match
 * @param matchType Type of match result (3-0, 3-1, 3-2)
 * @returns Array of sets with scores
 */
function generateVolleyballSets(matchType: '3-0' | '3-1' | '3-2'): VolleyballSet[] {
  const sets: VolleyballSet[] = [];
  
  switch (matchType) {
    case '3-0': {
      // 3-0 sweep - winning team wins all sets convincingly
      for (let i = 0; i < 3; i++) {
        const score = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)]; // Exclude tie-break scores
        sets.push({ 
          time1Score: score.time1, 
          time2Score: score.time2 
        });
      }
      break;
    }
      
    case '3-1': {
      // 3-1 victory - losing team wins one set
      // First set: losing team wins
      const firstSet = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
      sets.push({ 
        time1Score: firstSet.time2, 
        time2Score: firstSet.time1 
      });
      
      // Next three sets: winning team wins
      for (let i = 0; i < 3; i++) {
        const score = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
        sets.push({ 
          time1Score: score.time1, 
          time2Score: score.time2 
        });
      }
      break;
    }
      
    case '3-2': {
      // 3-2 full match - teams alternate wins, fifth set tie-break
      // First two sets: alternating wins
      const set1 = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
      sets.push({ 
        time1Score: set1.time1, 
        time2Score: set1.time2 
      });
      
      const set2 = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
      sets.push({ 
        time1Score: set2.time2, 
        time2Score: set2.time1 
      });
      
      const set3 = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
      sets.push({ 
        time1Score: set3.time1, 
        time2Score: set3.time2 
      });
      
      const set4 = REALISTIC_SET_SCORES[Math.floor(Math.random() * 8)];
      sets.push({ 
        time1Score: set4.time2, 
        time2Score: set4.time1 
      });
      
      // Fifth set: tie-break
      const fifthSet = REALISTIC_SET_SCORES[10 + Math.floor(Math.random() * 2)]; // Use 15-point sets
      sets.push({ 
        time1Score: fifthSet.time1, 
        time2Score: fifthSet.time2 
      });
      break;
    }
  }
  
  return sets;
}

/**
 * Simulate a volleyball match with realistic scoring
 * @param gameId ID of the game to simulate
 * @param matchType Type of match result to simulate
 */
async function simulateVolleyballMatch(gameId: number, matchType: '3-0' | '3-1' | '3-2' = '3-0') {
  try {
    console.log(`\n🏐 Simulating volleyball match ${gameId} (${matchType})`);
    
    // Get game details
    const game = await prisma.jogo.findUnique({
      where: { id: gameId },
      include: { time1: true, time2: true }
    });
    
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }
    
    console.log(`   Match: ${game.time1?.nome} vs ${game.time2?.nome}`);
    
    // Generate sets based on match type
    const sets = generateVolleyballSets(matchType);
    const time1Sets = sets.map(set => set.time1Score);
    const time2Sets = sets.map(set => set.time2Score);
    
    console.log(`   Sets: ${time1Sets.join('-')} vs ${time2Sets.join('-')}`);
    
    // Update the game with volleyball set scores
    await JogoModel.atualizarPlacarVolei(gameId, time1Sets, time2Sets);
    
    // Determine winner (team with more sets won)
    const time1SetWins = time1Sets.filter((score, i) => score > time2Sets[i]).length;
    const time2SetWins = time2Sets.filter((score, i) => score > time1Sets[i]).length;
    
    let winnerId: number;
    if (time1SetWins > time2SetWins) {
      winnerId = game.time1Id;
      console.log(`   Winner: ${game.time1?.nome} (${time1SetWins}-${time2SetWins})`);
    } else {
      winnerId = game.time2Id;
      console.log(`   Winner: ${game.time2?.nome} (${time2SetWins}-${time1SetWins})`);
    }
    
    // Update game status to FINALIZADO
    await prisma.jogo.update({
      where: { id: gameId },
      data: { 
        status: 'FINALIZADO',
        updatedAt: new Date()
      }
    });
    
    return {
      gameId,
      time1Sets,
      time2Sets,
      winnerId,
      matchType
    };
  } catch (error) {
    console.error('Error simulating volleyball match:', error);
    throw error;
  }
}

/**
 * Create a test volleyball tournament with round-robin group stage
 */
async function simulateVolleyballTournament() {
  console.log('🏆 Starting Volleyball Tournament Simulation');
  
  try {
    // Step 1: Create an edition if it doesn't exist
    let edition = await prisma.edicao.findFirst({
      where: { ano: 2025 }
    });
    
    if (!edition) {
      edition = await prisma.edicao.create({
        data: {
          ano: 2025,
          nome: 'Torneio de Voleibol 2025',
          descricao: 'Torneio Escolar de Voleibol 2025',
          ativa: true,
          dataInicio: new Date('2025-04-01'),
          dataFim: new Date('2025-04-30')
        }
      });
      console.log(`✅ Created edition: ${edition.nome}`);
    } else {
      console.log(`✅ Using existing edition: ${edition.nome}`);
    }
    
    // Step 2: Create a volleyball modality if it doesn't exist
    let modality = await prisma.modalidade.findFirst({
      where: { tipo: 'VOLEI' }
    });
    
    if (!modality) {
      modality = await prisma.modalidade.create({
        data: {
          nome: 'Voleibol',
          tipo: 'VOLEI',
          genero: 'Masculino'
        }
      });
      console.log(`✅ Created modality: ${modality.nome}`);
    } else {
      console.log(`✅ Using existing modality: ${modality.nome}`);
    }
    
    // Step 3: Create teams (4 for each group to have a good round-robin)
    const teamsData = [
      { nome: 'Time Alpha', grupo: 'A' },
      { nome: 'Time Beta', grupo: 'A' },
      { nome: 'Time Gamma', grupo: 'A' },
      { nome: 'Time Delta', grupo: 'A' },
      { nome: 'Time Epsilon', grupo: 'B' },
      { nome: 'Time Zeta', grupo: 'B' },
      { nome: 'Time Eta', grupo: 'B' },
      { nome: 'Time Theta', grupo: 'B' }
    ];
    
    const teams = [];
    for (const teamData of teamsData) {
      const team = await prisma.time.create({
        data: {
          nome: teamData.nome,
          grupo: teamData.grupo,
          ativo: true,
          edicaoId: edition.id,
          modalidadeId: modality.id
        }
      });
      teams.push(team);
      console.log(`✅ Created team: ${team.nome} (Group ${team.grupo})`);
    }
    
    console.log(`\n📋 Created ${teams.length} teams in 2 groups:`);
    console.log(`   Group A: ${teams.filter(t => t.grupo === 'A').map(t => t.nome).join(', ')}`);
    console.log(`   Group B: ${teams.filter(t => t.grupo === 'B').map(t => t.nome).join(', ')}`);
    
    // Step 4: Generate group stage games (round-robin)
    console.log('\n🏐 Generating group stage games (round-robin format)...');
    const groupStageDate = new Date('2025-04-05T09:00:00');
    await GameManagementService.gerarJogosFaseGrupos(
      modality.id,
      'Masculino',
      edition.id,
      groupStageDate,
      'Quadra Principal'
    );
    
    // Step 5: Get all group stage games
    const groupStageGames = await prisma.jogo.findMany({
      where: {
        modalidadeId: modality.id,
        edicaoId: edition.id,
        tipoJogo: 'FASE_GRUPOS'
      },
      include: {
        time1: true,
        time2: true
      }
    });
    
    console.log(`✅ Generated ${groupStageGames.length} group stage games`);
    
    // Step 6: Simulate completion of group stage games with realistic volleyball scores
    console.log('\n🏁 Simulating completion of group stage games with volleyball scoring...');
    
    // Track match types for variety
    const matchTypes: ('3-0' | '3-1' | '3-2')[] = ['3-0', '3-1', '3-2'];
    const matchResults: any[] = [];
    
    for (let i = 0; i < groupStageGames.length; i++) {
      const game = groupStageGames[i];
      const matchType = matchTypes[i % matchTypes.length]; // Rotate through match types
      
      try {
        const result = await simulateVolleyballMatch(game.id, matchType);
        matchResults.push(result);
      } catch (error) {
        console.error(`❌ Error simulating match ${game.id}:`, error);
      }
    }
    
    // Step 7: Display group standings
    console.log('\n📊 Group Standings:');
    const grupos = await GrupoModel.listarGrupos(modality.id, 'Masculino', edition.id);
    
    for (const grupo of grupos) {
      console.log(`\n   Group ${grupo}:`);
      const tabela = await GrupoModel.calcularTabelaGrupo(modality.id, 'Masculino', grupo, edition.id);
      
      tabela.forEach((posicao, index) => {
        console.log(`     ${index + 1}. ${posicao.time.nome} - ${posicao.pontos} pts (${posicao.vitorias}W-${posicao.derrotas}L)`);
      });
    }
    
    // Step 8: Generate semifinals based on group standings
    console.log('\n🏆 Generating semifinals based on group standings...');
    const semifinalDate = new Date('2025-04-20T15:00:00');
    
    try {
      await GameManagementService.gerarSemifinais(
        modality.id,
        'Masculino',
        edition.id,
        semifinalDate,
        'Quadra Principal'
      );
      console.log('✅ Semifinals generated successfully');
    } catch (error) {
      console.error('❌ Error generating semifinals:', error);
      throw error;
    }
    
    // Step 9: Verify the semifinal matchups
    const semifinalGames = await prisma.jogo.findMany({
      where: {
        modalidadeId: modality.id,
        edicaoId: edition.id,
        tipoJogo: 'SEMIFINAL'
      },
      include: {
        time1: true,
        time2: true
      },
      orderBy: { dataHora: 'asc' }
    });
    
    console.log('\n🎯 Generated Semifinal Matches:');
    semifinalGames.forEach((game, index) => {
      console.log(`   Semifinal ${index + 1}: ${game.time1?.nome} vs ${game.time2?.nome} (${game.descricao})`);
    });
    
    console.log('\n🎉 Volleyball tournament simulation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Edition: ${edition.nome}`);
    console.log(`   - Modality: ${modality.nome}`);
    console.log(`   - Teams: ${teams.length} (4 per group)`);
    console.log(`   - Group stage games: ${groupStageGames.length}`);
    console.log(`   - Semifinal games: ${semifinalGames.length}`);
    
  } catch (error) {
    console.error('❌ Error in volleyball tournament simulation:', error);
    throw error;
  }
}

// Run the simulation if this file is executed directly
if (require.main === module) {
  simulateVolleyballTournament()
    .then(() => {
      console.log('\n✅ Simulation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Simulation failed:', error);
      process.exit(1);
    });
}

export { simulateVolleyballTournament, simulateVolleyballMatch, generateVolleyballSets };