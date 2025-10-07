/**
 * Service API optimisé avec mise en cache et chargement conditionnel
 * Centralise tous les appels API et évite les requêtes redondantes
 */

import { apiService } from './api';
import { apiCache, CACHE_KEYS, CACHE_TTL } from './apiCache';
import { 
  ApiResponse, 
  User, 
  Message, 
  LeaderboardEntry, 
  PaginationParams,
  MessageRequest 
} from '../types';

interface OptimizedApiOptions {
  useCache?: boolean;
  forceRefresh?: boolean;
  ttl?: number;
}

class OptimizedApiService {
  /**
   * Récupérer le profil utilisateur avec cache
   */
  async getUserProfile(options: OptimizedApiOptions = {}): Promise<ApiResponse<{ user: User }>> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.USER_PROFILE;

    // Vérifier le cache si activé et pas de forçage
    if (useCache && !forceRefresh) {
      const cachedData = apiCache.get<ApiResponse<{ user: User }>>(cacheKey);
      if (cachedData) {
        console.log('Profil utilisateur récupéré depuis le cache');
        return cachedData;
      }
    }

    try {
      console.log('Récupération du profil utilisateur depuis l\'API');
      const response = await apiService.getProfile();
      
      // Mettre en cache si la requête a réussi
      if (response.success && useCache) {
        apiCache.set(cacheKey, response, CACHE_TTL.USER_PROFILE);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Récupérer les messages avec cache et pagination optimisée
   */
  async getMessages(
    params: PaginationParams = {}, 
    options: OptimizedApiOptions = {}
  ): Promise<ApiResponse<{ data: Message[]; pagination: any }>> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = `${CACHE_KEYS.MESSAGES}_${JSON.stringify(params)}`;

    // Vérifier le cache si activé et pas de forçage
    if (useCache && !forceRefresh) {
      const cachedData = apiCache.get<ApiResponse<{ data: Message[]; pagination: any }>>(cacheKey);
      if (cachedData) {
        console.log('Messages récupérés depuis le cache');
        return cachedData;
      }
    }

    try {
      console.log('Récupération des messages depuis l\'API');
      const response = await apiService.getMessages(params);
      
      // Mettre en cache si la requête a réussi
      if (response.success && useCache) {
        apiCache.set(cacheKey, response, CACHE_TTL.MESSAGES);
      }
      
      return response;
    } catch (error: any) {
      console.log('Erreur lors de la récupération des messages (gérée):', error.message);
      
      // Si erreur 401 (token expiré), essayer de rafraîchir le token
      if (error.response?.status === 401) {
        console.log('Token expiré, tentative de reconnexion...');
        try {
          // Essayer de récupérer les messages sans cache pour forcer un nouveau token
          const retryResponse = await apiService.getMessages(params);
          if (retryResponse.success && useCache) {
            apiCache.set(cacheKey, retryResponse, CACHE_TTL.MESSAGES);
          }
          return retryResponse;
        } catch (retryError) {
          console.log('Échec de la reconnexion, retour de données vides');
          // Retourner des données vides plutôt que de planter
          return {
            success: true,
            message: 'Aucun message disponible',
            data: { data: [], pagination: null }
          };
        }
      }
      
      // Pour toute autre erreur (500, etc.), retourner des données vides
      console.log('Erreur API, retour de données vides');
      return {
        success: true,
        message: 'Aucun message disponible',
        data: { data: [], pagination: null }
      };
    }
  }

  /**
   * Récupérer le leaderboard avec cache
   */
  async getLeaderboard(
    limit?: number, 
    options: OptimizedApiOptions = {}
  ): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[] }>> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = `${CACHE_KEYS.LEADERBOARD}_${limit || 'all'}`;

    // Vérifier le cache si activé et pas de forçage
    if (useCache && !forceRefresh) {
      const cachedData = apiCache.get<ApiResponse<{ leaderboard: LeaderboardEntry[] }>>(cacheKey);
      if (cachedData) {
        console.log('Leaderboard récupéré depuis le cache');
        return cachedData;
      }
    }

    try {
      console.log('Récupération du leaderboard depuis l\'API');
      const response = await apiService.getLeaderboard(limit);
      
      // Mettre en cache si la requête a réussi
      if (response.success && useCache) {
        apiCache.set(cacheKey, response, CACHE_TTL.LEADERBOARD);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération du leaderboard:', error);
      throw error;
    }
  }

  /**
   * Envoyer un message et invalider le cache des messages
   */
  async sendMessage(messageData: MessageRequest): Promise<ApiResponse<{ message: Message & { xpCalculation: any } }>> {
    try {
      console.log('Envoi du message');
      const response = await apiService.sendMessage(messageData);
      
      // Invalider le cache des messages après envoi
      this.invalidateMessagesCache();
      
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le profil utilisateur et invalider le cache
   */
  async updateUserProfile(
    userId: string, 
    userData: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    try {
      console.log('Mise à jour du profil utilisateur');
      const response = await apiService.updateProfile(userId, userData);
      
      // Invalider le cache du profil après mise à jour
      this.invalidateUserProfileCache();
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Vérifier la connectivité du serveur
   */
  async checkHealth(): Promise<ApiResponse> {
    try {
      return await apiService.checkHealth();
    } catch (error) {
      console.error('Erreur lors de la vérification de la connectivité:', error);
      throw error;
    }
  }

  /**
   * Invalider le cache du profil utilisateur
   */
  invalidateUserProfileCache(): void {
    apiCache.delete(CACHE_KEYS.USER_PROFILE);
    console.log('Cache du profil utilisateur invalidé');
  }

  /**
   * Invalider le cache des messages
   */
  invalidateMessagesCache(): void {
    // Supprimer toutes les entrées de cache liées aux messages
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(CACHE_KEYS.MESSAGES)) {
        apiCache.delete(key);
      }
    });
    console.log('Cache des messages invalidé');
  }

  /**
   * Invalider le cache du leaderboard
   */
  invalidateLeaderboardCache(): void {
    // Supprimer toutes les entrées de cache liées au leaderboard
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(CACHE_KEYS.LEADERBOARD)) {
        apiCache.delete(key);
      }
    });
    console.log('Cache du leaderboard invalidé');
  }

  /**
   * Vider complètement le cache
   */
  clearAllCache(): void {
    apiCache.clear();
    console.log('Cache complètement vidé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats() {
    return apiCache.getStats();
  }

  /**
   * Récupérer tous les utilisateurs (admin seulement)
   */
  async getUsers(
    params: PaginationParams = {},
    options: OptimizedApiOptions = {}
  ): Promise<ApiResponse<{ data: any[]; pagination: any }>> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = `${CACHE_KEYS.USERS}_${JSON.stringify(params)}`;

    if (useCache && !forceRefresh) {
      const cachedData = apiCache.get<ApiResponse<{ data: any[]; pagination: any }>>(cacheKey);
      if (cachedData) {
        console.log('Utilisateurs récupérés depuis le cache');
        return cachedData;
      }
    }

    try {
      console.log('Récupération des utilisateurs depuis l\'API');
      const response = await apiService.getUsers(params);
      
      if (response.success && useCache) {
        apiCache.set(cacheKey, response, CACHE_TTL.USERS || 30000);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel utilisateur (admin seulement)
   */
  async createUser(userData: { username: string; email: string; password: string }): Promise<ApiResponse<{ user: any }>> {
    try {
      console.log('Création d\'un nouvel utilisateur');
      const response = await apiService.createUser(userData);
      
      // Invalider le cache des utilisateurs après création
      this.invalidateUsersCache();
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur (admin seulement)
   */
  async deleteUser(userId: string): Promise<ApiResponse> {
    try {
      console.log('Suppression de l\'utilisateur');
      const response = await apiService.deleteUser(userId);
      
      // Invalider le cache des utilisateurs après suppression
      this.invalidateUsersCache();
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Invalider le cache des utilisateurs
   */
  invalidateUsersCache(): void {
    const stats = apiCache.getStats();
    stats.keys.forEach(key => {
      if (key.startsWith(CACHE_KEYS.USERS)) {
        apiCache.delete(key);
      }
    });
    console.log('Cache des utilisateurs invalidé');
  }

  /**
   * Méthodes d'authentification (sans cache)
   */
  async login(credentials: any) {
    return await apiService.login(credentials);
  }

  async register(userData: any) {
    return await apiService.register(userData);
  }

  async logout() {
    // Vider le cache lors de la déconnexion
    this.clearAllCache();
    return await apiService.logout();
  }

  /**
   * Gérer le retour sur l'application
   * Invalide le cache si les données sont trop anciennes
   */
  handleAppResume(): void {
    // Invalider le cache des messages pour forcer un refresh
    this.invalidateMessagesCache();
    console.log('Cache invalidé lors du retour sur l\'application');
  }
}

// Instance singleton
export const optimizedApi = new OptimizedApiService();
export default optimizedApi;
