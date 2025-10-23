import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '../.env' });

export class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() {
    // En mode test, ne pas créer de client Redis du tout
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true') {
      console.log('Redis désactivé en mode test');
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.setupEventHandlers();
    this.connect();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('Redis: Connexion établie');
      }
      this.isConnected = true;
    });

    this.client.on('error', err => {
      // Ne pas spammer les logs en mode test
      if (process.env.NODE_ENV !== 'test') {
        console.error('Redis: Erreur de connexion:', err.message);
      }
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('Redis: Déconnecté');
      }
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.client) return; // Pas de client en mode test

    try {
      await this.client.connect();
    } catch (error) {
      // Ne pas spammer les logs en mode test
      if (process.env.NODE_ENV !== 'test') {
        console.error('Redis: Impossible de se connecter:', error);
      }
      // Continue sans Redis en mode dégradé
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected && this.client) {
      await this.client.disconnect();
    }
  }

  // Cache des sessions utilisateur
  async setUserSession(userId: string, sessionData: any): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const ttl = parseInt(process.env.REDIS_SESSION_TTL || '604800'); // 7 jours par défaut
    await this.client.setEx(`session:${userId}`, ttl, JSON.stringify(sessionData));
  }

  async getUserSession(userId: string): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`session:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    await this.client.del(`session:${userId}`);
  }

  // Cache des messages
  async setMessagesCache(key: string, messages: any): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const ttl = parseInt(process.env.REDIS_MESSAGES_TTL || '300'); // 5 minutes par défaut
    await this.client.setEx(`messages:${key}`, ttl, JSON.stringify(messages));
  }

  async getMessagesCache(key: string): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`messages:${key}`);
    return data ? JSON.parse(data) : null;
  }

  // Cache du leaderboard
  async setLeaderboardCache(limit: number, leaderboard: any): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const ttl = parseInt(process.env.REDIS_LEADERBOARD_TTL || '600'); // 10 minutes par défaut
    await this.client.setEx(`leaderboard:${limit}`, ttl, JSON.stringify(leaderboard));
  }

  async getLeaderboardCache(limit: number): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`leaderboard:${limit}`);
    return data ? JSON.parse(data) : null;
  }

  // Cache des profils utilisateur
  async setUserProfileCache(userId: string, profile: any): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const ttl = parseInt(process.env.REDIS_PROFILE_TTL || '900'); // 15 minutes par défaut
    await this.client.setEx(`profile:${userId}`, ttl, JSON.stringify(profile));
  }

  async getUserProfileCache(userId: string): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`profile:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Cache des statistiques utilisateur
  async setUserStatsCache(userId: string, stats: any): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const ttl = parseInt(process.env.REDIS_STATS_TTL || '1800'); // 30 minutes par défaut
    await this.client.setEx(`stats:${userId}`, ttl, JSON.stringify(stats));
  }

  async getUserStatsCache(userId: string): Promise<any | null> {
    if (!this.isConnected || !this.client) return null;

    const data = await this.client.get(`stats:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    if (!this.isConnected || !this.client) return 0;

    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, Math.ceil(windowMs / 1000));

    const results = await multi.exec();
    return (results?.[0] as number) || 0;
  }

  // Invalidation de cache
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const keys = [`profile:${userId}`, `stats:${userId}`];
    await this.client.del(keys);
  }

  async invalidateMessagesCache(): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const keys = await this.client.keys('messages:*');
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  async invalidateLeaderboardCache(): Promise<void> {
    if (!this.isConnected || !this.client) return;

    const keys = await this.client.keys('leaderboard:*');
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  // Utilitaires
  async clearAllCache(): Promise<void> {
    if (!this.isConnected || !this.client) return;

    await this.client.flushDb();
  }

  async getCacheStats(): Promise<{ connected: boolean; keys: number }> {
    if (!this.isConnected || !this.client) {
      return { connected: false, keys: 0 };
    }

    const keys = await this.client.dbSize();
    return { connected: true, keys };
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

// Instance singleton
export const redisService = new RedisService();
