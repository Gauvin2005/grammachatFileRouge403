import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import userRoutes from './routes/users';

// Services
import { redisService } from './services/redisService';

// Middleware
import { apiRateLimit } from './middleware/rateLimiting';

// Swagger
import { setupSwagger } from './config/swagger';

// Charger les variables d'environnement
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());
app.use(compression());

// Rate limiting avec Redis (remplace express-rate-limit)
app.use(apiRateLimit);

// Middleware CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Vérifier l'état de l'API
 *     description: Retourne l'état de santé de l'API avec des informations système
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API fonctionnelle
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
 *                   example: "API Grammachat fonctionnelle"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-01T10:00:00.000Z"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 */
// Route de santé
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Grammachat fonctionnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Configuration Swagger
setupSwagger(app);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion d'erreurs global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur globale:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à MongoDB
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';
    
    await mongoose.connect(mongoURI);
    console.log('Connexion à MongoDB réussie');
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

// Connexion à Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redisService.connect();
    console.log('Connexion à Redis réussie');
  } catch (error) {
    console.error('Erreur de connexion à Redis:', error);
    console.log('Le serveur continue sans Redis (mode dégradé)');
  }
};

// Démarrage du serveur
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Serveur Grammachat démarré sur le port ${PORT}`);
      console.log(`Environnement: ${process.env.NODE_ENV}`);
      console.log(`API disponible sur: http://localhost:${PORT}/api`);
      console.log(`Redis: ${redisService.isRedisConnected() ? 'Connecté' : 'Non connecté'}`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux de fermeture
process.on('SIGTERM', async () => {
  console.log('Signal SIGTERM reçu, fermeture du serveur...');
  try {
    await mongoose.connection.close();
    await redisService.disconnect();
    console.log('Connexions fermées');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('Signal SIGINT reçu, fermeture du serveur...');
  try {
    await mongoose.connection.close();
    await redisService.disconnect();
    console.log('Connexions fermées');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error);
    process.exit(1);
  }
});

// Démarrer le serveur
startServer();

export default app;
