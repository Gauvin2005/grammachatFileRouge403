import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Message from '../models/Message';
import User from '../models/User';
import { LanguageToolService } from '../services/LanguageToolService';
import { redisService } from '../services/redisService';
import { ApiResponse, MessageRequest } from '../types';

const languageToolService = new LanguageToolService();

/**
 * Envoyer un nouveau message
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
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

    const { content }: MessageRequest = req.body;
    const userId = req.user!._id;

    // Analyser le texte avec LanguageTool
    const { errors: languageErrors, xpCalculation } = await languageToolService.analyzeText(content);

    // Créer le message
    const message = new Message({
      senderId: userId,
      content: content.trim(),
      xpEarned: xpCalculation.totalXP,
      errorsFound: languageErrors
    });

    await message.save();

    // Invalider le cache des messages après envoi
    await redisService.invalidateMessagesCache();

    // Ajouter l'XP à l'utilisateur
    const user = await User.findById(userId);
    if (user) {
      const oldLevel = user.level;
      await user.addXP(xpCalculation.totalXP);
      
      // Vérifier si l'utilisateur a monté de niveau
      xpCalculation.levelUp = user.level > oldLevel;
      xpCalculation.newLevel = user.level;

      // Invalider le cache leaderboard si l'XP a changé
      if (xpCalculation.totalXP > 0) {
        await redisService.invalidateLeaderboardCache();
      }
    }

    // Populer les données de l'expéditeur
    await message.populate('senderId', 'username email');

    const response: ApiResponse = {
      success: true,
      message: 'Message envoyé avec succès',
      data: {
        message: {
          id: message._id,
          content: message.content,
          timestamp: message.timestamp,
          xpEarned: message.xpEarned,
          errorsFound: message.errorsFound,
          sender: {
            id: user?._id,
            username: user?.username,
            email: user?.email
          },
          xpCalculation
        }
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi du message'
    });
  }
};

/**
 * Récupérer les messages avec pagination
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Construire la clé de cache
    const cacheKey = `messages:${page}:${limit}`;

    // Essayer de récupérer depuis le cache
    const cachedData = await redisService.getMessagesCache(cacheKey);
    if (cachedData) {
      console.log('Messages récupérés depuis le cache Redis');
      res.json(cachedData);
      return;
    }

    // Construire la requête de filtrage
    const filter: any = {};

    // Récupérer les messages avec pagination (du plus ancien au plus récent)
    const messages = await Message.find(filter)
      .populate('senderId', 'username email')
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit);

    // Compter le total des messages
    const total = await Message.countDocuments(filter);

    const response: ApiResponse = {
      success: true,
      message: 'Messages récupérés avec succès',
      data: {
        messages: messages.map(message => ({
          id: message._id,
          content: message.content,
          timestamp: message.timestamp,
          xpEarned: message.xpEarned,
          errorsFound: message.errorsFound,
          sender: {
            id: (message.senderId as any)._id,
            username: (message.senderId as any).username,
            email: (message.senderId as any).email
          }
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

    // Mettre en cache la réponse
    await redisService.setMessagesCache(cacheKey, response);

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des messages'
    });
  }
};

/**
 * Récupérer un message spécifique
 */
export const getMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const messageId = req.params.id;
    const userId = req.user!._id;

    // Construire la requête
    const filter: any = { _id: messageId };
    
    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres messages
    if (req.user!.role !== 'admin') {
      filter.senderId = userId;
    }

    const message = await Message.findOne(filter).populate('senderId', 'username email');

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Message récupéré avec succès',
      data: {
        message: {
          id: message._id,
          content: message.content,
          timestamp: message.timestamp,
          xpEarned: message.xpEarned,
          errorsFound: message.errorsFound,
          sender: {
            id: (message.senderId as any)._id,
            username: (message.senderId as any).username,
            email: (message.senderId as any).email
          }
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du message'
    });
  }
};

/**
 * Supprimer un message
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const messageId = req.params.id;
    const userId = req.user!._id;

    // Construire la requête
    const filter: any = { _id: messageId };
    
    // Si l'utilisateur n'est pas admin, il ne peut supprimer que ses propres messages
    if (req.user!.role !== 'admin') {
      filter.senderId = userId;
    }

    const message = await Message.findOneAndDelete(filter);

    if (!message) {
      res.status(404).json({
        success: false,
        message: 'Message non trouvé ou accès non autorisé'
      });
      return;
    }

    // Invalider le cache des messages après suppression
    await redisService.invalidateMessagesCache();

    const response: ApiResponse = {
      success: true,
      message: 'Message supprimé avec succès'
    };

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du message'
    });
  }
};

