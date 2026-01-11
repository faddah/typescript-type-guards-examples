// =============================================================================
// TYPE GUARDS INTEGRATION WITH REACT
// =============================================================================

// @ts-ignore
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, Result, AppError, APIEvent,
  isUser, isSuccess, isFailure, isAPIEvent,
  validateUser, fetchUser, assertIsUser
} from './detailed-type-guards';

// =============================================================================
// 1. PROP VALIDATION WITH TYPE GUARDS
// =============================================================================

interface UserCardProps {
  user: unknown; // Intentionally unknown for demonstration
  onEdit?: (user: User) => void;
  showEmail?: boolean;
}

// Type guard for component props
function isValidUserCardProps(props: any): props is Required<UserCardProps> & { user: User } {
  return (
    isUser(props.user) &&
    (props.onEdit === undefined || typeof props.onEdit === 'function') &&
    (props.showEmail === undefined || typeof props.showEmail === 'boolean')
  );
}

// Component with runtime prop validation
const UserCard: React.FC<UserCardProps> = (props: UserCardProps) => {
  // Validate props at runtime
  if (!isUser(props.user)) {
    console.error('UserCard: Invalid user prop', props.user);
    return (`
      <div className="error-card">
        <h3>Invalid User Data</h3>
        <p>The user data provided is not valid.</p>
        <pre>{JSON.stringify(props.user, null, 2)}</pre>
      </div>
    `);
  }

  const { user, onEdit, showEmail = true } = props;

  return (`
    <div className="user-card">
      <h3>{user.name}</h3>
      {showEmail && <p>Email: {user.contact.email}</p>}
      <p>Age: {user.age}</p>
      <p>Status: {user.isActive ? 'Active' : 'Inactive'}</p>
      <p>Tags: {user.tags.join(', ')}</p>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Edit User</button>
      )}
    </div>
  `);
};

// =============================================================================
// 2. FORM VALIDATION WITH TYPE GUARDS
// =============================================================================

interface UserFormData {
  name: string;
  email: string;
  age: string; // String from form input
  tags: string; // Comma-separated string
  isActive: boolean;
}

// Type guard for form data
function isUserFormData(data: any): data is UserFormData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.name === 'string' &&
    typeof data.email === 'string' &&
    typeof data.age === 'string' &&
    typeof data.tags === 'string' &&
    typeof data.isActive === 'boolean'
  );
}

// Form validation errors
interface FormValidationError {
  field: keyof UserFormData;
  message: string;
}

// Comprehensive form validation
function validateUserForm(data: unknown): { isValid: boolean; errors: FormValidationError[]; user?: User } {
  const errors: FormValidationError[] = [];

  if (!isUserFormData(data)) {
    return {
      isValid: false,
      errors: [{ field: 'name', message: 'Invalid form data structure' }]
    };
  }

  // Validate name
  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  // Validate age
  const age = parseInt(data.age, 10);
  if (isNaN(age) || age < 1 || age > 120) {
    errors.push({ field: 'age', message: 'Age must be between 1 and 120' });
  }

  // Validate tags
  const tags = data.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  if (tags.length === 0) {
    errors.push({ field: 'tags', message: 'At least one tag is required' });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Create User object if validation passes
  const user: User = {
    id: `user_${Date.now()}`, // Generate ID
    name: data.name.trim(),
    contact: {
      email: data.email,
    },
    age,
    isActive: data.isActive,
    tags,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { isValid: true, errors: [], user };
}

// User form component with type-safe validation
interface UserFormProps {
  onSubmit: (user: User) => void;
  onCancel: () => void;
  initialData?: Partial<User>;
}

const UserForm: React.FC<UserFormProps> = (props: UserFormProps) => {
  const { onSubmit, onCancel, initialData } = props;
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.contact?.email || '',
    age: initialData?.age?.toString() || '',
    tags: initialData?.tags?.join(', ') || '',
    isActive: initialData?.isActive ?? true,
  });

  const [errors, setErrors] = useState<FormValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof UserFormData) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.type === 'checkbox' 
        ? event.target.checked 
        : event.target.value;
      
      setFormData((prev: UserFormData) => ({ ...prev, [field]: value }));
      
      // Clear error for this field
      setErrors((prev: FormValidationError[]) => prev.filter(error => error.field !== field));
    }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const validation = validateUserForm(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Type guard ensures user exists
      assertIsUser(validation.user);
      await onSubmit(validation.user);
      
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      setErrors([{ field: 'name', message: 'Submission failed. Please try again.' }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit]);

  const getFieldError = useCallback((field: keyof UserFormData) => 
    errors.find((error: FormValidationError) => error.field === field)?.message, [errors]);

  return (`
    <form onSubmit={handleSubmit} className="user-form">
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange('name')}
          className={getFieldError('name') ? 'error' : ''}
          disabled={isSubmitting}
        />
        {getFieldError('name') && (
          <span className="error-message">{getFieldError('name')}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          className={getFieldError('email') ? 'error' : ''}
          disabled={isSubmitting}
        />
        {getFieldError('email') && (
          <span className="error-message">{getFieldError('email')}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="age">Age *</label>
        <input
          id="age"
          type="number"
          value={formData.age}
          onChange={handleInputChange('age')}
          className={getFieldError('age') ? 'error' : ''}
          disabled={isSubmitting}
        />
        {getFieldError('age') && (
          <span className="error-message">{getFieldError('age')}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags * (comma-separated)</label>
        <input
          id="tags"
          type="text"
          value={formData.tags}
          onChange={handleInputChange('tags')}
          className={getFieldError('tags') ? 'error' : ''}
          disabled={isSubmitting}
          placeholder="premium, verified, active"
        />
        {getFieldError('tags') && (
          <span className="error-message">{getFieldError('tags')}</span>
        )}
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={handleInputChange('isActive')}
            disabled={isSubmitting}
          />
          Active User
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save User'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  `);
};

// =============================================================================
// 3. API INTEGRATION WITH TYPE GUARDS
// =============================================================================

// Custom hook for safe API data fetching
function useUser(userId: string) {
  const [state, setState] = useState<{
    user: User | null;
    loading: boolean;
    error: AppError | null;
  }>({
    user: null,
    loading: false,
    error: null,
  });

  const fetchUserData = useCallback(async () => {
    setState((prev: { user: User | null; loading: boolean; error: AppError | null }) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchUser(userId);

      if (isSuccess(result)) {
        setState({
          user: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: result.error,
        });
      }
    } catch (error: unknown) {
      setState({
        user: null,
        loading: false,
        error: {
          type: 'network',
          status: 0,
          message: error instanceof Error ? error.message : 'Unknown error',
          endpoint: `/api/users/${userId}`,
        },
      });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId, fetchUserData]);

  const retry = useCallback(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    ...state,
    retry,
  };
}

// Component that safely handles API data
const UserProfile: React.FC<{ userId: string }> = (props: { userId: string }) => {
  const { userId } = props;
  const { user, loading, error, retry } = useUser(userId);

  if (loading) {
    return (`<div className="loading">Loading user profile...</div>`);
  }

  if (error) {
    return (`
      <div className="error">
        <h3>Failed to load user profile</h3>
        <p>{error.message}</p>
        <button onClick={retry}>Retry</button>
      </div>
    `);
  }

  if (!user) {
    return (`<div className="no-data">No user data available</div>`);
  }

  // TypeScript knows user is definitely a User here
  return (`<UserCard user={user} showEmail={true} />`);
};

// =============================================================================
// 4. EVENT HANDLING WITH TYPE GUARDS
// =============================================================================

// Custom hook for handling typed events
function useEventHandler<T>(
  eventGuard: (event: unknown) => event is T,
  handler: (event: T) => void
) {
  return useCallback((rawEvent: unknown) => {
    if (eventGuard(rawEvent)) {
      handler(rawEvent);
    } else {
      console.warn('Invalid event received:', rawEvent);
    }
  }, [eventGuard, handler]);
}

// Event log component with type-safe event handling
const EventLog: React.FC = () => {
  const [events, setEvents] = useState<APIEvent[]>([]);

  const handleNewEvent = useEventHandler(
    isAPIEvent,
    useCallback((event: APIEvent) => {
      setEvents((prev: APIEvent[]) => [event, ...prev.slice(0, 49)]); // Keep last 50 events
    }, [])
  );

  // Simulate receiving events
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random event
      const mockEvents = [
        {
          type: 'user_created' as const,
          timestamp: new Date(),
          data: {
            user: {
              id: `user_${Date.now()}`,
              name: `User ${Math.floor(Math.random() * 1000)}`,
              contact: { email: `user${Date.now()}@example.com` },
              age: Math.floor(Math.random() * 50) + 18,
              isActive: true,
              tags: ['new'],
              createdAt: new Date(),
              updatedAt: new Date(),
            } as User,
            source: 'registration' as const,
          },
        },
        {
          type: 'user_login' as const,
          timestamp: new Date(),
          data: {
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            successful: Math.random() > 0.1,
          },
        },
      ];

      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      handleNewEvent(randomEvent);
    }, 3000);

    return () => clearInterval(interval);
  }, [handleNewEvent]);

  const eventCounts = useMemo(() => {
    return events.reduce((counts: Record<string, number>, event: APIEvent) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [events]);

  return (`
    <div className="event-log">
      <h2>Event Log</h2>
      
      <div className="event-stats">
        <h3>Event Counts</h3>
        {Object.entries(eventCounts).map(([type, count]) => (
          <div key={type} className="stat">
            <span>{type}:</span> <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="event-list">
        <h3>Recent Events</h3>
        {events.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-header">
              <span className="event-type">{event.type}</span>
              <span className="event-time">
                {event.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="event-data">
              <pre>{JSON.stringify(event.data, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  `);
};

// =============================================================================
// 5. CONTEXT AND STATE MANAGEMENT WITH TYPE GUARDS
// =============================================================================

// Application state with type guards
interface AppState {
  currentUser: User | null;
  users: User[];
  events: APIEvent[];
  loading: boolean;
  error: AppError | null;
}

// State actions with discriminated unions
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<User> } }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'ADD_EVENT'; payload: APIEvent }
  | { type: 'RESET_STATE' };

// Action type guards
function isSetLoadingAction(action: AppAction): action is Extract<AppAction, { type: 'SET_LOADING' }> {
  return action.type === 'SET_LOADING';
}

function isAddUserAction(action: AppAction): action is Extract<AppAction, { type: 'ADD_USER' }> {
  return action.type === 'ADD_USER';
}

// Type-safe reducer with exhaustive checking
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'ADD_USER':
      // Validate user before adding
      if (!isUser(action.payload)) {
        console.error('Invalid user in ADD_USER action:', action.payload);
        return state;
      }
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.updates, updatedAt: new Date() }
            : user
        ),
      };
    
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
        currentUser: state.currentUser?.id === action.payload ? null : state.currentUser,
      };
    
    case 'ADD_EVENT':
      if (!isAPIEvent(action.payload)) {
        console.error('Invalid event in ADD_EVENT action:', action.payload);
        return state;
      }
      return {
        ...state,
        events: [action.payload, ...state.events.slice(0, 99)], // Keep last 100 events
      };
    
    case 'RESET_STATE':
      return {
        currentUser: null,
        users: [],
        events: [],
        loading: false,
        error: null,
      };
    
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustive: never = action;
      console.error('Unhandled action type:', action);
      return state;
  }
}

// React Context with type-safe state management
const AppContext = React.createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Context provider with type guards
export const AppProvider: React.FC<{ children: React.ReactNode }> = (props: { children: React.ReactNode }) => {
  const { children } = props;
  const [state, dispatch] = React.useReducer(appReducer, {
    currentUser: null,
    users: [],
    events: [],
    loading: false,
    error: null,
  });

  // Enhanced dispatch with validation
  const safeDispatch = useCallback((action: AppAction) => {
    try {
      dispatch(action);
    } catch (error) {
      console.error('Dispatch error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'business',
          code: 'DISPATCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown dispatch error',
        },
      });
    }
  }, []);

  return (`
    <AppContext.Provider value={{ state, dispatch: safeDispatch }}>
      {children}
    </AppContext.Provider>
  `);
};

// Custom hook to use app context safely
export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// =============================================================================
// 6. MAIN APPLICATION COMPONENT
// =============================================================================

const App: React.FC = () => {
  return (`
    <AppProvider>
      <div className="app">
        <header>
          <h1>Type-Safe React Application</h1>
        </header>
        
        <main>
          <UserProfile userId="user_123" />
          <EventLog />
        </main>
      </div>
    </AppProvider>
  `);
};

export default App;

// =============================================================================
// COMPONENT TESTING UTILITIES
// =============================================================================

// Test utilities for type-safe component testing
export const testUtils = {
  // Create mock user for testing
  createMockUser: (overrides: Partial<User> = {}): User => ({
    id: 'test_user_123',
    name: 'Test User',
    contact: { email: 'test@example.com' },
    age: 25,
    isActive: true,
    tags: ['test'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    ...overrides,
  }),

  // Create mock API events
  createMockEvent: (type: APIEvent['type'], overrides: any = {}): APIEvent => {
    const base = {
      timestamp: new Date(),
      ...overrides,
    };

    switch (type) {
      case 'user_created':
        return {
          type,
          ...base,
          data: {
            user: testUtils.createMockUser(),
            source: 'registration' as const,
            ...overrides.data,
          },
        };
      
      case 'user_login':
        return {
          type,
          ...base,
          data: {
            userId: 'test_user_123',
            ip: '192.168.1.1',
            userAgent: 'Test Agent',
            successful: true,
            ...overrides.data,
          },
        };
      
      default:
        throw new Error(`Unsupported mock event type: ${type}`);
    }
  },

  // Validate component props
  validateProps: {
    UserCard: (props: any): props is UserCardProps => {
      return isUser(props.user);
    },
  },
};

export {
  UserCard,
  UserForm,
  UserProfile,
  EventLog,
  useUser,
  useEventHandler,
};