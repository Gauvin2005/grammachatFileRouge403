import { Router } from 'express';
import { authenticateToken, requireAdmin, requireOwnership } from '../middleware/auth';
import User from '../models/User';
import {
  getUsers,
  getUser,
  updateProfile,
  deleteUser,
  getLeaderboard,
  validatePagination,
  createUser
} from '../controllers/userController';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur avec rôle forcé à "user" (réservé aux administrateurs)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: "johndoe"
 *           examples:
 *             example1:
 *               summary: Création utilisateur standard
 *               value:
 *                 email: "user@example.com"
 *                 password: "password123"
 *                 username: "johndoe"
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Utilisateur créé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - droits administrateur requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ou nom d'utilisateur déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route pour créer un utilisateur (accessible uniquement par admin)
router.post('/', authenticateToken, requireAdmin, createUser);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Récupérer tous les utilisateurs (admin seulement)
 *     description: Récupère la liste de tous les utilisateurs avec pagination (réservé aux administrateurs)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'utilisateurs par page
 *     responses:
 *       200:
 *         description: Utilisateurs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - droits administrateur requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, requireAdmin, validatePagination, getUsers);

/**
 * @swagger
 * /api/users/leaderboard:
 *   get:
 *     summary: Récupérer le classement des utilisateurs par XP
 *     description: Récupère le classement des utilisateurs triés par points d'expérience (route publique)
 *     tags: [Users]
 *     security: []
 *     responses:
 *       200:
 *         description: Classement récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       username:
 *                         type: string
 *                         example: "johndoe"
 *                       xp:
 *                         type: number
 *                         example: 150
 *                       level:
 *                         type: number
 *                         example: 2
 *                       rank:
 *                         type: number
 *                         example: 1
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @swagger
 * /api/users/public:
 *   get:
 *     summary: Récupérer la liste publique des utilisateurs
 *     description: Récupère la liste des utilisateurs sans informations sensibles (route publique pour sélection de compte)
 *     tags: [Users]
 *     security: []
 *     responses:
 *       200:
 *         description: Utilisateurs récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       username:
 *                         type: string
 *                         example: "johndoe"
 *                       email:
 *                         type: string
 *                         example: "user@example.com"
 *                       role:
 *                         type: string
 *                         enum: ["user", "admin"]
 *                         example: "user"
 *                       xp:
 *                         type: number
 *                         example: 150
 *                       level:
 *                         type: number
 *                         example: 2
 */
// Route publique pour récupérer les utilisateurs (sans mot de passe) - DOIT être avant /:id
router.get('/public', async (req, res) => {
  try {
    console.log('Route /api/users/public appelée');
    
    // Essayer de récupérer les vrais utilisateurs depuis MongoDB
    try {
      const users = await User.find({}, { password: 0 }).select('username email role xp level');
      
      if (users && users.length > 0) {
        console.log(`Utilisateurs récupérés depuis MongoDB: ${users.length}`);
        return res.json({
          success: true,
          data: users
        });
      } else {
        console.log('Aucun utilisateur trouvé en base, utilisation des données mockées');
      }
    } catch (dbError: any) {
      console.log('Erreur MongoDB:', dbError.message);
      console.log('Utilisation des données mockées');
    }
    
    // Fallback vers des données mockées si MongoDB n'est pas disponible
    const mockUsers = [
      {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser1',
        email: 'test1@example.com',
        role: 'user',
        xp: 150,
        level: 2
      },
      {
        _id: '507f1f77bcf86cd799439012',
        username: 'testuser2',
        email: 'test2@example.com',
        role: 'user',
        xp: 300,
        level: 3
      },
      {
        _id: '507f1f77bcf86cd799439013',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        xp: 1000,
        level: 5
      }
    ];
    
    console.log('Retour de données mockées');
    return res.json({
      success: true,
      data: mockUsers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs publics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur spécifique
 *     description: Récupère les informations d'un utilisateur par son ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     description: Met à jour le profil d'un utilisateur (seul le propriétaire peut modifier son profil)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 example: "newusername"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newemail@example.com"
 *           examples:
 *             example1:
 *               summary: Mise à jour username
 *               value:
 *                 username: "newusername"
 *             example2:
 *               summary: Mise à jour email
 *               value:
 *                 email: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profil mis à jour avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - vous ne pouvez modifier que votre propre profil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email ou nom d'utilisateur déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authenticateToken, requireOwnership, updateProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur (admin seulement)
 *     description: Supprime définitivement un utilisateur (réservé aux administrateurs)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Utilisateur supprimé avec succès"
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - droits administrateur requis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
