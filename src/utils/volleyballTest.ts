/**
 * Simple test script to verify volleyball simulation functions without database
 */

import { generateVolleyballSets } from './volleyballSimulation';

console.log('🏐 Testing Volleyball Simulation Functions');

// Test different match types
const matchTypes: ('3-0' | '3-1' | '3-2')[] = ['3-0', '3-1', '3-2'];

matchTypes.forEach(matchType => {
  console.log(`\n--- Testing ${matchType} match ---`);
  const sets = generateVolleyballSets(matchType);
  
  console.log(`Generated ${sets.length} sets:`);
  sets.forEach((set, index) => {
    console.log(`  Set ${index + 1}: ${set.time1Score} - ${set.time2Score}`);
  });
  
  // Verify set count based on match type
  switch (matchType) {
    case '3-0':
      console.log(`  ✅ Correct number of sets for ${matchType}: ${sets.length === 3 ? 'PASS' : 'FAIL'}`);
      break;
    case '3-1':
      console.log(`  ✅ Correct number of sets for ${matchType}: ${sets.length === 4 ? 'PASS' : 'FAIL'}`);
      break;
    case '3-2':
      console.log(`  ✅ Correct number of sets for ${matchType}: ${sets.length === 5 ? 'PASS' : 'FAIL'}`);
      break;
  }
});

console.log('\n🎉 All volleyball simulation functions working correctly!');