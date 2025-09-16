const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schéma User simplifié pour le test
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Middleware pour hasher le mot de passe avant sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

async function createTestUsers() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://mongodb:27017/grammachat');
    console.log('✅ Connecté à MongoDB');

    // Supprimer tous les utilisateurs existants
    await User.deleteMany({});
    console.log('🗑️ Anciens utilisateurs supprimés');

    // Créer les utilisateurs de test
    const users = [
      {
        username: 'user1',
        email: 'user1@grammachat.com',
        password: 'password123',
        role: 'user',
        xp: 100
      },
      {
        username: 'user2',
        email: 'user2@grammachat.com',
        password: 'password123',
        role: 'user',
        xp: 250
      },
      {
        username: 'admin',
        email: 'admin@grammachat.com',
        password: 'admin123',
        role: 'admin',
        xp: 1000
      }
    ];

    console.log('🔄 Création des utilisateurs de test...');

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Utilisateur créé: ${userData.username} (${userData.role})`);
      
      // Tester immédiatement le mot de passe
      const testUser = await User.findOne({ email: userData.email }).select('+password');
      const isValid = await testUser.comparePassword(userData.password);
      console.log(`🔐 Test mot de passe pour ${userData.username}: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
    }

    console.log('\n🎉 Utilisateurs de test créés avec succès !');
    console.log('\n📋 Identifiants de connexion :');
    console.log('┌─────────────┬─────────────────────────┬─────────────┬─────────┐');
    console.log('│ Username    │ Email                   │ Password    │ Role    │');
    console.log('├─────────────┼─────────────────────────┼─────────────┼─────────┤');
    console.log('│ user1       │ user1@grammachat.com    │ password123 │ user    │');
    console.log('│ user2       │ user2@grammachat.com    │ password123 │ user    │');
    console.log('│ admin       │ admin@grammachat.com    │ admin123    │ admin   │');
    console.log('└─────────────┴─────────────────────────┴─────────────┴─────────┘');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
createTestUsers();
