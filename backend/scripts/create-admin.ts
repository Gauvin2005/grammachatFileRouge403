#!/usr/bin/env ts-node

/**
 * Script pour créer le premier compte administrateur
 * Usage: npm run create-admin
 * 
 * Ce script crée un compte administrateur avec les informations
 * fournies dans les variables d'environnement ou utilise des valeurs par défaut.
 * 
 * Variables d'environnement requises :
 * - ADMIN_EMAIL : Email de l'administrateur
 * - ADMIN_USERNAME : Nom d'utilisateur de l'administrateur  
 * - ADMIN_PASSWORD : Mot de passe de l'administrateur
 * - MONGODB_URI : URI de connexion MongoDB
 * - JWT_SECRET : Clé secrète pour JWT (optionnel pour ce script)
 */

import mongoose from 'mongoose';
import User from '../src/models/User';
import { config } from 'dotenv';
import { generateToken } from '../src/middleware/auth';

// Charger les variables d'environnement
config();

interface AdminCreationResult {
  success: boolean;
  admin?: any;
  token?: string;
  error?: string;
}

const createAdmin = async (): Promise<AdminCreationResult> => {
  try {
    // Vérifier les variables d'environnement requises
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@grammachat.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    console.log('Configuration:');
    console.log(`   MongoDB URI: ${mongoUri}`);
    console.log(`   Admin Email: ${adminEmail}`);
    console.log(`   Admin Username: ${adminUsername}`);
    console.log(`   Admin Password: ${adminPassword ? '[CONFIGURÉ]' : '[DÉFAUT]'}`);

    // Connexion à MongoDB
    console.log('\nConnexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connecté à MongoDB avec succès');

    // Vérifier si un admin existe déjà
    console.log('\nVérification des administrateurs existants...');
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ATTENTION: Un administrateur existe déjà:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Créé le: ${existingAdmin.createdAt}`);
      
      // Demander confirmation pour continuer
      const shouldContinue = process.argv.includes('--force');
      if (!shouldContinue) {
        console.log('\nPour forcer la création, utilisez: npm run create-admin -- --force');
        return { success: false, error: 'Administrateur déjà existant' };
      }
      console.log('Mode force activé, création d\'un nouvel administrateur...');
    }

    // Vérifier si l'email ou username existe déjà
    const existingUser = await User.findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }]
    });

    if (existingUser) {
      const conflict = existingUser.email === adminEmail ? 'email' : 'nom d\'utilisateur';
      console.log(`Erreur: Un utilisateur avec ce ${conflict} existe déjà`);
      return { success: false, error: `Conflit de ${conflict}` };
    }

    // Créer le compte admin
    console.log('\nCréation du compte administrateur...');
    const adminData = {
      email: adminEmail,
      username: adminUsername,
      password: adminPassword,
      role: 'admin' as const,
      xp: 0,
      level: 1
    };

    const admin = new User(adminData);
    await admin.save();

    // Générer un token JWT pour l'admin
    let token: string | undefined;
    try {
      token = generateToken(admin._id?.toString() || '');
      console.log('Token JWT généré avec succès');
    } catch (tokenError) {
      console.log('Impossible de générer le token JWT (JWT_SECRET manquant)');
    }

    console.log('\nSUCCÈS: Compte administrateur créé avec succès !');
    console.log('Informations du compte:');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Rôle: ${admin.role}`);
    console.log(`   XP: ${admin.xp}`);
    console.log(`   Niveau: ${admin.level}`);
    console.log(`   Créé le: ${admin.createdAt}`);

    if (token) {
      console.log('\nToken JWT (pour tests):');
      console.log(`   ${token}`);
    }

    console.log('\nSÉCURITÉ:');
    console.log('   1. Changez le mot de passe après la première connexion');
    console.log('   2. Ne partagez jamais les identifiants');
    console.log('   3. Utilisez un mot de passe fort en production');
    console.log('   4. Activez l\'authentification à deux facteurs si possible');

    return { success: true, admin, token };

  } catch (error) {
    console.error('\nErreur lors de la création de l\'administrateur:');
    console.error(error);
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  } finally {
    await mongoose.disconnect();
    console.log('\nDéconnecté de MongoDB');
  }
};

// Fonction pour afficher l'aide
const showHelp = () => {
  console.log(`
Script de création d'administrateur - Grammachat

Usage:
  npm run create-admin [options]

Options:
  --force     Forcer la création même si un admin existe déjà
  --help      Afficher cette aide

Variables d'environnement:
  ADMIN_EMAIL      Email de l'administrateur (défaut: admin@grammachat.com)
  ADMIN_USERNAME   Nom d'utilisateur (défaut: admin)
  ADMIN_PASSWORD   Mot de passe (défaut: admin123456)
  MONGODB_URI      URI MongoDB (défaut: mongodb://localhost:27017/grammachat)
  JWT_SECRET       Clé secrète JWT (optionnel)

Exemples:
  npm run create-admin
  npm run create-admin -- --force
  ADMIN_EMAIL=admin@example.com npm run create-admin

Sécurité:
  - Changez le mot de passe après la première connexion
  - Utilisez des variables d'environnement en production
  - Ne commitez jamais les mots de passe
`);
};

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Exécuter le script
createAdmin()
  .then((result) => {
    if (result.success) {
      console.log('\nScript terminé avec succès');
      process.exit(0);
    } else {
      console.log(`\nScript échoué: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\nErreur fatale:', error);
    process.exit(1);
  });
