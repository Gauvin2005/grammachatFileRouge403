import { Router } from 'express';
import { authenticateToken, requireAdmin, requireOwnership } from '@/middleware/auth';
import {
  getUsers,
  getUser,
  updateProfile,
  deleteUser,
  getLeaderboard,
  validatePagination
} from '@/controllers/userController';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    Récupérer tous les utilisateurs (admin seulement)
 * @access  Private/Admin
 */
router.get('/', authenticateToken, requireAdmin, validatePagination, getUsers);

/**
 * @route   GET /api/users/leaderboard
 * @desc    Récupérer le classement des utilisateurs par XP
 * @access  Public
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/users/:id
 * @desc    Récupérer un utilisateur spécifique
 * @access  Private
 */
router.get('/:id', authenticateToken, getUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Mettre à jour le profil utilisateur
 * @access  Private
 */
router.put('/:id', authenticateToken, requireOwnership, updateProfile);

/**
 * @route   DELETE /api/users/:id
 * @desc    Supprimer un utilisateur (admin seulement)
 * @access  Private/Admin
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
