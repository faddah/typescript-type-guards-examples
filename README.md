# TypeScript Type Guards - Comprehensive Guide

This repository contains a complete guide to TypeScript Type Guards with detailed examples, advanced patterns, and framework integrations.

## 📚 Contents

### Core Files
- `type-guards-examples.ts` - Basic type guard patterns and examples
- `detailed-type-guards.ts` - Advanced type guard patterns with comprehensive validation
- `react-type-guards.tsx` - React integration with type guards
- `express-type-guards.ts` - Express.js integration with type guards
- `practical-examples.ts` - Real-world usage examples and demos

### Supporting Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `test-server.ts` - Server testing utilities

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- TypeScript 5+

### Installation

```bash
# Install dependencies
npm install

# Or if you prefer yarn
yarn install
```

### Running the Examples

#### 1. Basic Type Guard Examples
```bash
# Run comprehensive examples
npm start

# Or with auto-reload during development
npm run dev
```

#### 2. Express Server with Type Guards
```bash
# Start the Express server
npm run start:server

# Or with auto-reload
npm run dev:server
```

#### 3. Test Everything
```bash
# Run all examples and test the server
npm test
```

## 📖 Type Guard Patterns Covered

### 1. Basic Type Predicates
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    'id' in value && isString(value.id) &&
    'name' in value && isString(value.name) &&
    'email' in value && isString(value.email)
  );
}
```

### 2. Discriminated Union Guards
```typescript
type Shape = 
  | { type: 'circle'; radius: number }
  | { type: 'rectangle'; width: number; height: number };

function isCircle(shape: Shape): shape is Extract<Shape, { type: 'circle' }> {
  return shape.type === 'circle';
}
```

### 3. Result Type Guards
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function isSuccess<T, E>(result: Result<T, E>): result is Extract<Result<T, E>, { success: true }> {
  return result.success === true;
}
```

### 4. Assertion Functions
```typescript
function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Value is not a valid User');
  }
}
```

### 5. Generic Type Guards
```typescript
function isArrayOf<T>(
  value: unknown,
  elementGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(elementGuard);
}
```

## 🔧 React Integration

### Prop Validation
```typescript
const UserCard: React.FC<{ user: unknown }> = ({ user }) => {
  if (!isUser(user)) {
    return <div>Invalid user data</div>;
  }
  
  // TypeScript now knows user is User
  return <div>{user.name}</div>;
};
```

### Form Validation
```typescript
function validateUserForm(data: unknown): { isValid: boolean; errors: string[]; user?: User } {
  const errors: string[] = [];
  
  // Comprehensive validation logic
  if (!isUserFormData(data)) {
    errors.push('Invalid form structure');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    user: errors.length === 0 ? createUser(data) : undefined
  };
}
```

### API Integration
```typescript
function useUser(userId: string) {
  const [state, setState] = useState<{
    user: User | null;
    loading: boolean;
    error: AppError | null;
  }>();

  useEffect(() => {
    fetchUser(userId).then(result => {
      if (isSuccess(result)) {
        setState({ user: result.data, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: result.error });
      }
    });
  }, [userId]);

  return state;
}
```

## 🌐 Express Integration

### Request Validation Middleware
```typescript
function validateRequest<T>(
  validator: (body: unknown) => body is T,
  errorMessage = 'Invalid request body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validator(req.body)) {
      return res.status(400).json({
        success: false,
        error: { type: 'validation', message: errorMessage }
      });
    }
    next();
  };
}
```

### Type-Safe Route Handlers
```typescript
const createUser: RequestHandler = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body);
    
    if (isSuccess(result)) {
      return ResponseHelper.success(res, result.data, {}, 201);
    } else {
      return ResponseHelper.error(res, result.error);
    }
  } catch (error) {
    next(error);
  }
};
```

### Service Layer with Validation
```typescript
class UserService {
  async createUser(userData: unknown): Promise<Result<User, AppError>> {
    const validation = validateUser(userData);
    
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid user data',
          details: validation.errors
        }
      };
    }
    
    // Proceed with valid user data
    const user = validation.data!;
    // ... save to database
    
    return { success: true, data: user };
  }
}
```

## 🧪 Testing the Server

The Express server provides these endpoints:

- `GET /health` - Health check
- `POST /api/users` - Create user
- `GET /api/users` - List users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/events` - Get events

### Manual Testing
```bash
# Start server
npm run dev:server

# In another terminal, test endpoints
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "contact": {"email": "john@example.com"},
    "age": 30,
    "isActive": true,
    "tags": ["premium"]
  }'
```

### Automated Testing
```bash
# Run the test suite
npm test
```

## 💡 Key Benefits

### Type Safety
- Eliminates runtime type errors
- Provides compile-time type checking
- Enables safe type narrowing

### Better Developer Experience
- Improved IntelliSense and autocomplete
- Clear error messages
- Self-documenting code

### Runtime Validation
- Validates data from external sources
- Handles API responses safely
- Processes form inputs securely

### Framework Integration
- Seamless React component validation
- Express middleware integration
- Type-safe state management

## 📋 Best Practices

1. **Always validate external data** - Use type guards for API responses, user inputs, and third-party data
2. **Use discriminated unions** - For complex state management and event systems
3. **Implement proper error handling** - Use Result types for predictable error handling
4. **Write comprehensive validators** - Include edge cases and provide detailed error messages
5. **Consider performance** - Cache validation results for frequently accessed data
6. **Test thoroughly** - Validate both success and failure scenarios
7. **Document type contracts** - Use JSDoc comments for complex type guards

## 🔍 Advanced Patterns

### Branded Types
```typescript
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

function isUserId(value: string): value is UserId {
  return /^user_[a-zA-Z0-9]+$/.test(value);
}
```

### Recursive Type Guards
```typescript
function isDeepUser(value: unknown): value is DeepUser {
  return (
    isUser(value) &&
    (!('manager' in value) || value.manager === null || isDeepUser(value.manager))
  );
}
```

### Conditional Type Guards
```typescript
function isArrayOfUsers<T>(
  value: unknown,
  allowEmpty = false
): value is T extends User[] ? T : never {
  if (!Array.isArray(value)) return false;
  if (!allowEmpty && value.length === 0) return false;
  return value.every(isUser);
}
```

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

MIT License - see LICENSE file for details.

---

**Happy coding with type-safe TypeScript! 🎉**