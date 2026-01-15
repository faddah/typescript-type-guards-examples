// =============================================================================
// COMPREHENSIVE TYPE GUARDS IN TYPESCRIPT
// =============================================================================

// =============================================================================
// 1. BASIC TYPE PREDICATES
// =============================================================================

// Simple type predicate functions
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Usage examples
export function processValue(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // TypeScript knows it's a string
  }
  
  if (isNumber(value)) {
    console.log(value.toFixed(2)); // TypeScript knows it's a number
  }
  
  if (isArray<string>(value)) {
    console.log(value.map(s => s.toLowerCase())); // TypeScript knows it's string[]
  }
}

// =============================================================================
// 2. OBJECT SHAPE TYPE GUARDS
// =============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Type guard for User
function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    'age' in value &&
    typeof value['id'] === 'string' &&
    typeof value['name'] === 'string' &&
    typeof value['email'] === 'string' &&
    typeof value['age'] === 'number'
  );
}

// Type guard for Admin
function isAdmin(value: unknown): value is Admin {
  return (
    isUser(value) &&
    'role' in value &&
    'permissions' in value &&
    value['role'] === 'admin' &&
    Array.isArray(value['permissions']) &&
    value['permissions'].every(p => typeof p === 'string')
  );
}

// More robust object validation
function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

export function hasStringProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, string> {
  return key in obj && typeof (obj as Record<PropertyKey, unknown>)[key] === 'string';
}

// Usage
export function processUserData(data: unknown) {
  if (isUser(data)) {
    console.log(`User: ${data.name} (${data.email})`); // Fully typed as User
  }
  
  if (isAdmin(data)) {
    console.log(`Admin with permissions: ${data.permissions.join(', ')}`);
  }
}

// =============================================================================
// 3. DISCRIMINATED UNION TYPE GUARDS
// =============================================================================

type Shape = 
  | { type: 'circle'; radius: number }
  | { type: 'rectangle'; width: number; height: number }
  | { type: 'triangle'; base: number; height: number };

// Type guards for discriminated unions
function isCircle(shape: Shape): shape is Extract<Shape, { type: 'circle' }> {
  return shape.type === 'circle';
}

function isRectangle(shape: Shape): shape is Extract<Shape, { type: 'rectangle' }> {
  return shape.type === 'rectangle';
}

function isTriangle(shape: Shape): shape is Extract<Shape, { type: 'triangle' }> {
  return shape.type === 'triangle';
}

function calculateArea(shape: Shape): number {
  if (isCircle(shape)) {
    return Math.PI * shape.radius ** 2; // radius is available
  }
  
  if (isRectangle(shape)) {
    return shape.width * shape.height; // width and height are available
  }
  
  if (isTriangle(shape)) {
    return 0.5 * shape.base * shape.height; // base and height are available
  }
  
  // TypeScript ensures exhaustiveness
  const _exhaustive: never = shape;
  return _exhaustive;
}

// =============================================================================
// 4. RESULT TYPE GUARDS
// =============================================================================

type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function isSuccess<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: true }> {
  return result.success === true;
}

function isFailure<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: false }> {
  return result.success === false;
}

// Usage
export async function fetchUserData(id: string): Promise<Result<User, string>> {
  try {
    // Simulate API call
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    
    if (isUser(data)) {
      return { success: true, data };
    } else {
      return { success: false, error: 'Invalid user data format' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function handleUserResult(result: Result<User, string>) {
  if (isSuccess(result)) {
    console.log(`User loaded: ${result.data.name}`); // data is typed as User
  } else {
    console.error(`Failed to load user: ${result.error}`); // error is typed as string
  }
}

// =============================================================================
// 5. ASSERTION FUNCTIONS (THROWS ON FAILURE)
// =============================================================================

// Assertion function that throws if condition is false
function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error('Value is null or undefined');
  }
}

function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Value is not a valid User object');
  }
}

// Usage of assertion functions
export function processDefinitelyUser(data: unknown) {
  assertIsUser(data);
  // After this point, TypeScript knows data is User
  console.log(`Processing user: ${data.name}`);
  console.log(`Email: ${data.email}`);
}

export function safeStringOperation(value: unknown) {
  assertIsString(value);
  // TypeScript now knows value is string
  return value.toUpperCase();
}

// =============================================================================
// 6. GENERIC TYPE GUARDS
// =============================================================================

// Generic type guard for optional values
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Generic type guard for arrays with specific element types
function isArrayOf<T>(
  value: unknown,
  elementGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(elementGuard);
}

// Generic type guard for objects with specific property types
export function hasValidProperty<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  validator: (value: unknown) => value is T[K]
): obj is T & Required<Pick<T, K>> {
  return key in obj && validator(obj[key]);
}

// Usage examples
const mixedArray: unknown[] = [1, 2, "hello", 4, "world"];
export const stringArray = mixedArray.filter(isString); // string[]
export const numberArray = mixedArray.filter(isNumber); // number[]

const userArray: unknown = [
  { id: "1", name: "John", email: "john@example.com", age: 30 },
  { id: "2", name: "Jane", email: "jane@example.com", age: 25 }
];

if (isArrayOf(userArray, isUser)) {
  // TypeScript knows userArray is User[]
  userArray.forEach(user => console.log(user.name));
}

// =============================================================================
// 7. BRANDED TYPE GUARDS
// =============================================================================

// Branded types for type safety
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

function isUserId(value: string): value is UserId {
  return /^user_[a-zA-Z0-9]+$/.test(value);
}

function isEmail(value: string): value is Email {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Factory functions for branded types
function createUserId(value: string): UserId {
  if (!isUserId(value)) {
    throw new Error('Invalid user ID format');
  }
  return value;
}

function createEmail(value: string): Email {
  if (!isEmail(value)) {
    throw new Error('Invalid email format');
  }
  return value;
}

// Usage
export function processUserId(id: string) {
  if (isUserId(id)) {
    // id is now branded as UserId
    console.log(`Processing user ID: ${id}`);
  } else {
    throw new Error('Invalid user ID format');
  }
}

// =============================================================================
// 8. CLASS INSTANCE TYPE GUARDS
// =============================================================================

class Dog {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  bark() {
    return `${this.name} says woof!`;
  }
}

class Cat {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  meow() {
    return `${this.name} says meow!`;
  }
}

// Type guards for class instances
function isDog(animal: Dog | Cat): animal is Dog {
  return animal instanceof Dog;
}

function isCat(animal: Dog | Cat): animal is Cat {
  return animal instanceof Cat;
}

// Duck typing type guard
function canBark(animal: unknown): animal is { bark(): string } {
  return (
    typeof animal === 'object' &&
    animal !== null &&
    'bark' in animal &&
    typeof (animal as Record<string, unknown>)['bark'] === 'function'
  );
}

export function makeSound(animal: Dog | Cat) {
  if (isDog(animal)) {
    console.log(animal.bark()); // bark() is available
  } else {
    console.log(animal.meow()); // meow() is available
  }
}

// =============================================================================
// 9. PROMISE AND ASYNC TYPE GUARDS
// =============================================================================

function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as Record<string, unknown>)['then'] === 'function'
  );
}

export async function processAsyncValue(value: unknown) {
  if (isPromise<string>(value)) {
    const result = await value;
    console.log(result.toUpperCase()); // TypeScript knows result is string
  } else if (isString(value)) {
    console.log(value.toUpperCase());
  }
}

// =============================================================================
// 10. COMPLEX NESTED TYPE GUARDS
// =============================================================================

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  timestamp: number;
}

function isApiResponse<T>(
  value: unknown,
  dataGuard: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false;
  
  // Check required fields
  if (!('status' in value) || !('timestamp' in value)) return false;
  
  const status = value['status'];
  const timestamp = value['timestamp'];
  
  if (status !== 'success' && status !== 'error') return false;
  if (typeof timestamp !== 'number') return false;
  
  // Check optional fields based on status
  if (status === 'success') {
    return 'data' in value && dataGuard(value['data']);
  } else {
    return 'error' in value && typeof value['error'] === 'string';
  }
}

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { status: 'success'; data: T } {
  return response.status === 'success' && response.data !== undefined;
}

function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { status: 'error'; error: string } {
  return response.status === 'error';
}

// Usage
export function handleApiResponse(response: unknown) {
  if (isApiResponse(response, isUser)) {
    if (isSuccessResponse(response)) {
      console.log(`User: ${response.data.name}`); // data is guaranteed to be User
    } else if (isErrorResponse(response)) {
      console.error(`Error: ${response.error}`); // error is guaranteed to be string
    }
  }
}

// =============================================================================
// 11. UTILITY FUNCTIONS FOR COMMON PATTERNS
// =============================================================================

// Type guard composer
function and<T, U extends T>(
  guard1: (value: unknown) => value is T,
  guard2: (value: T) => value is U
) {
  return (value: unknown): value is U => {
    return guard1(value) && guard2(value);
  };
}

function or<T, U>(
  guard1: (value: unknown) => value is T,
  guard2: (value: unknown) => value is U
) {
  return (value: unknown): value is T | U => {
    return guard1(value) || guard2(value);
  };
}

// Array filtering with type guards
function filterAndNarrow<T, U extends T>(
  array: T[],
  guard: (item: T) => item is U
): U[] {
  return array.filter(guard);
}

// Safe property access with type guards
function safeGet<T, K extends keyof T>(
  obj: T,
  key: K,
  guard: (value: unknown) => value is T[K]
): T[K] | undefined {
  const value = obj[key];
  return guard(value) ? value : undefined;
}

// =============================================================================
// EXAMPLE USAGE AND TESTING
// =============================================================================

// Test data
const testData: unknown[] = [
  "hello",
  42,
  { id: "user_123", name: "John", email: "john@example.com", age: 30 },
  { id: "admin_456", name: "Jane", email: "jane@example.com", age: 25, role: "admin", permissions: ["read", "write"] },
  null,
  undefined,
  [1, 2, 3],
  { type: 'circle', radius: 5 },
  { type: 'rectangle', width: 10, height: 20 },
];

console.log("=== TESTING TYPE GUARDS ===");

testData.forEach((data, index) => {
  console.log(`\nTesting item ${index}:`, data);
  
  if (isString(data)) {
    console.log(`  ✓ String: ${data.toUpperCase()}`);
  }
  
  if (isNumber(data)) {
    console.log(`  ✓ Number: ${data.toFixed(2)}`);
  }
  
  if (isUser(data)) {
    console.log(`  ✓ User: ${data.name} (${data.email})`);
  }
  
  if (isAdmin(data)) {
    console.log(`  ✓ Admin with permissions: ${data.permissions.join(', ')}`);
  }
  
  if (isObject(data) && hasProperty(data, 'type')) {
    const shape = data as Shape;
    if (shape.type === 'circle' || shape.type === 'rectangle' || shape.type === 'triangle') {
      console.log(`  ✓ Shape area: ${calculateArea(shape)}`);
    }
  }
});

export {
  // Basic type predicates
  isString, isNumber, isBoolean, isArray, isObject,
  
  // Object type guards
  isUser, isAdmin,
  
  // Discriminated union guards
  isCircle, isRectangle, isTriangle,
  
  // Result type guards
  isSuccess, isFailure,
  
  // Assertion functions
  assertDefined, assertIsString, assertIsUser,
  
  // Generic guards
  isDefined, isArrayOf,
  
  // Branded type guards
  isUserId, isEmail, createUserId, createEmail,
  
  // Class guards
  isDog, isCat, canBark,
  
  // Async guards
  isPromise,
  
  // Complex guards
  isApiResponse, isSuccessResponse, isErrorResponse,
  
  // Utility functions
  and, or, filterAndNarrow, safeGet
};

export type {
  // Types
  User, Admin, Shape, Result, UserId, Email, ApiResponse
};