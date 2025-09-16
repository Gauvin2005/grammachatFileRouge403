import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';

async function createDefaultAccounts() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si des comptes existent déjà
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('⚠️  Des comptes existent déjà. Suppression des anciens comptes...');
      await User.deleteMany({});
    }

    // Créer les comptes par défaut
    const defaultAccounts = [
      {
        username: 'user1',
        email: 'user1@grammachat.com',
        password: 'password123',
        role: 'user' as const,
        xp: 100
      },
      {
        username: 'user2',
        email: 'user2@grammachat.com',
        password: 'password123',
        role: 'user' as const,
        xp: 250
      },
      {
        username: 'admin',
        email: 'admin@grammachat.com',
        password: 'admin123',
        role: 'admin' as const,
        xp: 1000
      }
    ];

    console.log('🔄 Création des comptes par défaut...');

    for (const account of defaultAccounts) {
      // Créer l'utilisateur (le mot de passe sera hashé automatiquement par le middleware)
      const user = new User({
        username: account.username,
        email: account.email,
        password: account.password,
        role: account.role,
        xp: account.xp
      });

      await user.save();
      console.log(`✅ Compte créé: ${account.username} (${account.role})`);
    }

    console.log('\n🎉 Comptes par défaut créés avec succès !');
    console.log('\n📋 Identifiants de connexion :');
    console.log('┌─────────────┬─────────────────────────┬─────────────┬─────────┐');
    console.log('│ Username    │ Email                   │ Password    │ Role    │');
    console.log('├─────────────┼─────────────────────────┼─────────────┼─────────┤');
    console.log('│ user1       │ user1@grammachat.com    │ password123 │ user    │');
    console.log('│ user2       │ user2@grammachat.com    │ password123 │ user    │');
    console.log('│ admin       │ admin@grammachat.com    │ admin123    │ admin   │');
    console.log('└─────────────┴─────────────────────────┴─────────────┴─────────┘');

  } catch (error) {
    console.error('❌ Erreur lors de la création des comptes:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
createDefaultAccounts();
