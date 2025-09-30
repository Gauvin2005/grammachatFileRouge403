import { Request, Response } from 'express';
import { query, validationResult, body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types';

/**
 * Créer un nouvel utilisateur (accessible uniquement par admin)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;

    // Validation des données requises
    if (!email || !password || !username) {
      res.status(400).json({
        success: false,
        message: 'Email, mot de passe et nom d\'utilisateur sont requis'
      });
      return;
    }

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
      return;
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      res.status(409).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
      return;
    }

    // Créer l'utilisateur avec rôle forcé à 'user'
    const newUser = new User({
      email,
      password,
      username,
      role: 'user', // Rôle forcé à 'user' par défaut
      xp: 0,
      level: 1
    });

    await newUser.save();

    // Retourner la réponse sans le mot de passe
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      xp: newUser.xp,
      level: newUser.level,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    const response: ApiResponse = {
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: userResponse
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création de l\'utilisateur'
    });
  }
};

/**
 * Récupérer tous les utilisateurs (admin seulement)
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy as string || 'xp';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

    // Construire l'objet de tri
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Récupérer les utilisateurs avec pagination
    const users = await User.find({})
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Compter le total des utilisateurs
    const total = await User.countDocuments({});

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      message: 'Utilisateurs récupérés avec succès',
      data: {
        data: users.map(user => ({
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          xp: user.xp,
          level: user.level,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

/**
 * Récupérer un utilisateur spécifique
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Utilisateur récupéré avec succès',
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
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de l\'utilisateur'
    });
  }
};

/**
 * Mettre à jour le profil utilisateur
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const { username } = req.body;

    // Vérifier que l'utilisateur met à jour son propre profil
    if (req.user!._id?.toString() !== userId && req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    // Mettre à jour le nom d'utilisateur si fourni
    if (username && username !== user.username) {
      // Vérifier si le nouveau nom d'utilisateur est déjà pris
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Nom d\'utilisateur déjà utilisé'
        });
        return;
      }
      user.username = username;
    }

    await user.save();

    const response: ApiResponse = {
      success: true,
      message: 'Profil mis à jour avec succès',
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
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du profil'
    });
  }
};

/**
 * Supprimer un utilisateur (admin seulement)
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // Empêcher l'auto-suppression
    if (req.user!._id?.toString() === userId) {
      res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
      return;
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Utilisateur supprimé avec succès'
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression de l\'utilisateur'
    });
  }
};

/**
 * Obtenir le classement des utilisateurs par XP
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const users = await User.find({})
      .select('username xp level')
      .sort({ xp: -1 })
      .limit(limit);

    const response: ApiResponse = {
      success: true,
      message: 'Classement récupéré avec succès',
      data: {
        leaderboard: users.map((user, index) => ({
          rank: index + 1,
          username: user.username,
          xp: user.xp,
          level: user.level
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du classement'
    });
  }
};

/**
 * Validation pour la pagination
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un nombre entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un nombre entre 1 et 100'),
  query('sortBy')
    .optional()
    .isIn(['xp', 'level', 'username', 'createdAt'])
    .withMessage('Le tri doit être par: xp, level, username ou createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('L\'ordre de tri doit être asc ou desc')
];
