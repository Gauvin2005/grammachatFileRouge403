import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { 
  ApiResponse, 
  AuthRequest, 
  RegisterRequest, 
  MessageRequest, 
  User, 
  Message, 
  LeaderboardEntry,
  PaginationParams 
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = __DEV__ 
      ? 'http://localhost:3000/api' 
      : 'https://your-production-api.com/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les réponses
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide, déconnecter l'utilisateur
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
          // Rediriger vers la page de connexion
          // NavigationService.navigate('Login');
        }
        return Promise.reject(error);
      }
    );
  }

  // Méthodes d'authentification
  async login(credentials: AuthRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // Méthodes pour les messages
  async sendMessage(messageData: MessageRequest): Promise<ApiResponse<{ message: Message & { xpCalculation: any } }>> {
    const response = await this.api.post('/messages', messageData);
    return response.data;
  }

  async getMessages(params?: PaginationParams): Promise<ApiResponse<{ data: Message[]; pagination: any }>> {
    const response = await this.api.get('/messages', { params });
    return response.data;
  }

  async getMessage(messageId: string): Promise<ApiResponse<{ message: Message }>> {
    const response = await this.api.get(`/messages/${messageId}`);
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/messages/${messageId}`);
    return response.data;
  }

  // Méthodes pour les utilisateurs
  async getUsers(params?: PaginationParams): Promise<ApiResponse<{ data: User[]; pagination: any }>> {
    const response = await this.api.get('/users', { params });
    return response.data;
  }

  async getUser(userId: string): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async getLeaderboard(limit?: number): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    const response = await this.api.get('/users/leaderboard', { 
      params: limit ? { limit } : undefined 
    });
    return response.data;
  }

  // Méthodes utilitaires
  async checkHealth(): Promise<ApiResponse> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Gestion du token
  async setAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
  }

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
  }

  async clearAuthToken(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
  }

  // Gestion des données utilisateur
  async setUserData(user: User): Promise<void> {
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
  }

  async getUserData(): Promise<User | null> {
    const userData = await SecureStore.getItemAsync('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  async clearUserData(): Promise<void> {
    await SecureStore.deleteItemAsync('user_data');
  }

  // Méthode pour déconnecter complètement
  async logout(): Promise<void> {
    await this.clearAuthToken();
    await this.clearUserData();
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
