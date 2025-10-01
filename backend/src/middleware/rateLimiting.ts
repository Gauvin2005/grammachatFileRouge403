import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redisService';

/**
 * Middleware de rate limiting avec Redis
 * Plus efficace que express-rate-limit car partagé entre instances
 */
export const redisRateLimit = (windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Utiliser l'IP comme clé
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `rate_limit:${clientIp}`;

      // Si Redis n'est pas disponible, passer au middleware suivant
      if (!redisService.isRedisConnected()) {
        return next();
      }

      // Incrémenter le compteur
      const currentCount = await redisService.incrementRateLimit(key, windowMs);

      // Ajouter les headers de rate limiting
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - currentCount).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      // Vérifier si la limite est dépassée
      if (currentCount > maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erreur Redis rate limiting:', error);
      // En cas d'erreur Redis, continuer sans rate limiting
      next();
    }
  };
};

/**
 * Rate limiting spécifique pour l'authentification
 * Plus strict pour éviter les attaques par force brute
 */
export const authRateLimit = redisRateLimit(15 * 60 * 1000, 5); // 5 tentatives par 15 minutes

/**
 * Rate limiting pour l'envoi de messages
 * Évite le spam
 */
export const messageRateLimit = redisRateLimit(60 * 1000, 10); // 10 messages par minute

/**
 * Rate limiting général pour l'API
 */
export const apiRateLimit = redisRateLimit(15 * 60 * 1000, 100); // 100 requêtes par 15 minutes
