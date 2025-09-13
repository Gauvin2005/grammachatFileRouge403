import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  register,
  login,
  getProfile,
  createAdmin,
  validateRegister,
  validateLogin,
  validateCreateAdmin
} from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   POST /api/auth/create-admin
 * @desc    Créer un compte administrateur
 * @access  Private (Admin only)
 */
router.post('/create-admin', authenticateToken, requireAdmin, validateCreateAdmin, createAdmin);

export default router;
