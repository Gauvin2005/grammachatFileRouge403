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
import { getNetworkErrorMessage, getTestUrls } from '../utils/networkUtils';

class ApiService {
  public api: AxiosInstance;
  public baseURL: string;

  constructor() {
    // Configuration dynamique selon l'environnement
    this.baseURL = this.getApiBaseUrl();
    
    console.log('Configuration API:', {
      baseURL: this.baseURL,
      isDev: __DEV__
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

  /**
   * Détermine l'URL de base de l'API selon l'environnement
   */
  private getApiBaseUrl(): string {
    // URL fixe pour éviter les tests multiples
    return 'http://10.8.252.168:3000/api';
  }

  private setupInterceptors(): void {
    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        console.log('Token récupéré pour la requête:', token ? 'PRÉSENT' : 'ABSENT');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token ajouté aux headers:', `Bearer ${token.substring(0, 20)}...`);
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
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.get('/auth/profile');
    return response.data;
  }

  // Méthodes pour les messages
  async sendMessage(messageData: MessageRequest): Promise<ApiResponse<{ message: Message & { xpCalculation: any } }>> {
    console.log('Envoi de message via API service:', { content: messageData.content });
    console.log('URL de l\'API:', `${this.baseURL}/messages`);
    
    const response = await this.api.post('/messages', messageData);
    console.log('Réponse API sendMessage:', response.status, response.data);
    
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

  async createUser(userData: { username: string; email: string; password: string }): Promise<ApiResponse<{ user: User }>> {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async updateProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    console.log('Mise à jour du profil utilisateur - userId:', userId);
    console.log('Mise à jour du profil utilisateur - userData:', userData);
    
    try {
      const response = await this.api.put(`/users/${userId}`, userData);
      console.log('Réponse de mise à jour du profil:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      console.error('Détails de l\'erreur:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async getLeaderboard(limit?: number): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    const response = await this.api.get('/users/leaderboard', { 
      params: limit ? { limit } : undefined 
    });
    return response.data;
  }

  // Méthodes utilitaires
  async checkHealth(): Promise<ApiResponse> {
    try {
      console.log('Test de connectivité vers:', `${this.baseURL}/health`);
      const response = await this.api.get('/health');
      console.log('Serveur accessible:', response.status);
      return response.data;
    } catch (error: any) {
      console.log('Serveur inaccessible:', error.message);
      
      // Améliorer la gestion d'erreur réseau
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        const networkError = new Error(getNetworkErrorMessage(error));
        networkError.name = 'NetworkError';
        throw networkError;
      }
      
      throw error;
    }
  }

  /**
   * Teste plusieurs URLs pour trouver celle qui fonctionne
   */
  async findWorkingUrl(): Promise<string | null> {
    if (!__DEV__) {
      return this.baseURL;
    }

    const testUrls = getTestUrls(3000);

    for (const url of testUrls) {
      try {
        console.log(`Test de l'URL: ${url}`);
        const testApi = axios.create({
          baseURL: url,
          timeout: 3000,
        });
        
        await testApi.get('/health');
        console.log(`URL fonctionnelle trouvée: ${url}`);
        return url;
      } catch (error) {
        console.log(`URL non accessible: ${url}`);
        continue;
      }
    }

    console.log('Aucune URL fonctionnelle trouvée');
    return null;
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

  /**
   * Force une nouvelle détection d'IP et met à jour l'URL
   */
  async refreshIP(): Promise<void> {
    // Désactivé pour éviter les tests multiples
    console.log('Refresh IP désactivé - utilisation de l\'URL fixe');
  }

  /**
   * Méthode pour déconnecter complètement
   */
  async logout(): Promise<void> {
    await this.clearAuthToken();
    await this.clearUserData();
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
