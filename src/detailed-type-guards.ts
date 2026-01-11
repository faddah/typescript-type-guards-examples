// =============================================================================
// DETAILED TYPE GUARDS PATTERNS WITH ADVANCED EXAMPLES
// =============================================================================

// =============================================================================
// 1. BASIC TYPE PREDICATES - DEEP DIVE
// =============================================================================

// Enhanced primitive type guards with edge case handling
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isNumericString(value: unknown): value is string {
  return isString(value) && !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNull(value: unknown): value is null {
  return value === null;
}

function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

// Enhanced array type guards
function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

function isArrayOfLength<T, N extends number>(
  value: unknown,
  length: N
): value is T[] & { length: N } {
  return Array.isArray(value) && value.length === length;
}

// Enhanced object type guards
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  
  // Check if it's a plain object (not a class instance)
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return isObject(value) && Object.keys(value).length === 0;
}

// Date type guards
function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

function isValidDateString(value: unknown): value is string {
  return isString(value) && !isNaN(Date.parse(value));
}

// Function type guards
function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

function isAsyncFunction(value: unknown): value is (...args: any[]) => Promise<any> {
  return isFunction(value) && value.constructor.name === 'AsyncFunction';
}

// Advanced usage examples
function processBasicTypes(values: unknown[]) {
  console.log('=== BASIC TYPE PROCESSING ===');
  
  values.forEach((value, index) => {
    console.log(`\nValue ${index}:`, value);
    
    if (isNonEmptyString(value)) {
      console.log(`  ✓ Non-empty string: "${value}" (${value.length} chars)`);
    }
    
    if (isNumericString(value)) {
      console.log(`  ✓ Numeric string: ${value} → ${Number(value)}`);
    }
    
    if (isPositiveNumber(value)) {
      console.log(`  ✓ Positive number: ${value}`);
    }
    
    if (isInteger(value)) {
      console.log(`  ✓ Integer: ${value}`);
    }
    
    if (isNonEmptyArray(value)) {
      console.log(`  ✓ Non-empty array with ${value.length} items`);
    }
    
    if (isDate(value)) {
      console.log(`  ✓ Valid date: ${value.toISOString()}`);
    }
  });
}

// =============================================================================
// 2. OBJECT SHAPE TYPE GUARDS - ADVANCED PATTERNS
// =============================================================================

// Complex nested interfaces
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ContactInfo {
  email: string;
  phone?: string;
  address?: Address;
}

interface User {
  id: string;
  name: string;
  contact: ContactInfo;
  age: number;
  isActive: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface AdminUser extends User {
  role: 'admin';
  permissions: string[];
  lastLogin?: Date;
}

interface RegularUser extends User {
  role: 'user';
  subscription?: 'basic' | 'premium' | 'enterprise';
}

type AnyUser = AdminUser | RegularUser;

// Detailed object validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function isAddress(value: unknown): value is Address {
  return (
    isObject(value) &&
    'street' in value && isNonEmptyString(value.street) &&
    'city' in value && isNonEmptyString(value.city) &&
    'state' in value && isNonEmptyString(value.state) &&
    'zipCode' in value && isNonEmptyString(value.zipCode) &&
    'country' in value && isNonEmptyString(value.country)
  );
}

function isContactInfo(value: unknown): value is ContactInfo {
  if (!isObject(value)) return false;
  
  // Required email field
  if (!('email' in value) || !isString(value.email) || !isValidEmail(value.email)) {
    return false;
  }
  
  // Optional phone field
  if ('phone' in value) {
    if (!isString(value.phone) || !isValidPhoneNumber(value.phone)) {
      return false;
    }
  }
  
  // Optional address field
  if ('address' in value) {
    if (!isAddress(value.address)) {
      return false;
    }
  }
  
  return true;
}

function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  
  return (
    'id' in value && isNonEmptyString(value.id) &&
    'name' in value && isNonEmptyString(value.name) &&
    'contact' in value && isContactInfo(value.contact) &&
    'age' in value && isPositiveNumber(value.age) && isInteger(value.age) &&
    'isActive' in value && isBoolean(value.isActive) &&
    'tags' in value && isArray<string>(value.tags) && 
      (value.tags as unknown[]).every(isString) &&
    'createdAt' in value && isDate(value.createdAt) &&
    'updatedAt' in value && isDate(value.updatedAt) &&
    (!('metadata' in value) || isPlainObject(value.metadata))
  );
}

function isAdminUser(value: unknown): value is AdminUser {
  if (!isUser(value)) return false;
  
  return (
    'role' in value && value.role === 'admin' &&
    'permissions' in value && 
      isArray<string>(value.permissions) && 
      (value.permissions as unknown[]).every(isString) &&
    (!('lastLogin' in value) || isDate(value.lastLogin))
  );
}

function isRegularUser(value: unknown): value is RegularUser {
  if (!isUser(value)) return false;
  
  return (
    'role' in value && value.role === 'user' &&
    (!('subscription' in value) || 
      (isString(value.subscription) && 
        ['basic', 'premium', 'enterprise'].includes(value.subscription)))
  );
}

// Advanced object validation with detailed error reporting
interface SimpleValidationError {
  field: string;
  message: string;
  value: unknown;
}

interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: SimpleValidationError[];
}

function validateUser(value: unknown): ValidationResult<User> {
  const errors: SimpleValidationError[] = [];
  
  if (!isObject(value)) {
    return {
      isValid: false,
      errors: [{ field: 'root', message: 'Value is not an object', value }]
    };
  }
  
  // Validate each field with detailed error messages
  if (!('id' in value) || !isNonEmptyString(value.id)) {
    errors.push({ field: 'id', message: 'Missing or invalid id field', value: 'id' in value ? value.id : undefined });
  }
  
  if (!('name' in value) || !isNonEmptyString(value.name)) {
    errors.push({ field: 'name', message: 'Missing or invalid name field', value: 'name' in value ? value.name : undefined });
  }
  
  if (!('contact' in value) || !isContactInfo(value.contact)) {
    errors.push({ field: 'contact', message: 'Missing or invalid contact field', value: 'contact' in value ? value.contact : undefined });
  }
  
  if (!('age' in value) || !isPositiveNumber(value.age) || !isInteger(value.age)) {
    errors.push({ field: 'age', message: 'Age must be a positive integer', value: 'age' in value ? value.age : undefined });
  }
  
  if (!('isActive' in value) || !isBoolean(value.isActive)) {
    errors.push({ field: 'isActive', message: 'isActive must be a boolean', value: 'isActive' in value ? value.isActive : undefined });
  }
  
  if (!('tags' in value) || !isArray<string>(value.tags) || 
      !(value.tags as unknown[]).every(isString)) {
    errors.push({ field: 'tags', message: 'tags must be an array of strings', value: 'tags' in value ? value.tags : undefined });
  }
  
  if (!('createdAt' in value) || !isDate(value.createdAt)) {
    errors.push({ field: 'createdAt', message: 'createdAt must be a valid Date', value: 'createdAt' in value ? value.createdAt : undefined });
  }
  
  if (!('updatedAt' in value) || !isDate(value.updatedAt)) {
    errors.push({ field: 'updatedAt', message: 'updatedAt must be a valid Date', value: 'updatedAt' in value ? value.updatedAt : undefined });
  }
  
  if (errors.length === 0) {
    return {
      isValid: true,
      data: value as User,
      errors: []
    };
  }
  
  return { isValid: false, errors };
}

// =============================================================================
// 3. DISCRIMINATED UNIONS - COMPLEX PATTERNS
// =============================================================================

// Complex discriminated union with nested data
type APIEvent = 
  | { 
      type: 'user_created'; 
      timestamp: Date;
      data: { 
        user: User; 
        source: 'registration' | 'admin' | 'import';
        metadata?: Record<string, any>;
      } 
    }
  | { 
      type: 'user_updated'; 
      timestamp: Date;
      data: { 
        userId: string;
        changes: Partial<User>;
        previousValues: Partial<User>;
        updatedBy: string;
      } 
    }
  | { 
      type: 'user_deleted'; 
      timestamp: Date;
      data: { 
        userId: string;
        deletedBy: string;
        reason?: string;
        backup: User;
      } 
    }
  | {
      type: 'user_login';
      timestamp: Date;
      data: {
        userId: string;
        ip: string;
        userAgent: string;
        successful: boolean;
        failureReason?: string;
      }
    };

// Type guards for each event type
function isUserCreatedEvent(event: APIEvent): event is Extract<APIEvent, { type: 'user_created' }> {
  return event.type === 'user_created';
}

function isUserUpdatedEvent(event: APIEvent): event is Extract<APIEvent, { type: 'user_updated' }> {
  return event.type === 'user_updated';
}

function isUserDeletedEvent(event: APIEvent): event is Extract<APIEvent, { type: 'user_deleted' }> {
  return event.type === 'user_deleted';
}

function isUserLoginEvent(event: APIEvent): event is Extract<APIEvent, { type: 'user_login' }> {
  return event.type === 'user_login';
}

// Comprehensive event validation
function isAPIEvent(value: unknown): value is APIEvent {
  if (!isObject(value)) return false;
  
  if (!('type' in value) || !isString(value.type)) return false;
  if (!('timestamp' in value) || !isDate(value.timestamp)) return false;
  if (!('data' in value) || !isObject(value.data)) return false;
  
  const eventType = value.type;
  const data = value.data;
  
  switch (eventType) {
    case 'user_created':
      return (
        'user' in data && isUser(data.user) &&
        'source' in data && isString(data.source) &&
        ['registration', 'admin', 'import'].includes(data.source) &&
        (!('metadata' in data) || isPlainObject(data.metadata))
      );
      
    case 'user_updated':
      return (
        'userId' in data && isNonEmptyString(data.userId) &&
        'changes' in data && isObject(data.changes) &&
        'previousValues' in data && isObject(data.previousValues) &&
        'updatedBy' in data && isNonEmptyString(data.updatedBy)
      );
      
    case 'user_deleted':
      return (
        'userId' in data && isNonEmptyString(data.userId) &&
        'deletedBy' in data && isNonEmptyString(data.deletedBy) &&
        'backup' in data && isUser(data.backup) &&
        (!('reason' in data) || isString(data.reason))
      );
      
    case 'user_login':
      return (
        'userId' in data && isNonEmptyString(data.userId) &&
        'ip' in data && isNonEmptyString(data.ip) &&
        'userAgent' in data && isNonEmptyString(data.userAgent) &&
        'successful' in data && isBoolean(data.successful) &&
        (!('failureReason' in data) || isString(data.failureReason))
      );
      
    default:
      return false;
  }
}

// Event processor with exhaustive handling
function processAPIEvent(event: APIEvent): void {
  console.log(`Processing ${event.type} event at ${event.timestamp.toISOString()}`);
  
  if (isUserCreatedEvent(event)) {
    const { user, source, metadata } = event.data;
    console.log(`New user created: ${user.name} via ${source}`);
    if (metadata) {
      console.log('Additional metadata:', metadata);
    }
  } else if (isUserUpdatedEvent(event)) {
    const { userId, changes, updatedBy } = event.data;
    console.log(`User ${userId} updated by ${updatedBy}`);
    console.log('Changes:', changes);
  } else if (isUserDeletedEvent(event)) {
    const { userId, deletedBy, reason } = event.data;
    console.log(`User ${userId} deleted by ${deletedBy}`);
    if (reason) {
      console.log(`Reason: ${reason}`);
    }
  } else if (isUserLoginEvent(event)) {
    const { userId, successful, ip } = event.data;
    const status = successful ? 'successful' : 'failed';
    console.log(`${status} login attempt for user ${userId} from ${ip}`);
  } else {
    // TypeScript ensures exhaustiveness - this should never execute
    const _exhaustive: never = event;
    throw new Error(`Unhandled event type: ${JSON.stringify(event)}`);
  }
}

// =============================================================================
// 4. RESULT TYPES - COMPREHENSIVE ERROR HANDLING
// =============================================================================

// Enhanced Result type with multiple error categories
type Result<T, E = Error> =
  | { success: true; data: T; metadata?: Record<string, any> }
  | { success: false; error: E; context?: Record<string, any> };

// Specific error types
interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
  code: string;
}

interface NetworkError {
  type: 'network';
  status: number;
  message: string;
  endpoint: string;
}

interface BusinessError {
  type: 'business';
  code: string;
  message: string;
  details?: Record<string, any>;
}

type AppError = ValidationError | NetworkError | BusinessError;

// Result type guards
function isSuccess<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: true }> {
  return result.success === true;
}

function isFailure<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: false }> {
  return result.success === false;
}

// Error type guards
function isValidationError(error: AppError): error is ValidationError {
  return error.type === 'validation';
}

function isNetworkError(error: AppError): error is NetworkError {
  return error.type === 'network';
}

function isBusinessError(error: AppError): error is BusinessError {
  return error.type === 'business';
}

// Result builders
function success<T>(data: T, metadata?: Record<string, any>): Result<T, AppError> {
  return { success: true, data, ...(metadata && { metadata }) };
}

function failure<T>(error: AppError, context?: Record<string, any>): Result<T, AppError> {
  return { success: false, error, ...(context && { context }) };
}

// Async result handling
async function fetchUser(id: string): Promise<Result<User, AppError>> {
  try {
    // Validate input
    if (!isNonEmptyString(id)) {
      return failure({
        type: 'validation',
        field: 'id',
        message: 'User ID must be a non-empty string',
        code: 'INVALID_ID'
      });
    }
    
    // Simulate API call
    const response = await fetch(`/api/users/${id}`);
    
    if (!response.ok) {
      return failure({
        type: 'network',
        status: response.status,
        message: response.statusText,
        endpoint: `/api/users/${id}`
      });
    }
    
    const data = await response.json();
    
    // Validate response data
    const validation = validateUser(data);
    if (!validation.isValid) {
      return failure({
        type: 'validation',
        field: 'response',
        message: 'Invalid user data received from API',
        code: 'INVALID_RESPONSE'
      }, { validationErrors: validation.errors });
    }
    
    return success(validation.data!, {
      source: 'api',
      fetchedAt: new Date().toISOString()
    });
    
  } catch (error) {
    return failure({
      type: 'network',
      status: 0,
      message: error instanceof Error ? error.message : 'Unknown network error',
      endpoint: `/api/users/${id}`
    });
  }
}

// Result processing with comprehensive error handling
async function handleUserFetch(id: string) {
  const result = await fetchUser(id);
  
  if (isSuccess(result)) {
    console.log(`✓ User fetched: ${result.data.name}`);
    if (result.metadata) {
      console.log('Metadata:', result.metadata);
    }
    return result.data;
  } else {
    console.error('✗ Failed to fetch user:');
    
    if (isValidationError(result.error)) {
      console.error(`Validation error in field '${result.error.field}': ${result.error.message}`);
    } else if (isNetworkError(result.error)) {
      console.error(`Network error (${result.error.status}): ${result.error.message} at ${result.error.endpoint}`);
    } else if (isBusinessError(result.error)) {
      console.error(`Business error (${result.error.code}): ${result.error.message}`);
      if (result.error.details) {
        console.error('Details:', result.error.details);
      }
    }
    
    if (result.context) {
      console.error('Context:', result.context);
    }
    
    return null;
  }
}

// =============================================================================
// 5. ASSERTION FUNCTIONS - ADVANCED PATTERNS
// =============================================================================

// Custom error classes for assertions
class AssertionError extends Error {
  constructor(message: string, public readonly value: unknown, public readonly expected: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

class ValidationError extends AssertionError {
  constructor(field: string, value: unknown, expected: string) {
    super(`Validation failed for field '${field}': expected ${expected}`, value, expected);
    this.name = 'ValidationError';
  }
}

// Basic assertion functions with enhanced error messages
function assertDefined<T>(value: T | null | undefined, fieldName = 'value'): asserts value is T {
  if (value === null || value === undefined) {
    throw new AssertionError(`${fieldName} is required but was ${value}`, value, 'defined value');
  }
}

function assertIsString(value: unknown, fieldName = 'value'): asserts value is string {
  if (!isString(value)) {
    throw new ValidationError(fieldName, value, 'string');
  }
}

function assertIsNonEmptyString(value: unknown, fieldName = 'value'): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new ValidationError(fieldName, value, 'non-empty string');
  }
}

function assertIsNumber(value: unknown, fieldName = 'value'): asserts value is number {
  if (!isNumber(value)) {
    throw new ValidationError(fieldName, value, 'number');
  }
}

function assertIsPositiveNumber(value: unknown, fieldName = 'value'): asserts value is number {
  if (!isPositiveNumber(value)) {
    throw new ValidationError(fieldName, value, 'positive number');
  }
}

function assertIsUser(value: unknown, fieldName = 'value'): asserts value is User {
  const validation = validateUser(value);
  if (!validation.isValid) {
    throw new ValidationError(fieldName, value, `User object. Errors: ${validation.errors.map(e => e.message).join(', ')}`);
  }
}

// Conditional assertions
function assertIf<T>(
  condition: boolean,
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (condition && !guard(value)) {
    throw new AssertionError(errorMessage, value, 'condition to be met');
  }
}

// Array assertions
function assertIsArrayOf<T>(
  value: unknown,
  elementGuard: (item: unknown) => item is T,
  fieldName = 'value'
): asserts value is T[] {
  if (!isArray(value)) {
    throw new ValidationError(fieldName, value, 'array');
  }
  
  value.forEach((item, index) => {
    if (!elementGuard(item)) {
      throw new ValidationError(`${fieldName}[${index}]`, item, 'valid array element');
    }
  });
}

// Object property assertions
function assertHasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
  fieldName = 'object'
): asserts obj is T & Record<K, unknown> {
  if (!(key in obj)) {
    throw new ValidationError(fieldName, obj, `object with property '${String(key)}'`);
  }
}

function assertHasTypedProperty<T extends object, K extends PropertyKey, V>(
  obj: T,
  key: K,
  guard: (value: unknown) => value is V,
  fieldName = 'object'
): asserts obj is T & Record<K, V> {
  assertHasProperty(obj, key, fieldName);
  if (!guard(obj[key as keyof T])) {
    throw new ValidationError(`${fieldName}.${String(key)}`, obj[key as keyof T], 'valid property value');
  }
}

// Usage examples with proper error handling
function safeUserProcessing(data: unknown) {
  try {
    assertIsUser(data, 'userData');
    // TypeScript now knows data is User
    
    assertIsNonEmptyString(data.name, 'user.name');
    assertIsPositiveNumber(data.age, 'user.age');
    assertIsArrayOf(data.tags, isString, 'user.tags');
    
    console.log(`✓ Processing user: ${data.name}, age ${data.age}, tags: ${data.tags.join(', ')}`);
    return data;
    
  } catch (error) {
    if (error instanceof AssertionError) {
      console.error(`✗ Assertion failed: ${error.message}`);
      console.error(`  Expected: ${error.expected}`);
      console.error(`  Received: ${JSON.stringify(error.value)}`);
    } else {
      console.error(`✗ Unexpected error: ${error}`);
    }
    throw error;
  }
}

// =============================================================================
// TESTING AND EXAMPLES
// =============================================================================

// Test data with various edge cases
const testData = [
  // Valid cases
  'hello world',
  42,
  true,
  new Date(),
  [1, 2, 3],
  { name: 'test', value: 123 },
  
  // Edge cases
  '',
  0,
  -5,
  NaN,
  Infinity,
  null,
  undefined,
  [],
  {},
  
  // Complex objects
  {
    id: 'user_123',
    name: 'John Doe',
    contact: {
      email: 'john@example.com',
      phone: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'USA'
      }
    },
    age: 30,
    isActive: true,
    tags: ['premium', 'verified'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-01'),
    metadata: { source: 'import' }
  }
];

console.log('=== DETAILED TYPE GUARDS TESTING ===');
processBasicTypes(testData);

export {
  // Enhanced basic type guards
  isString, isNonEmptyString, isNumericString,
  isNumber, isPositiveNumber, isInteger,
  isBoolean, isNull, isUndefined, isNullish,
  isArray, isNonEmptyArray, isArrayOfLength,
  isObject, isPlainObject, isEmptyObject,
  isDate, isValidDateString,
  isFunction, isAsyncFunction,
  
  // Complex object validation
  isAddress, isContactInfo, isUser, isAdminUser, isRegularUser,
  validateUser, ValidationResult, SimpleValidationError,
  
  // Discriminated unions
  isAPIEvent, isUserCreatedEvent, isUserUpdatedEvent, isUserDeletedEvent, isUserLoginEvent,
  processAPIEvent,
  
  // Result types
  isSuccess, isFailure, success, failure,
  isValidationError, isNetworkError, isBusinessError,
  fetchUser, handleUserFetch,
  
  // Advanced assertions
  assertDefined, assertIsString, assertIsNonEmptyString,
  assertIsNumber, assertIsPositiveNumber, assertIsUser,
  assertIf, assertIsArrayOf, assertHasProperty, assertHasTypedProperty,
  safeUserProcessing,
  
  // Types
  User, AdminUser, RegularUser, AnyUser,
  Address, ContactInfo,
  APIEvent, Result, AppError,
  AssertionError, ValidationError
};