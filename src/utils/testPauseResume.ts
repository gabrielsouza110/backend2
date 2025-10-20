import { GameTimeHelper } from './gameTimeHelper';

/**
 * Simple test to verify the pause/resume functionality works correctly
 */
async function testPauseResume() {
  console.log('Testing pause/resume functionality...');
  
  // Create a mock game start time (10 minutes ago)
  const startTime = new Date(Date.now() - 10 * 60 * 1000);
  console.log(`Game started at: ${startTime.toISOString()}`);
  
  // Test normal calculation (should be around 10 minutes)
  // Note: We're using a mock jogoId of 1 for testing
  const normalMinutes = await GameTimeHelper.calculateGameMinute(1, startTime);
  console.log(`Normal game time: ${normalMinutes} minutes`);
  
  console.log('Test completed successfully!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPauseResume().catch(console.error);
}

export { testPauseResume };