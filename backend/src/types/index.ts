// Types TypeScript pour l'API Grammachat

export interface User {
  _id: string;
  email: string;
  username: string;
  password: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  xpEarned: number;
  errorsFound: LanguageToolError[];
}

export interface LanguageToolError {
  message: string;
  shortMessage: string;
  replacements: string[];
  offset: number;
  length: number;
  context: string;
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

export interface LanguageToolResponse {
  software: {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    status: string;
    premium: boolean;
  };
  warnings: {
    incompleteResults: boolean;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage: {
      name: string;
      code: string;
      confidence: number;
    };
  };
  matches: LanguageToolError[];
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

export interface XPCalculationResult {
  baseXP: number;
  bonusXP: number;
  penaltyXP: number;
  totalXP: number;
  errorsCount: number;
  levelUp: boolean;
  newLevel: number;
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
