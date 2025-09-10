const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/grammachat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connexion à MongoDB réussie');
}).catch(err => {
  console.error('❌ Erreur de connexion à MongoDB:', err);
});

// Modèle User simplifié
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  role: { type: String, default: 'user' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Modèle Message simplifié
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  xpEarned: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Grammachat fonctionnelle',
    timestamp: new Date().toISOString(),
    environment: 'development',
    version: '1.0.0'
  });
});

// Route d'inscription
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    const user = new User({ email, username, password });
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          xp: user.xp,
          level: user.level
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
});

// Route de connexion
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          xp: user.xp,
          level: user.level
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
});

// Route d'envoi de message
app.post('/api/messages', async (req, res) => {
  try {
    const { content, senderId } = req.body;
    
    // Calcul XP simple (1 point par caractère)
    const xpEarned = Math.floor(content.length);
    
    const message = new Message({ 
      senderId, 
      content, 
      xpEarned 
    });
    await message.save();
    
    // Mettre à jour l'XP de l'utilisateur
    await User.findByIdAndUpdate(senderId, { 
      $inc: { xp: xpEarned },
      $set: { level: Math.floor(xpEarned / 100) + 1 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: {
        message: {
          id: message._id,
          content: message.content,
          xpEarned: message.xpEarned,
          timestamp: message.timestamp
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
});

// Route pour récupérer les messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('senderId', 'username email')
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json({
      success: true,
      message: 'Messages récupérés avec succès',
      data: {
        data: messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          xpEarned: msg.xpEarned,
          timestamp: msg.timestamp,
          sender: {
            id: msg.senderId._id,
            username: msg.senderId.username,
            email: msg.senderId.email
          }
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
});

// Route pour le classement
app.get('/api/users/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 })
      .limit(10)
      .select('username xp level');
    
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      xp: user.xp,
      level: user.level
    }));
    
    res.json({
      success: true,
      message: 'Classement récupéré avec succès',
      data: { leaderboard }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du classement',
      error: error.message
    });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Grammachat démarré sur le port ${PORT}`);
  console.log(`📱 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
