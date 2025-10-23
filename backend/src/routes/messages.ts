import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendMessage,
  getMessages,
  getMessage,
  deleteMessage,
  validateMessage,
  validatePagination,
} from '../controllers/messageController';

const router = Router();

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Envoyer un nouveau message
 *     description: Envoie un message qui sera automatiquement corrigé par LanguageTool et rapportera des XP
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageRequest'
 *           examples:
 *             example1:
 *               summary: Message simple
 *               value:
 *                 content: "Bonjour, comment allez-vous ?"
 *             example2:
 *               summary: Message avec erreurs
 *               value:
 *                 content: "Salut, comment tu va ?"
 *     responses:
 *       201:
 *         description: Message envoyé avec succès
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
 *                   example: "Message envoyé avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/Message'
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
 */
router.post('/', authenticateToken, validateMessage, sendMessage);

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Récupérer les messages avec pagination
 *     description: Récupère la liste des messages avec pagination et filtres
 *     tags: [Messages]
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
 *         description: Nombre de messages par page
 *     responses:
 *       200:
 *         description: Messages récupérés avec succès
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
 *                     $ref: '#/components/schemas/Message'
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
 *       400:
 *         description: Paramètres de pagination invalides
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
 */
router.get('/', authenticateToken, validatePagination, getMessages);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Récupérer un message spécifique
 *     description: Récupère un message par son ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Message récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Message non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticateToken, getMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Supprimer un message
 *     description: Supprime un message (seul l'auteur peut supprimer ses messages)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du message
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Message supprimé avec succès
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
 *                   example: "Message supprimé avec succès"
 *       401:
 *         description: Token JWT invalide ou manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Accès refusé - vous ne pouvez supprimer que vos propres messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Message non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticateToken, deleteMessage);

export default router;
