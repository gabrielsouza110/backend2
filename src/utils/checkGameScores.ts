import { prisma } from '../models/database';

/**
 * Check game scores and display them properly
 */
async function checkGameScores() {
  console.log('📋 Checking game scores...');
  
  try {
    // Get all games with their scores
    const games = await prisma.jogo.findMany({
      where: {
        tipoJogo: { in: ['FASE_GRUPOS', 'SEMIFINAL'] }
      },
      include: {
        jogoTimes: true,
        time1: true,
        time2: true
      },
      orderBy: [{ tipoJogo: 'asc' }, { id: 'asc' }]
    });
    
    console.log('\n⚽ Group Stage Games:');
    const groupStageGames = games.filter(g => g.tipoJogo === 'FASE_GRUPOS');
    groupStageGames.forEach(game => {
      // Get scores from jogoTimes
      const time1Score = game.jogoTimes.find(jt => jt.timeId === game.time1Id)?.gols || 0;
      const time2Score = game.jogoTimes.find(jt => jt.timeId === game.time2Id)?.gols || 0;
      
      console.log(`   Game ${game.id}: ${game.time1?.nome} ${time1Score} x ${time2Score} ${game.time2?.nome} (${game.descricao})`);
    });
    
    console.log('\n🏆 Semifinal Games:');
    const semifinalGames = games.filter(g => g.tipoJogo === 'SEMIFINAL');
    semifinalGames.forEach(game => {
      // Get scores from jogoTimes
      const time1Score = game.jogoTimes.find(jt => jt.timeId === game.time1Id)?.gols || 0;
      const time2Score = game.jogoTimes.find(jt => jt.timeId === game.time2Id)?.gols || 0;
      
      console.log(`   Game ${game.id}: ${game.time1?.nome} ${time1Score} x ${time2Score} ${game.time2?.nome} (${game.descricao})`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Group stage games: ${groupStageGames.length}`);
    console.log(`   - Semifinal games: ${semifinalGames.length}`);
    
    // Show teams and their groups
    const teams = await prisma.time.findMany({
      where: {
        nome: {
          in: [
            'Time Alpha', 'Time Beta', 'Time Gamma',
            'Time Delta', 'Time Epsilon', 'Time Zeta'
          ]
        }
      },
      orderBy: [{ grupo: 'asc' }, { nome: 'asc' }]
    });
    
    console.log('\n📋 Teams by Group:');
    const groups: Record<string, typeof teams> = { A: [], B: [] };
    teams.forEach(team => {
      if (team.grupo) {
        groups[team.grupo].push(team);
      }
    });
    
    Object.entries(groups).forEach(([groupName, groupTeams]) => {
      console.log(`   Group ${groupName}:`);
      groupTeams.forEach(team => {
        console.log(`     - ${team.nome}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking game scores:', error);
  }
}

// Run the check if this file is executed directly
if (require.main === module) {
  checkGameScores()
    .then(() => {
      console.log('\n✅ Game score check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Game score check failed:', error);
      process.exit(1);
    });
}

export { checkGameScores };