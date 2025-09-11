import mongoose from 'mongoose';
import User from '../src/models/User';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';

async function checkUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const users = await User.find({}).select('username email role');
    
    console.log('\n📋 Utilisateurs dans la base de données :');
    console.log('┌─────────────┬─────────────────────────┬─────────┐');
    console.log('│ Username    │ Email                   │ Role    │');
    console.log('├─────────────┼─────────────────────────┼─────────┤');
    
    users.forEach(user => {
      console.log(`│ ${user.username.padEnd(11)} │ ${user.email.padEnd(23)} │ ${user.role.padEnd(7)} │`);
    });
    
    console.log('└─────────────┴─────────────────────────┴─────────┘');
    console.log(`\nTotal: ${users.length} utilisateurs`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
checkUsers();
