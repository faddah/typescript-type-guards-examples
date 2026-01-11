// Please create a type.d.ts file with the following content:
export interface User {
    id: number;
    name: string;
    email: string;
}

export interface UserCardProps {
    user: User;
}   

export interface UserFormProps {
    onSubmit: (user: User) => void;
    onCancel: () => void;
}

export interface UserFormData {
    name: string;
    email: string;
    age: string;
    tags: string;
    isActive: boolean;
}

export interface FormValidationError {
    field: string;
    message: string;
}

export interface EventLog {
    timestamp: Date;
    eventType: string;
    details: string;
}

export interface AppState {
    currentUser: User | null;
    users: User[];
    eventLogs: EventLog[];
}

export type AppAction =
    | { type: 'SET_CURRENT_USER'; payload: User | null }
    | { type: 'ADD_USER'; payload: User }
    | { type: 'REMOVE_USER'; payload: number }
    | { type: 'ADD_EVENT_LOG'; payload: EventLog };

export interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

