// =============================================================================
// TYPE GUARDS INTEGRATION WITH EXPRESS.JS
// =============================================================================
// @ts-ignore
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { 
  User, Result, AppError, APIEvent,
  isUser, isSuccess, isFailure, isAPIEvent,
  validateUser, assertIsUser, isNonEmptyString, isPositiveNumber
} from './detailed-type-guards';

// =============================================================================
// 1. REQUEST VALIDATION MIDDLEWARE
// =============================================================================

// Enhanced Request interface with typed body
interface TypedRequest<T> extends Request {
  body: T;
  validatedBody?: T;
}

// Generic request validation middleware
function validateRequest<T>(
  validator: (body: unknown) => body is T,
  errorMessage = 'Invalid request body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validator(req.body)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'validation',
          message: errorMessage,
          received: req.body,
        },
      });
    }
    
    // Attach validated body to request
    (req as TypedRequest<T>).validatedBody = req.body;
    next();
  };
}

// Specific validation middleware for different request types
const validateUserCreation = validateRequest(
  (body: unknown): body is Omit<User, 'id' | 'createdAt' | 'updatedAt'> => {
    if (!isUser({ 
      id: 'temp', 
      createdAt: new Date(), 
      updatedAt: new Date(), 
      ...body as any 
    })) {
      return false;
    }
    return true;
  },
  'Invalid user creation data'
);

const validateUserUpdate = validateRequest(
  (body: unknown): body is Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> => {
    if (typeof body !== 'object' || body === null) return false;
    
    // At least one field must be present for update
    const updateFields = ['name', 'contact', 'age', 'isActive', 'tags'];
    const hasValidField = updateFields.some(field => field in body);
    
    return hasValidField;
  },
  'Invalid user update data'
);

// Parameter validation middleware
function validateParam(
  paramName: string,
  validator: (value: string) => boolean,
  errorMessage?: string
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const paramValue = req.params[paramName];
    
    if (!validator(paramValue)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'validation',
          message: errorMessage || `Invalid ${paramName} parameter`,
          parameter: paramName,
          value: paramValue,
        },
      });
    }
    
    next();
  };
}

// Common parameter validators
const validateUserId = validateParam(
  'id',
  (id: string) => isNonEmptyString(id) && id.startsWith('user_'),
  'User ID must be a non-empty string starting with "user_"'
);

// Query parameter validation middleware
function validateQuery<T>(
  validator: (query: unknown) => query is T,
  errorMessage = 'Invalid query parameters'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validator(req.query)) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'validation',
          message: errorMessage,
          received: req.query,
        },
      });
    }
    
    next();
  };
}

// Pagination query validation
interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const validatePagination = validateQuery(
  (query: unknown): query is PaginationQuery => {
    if (typeof query !== 'object' || query === null) return false;
    
    const q = query as any;
    
    // Optional page validation
    if ('page' in q && (!isNonEmptyString(q.page) || isNaN(Number(q.page)) || Number(q.page) < 1)) {
      return false;
    }
    
    // Optional limit validation
    if ('limit' in q && (!isNonEmptyString(q.limit) || isNaN(Number(q.limit)) || Number(q.limit) < 1 || Number(q.limit) > 100)) {
      return false;
    }
    
    // Optional sortOrder validation
    if ('sortOrder' in q && q.sortOrder !== 'asc' && q.sortOrder !== 'desc') {
      return false;
    }
    
    return true;
  },
  'Invalid pagination parameters'
);

// =============================================================================
// 2. RESPONSE HELPERS WITH TYPE SAFETY
// =============================================================================

// Standardized response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  metadata?: Record<string, any>;
}

// Response helper functions
class ResponseHelper {
  static success<T>(res: Response, data: T, metadata?: Record<string, any>, statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(metadata && { metadata }),
    };
    
    return res.status(statusCode).json(response);
  }
  
  static error(res: Response, error: AppError, statusCode?: number): Response {
    const status = statusCode || this.getStatusCodeFromError(error);
    
    const response: ApiResponse<never> = {
      success: false,
      error,
    };
    
    return res.status(status).json(response);
  }
  
  static validationError(res: Response, message: string, field?: string): Response {
    return this.error(res, {
      type: 'validation',
      field: field || 'unknown',
      message,
      code: 'VALIDATION_ERROR',
    }, 400);
  }
  
  static notFound(res: Response, resource = 'Resource'): Response {
    return this.error(res, {
      type: 'business',
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    }, 404);
  }
  
  static serverError(res: Response, message = 'Internal server error'): Response {
    return this.error(res, {
      type: 'business',
      code: 'INTERNAL_ERROR',
      message,
    }, 500);
  }
  
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number },
    metadata?: Record<string, any>
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      pagination: {
        ...pagination,
        pages: Math.ceil(pagination.total / pagination.limit),
      },
      ...(metadata && { metadata }),
    };
    
    return res.status(200).json(response);
  }
  
  private static getStatusCodeFromError(error: AppError): number {
    switch (error.type) {
      case 'validation':
        return 400;
      case 'network':
        return error.status || 500;
      case 'business':
        return error.code === 'NOT_FOUND' ? 404 : 500;
      default:
        return 500;
    }
  }
}

// =============================================================================
// 3. SERVICE LAYER WITH TYPE GUARDS
// =============================================================================

// In-memory database simulation
class UserService {
  private users: Map<string, User> = new Map();
  private events: APIEvent[] = [];
  
  // Generate unique ID
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Validate and create user
  async createUser(userData: unknown): Promise<Result<User, AppError>> {
    try {
      // Validate input data
      const validation = validateUser({
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...userData as any,
      });
      
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            type: 'validation',
            field: 'userData',
            message: 'Invalid user data',
            code: 'INVALID_USER_DATA',
          },
        };
      }
      
      const user = validation.data!;
      user.id = this.generateId();
      user.createdAt = new Date();
      user.updatedAt = new Date();
      
      // Store user
      this.users.set(user.id, user);
      
      // Create event
      const event: APIEvent = {
        type: 'user_created',
        timestamp: new Date(),
        data: {
          user,
          source: 'admin',
          metadata: { createdVia: 'api' },
        },
      };
      
      this.events.push(event);
      
      return { success: true, data: user };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'CREATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  // Get user by ID with type safety
  async getUserById(id: string): Promise<Result<User, AppError>> {
    if (!isNonEmptyString(id)) {
      return {
        success: false,
        error: {
          type: 'validation',
          field: 'id',
          message: 'User ID must be a non-empty string',
          code: 'INVALID_ID',
        },
      };
    }
    
    const user = this.users.get(id);
    
    if (!user) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'NOT_FOUND',
          message: `User with ID ${id} not found`,
        },
      };
    }
    
    // Double-check with type guard
    if (!isUser(user)) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'DATA_CORRUPTION',
          message: 'Stored user data is corrupted',
        },
      };
    }
    
    return { success: true, data: user };
  }
  
  // Get all users with pagination
  async getUsers(options: {
    page?: number;
    limit?: number;
    sortBy?: keyof User;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Result<{ users: User[]; total: number; page: number; limit: number }, AppError>> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder || 'desc';
      
      // Validate pagination parameters
      if (!isPositiveNumber(page) || !isPositiveNumber(limit)) {
        return {
          success: false,
          error: {
            type: 'validation',
            field: 'pagination',
            message: 'Page and limit must be positive numbers',
            code: 'INVALID_PAGINATION',
          },
        };
      }
      
      const allUsers = Array.from(this.users.values()).filter(isUser);
      
      // Sort users
      allUsers.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const users = allUsers.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          users,
          total: allUsers.length,
          page,
          limit,
        },
      };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  // Update user with validation
  async updateUser(id: string, updates: unknown): Promise<Result<User, AppError>> {
    try {
      // Get existing user
      const getUserResult = await this.getUserById(id);
      if (!isSuccess(getUserResult)) {
        return getUserResult;
      }
      
      const existingUser = getUserResult.data;
      
      // Validate updates
      if (typeof updates !== 'object' || updates === null) {
        return {
          success: false,
          error: {
            type: 'validation',
            field: 'updates',
            message: 'Updates must be an object',
            code: 'INVALID_UPDATES',
          },
        };
      }
      
      // Create updated user object
      const updatedUserData = {
        ...existingUser,
        ...updates as any,
        id: existingUser.id, // Preserve ID
        createdAt: existingUser.createdAt, // Preserve creation date
        updatedAt: new Date(),
      };
      
      // Validate the updated user
      const validation = validateUser(updatedUserData);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            type: 'validation',
            field: 'userData',
            message: 'Updated user data is invalid',
            code: 'INVALID_UPDATED_DATA',
          },
        };
      }
      
      const updatedUser = validation.data!;
      
      // Store updated user
      this.users.set(id, updatedUser);
      
      // Create event
      const event: APIEvent = {
        type: 'user_updated',
        timestamp: new Date(),
        data: {
          userId: id,
          changes: updates as Partial<User>,
          previousValues: existingUser,
          updatedBy: 'api',
        },
      };
      
      this.events.push(event);
      
      return { success: true, data: updatedUser };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  // Delete user
  async deleteUser(id: string): Promise<Result<{ message: string }, AppError>> {
    try {
      // Get existing user for backup
      const getUserResult = await this.getUserById(id);
      if (!isSuccess(getUserResult)) {
        return getUserResult;
      }
      
      const user = getUserResult.data;
      
      // Delete user
      this.users.delete(id);
      
      // Create event
      const event: APIEvent = {
        type: 'user_deleted',
        timestamp: new Date(),
        data: {
          userId: id,
          deletedBy: 'api',
          reason: 'API request',
          backup: user,
        },
      };
      
      this.events.push(event);
      
      return {
        success: true,
        data: { message: `User ${id} deleted successfully` },
      };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  // Get events with filtering
  async getEvents(filter?: Partial<Pick<APIEvent, 'type'>>): Promise<Result<APIEvent[], AppError>> {
    try {
      let events = this.events.filter(isAPIEvent); // Validate all events
      
      if (filter?.type) {
        events = events.filter(event => event.type === filter.type);
      }
      
      // Sort by timestamp descending
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return { success: true, data: events };
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'business',
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// =============================================================================
// 4. CONTROLLER LAYER WITH TYPE-SAFE HANDLERS
// =============================================================================

// Create service instance
const userService = new UserService();

// Type-safe controller handlers
class UserController {
  // Create user endpoint
  static createUser: RequestHandler = async (req: TypedRequest<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>, res, next) => {
    try {
      const result = await userService.createUser(req.validatedBody || req.body);
      
      if (isSuccess(result)) {
        return ResponseHelper.success(res, result.data, { created: true }, 201);
      } else {
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Get user by ID endpoint
  static getUserById: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await userService.getUserById(id);
      
      if (isSuccess(result)) {
        return ResponseHelper.success(res, result.data);
      } else {
        if (result.error.code === 'NOT_FOUND') {
          return ResponseHelper.notFound(res, 'User');
        }
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Get all users with pagination
  static getUsers: RequestHandler = async (req, res, next) => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query as PaginationQuery;
      
      const options = {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        sortBy: sortBy as keyof User | undefined,
        sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      };
      
      const result = await userService.getUsers(options);
      
      if (isSuccess(result)) {
        const { users, total, page: resultPage, limit: resultLimit } = result.data;
        return ResponseHelper.paginated(res, users, {
          page: resultPage,
          limit: resultLimit,
          total,
        });
      } else {
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Update user endpoint
  static updateUser: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.validatedBody || req.body;
      
      const result = await userService.updateUser(id, updates);
      
      if (isSuccess(result)) {
        return ResponseHelper.success(res, result.data, { updated: true });
      } else {
        if (result.error.code === 'NOT_FOUND') {
          return ResponseHelper.notFound(res, 'User');
        }
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Delete user endpoint
  static deleteUser: RequestHandler = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      
      if (isSuccess(result)) {
        return ResponseHelper.success(res, result.data, { deleted: true });
      } else {
        if (result.error.code === 'NOT_FOUND') {
          return ResponseHelper.notFound(res, 'User');
        }
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
  
  // Get events endpoint
  static getEvents: RequestHandler = async (req, res, next) => {
    try {
      const { type } = req.query;
      const filter = type ? { type: type as APIEvent['type'] } : undefined;
      
      const result = await userService.getEvents(filter);
      
      if (isSuccess(result)) {
        return ResponseHelper.success(res, result.data);
      } else {
        return ResponseHelper.error(res, result.error);
      }
    } catch (error) {
      next(error);
    }
  };
}

// =============================================================================
// 5. ERROR HANDLING MIDDLEWARE
// =============================================================================

// Global error handler with type safety
const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);
  
  // Check if it's our custom AppError
  if ('type' in error && 'message' in error) {
    ResponseHelper.error(res, error as AppError);
    return;
  }
  
  // Handle other types of errors
  if (error instanceof SyntaxError && 'body' in error) {
    ResponseHelper.validationError(res, 'Invalid JSON in request body');
    return;
  }
  
  // Default server error
  ResponseHelper.serverError(res, 'An unexpected error occurred');
};

// 404 handler
const notFoundHandler = (req: Request, res: Response): void => {
  ResponseHelper.notFound(res, `Endpoint ${req.method} ${req.path}`);
};

// =============================================================================
// 6. ROUTE DEFINITIONS
// =============================================================================

// Create Express application
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  ResponseHelper.success(res, { 
    status: 'healthy', 
    timestamp: new Date(),
    version: '1.0.0' 
  });
});

// User routes with validation middleware
const userRoutes = express.Router();

// POST /users - Create user
userRoutes.post('/', validateUserCreation, UserController.createUser);

// GET /users - Get all users with pagination
userRoutes.get('/', validatePagination, UserController.getUsers);

// GET /users/:id - Get user by ID
userRoutes.get('/:id', validateUserId, UserController.getUserById);

// PUT /users/:id - Update user
userRoutes.put('/:id', validateUserId, validateUserUpdate, UserController.updateUser);

// DELETE /users/:id - Delete user
userRoutes.delete('/:id', validateUserId, UserController.deleteUser);

// Mount user routes
app.use('/api/users', userRoutes);

// Events routes
app.get('/api/events', UserController.getEvents);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// 7. SERVER SETUP AND TESTING UTILITIES
// =============================================================================

// Start server function
function startServer(port = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log('Available endpoints:');
        console.log('  GET    /health');
        console.log('  POST   /api/users');
        console.log('  GET    /api/users');
        console.log('  GET    /api/users/:id');
        console.log('  PUT    /api/users/:id');
        console.log('  DELETE /api/users/:id');
        console.log('  GET    /api/events');
        resolve();
      });
      
      server.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
}

// Testing utilities
export const testUtils = {
  // Create test user data
  createTestUser: () => ({
    name: 'Test User',
    contact: { email: 'test@example.com' },
    age: 25,
    isActive: true,
    tags: ['test'],
  }),
  
  // API client for testing
  apiClient: {
    async createUser(userData: any) {
      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    
    async getUsers(params?: Record<string, string>) {
      const query = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`http://localhost:3000/api/users${query ? '?' + query : ''}`);
      return response.json();
    },
    
    async getUserById(id: string) {
      const response = await fetch(`http://localhost:3000/api/users/${id}`);
      return response.json();
    },
    
    async updateUser(id: string, updates: any) {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.json();
    },
    
    async deleteUser(id: string) {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    
    async getEvents(type?: string) {
      const query = type ? `?type=${type}` : '';
      const response = await fetch(`http://localhost:3000/api/events${query}`);
      return response.json();
    },
  },
};

// Export the app and utilities
export {
  app,
  startServer,
  UserService,
  UserController,
  ResponseHelper,
  validateRequest,
  validateParam,
  validateQuery,
  errorHandler,
};

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}