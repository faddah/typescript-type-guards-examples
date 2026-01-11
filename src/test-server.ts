// =============================================================================
// SERVER TESTING SCRIPT
// =============================================================================

import { testUtils } from './express-type-guards';

async function testExpressServer() {
  console.log('🧪 Testing Express Server with Type Guards');
  console.log('==========================================\n');
  
  try {
    // Test 1: Create a valid user
    console.log('1. Creating a valid user...');
    const validUserData = testUtils.createTestUser();
    console.log('Sending data:', validUserData);
    
    const createResponse = await testUtils.apiClient.createUser(validUserData);
    console.log('Response:', createResponse);
    
    if (createResponse.success) {
      const userId = createResponse.data.id;
      console.log(`✅ User created successfully with ID: ${userId}\n`);
      
      // Test 2: Get the created user
      console.log('2. Retrieving the created user...');
      const getUserResponse = await testUtils.apiClient.getUserById(userId);
      console.log('Response:', getUserResponse);
      console.log(getUserResponse.success ? '✅ User retrieved successfully\n' : '❌ Failed to retrieve user\n');
      
      // Test 3: Update the user
      console.log('3. Updating the user...');
      const updates = { name: 'Updated Test User', age: 30 };
      const updateResponse = await testUtils.apiClient.updateUser(userId, updates);
      console.log('Response:', updateResponse);
      console.log(updateResponse.success ? '✅ User updated successfully\n' : '❌ Failed to update user\n');
      
      // Test 4: Delete the user
      console.log('4. Deleting the user...');
      const deleteResponse = await testUtils.apiClient.deleteUser(userId);
      console.log('Response:', deleteResponse);
      console.log(deleteResponse.success ? '✅ User deleted successfully\n' : '❌ Failed to delete user\n');
    }
    
    // Test 5: Try to create invalid user
    console.log('5. Testing validation with invalid user data...');
    const invalidUserData = {
      name: '', // Invalid: empty name
      contact: { email: 'not-an-email' }, // Invalid email
      age: -5, // Invalid age
      isActive: 'yes', // Wrong type
      tags: 'not-an-array', // Wrong type
    };
    
    const invalidResponse = await testUtils.apiClient.createUser(invalidUserData);
    console.log('Response:', invalidResponse);
    console.log(!invalidResponse.success ? '✅ Invalid data correctly rejected\n' : '❌ Invalid data was accepted\n');
    
    // Test 6: Test pagination
    console.log('6. Testing pagination...');
    const paginationResponse = await testUtils.apiClient.getUsers({ page: '1', limit: '5' });
    console.log('Response:', paginationResponse);
    console.log(paginationResponse.success ? '✅ Pagination working\n' : '❌ Pagination failed\n');
    
    // Test 7: Get events
    console.log('7. Getting events...');
    const eventsResponse = await testUtils.apiClient.getEvents();
    console.log('Response:', eventsResponse);
    console.log(eventsResponse.success ? '✅ Events retrieved successfully\n' : '❌ Failed to retrieve events\n');
    
    console.log('🎉 All server tests completed!');
    
  } catch (error) {
    console.error('❌ Server test error:', error);
    console.log('\n💡 Make sure the Express server is running on port 3000');
    console.log('   Run: npm run dev:server');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Wait a moment for server to start if running in sequence
  setTimeout(() => {
    testExpressServer().catch(console.error);
  }, 2000);
}