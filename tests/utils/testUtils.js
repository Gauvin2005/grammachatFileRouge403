#!/usr/bin/env node

/**
 * Utilitaires partagés pour les tests Grammachat
 * Évite la duplication de code entre les différents tests
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration par défaut
const DEFAULT_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TEST_USER: {
    email: 'test@example.com',
    username: 'testuser',
    password: 'TestPassword123!'
  }
};

// Modèle User partagé (copié du backend)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  username: {
    type: String,
    required: [true, 'Nom d\'utilisateur requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères']
  },
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalCharacters: {
    type: Number,
    default: 0
  },
  totalErrors: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);

// Modèle Message partagé
const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Le contenu du message est requis'],
    trim: true,
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  xpEarned: {
    type: Number,
    default: 0
  },
  errorsFound: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', MessageSchema);

/**
 * Classe utilitaire pour les tests
 */
class TestUtils {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isConnected = false;
  }

  /**
   * Connexion à MongoDB
   */
  async connectDB() {
    try {
      if (!this.isConnected) {
        await mongoose.connect(this.config.MONGODB_URI);
        this.isConnected = true;
        console.log('[SUCCESS] Connexion MongoDB réussie');
      }
    } catch (error) {
      console.error('[ERROR] Erreur de connexion MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Déconnexion de MongoDB
   */
  async disconnectDB() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('[SUCCESS] Déconnexion MongoDB réussie');
      }
    } catch (error) {
      console.error('[ERROR] Erreur de déconnexion MongoDB:', error.message);
    }
  }

  /**
   * Nettoyer la base de données
   */
  async cleanDatabase() {
    try {
      await this.connectDB();
      await User.deleteMany({});
      await Message.deleteMany({});
      console.log('[SUCCESS] Base de données nettoyée');
    } catch (error) {
      console.error('[ERROR] Erreur lors du nettoyage:', error.message);
      throw error;
    }
  }

  /**
   * Créer un utilisateur de test
   */
  async createTestUser(userData = {}) {
    try {
      await this.connectDB();
      const user = new User({
        ...this.config.TEST_USER,
        ...userData,
        password: await bcrypt.hash(userData.password || this.config.TEST_USER.password, 10)
      });
      await user.save();
      console.log(`[SUCCESS] Utilisateur créé: ${user.email}`);
      return user;
    } catch (error) {
      console.error('[ERROR] Erreur création utilisateur:', error.message);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur de test
   */
  async deleteTestUser(email) {
    try {
      await this.connectDB();
      await User.deleteOne({ email });
      console.log(`[SUCCESS] Utilisateur supprimé: ${email}`);
    } catch (error) {
      console.error('[ERROR] Erreur suppression utilisateur:', error.message);
      throw error;
    }
  }

  /**
   * Créer un message de test
   */
  async createTestMessage(messageData) {
    try {
      await this.connectDB();
      const message = new Message(messageData);
      await message.save();
      console.log(`[SUCCESS] Message créé: ${message.content.substring(0, 50)}...`);
      return message;
    } catch (error) {
      console.error('[ERROR] Erreur création message:', error.message);
      throw error;
    }
  }

  /**
   * Requête HTTP helper
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.config.API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();
      
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (error) {
      console.error(`[ERROR] Erreur requête ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Authentification helper
   */
  async authenticateUser(email, password) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        return response.data.token;
      } else {
        throw new Error(`Authentification échouée: ${response.data.message}`);
      }
    } catch (error) {
      console.error('[ERROR] Erreur authentification:', error.message);
      throw error;
    }
  }

  /**
   * Logger avec couleurs
   */
  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m',  // Vert
      warning: '\x1b[33m',  // Jaune
      error: '\x1b[31m',   // Rouge
      reset: '\x1b[0m'      // Reset
    };

    const icon = {
      info: '[INFO]',
      success: '[SUCCESS]',
      warning: '[WARNING]',
      error: '[ERROR]'
    };

    console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
  }

  /**
   * Attendre un délai
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Générer des données de test aléatoires
   */
  generateTestData(type) {
    const generators = {
      user: () => ({
        email: `test${Date.now()}@example.com`,
        username: `user${Date.now()}`,
        password: 'TestPassword123!'
      }),
      message: () => ({
        content: `Message de test ${Date.now()}`,
        author: new mongoose.Types.ObjectId()
      })
    };

    return generators[type] ? generators[type]() : {};
  }
}

module.exports = {
  TestUtils,
  User,
  Message,
  DEFAULT_CONFIG
};
