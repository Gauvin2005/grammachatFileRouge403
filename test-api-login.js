const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Copier exactement le modèle User du backend
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
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
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

async function testApiLogin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect('mongodb://mongodb:27017/grammachat');
    console.log('✅ Connecté à MongoDB');

    // Tester la connexion avec user1
    console.log('🔐 Test de connexion API avec user1@grammachat.com...');
    
    const user = await User.findOne({ email: 'user1@grammachat.com' }).select('+password');
    if (!user) {
      console.log('❌ Utilisateur user1 non trouvé');
      return;
    }
    
    console.log('👤 Utilisateur trouvé:', user.username);
    console.log('🔐 Hash du mot de passe:', user.password.substring(0, 20) + '...');
    
    const isValid = await user.comparePassword('password123');
    console.log('✅ Mot de passe valide:', isValid);
    
    if (isValid) {
      console.log('Connexion API devrait fonctionner !');
    } else {
      console.log('❌ Problème avec le mot de passe - connexion API échouera');
      
      // Debug : tester avec différents mots de passe
      console.log('🔍 Test avec différents mots de passe:');
      const passwords = ['password123', 'Password123', 'PASSWORD123', 'password', 'admin123'];
      
      for (const pwd of passwords) {
        const testResult = await user.comparePassword(pwd);
        console.log(`  "${pwd}": ${testResult ? '✅' : '❌'}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
testApiLogin();
