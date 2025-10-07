import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

export interface AuthRequest extends Request {
  user: UserDocument;
}

/**
 * Middleware d'authentification JWT
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configuré');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur d\'authentification'
      });
    }
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Accès administrateur requis'
    });
    return;
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données
 */
export const requireOwnership = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
    return;
  }

  const userId = req.params.userId || req.params.id;
  
  if (req.user.role !== 'admin' && req.user._id?.toString() !== userId) {
    res.status(403).json({
      success: false,
      message: 'Accès non autorisé à cette ressource'
    });
    return;
  }

  next();
};

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET non configuré');
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
};
