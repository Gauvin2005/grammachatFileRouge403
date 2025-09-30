/**
 * Service de mise en cache pour optimiser les appels API
 * Évite les requêtes redondantes et améliore les performances
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
}

interface CacheConfig {
  defaultTTL: number; // TTL par défaut en millisecondes
  maxSize: number; // Taille maximale du cache
}

class ApiCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;

  constructor(config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes par défaut
    maxSize: 100 // 100 entrées maximum
  }) {
    this.config = config;
  }

  /**
   * Récupérer une entrée du cache si elle est valide
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stocker une entrée dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Nettoyer le cache si nécessaire
    this.cleanup();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Vérifier si une clé existe dans le cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? Date.now() - entry.timestamp <= entry.ttl : false;
  }

  /**
   * Nettoyer les entrées expirées et limiter la taille du cache
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Supprimer les entrées expirées
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // Limiter la taille du cache si nécessaire
    if (this.cache.size > this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      // Trier par timestamp (les plus anciens en premier)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Supprimer les entrées les plus anciennes
      const toDelete = entries.slice(0, this.cache.size - this.config.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Obtenir des statistiques du cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
export const apiCache = new ApiCacheService();

// Clés de cache prédéfinies
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  MESSAGES: 'messages',
  LEADERBOARD: 'leaderboard',
  USER_STATS: 'user_stats',
  USERS: 'users'
} as const;

// TTL personnalisés pour différents types de données
export const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  MESSAGES: 2 * 60 * 1000, // 2 minutes
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes
  USER_STATS: 15 * 60 * 1000, // 15 minutes
  USERS: 30 * 1000 // 30 secondes pour les utilisateurs (données sensibles)
} as const;
