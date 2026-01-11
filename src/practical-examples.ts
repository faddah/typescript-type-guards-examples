// =============================================================================
// PRACTICAL EXAMPLES AND TESTING DEMOS
// =============================================================================

import { 
  // Basic type guards
  isString, isNumber, isUser, isAPIEvent,
  // Advanced patterns
  validateUser, fetchUser, assertIsUser,
  // Types
  User, APIEvent, Result,
} from './detailed-type-guards.ts';

// =============================================================================
// 1. REAL-WORLD USAGE EXAMPLES
// =============================================================================

console.log('=== TYPE GUARDS PRACTICAL EXAMPLES ===\n');

// Example 1: Processing external API data
async function processExternalApiData() {
  console.log('1. Processing External API Data');
  console.log('================================');
  
  // Simulate data from external API (could be malformed)
  const externalData = [
    // Valid user
    {
      id: 'user_123',
      name: 'John Doe',
      contact: { email: 'john@example.com' },
      age: 30,
      isActive: true,
      tags: ['premium', 'verified'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-12-01'),
    },
    // Invalid user (missing required fields)
    {
      id: 'user_456',
      name: 'Jane Smith',
      // missing contact
      age: 25,
      isActive: true,
      tags: ['basic'],
    },
    // Completely invalid data
    'not-a-user-object',
    null,
    // Partial user data
    {
      name: 'Bob Johnson',
      contact: { email: 'invalid-email' }, // Invalid email
      age: -5, // Invalid age
      isActive: true,
      tags: [],
    },
  ];
  
  const validUsers: User[] = [];
  const errors: string[] = [];
  
  externalData.forEach((data, index) => {
    console.log(`\nProcessing item ${index}:`, data);
    
    if (isUser(data)) {
      validUsers.push(data);
      console.log(`  ✅ Valid user: ${data.name}`);
    } else {
      const validation = validateUser(data);
      if (validation.isValid) {
        validUsers.push(validation.data!);
        console.log(`  ✅ Valid user after detailed validation: ${validation.data!.name}`);
      } else {
        const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        errors.push(`Item ${index}: ${errorMessages}`);
        console.log(`  ❌ Invalid: ${errorMessages}`);
      }
    }
  });
  
  console.log(`\nResults: ${validUsers.length} valid users, ${errors.length} errors`);
  console.log('Valid users:', validUsers.map(u => u.name));
  console.log('Errors:', errors);
}

// Example 2: Form data processing with validation
function processFormData() {
  console.log('\n\n2. Form Data Processing');
  console.log('=======================');
  
  // Simulate form submissions with various data types
  const formSubmissions = [
    // Valid form data
    {
      name: 'Alice Cooper',
      email: 'alice@example.com',
      age: '28',
      tags: 'musician, verified, premium',
      isActive: true,
    },
    // Invalid email
    {
      name: 'Bob Smith',
      email: 'not-an-email',
      age: '35',
      tags: 'customer',
      isActive: true,
    },
    // Invalid age
    {
      name: 'Carol White',
      email: 'carol@example.com',
      age: 'thirty-five', // Non-numeric age
      tags: 'customer',
      isActive: true,
    },
    // Missing fields
    {
      name: 'David Brown',
      // missing email, age, tags
      isActive: false,
    },
  ];
  
  function validateFormSubmission(data: unknown) {
    // Type guard for form data structure
    if (typeof data !== 'object' || data === null) {
      return { isValid: false, errors: ['Data must be an object'] };
    }
    
    const form = data as any;
    const errors: string[] = [];
    
    // Validate name
    if (!isString(form.name) || form.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isString(form.email) || !emailRegex.test(form.email)) {
      errors.push('Email must be a valid email address');
    }
    
    // Validate age
    if (!isString(form.age) || isNaN(Number(form.age)) || Number(form.age) < 1) {
      errors.push('Age must be a valid positive number');
    }
    
    // Validate tags
    if (!isString(form.tags) || form.tags.trim().length === 0) {
      errors.push('Tags are required');
    }
    
    // Validate isActive
    if (typeof form.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? {
        name: form.name.trim(),
        email: form.email,
        age: Number(form.age),
        tags: form.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
        isActive: form.isActive,
      } : null,
    };
  }
  
  formSubmissions.forEach((submission, index) => {
    console.log(`\nForm submission ${index}:`, submission);
    const validation = validateFormSubmission(submission);
    
    if (validation.isValid) {
      console.log(`  ✅ Valid form data:`, validation.data);
    } else {
      console.log(`  ❌ Validation errors:`, validation.errors);
    }
  });
}

// Example 3: Event processing with discriminated unions
function processEvents() {
  console.log('\n\n3. Event Processing');
  console.log('===================');
  
  // Simulate various events (some valid, some invalid)
  const eventData = [
    // Valid user_created event
    {
      type: 'user_created',
      timestamp: new Date(),
      data: {
        user: {
          id: 'user_789',
          name: 'Event User',
          contact: { email: 'event@example.com' },
          age: 30,
          isActive: true,
          tags: ['event-created'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        source: 'registration',
      },
    },
    // Valid user_login event
    {
      type: 'user_login',
      timestamp: new Date(),
      data: {
        userId: 'user_123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        successful: true,
      },
    },
    // Invalid event (missing required fields)
    {
      type: 'user_created',
      timestamp: new Date(),
      data: {
        // missing user field
        source: 'admin',
      },
    },
    // Invalid event type
    {
      type: 'unknown_event',
      timestamp: new Date(),
      data: { some: 'data' },
    },
    // Malformed event
    {
      not_type: 'user_login',
      data: { userId: 'test' },
    },
  ];
  
  eventData.forEach((event, index) => {
    console.log(`\nEvent ${index}:`, event);
    
    if (isAPIEvent(event)) {
      console.log(`  ✅ Valid ${event.type} event at ${event.timestamp.toISOString()}`);
      
      // Process specific event types
      switch (event.type) {
        case 'user_created':
          console.log(`    👤 New user: ${event.data.user.name} via ${event.data.source}`);
          break;
        case 'user_login':
          const status = event.data.successful ? 'successful' : 'failed';
          console.log(`    🔑 ${status} login for user ${event.data.userId} from ${event.data.ip}`);
          break;
        case 'user_updated':
          console.log(`    ✏️  User ${event.data.userId} updated by ${event.data.updatedBy}`);
          break;
        case 'user_deleted':
          console.log(`    🗑️  User ${event.data.userId} deleted by ${event.data.deletedBy}`);
          break;
        default:
          // TypeScript ensures exhaustive checking
          const _exhaustive: never = event;
          console.log(`    ⚠️  Unhandled event type`);
      }
    } else {
      console.log(`  ❌ Invalid event structure`);
    }
  });
}

// Example 4: Error handling with Result types
async function demonstrateErrorHandling() {
  console.log('\n\n4. Error Handling with Results');
  console.log('==============================');
  
  // Simulate various scenarios
  const userIds = ['valid_user_123', '', 'nonexistent_user', null as any];
  
  for (const userId of userIds) {
    console.log(`\nFetching user: ${userId}`);
    
    try {
      // This would normally make an HTTP request
      const result = await simulateFetchUser(userId);
      
      if (result.success) {
        console.log(`  ✅ User found: ${result.data.name} (${result.data.contact.email})`);
        
        // Safe to use result.data as User here
        console.log(`  📊 User stats: Age ${result.data.age}, ${result.data.tags.length} tags, ${result.data.isActive ? 'Active' : 'Inactive'}`);
        
      } else {
        console.log(`  ❌ Failed to fetch user: ${result.error.message}`);
        console.log(`  🏷️  Error type: ${result.error.type}`);
        
        // Handle specific error types
        switch (result.error.type) {
          case 'validation':
            console.log(`  📝 Validation error in field: ${result.error.field}`);
            break;
          case 'network':
            console.log(`  🌐 Network error (status: ${result.error.status})`);
            break;
          case 'business':
            console.log(`  💼 Business error (code: ${result.error.code})`);
            break;
        }
      }
    } catch (error) {
      console.log(`  💥 Unexpected error: ${error}`);
    }
  }
}

// Helper function to simulate async user fetching
async function simulateFetchUser(userId: string): Promise<Result<User, any>> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!isString(userId) || userId.trim() === '') {
    return {
      success: false,
      error: {
        type: 'validation',
        field: 'userId',
        message: 'User ID must be a non-empty string',
        code: 'INVALID_USER_ID',
      },
    };
  }
  
  if (userId === 'valid_user_123') {
    return {
      success: true,
      data: {
        id: userId,
        name: 'John Doe',
        contact: { email: 'john@example.com' },
        age: 30,
        isActive: true,
        tags: ['premium', 'verified'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-12-01'),
      },
    };
  }
  
  return {
    success: false,
    error: {
      type: 'business',
      code: 'NOT_FOUND',
      message: `User with ID ${userId} not found`,
    },
  };
}

// Example 5: Assertion functions in action
function demonstrateAssertions() {
  console.log('\n\n5. Assertion Functions');
  console.log('======================');
  
  const testData = [
    // Valid user data
    {
      id: 'user_456',
      name: 'Assertion Test User',
      contact: { email: 'assertion@example.com' },
      age: 25,
      isActive: true,
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Invalid user data
    {
      id: 'user_789',
      name: '', // Empty name
      contact: { email: 'invalid-email' }, // Invalid email
      age: -5, // Invalid age
      isActive: 'yes', // Wrong type
      tags: 'not-an-array', // Wrong type
      // Missing required fields
    },
    // Null data
    null,
  ];
  
  testData.forEach((data, index) => {
    console.log(`\nTesting assertion with data ${index}:`, data);
    
    try {
      assertIsUser(data);
      const user = data; // TypeScript knows this is a User now
      console.log(`  ✅ Assertion passed: ${user.name} is a valid user`);
      console.log(`  📧 Email: ${user.contact.email}`);
      console.log(`  🏷️  Tags: ${user.tags.join(', ')}`);
      
    } catch (error) {
      console.log(`  ❌ Assertion failed: ${error instanceof Error ? error.message : error}`);
    }
  });
}

// Example 6: Performance considerations
function demonstratePerformance() {
  console.log('\n\n6. Performance Considerations');
  console.log('=============================');
  
  // Generate large dataset
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: `user_${i}`,
    name: `User ${i}`,
    contact: { email: `user${i}@example.com` },
    age: 20 + (i % 50),
    isActive: i % 2 === 0,
    tags: [`tag${i % 5}`, `category${i % 3}`],
    createdAt: new Date(2020, i % 12, (i % 28) + 1),
    updatedAt: new Date(),
    // Add some invalid data occasionally
    ...(i % 1000 === 0 ? { invalidField: 'this will cause validation to fail' } : {}),
  }));
  
  console.log(`Testing with ${largeDataset.length} items...`);
  
  // Method 1: Individual validation
  console.time('Individual validation');
  let validCount1 = 0;
  for (const item of largeDataset) {
    if (isUser(item)) {
      validCount1++;
    }
  }
  console.timeEnd('Individual validation');
  console.log(`Valid items (method 1): ${validCount1}`);
  
  // Method 2: Batch validation with filter
  console.time('Batch filter validation');
  const validItems2 = largeDataset.filter(isUser);
  console.timeEnd('Batch filter validation');
  console.log(`Valid items (method 2): ${validItems2.length}`);
  
  // Method 3: Early exit with some()
  console.time('Find first valid');
  const hasValidItem = largeDataset.some(isUser);
  console.timeEnd('Find first valid');
  console.log(`Has at least one valid item: ${hasValidItem}`);
  
  // Memory usage consideration
  console.log('\nMemory usage considerations:');
  console.log('- Type guards don\'t create new objects, only validate existing ones');
  console.log('- Use streaming for very large datasets to avoid memory issues');
  console.log('- Cache validation results for frequently accessed objects');
}

// =============================================================================
// RUN ALL EXAMPLES
// =============================================================================

async function runAllExamples() {
  try {
    await processExternalApiData();
    processFormData();
    processEvents();
    await demonstrateErrorHandling();
    demonstrateAssertions();
    demonstratePerformance();
    
    console.log('\n\n🎉 All examples completed successfully!');
    console.log('\n📚 Key Takeaways:');
    console.log('- Always validate external data with type guards');
    console.log('- Use discriminated unions for complex event systems');
    console.log('- Implement proper error handling with Result types');
    console.log('- Use assertion functions when you need to throw on invalid data');
    console.log('- Consider performance implications for large datasets');
    console.log('- Type guards provide runtime safety without TypeScript compilation');
    
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

export const testingSuite = {
  // Test data generators
  generateValidUser: (overrides: Partial<User> = {}): User => ({
    id: `user_${Date.now()}`,
    name: 'Test User',
    contact: { email: 'test@example.com' },
    age: 25,
    isActive: true,
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  
  generateInvalidUserData: () => [
    null,
    undefined,
    'not-an-object',
    {},
    { name: 'Missing fields' },
    { id: '', name: 'Empty ID' },
    { id: 'user_123', name: 'Test', age: -1 }, // Invalid age
    { id: 'user_123', name: 'Test', contact: { email: 'invalid' } }, // Invalid email
  ],
  
  // Validation test helpers
  testTypeGuard: <T>(
    guard: (value: unknown) => value is T,
    validInputs: unknown[],
    invalidInputs: unknown[],
    guardName: string
  ) => {
    console.log(`\nTesting ${guardName}:`);
    
    let passedValid = 0;
    let passedInvalid = 0;
    
    validInputs.forEach((input, i) => {
      if (guard(input)) {
        passedValid++;
      } else {
        console.log(`  ❌ Failed to validate valid input ${i}:`, input);
      }
    });
    
    invalidInputs.forEach((input, i) => {
      if (!guard(input)) {
        passedInvalid++;
      } else {
        console.log(`  ❌ Incorrectly validated invalid input ${i}:`, input);
      }
    });
    
    const totalValid = validInputs.length;
    const totalInvalid = invalidInputs.length;
    
    console.log(`  ✅ Valid inputs: ${passedValid}/${totalValid} passed`);
    console.log(`  ✅ Invalid inputs: ${passedInvalid}/${totalInvalid} correctly rejected`);
    
    return {
      validSuccess: passedValid / totalValid,
      invalidSuccess: passedInvalid / totalInvalid,
      overallSuccess: (passedValid + passedInvalid) / (totalValid + totalInvalid),
    };
  },
  
  // Benchmark helper
  benchmark: (name: string, fn: () => void, iterations = 1000) => {
    console.log(`\nBenchmarking ${name} (${iterations} iterations):`);
    console.time(name);
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    console.timeEnd(name);
  },
};

// Export for use in other files
export {
  runAllExamples,
  processExternalApiData,
  processFormData,
  processEvents,
  demonstrateErrorHandling,
  demonstrateAssertions,
  demonstratePerformance,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}