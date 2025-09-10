import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendMessage,
  getMessages,
  getMessage,
  deleteMessage,
  validateMessage,
  validatePagination
} from '../controllers/messageController';

const router = Router();

/**
 * @route   POST /api/messages
 * @desc    Envoyer un nouveau message
 * @access  Private
 */
router.post('/', authenticateToken, validateMessage, sendMessage);

/**
 * @route   GET /api/messages
 * @desc    Récupérer les messages avec pagination
 * @access  Private
 */
router.get('/', authenticateToken, validatePagination, getMessages);

/**
 * @route   GET /api/messages/:id
 * @desc    Récupérer un message spécifique
 * @access  Private
 */
router.get('/:id', authenticateToken, getMessage);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Supprimer un message
 * @access  Private
 */
router.delete('/:id', authenticateToken, deleteMessage);

export default router;
