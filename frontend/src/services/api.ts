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
  private DEMO_MODE = true; // MODE DÉMO TEMPORAIRE

  constructor() {
    this.baseURL = __DEV__ 
      ? 'http://localhost:3000/api'  // IP de l'ordinateur pour mobile physique
      : 'https://your-production-api.com/api';
    
    console.log('Configuration API:', {
      baseURL: this.baseURL,
      isDev: __DEV__,
      demoMode: this.DEMO_MODE
    });
    
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
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Connexion simulée');
      
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données utilisateur fictives
      const demoUser: User = {
        id: 'demo-user-1',
        email: credentials.email,
        username: credentials.email.split('@')[0],
        role: 'user',
        xp: 150,
        level: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      // Sauvegarder les données
      await this.setAuthToken(demoToken);
      await this.setUserData(demoUser);
      
      return {
        success: true,
        data: {
          user: demoUser,
          token: demoToken
        },
        message: 'Connexion réussie (mode démo)'
      };
    }

    try {
      console.log('Envoi requête login vers:', `${this.baseURL}/auth/login`);
      console.log('Données envoyées:', { email: credentials.email, password: '[HIDDEN]' });
      
      const response = await this.api.post('/auth/login', credentials);
      console.log('Réponse reçue:', response.status, response.data);
      
      return response.data;
    } catch (error: any) {
      console.log('Erreur API login:', error);
      console.log('Détails erreur:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Inscription simulée');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const demoUser: User = {
        id: 'demo-user-' + Date.now(),
        email: userData.email,
        username: userData.username,
        role: 'user',
        xp: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const demoToken = 'demo-token-' + Date.now();
      
      await this.setAuthToken(demoToken);
      await this.setUserData(demoUser);
      
      return {
        success: true,
        data: {
          user: demoUser,
          token: demoToken
        },
        message: 'Inscription réussie (mode démo)'
      };
    }

    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Profil simulé');
      const userData = await this.getUserData();
      return {
        success: true,
        data: { user: userData! },
        message: 'Profil récupéré (mode démo)'
      };
    }

    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // Méthodes pour les messages
  async sendMessage(messageData: MessageRequest): Promise<ApiResponse<{ message: Message & { xpCalculation: any } }>> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Message simulé');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simuler un message avec XP
      const demoMessage = {
        id: 'demo-message-' + Date.now(),
        content: messageData.content,
        timestamp: new Date().toISOString(),
        xpEarned: Math.floor(Math.random() * 20) + 5, // 5-25 XP
        errorsFound: [],
        sender: {
          id: 'demo-user-1',
          username: 'demo',
          email: 'demo@grammachat.com'
        },
        xpCalculation: {
          baseXP: Math.floor(messageData.content.length * 0.5),
          bonusXP: 10,
          penaltyXP: 0,
          totalXP: Math.floor(Math.random() * 20) + 5,
          errorsCount: 0,
          levelUp: false,
          newLevel: 2
        }
      };
      
      return {
        success: true,
        data: { message: demoMessage },
        message: 'Message envoyé (mode démo)'
      };
    }

    const response = await this.api.post('/messages', messageData);
    return response.data;
  }

  async getMessages(params?: PaginationParams): Promise<ApiResponse<{ data: Message[]; pagination: any }>> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Messages simulés');
      
      // Simuler des messages avec différents expéditeurs
      const demoMessages = [
        {
          id: 'demo-msg-1',
          content: 'Bonjour tout le monde !',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          xpEarned: 15,
          errorsFound: [],
          sender: { id: 'demo-user-1', username: 'demo', email: 'demo@grammachat.com' }
        },
        {
          id: 'demo-msg-2', 
          content: 'Comment allez-vous aujourd\'hui ?',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          xpEarned: 22,
          errorsFound: [],
          sender: { id: 'demo-user-1', username: 'demo', email: 'demo@grammachat.com' }
        },
        {
          id: 'demo-msg-3',
          content: 'Salut ! Ça va bien ?',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          xpEarned: 18,
          errorsFound: [],
          sender: { id: 'demo-user-1', username: 'demo', email: 'demo@grammachat.com' }
        }
      ];
      
      return {
        success: true,
        data: {
          data: demoMessages,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
        },
        message: 'Messages récupérés (mode démo)'
      };
    }

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
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Mise à jour profil simulée');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Récupérer l'utilisateur actuel et le mettre à jour
      const currentUser = await this.getUserData();
      const updatedUser = {
        ...currentUser!,
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      // Sauvegarder les nouvelles données
      await this.setUserData(updatedUser);
      
      return {
        success: true,
        data: { user: updatedUser },
        message: 'Profil mis à jour (mode démo)'
      };
    }

    const response = await this.api.put(`/users/${userId}`, userData);
    return response.data;
  }

  async getLeaderboard(limit?: number): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Leaderboard simulé');
      
      // Simuler un leaderboard
      const demoLeaderboard = [
        { rank: 1, username: 'demo', xp: 150, level: 2 },
        { rank: 2, username: 'alice', xp: 120, level: 2 },
        { rank: 3, username: 'bob', xp: 95, level: 1 },
        { rank: 4, username: 'charlie', xp: 80, level: 1 },
        { rank: 5, username: 'diana', xp: 65, level: 1 }
      ];
      
      return {
        success: true,
        data: { leaderboard: demoLeaderboard },
        message: 'Leaderboard récupéré (mode démo)'
      };
    }

    const response = await this.api.get('/users/leaderboard', { 
      params: limit ? { limit } : undefined 
    });
    return response.data;
  }

  // Méthodes utilitaires
  async checkHealth(): Promise<ApiResponse> {
    if (this.DEMO_MODE) {
      console.log('MODE DÉMO - Health check simulé');
      return {
        success: true,
        data: { status: 'ok', mode: 'demo' },
        message: 'Serveur accessible (mode démo)'
      };
    }

    try {
      console.log('Test de connectivité vers:', `${this.baseURL}/health`);
      const response = await this.api.get('/health');
      console.log('Serveur accessible:', response.status);
      return response.data;
    } catch (error: any) {
      console.log('Serveur inaccessible:', error.message);
      throw error;
    }
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
