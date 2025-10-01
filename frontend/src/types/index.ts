// Types TypeScript pour l'application mobile Grammachat

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  xpEarned: number;
  errorsFound: LanguageToolError[];
  sender: {
    id: string;
    username: string;
    email: string;
  };
}

export interface LanguageToolError {
  message: string;
  shortMessage: string;
  replacements: Array<{ value: string }> | string[]; // Peut être des objets ou des strings
  offset: number;
  length: number;
  context: { text: string; offset: number; length: number } | string; // Peut être un objet ou une string
  sentence: string;
  type: {
    typeName: string;
  };
  rule: {
    id: string;
    description: string;
    issueType: string;
  };
}

export interface XPCalculationResult {
  baseXP: number;
  bonusXP: number;
  penaltyXP: number;
  totalXP: number;
  errorsCount: number;
  levelUp: boolean;
  newLevel: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role?: 'user' | 'admin';
}

export interface MessageRequest {
  content: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MessageState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

export interface UserState {
  users: User[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  messages: MessageState;
  users: UserState;
}

// Types pour la navigation
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Profile: undefined;
  Chat: undefined;
  Leaderboard: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

// Types pour les formulaires
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  role: 'user' | 'admin';
}

export interface MessageFormData {
  content: string;
}

// Types pour les notifications
export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

// Types pour le cache local
export interface CachedData {
  user: User | null;
  messages: Message[];
  lastSync: string;
}
