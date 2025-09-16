const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function testPassword() {
  try {
    await mongoose.connect('mongodb://mongodb:27017/grammachat');
    console.log('✅ Connecté à MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String
    }));
    
    const user = await User.findOne({email: 'user1@grammachat.com'}).select('+password');
    console.log('👤 Utilisateur trouvé:', !!user);
    
    if (user) {
      console.log('🔐 Hash du mot de passe:', user.password.substring(0, 20) + '...');
      const isValid = await bcrypt.compare('password123', user.password);
      console.log('✅ Mot de passe valide:', isValid);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testPassword();
