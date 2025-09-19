#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Connexion MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/grammachat';

async function debugAuth() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion MongoDB réussie');

    // Importer le modèle User
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
        match: [/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores']
      },
      password: {
        type: String,
        required: [true, 'Mot de passe requis'],
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
      },
      role: {
        type: String,
        enum: ['user', 'admin'],
        required: true
      },
      xp: {
        type: Number,
        default: 0,
        min: [0, 'XP ne peut pas être négatif']
      },
      level: {
        type: Number,
        default: 1,
        min: [1, 'Le niveau doit être au moins 1']
      }
    }, {
      timestamps: true
    });

    const User = mongoose.model('User', UserSchema);

    // Tester la création d'un utilisateur
    console.log('🧪 Test création utilisateur...');
    
    const testUser = new User({
      email: 'debug@example.com',
      username: 'debuguser',
      password: 'password123',
      role: 'user',
      xp: 0,
      level: 1
    });

    await testUser.save();
    console.log('✅ Utilisateur créé:', testUser._id);

    // Tester la recherche
    console.log('🔍 Test recherche utilisateur...');
    const foundUser = await User.findOne({ email: 'debug@example.com' });
    console.log('✅ Utilisateur trouvé:', foundUser ? foundUser.username : 'Non trouvé');

    // Tester JWT
    console.log('🔐 Test JWT...');
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    console.log('JWT_SECRET défini:', !!jwtSecret);
    
    if (jwtSecret) {
      const token = jwt.sign({ userId: testUser._id.toString() }, jwtSecret, { expiresIn: '7d' });
      console.log('✅ Token généré:', token.substring(0, 50) + '...');
      
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token décodé:', decoded);
    }

    // Nettoyer
    await User.deleteOne({ _id: testUser._id });
    console.log('🧹 Utilisateur de test supprimé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion MongoDB');
  }
}

debugAuth();
