#!/usr/bin/env ts-node

/**
 * Script pour créer le premier compte administrateur
 * Usage: npm run create-admin
 */

import mongoose from 'mongoose';
import User from '../src/models/User';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Un administrateur existe déjà:', existingAdmin.email);
      process.exit(0);
    }

    // Créer le compte admin
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@grammachat.com',
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      role: 'admin' as const,
      xp: 0,
      level: 1
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('🎉 Compte administrateur créé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Mot de passe:', adminData.password);
    console.log('⚠️  N\'oubliez pas de changer le mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
};

// Exécuter le script
createAdmin();
