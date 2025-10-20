import { prisma } from '../models/database';
import { GameManagementService } from '../services/gameManagementService';
import { GrupoModel } from '../models/grupoModel';

/**
 * Clean existing tournament data and simulate a fresh championship tournament
 */
async function cleanAndSimulateTournament() {
  console.log('🧹 Cleaning existing tournament data...');
  
  try {
    // Delete all games with tournament descriptions
    await prisma.jogo.deleteMany({
      where: {
        OR: [
          { descricao: { contains: 'Fase de Grupos' } },
          { tipoJogo: 'SEMIFINAL' },
          { tipoJogo: 'FINAL' }
        ]
      }
    });
    console.log('✅ Deleted existing tournament games');
    
    // Delete teams that were created for tournament simulation
    await prisma.time.deleteMany({
      where: {
        nome: {
          in: [
            'Time Alpha', 'Time Beta', 'Time Gamma',
            'Time Delta', 'Time Epsilon', 'Time Zeta'
          ]
        }
      }
    });
    console.log('✅ Deleted existing tournament teams');
    
    // Now run the tournament simulation
    await simulateChampionshipTournament();
    
  } catch (error) {
    console.error('❌ Error cleaning and simulating tournament:', error);
    throw error;
  }
}

/**
 * Simulate a championship tournament with the following structure:
 * - 2 groups (A and B), each containing exactly 3 teams
 * - In the elimination phase, schedule matches where:
 *   - 1st place team from Group A plays against the 2nd place team from Group B
 *   - 1st place team from Group B plays against the 2nd place team from Group A
 */
async function simulateChampionshipTournament() {
  console.log('\n🏆 Starting Championship Tournament Simulation');
  
  try {
    // Step 1: Create an edition if it doesn't exist
    let edition = await prisma.edicao.findFirst({
      where: { ano: 2025 }
    });
    
    if (!edition) {
      edition = await prisma.edicao.create({
        data: {
          ano: 2025,
          nome: 'Campeonato 2025',
          descricao: 'Campeonato Escolar 2025',
          ativa: true,
          dataInicio: new Date('2025-03-01'),
          dataFim: new Date('2025-03-31')
        }
      });
      console.log(`✅ Created edition: ${edition.nome}`);
    } else {
      console.log(`✅ Using existing edition: ${edition.nome}`);
    }
    
    // Step 2: Create a modality if it doesn't exist
    let modality = await prisma.modalidade.findFirst({
      where: { tipo: 'FUTSAL' }
    });
    
    if (!modality) {
      modality = await prisma.modalidade.create({
        data: {
          nome: 'Futsal',
          tipo: 'FUTSAL',
          genero: 'Masculino'
        }
      });
      console.log(`✅ Created modality: ${modality.nome}`);
    } else {
      console.log(`✅ Using existing modality: ${modality.nome}`);
    }
    
    // Step 3: Create 6 teams (3 for each group)
    const teamsData = [
      { nome: 'Time Alpha', grupo: 'A' },
      { nome: 'Time Beta', grupo: 'A' },
      { nome: 'Time Gamma', grupo: 'A' },
      { nome: 'Time Delta', grupo: 'B' },
      { nome: 'Time Epsilon', grupo: 'B' },
      { nome: 'Time Zeta', grupo: 'B' }
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
    
    // Step 4: Generate group stage games
    console.log('\n⚽ Generating group stage games...');
    const groupStageDate = new Date('2025-03-01T09:00:00');
    await GameManagementService.gerarJogosFaseGrupos(
      modality.id,
      'Masculino',
      edition.id,
      groupStageDate,
      'Quadra Principal'
    );
    
    // Step 5: Simulate completion of group stage games by marking them as FINALIZADO
    console.log('✅ Group stage games generated');
    
    // Get all group stage games and mark them as finished with some scores
    const groupStageGames = await prisma.jogo.findMany({
      where: {
        modalidadeId: modality.id,
        edicaoId: edition.id,
        tipoJogo: 'FASE_GRUPOS'
      }
    });
    
    console.log(`\n🏁 Simulating completion of ${groupStageGames.length} group stage games...`);
    
    // For each group stage game, set a score and mark as FINALIZADO
    for (let i = 0; i < groupStageGames.length; i++) {
      const game = groupStageGames[i];
      // Generate random scores for simulation
      const score1 = Math.floor(Math.random() * 5);
      const score2 = Math.floor(Math.random() * 5);
      
      // First, ensure jogo_times entries exist for this game
      let jogoTimes = await prisma.jogoTime.findMany({
        where: { jogoId: game.id }
      });
      
      // If jogo_times entries don't exist, create them
      if (jogoTimes.length === 0) {
        await prisma.jogoTime.createMany({
          data: [
            {
              jogoId: game.id,
              timeId: game.time1Id,
              gols: 0
            },
            {
              jogoId: game.id,
              timeId: game.time2Id,
              gols: 0
            }
          ]
        });
        // Refresh the jogoTimes array
        jogoTimes = await prisma.jogoTime.findMany({
          where: { jogoId: game.id }
        });
      }
      
      // Update team scores in jogoTimes
      if (jogoTimes.length >= 2) {
        // Find the jogoTime entries for each team
        const jogoTime1 = jogoTimes.find(jt => jt.timeId === game.time1Id);
        const jogoTime2 = jogoTimes.find(jt => jt.timeId === game.time2Id);
        
        if (jogoTime1 && jogoTime2) {
          await prisma.jogoTime.update({
            where: { id: jogoTime1.id },
            data: { gols: score1 }
          });
          
          await prisma.jogoTime.update({
            where: { id: jogoTime2.id },
            data: { gols: score2 }
          });
        }
      }
      
      // Update game status
      await prisma.jogo.update({
        where: { id: game.id },
        data: {
          status: 'FINALIZADO',
          updatedAt: new Date()
        }
      });
      
      console.log(`   Game ${game.id}: ${game.descricao} - ${score1} x ${score2}`);
    }
    
    // Step 6: Generate semifinals based on group standings
    console.log('\n🏆 Generating semifinals based on group standings...');
    const semifinalDate = new Date('2025-03-15T15:00:00');
    
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
      // Let's try to understand what went wrong
      const grupos = await GrupoModel.listarGrupos(modality.id, 'Masculino', edition.id);
      console.log(`Available groups: ${grupos.join(', ')}`);
      
      // Check if we have enough teams in each group
      for (const grupo of grupos) {
        const classificados = await GrupoModel.getClassificados(modality.id, 'Masculino', grupo, 2, edition.id);
        console.log(`Group ${grupo} qualified teams: ${classificados.length}`);
        classificados.forEach((c, index) => {
          console.log(`  ${index + 1}. Team ID: ${c.timeId}`);
        });
      }
      
      throw error;
    }
    
    // Step 7: Verify the semifinal matchups
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
    
    console.log('\n🎉 Tournament simulation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Edition: ${edition.nome}`);
    console.log(`   - Modality: ${modality.nome}`);
    console.log(`   - Teams: ${teams.length} (3 per group)`);
    console.log(`   - Group stage games: ${groupStageGames.length}`);
    console.log(`   - Semifinal games: ${semifinalGames.length}`);
    
  } catch (error) {
    console.error('❌ Error in tournament simulation:', error);
    throw error;
  }
}

// Run the clean and simulate if this file is executed directly
if (require.main === module) {
  cleanAndSimulateTournament()
    .then(() => {
      console.log('\n✅ Tournament simulation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Tournament simulation failed:', error);
      process.exit(1);
    });
}

export { cleanAndSimulateTournament, simulateChampionshipTournament };