# 🧪 Guide de Test - Grammachat

## 🚀 Services Démarrés

✅ **MongoDB** : `localhost:27017` (Docker)  
✅ **Redis** : `localhost:6379` (Docker)  
✅ **API Backend** : `localhost:3000` (Node.js)  
🔄 **Frontend Expo** : En cours de démarrage...

## 📱 Test de l'Application Mobile

### 1. Installer Expo Go
- **Android** : [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS** : [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Scanner le QR Code
Une fois Expo démarré, scannez le QR code affiché dans le terminal avec :
- **Android** : Expo Go app
- **iOS** : Appareil photo iOS

### 3. Tester les Fonctionnalités
- **Inscription** : Créez un nouveau compte
- **Connexion** : Connectez-vous avec vos identifiants
- **Chat** : Envoyez des messages et gagnez de l'XP
- **Profil** : Consultez vos statistiques
- **Classement** : Voyez votre position

## 🔧 Test de l'API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Inscription Utilisateur
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Envoi de Message
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Bonjour, ceci est un test !","senderId":"USER_ID"}'
```

### Récupération des Messages
```bash
curl http://localhost:3000/api/messages
```

### Classement
```bash
curl http://localhost:3000/api/users/leaderboard
```

## 🎮 Fonctionnalités à Tester

### ✅ MVP Fonctionnel
- [x] **Authentification** : Inscription/Connexion
- [x] **Messagerie** : Envoi de messages texte
- [x] **Gamification** : Calcul d'XP (1 point par caractère)
- [x] **Profil** : Affichage des statistiques utilisateur
- [x] **Classement** : Liste des utilisateurs par XP
- [x] **Base de données** : Persistance MongoDB
- [x] **Cache** : Redis pour les sessions

### 🔄 En Cours de Développement
- [ ] **Vérification orthographique** : LanguageTool API
- [ ] **Notifications push** : Expo Notifications
- [ ] **Interface mobile** : Écrans React Native
- [ ] **Authentification JWT** : Tokens sécurisés
- [ ] **Validation avancée** : Contrôles de sécurité

## 📊 Données de Test

### Utilisateur Créé
- **Email** : test@example.com
- **Username** : testuser
- **XP** : 38 points
- **Niveau** : 1
- **Messages** : 1

### Message Envoyé
- **Contenu** : "Bonjour, ceci est un test de message !"
- **XP Gagné** : 38 points (nombre de caractères)
- **Timestamp** : 2025-09-08T14:35:31.017Z

## 🐛 Dépannage

### API ne répond pas
```bash
# Vérifier le processus
ps aux | grep "node src/simple-server.js"

# Redémarrer si nécessaire
cd backend && node src/simple-server.js
```

### MongoDB inaccessible
```bash
# Vérifier le conteneur
docker-compose ps mongodb

# Redémarrer si nécessaire
docker-compose restart mongodb
```

### Expo ne démarre pas
```bash
# Installer Expo CLI
npm install -g @expo/cli

# Redémarrer Expo
cd frontend && npm start
```

## 🎯 Prochaines Étapes

1. **Tester l'interface mobile** avec Expo Go
2. **Implémenter la vérification orthographique** avec LanguageTool
3. **Ajouter l'authentification JWT** pour la sécurité
4. **Développer les écrans React Native** complets
5. **Ajouter les notifications push**

## 📞 Support

En cas de problème :
- Vérifiez les logs : `docker-compose logs`
- Consultez la documentation : `docs/`
- Vérifiez les prérequis : Node.js 18+, Docker, Expo CLI

---

**🎉 Grammachat MVP est opérationnel !**  
Testez l'application et donnez votre feedback pour les améliorations.
