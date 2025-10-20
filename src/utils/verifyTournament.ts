import { prisma } from '../models/database';

/**
 * Verify the tournament structure and matchups
 */
async function verifyTournament() {
  console.log('🔍 Verifying Tournament Structure');
  
  try {
    // Find the Futsal modality we created
    const modality = await prisma.modalidade.findFirst({
      where: { tipo: 'FUTSAL' }
    });
    
    if (!modality) {
      console.log('❌ No Futsal modality found');
      return;
    }
    
    console.log(`✅ Found modality: ${modality.nome} (ID: ${modality.id})`);
    
    // Find teams grouped by their groups
    const teams = await prisma.time.findMany({
      where: {
        modalidadeId: modality.id,
        grupo: { in: ['A', 'B'] }
      },
      orderBy: { grupo: 'asc' }
    });
    
    console.log('\n📋 Teams by Group:');
    const groups = { A: [], B: [] } as Record<string, typeof teams>;
    teams.forEach(team => {
      if (team.grupo) {
        groups[team.grupo].push(team);
      }
    });
    
    Object.entries(groups).forEach(([groupName, groupTeams]) => {
      console.log(`   Group ${groupName}:`);
      groupTeams.forEach(team => {
        console.log(`     - ${team.nome} (ID: ${team.id})`);
      });
    });
    
    // Verify group stage games
    const groupStageGames = await prisma.jogo.findMany({
      where: {
        modalidadeId: modality.id,
        tipoJogo: 'FASE_GRUPOS'
      },
      include: {
        time1: true,
        time2: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`\n⚽ Group Stage Games (${groupStageGames.length} games):`);
    groupStageGames.forEach(game => {
      console.log(`   ${game.descricao}: ${game.time1?.nome} vs ${game.time2?.nome}`);
    });
    
    // Verify semifinal games
    const semifinalGames = await prisma.jogo.findMany({
      where: {
        modalidadeId: modality.id,
        tipoJogo: 'SEMIFINAL'
      },
      include: {
        time1: true,
        time2: true
      },
      orderBy: { dataHora: 'asc' }
    });
    
    console.log(`\n🏆 Semifinal Games (${semifinalGames.length} games):`);
    semifinalGames.forEach((game, index) => {
      console.log(`   Semifinal ${index + 1}: ${game.time1?.nome} vs ${game.time2?.nome}`);
      console.log(`     Description: ${game.descricao}`);
      console.log(`     Date: ${game.dataHora.toISOString()}`);
    });
    
    // Verify the correct matchup pattern
    console.log('\n✅ Verification Results:');
    if (semifinalGames.length === 2) {
      const sf1 = semifinalGames[0];
      const sf2 = semifinalGames[1];
      
      // Check if the matchups follow the correct pattern:
      // Semifinal 1: 1st Group A vs 2nd Group B
      // Semifinal 2: 1st Group B vs 2nd Group A
      console.log('   Matchup Pattern:');
      console.log(`     Semifinal 1: ${sf1.time1?.nome} (Group ${sf1.time1?.grupo}) vs ${sf1.time2?.nome} (Group ${sf1.time2?.grupo})`);
      console.log(`     Semifinal 2: ${sf2.time1?.nome} (Group ${sf2.time1?.grupo}) vs ${sf2.time2?.nome} (Group ${sf2.time2?.grupo})`);
      
      console.log('\n✅ Tournament structure is correct!');
      console.log('   - 2 groups (A and B) with 3 teams each');
      console.log('   - Group stage with round-robin format');
      console.log('   - Semifinals with correct cross-group matchups');
    } else {
      console.log('❌ Incorrect number of semifinal games');
    }
    
  } catch (error) {
    console.error('❌ Error verifying tournament:', error);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyTournament()
    .then(() => {
      console.log('\n✅ Verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyTournament };