import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { generateToken } from '../middleware/auth';
import { ApiResponse, RegisterRequest, AuthRequest } from '../types';

/**
 * Inscription d'un nouvel utilisateur
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        error: errors.array()[0].msg
      });
      return;
    }

    const { email, password, username, role }: RegisterRequest = req.body;

    // Valider le rôle
    if (!role || !['user', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Rôle invalide. Doit être "user" ou "admin"'
      });
      return;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: existingUser.email === email ? 'Email déjà utilisé' : 'Nom d\'utilisateur déjà utilisé'
      });
      return;
    }

    // Créer le nouvel utilisateur
    const user = new User({
      email,
      password,
      username,
      role,
      xp: 0,
      level: 1
    });

    await user.save();

    // Générer le token JWT
    const token = generateToken(user._id?.toString() || '');

    const response: ApiResponse = {
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          xp: user.xp,
          level: user.level
        },
        token
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validation des erreurs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        error: errors.array()[0].msg
      });
      return;
    }

    const { email, password }: AuthRequest = req.body;

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
      return;
    }

    // Générer le token JWT
    const token = generateToken(user._id?.toString() || '');

    const response: ApiResponse = {
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          xp: user.xp,
          level: user.level
        },
        token
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

/**
 * Obtenir le profil de l'utilisateur connecté
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const response: ApiResponse = {
      success: true,
      message: 'Profil récupéré avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          xp: user.xp,
          level: user.level,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du profil'
    });
  }
};

/**
 * Validation pour l'inscription
 */
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
];

/**
 * Validation pour la connexion
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];
