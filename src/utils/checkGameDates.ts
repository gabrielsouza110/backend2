// Check actual game dates in the database

import { prisma } from '../models/database';

async function checkGameDates() {
  try {
    console.log('=== Checking Game Dates in Database ===');
    
    // Get a few recent games
    const games = await prisma.jogo.findMany({
      orderBy: { dataHora: 'desc' },
      take: 5,
      include: {
        time1: true,
        time2: true
      }
    });
    
    console.log(`Found ${games.length} games:`);
    
    for (const game of games) {
      console.log('\n--- Game Details ---');
      console.log(`ID: ${game.id}`);
      console.log(`Description: ${game.descricao}`);
      console.log(`Stored date (UTC): ${game.dataHora.toISOString()}`);
      console.log(`Stored date (toString): ${game.dataHora.toString()}`);
      console.log(`Time1: ${game.time1?.nome}`);
      console.log(`Time2: ${game.time2?.nome}`);
      
      // Format for Brazil timezone
      const brazilTime = game.dataHora.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      });
      console.log(`Brazil time: ${brazilTime}`);
    }
    
    console.log('\n=== System Timezone Info ===');
    console.log('Current system time (UTC):', new Date().toISOString());
    console.log('Current Brazil time:', new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    }));
    
  } catch (error) {
    console.error('Error checking game dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  checkGameDates();
}

export { checkGameDates };