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
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
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
}

// Instance singleton
export const optimizedApi = new OptimizedApiService();
export default optimizedApi;
