# Guide d'Installation - Grammachat

## 📋 Prérequis

### Système
- **Node.js** : Version 18 ou supérieure (pour Express.js)
- **npm** : Version 8 ou supérieure
- **Docker** : Version 20.10 ou supérieure
- **Docker Compose** : Version 2.0 ou supérieure
- **Git** : Version 2.30 ou supérieure

### Plateformes supportées
- **Linux** : Ubuntu 20.04+, CentOS 8+, Debian 11+
- **macOS** : Version 10.15+
- **Windows** : Windows 10/11 avec WSL2

## 🚀 Installation Rapide

### 1. Cloner le projet
```bash
git clone <repository-url>
cd grammachat
```

### 2. Configuration de l'environnement
```bash
# Copier le fichier d'environnement
cp env.example .env

# Éditer les variables d'environnement
nano .env
```

### 3. Lancement avec Docker (Recommandé)
```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier que les services sont démarrés
docker-compose ps
```

### 4. Installation des dépendances frontend
```bash
cd frontend
npm install
```

### 5. Démarrage de l'application mobile
```bash
# Démarrer Expo
npm start

# Ou pour Android
npm run android

# Ou pour iOS
npm run ios
```

## 🔧 Installation Détaillée

### Backend (API Express.js)

#### 1. Installation des dépendances
```bash
cd backend
npm install
```

#### 2. Configuration de la base de données
```bash
# Démarrer MongoDB avec Docker
docker run -d \
  --name grammachat-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Ou utiliser MongoDB local
# Assurez-vous que MongoDB est installé et démarré
```

#### 3. Variables d'environnement Backend
```bash
# Créer le fichier .env dans le dossier backend
cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/grammachat
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_API_KEY=your-languagetool-api-key
XP_PER_CHARACTER=1
XP_BONUS_NO_ERRORS=10
XP_PENALTY_PER_ERROR=5
LEVEL_UP_THRESHOLD=100
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
EOF
```

#### 4. Compilation et démarrage
```bash
# Compiler TypeScript
npm run build

# Démarrer en mode développement
npm run dev

# Ou démarrer en mode production
npm start
```

### Frontend (React Native/Expo)

#### 1. Installation des dépendances
```bash
cd frontend
npm install
```

#### 2. Configuration Expo
```bash
# Installer Expo CLI globalement
npm install -g @expo/cli

# Vérifier l'installation
expo --version
```

#### 3. Configuration de l'application
```bash
# Créer le fichier app.config.js si nécessaire
# Les configurations sont dans app.json
```

#### 4. Démarrage de l'application
```bash
# Mode développement
npm start

# Build pour Android
npm run build:android

# Build pour iOS
npm run build:ios
```

## 🐳 Installation avec Docker

### Docker Compose (Recommandé)

#### 1. Configuration complète
```bash
# Le fichier docker-compose.yml est déjà configuré
# Il inclut :
# - API Express.js
# - MongoDB
# - Redis (pour le cache)

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

#### 2. Services inclus
- **API** : Port 3000
- **MongoDB** : Port 27017
- **Redis** : Port 6379

#### 3. Gestion des volumes
```bash
# Les données sont persistées dans des volumes Docker
# MongoDB : grammachat_mongodb_data
# Redis : grammachat_redis_data

# Sauvegarder les données
docker run --rm -v grammachat_mongodb_data:/data -v $(pwd):/backup mongo:7.0 tar czf /backup/mongodb-backup.tar.gz /data
```

### Docker individuel

#### Backend
```bash
cd backend
docker build -t grammachat-backend .
docker run -p 3000:3000 grammachat-backend
```

#### Frontend
```bash
cd frontend
docker build -t grammachat-frontend .
docker run -p 19006:19006 grammachat-frontend
```

## 🔍 Vérification de l'Installation

### 1. Vérifier les services
```bash
# Vérifier que l'API répond
curl http://localhost:3000/api/health

# Vérifier MongoDB
docker exec grammachat-mongodb mongosh --eval "db.adminCommand('ping')"

# Vérifier Redis
docker exec grammachat-redis redis-cli ping
```

### 2. Tests automatisés
```bash
# Tests Backend
cd backend && npm test

# Tests Frontend
cd frontend && npm test

# Tests d'intégration
cd tests/automation && node run-tests.js
```

### 3. Vérification de l'interface
- Ouvrir l'application mobile sur l'émulateur ou l'appareil
- Vérifier que l'écran de connexion s'affiche
- Tester l'inscription d'un nouvel utilisateur

## 🛠️ Dépannage

### Problèmes courants

#### 1. Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :3000
netstat -tulpn | grep :27017

# Arrêter les processus
sudo kill -9 <PID>
```

#### 2. Erreurs de permissions Docker
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Problèmes de dépendances Express.js
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

#### 4. Problèmes Expo
```bash
# Nettoyer le cache Expo
expo r -c

# Réinstaller les dépendances
rm -rf node_modules
npm install
```

#### 5. Problèmes MongoDB
```bash
# Redémarrer MongoDB
docker restart grammachat-mongodb

# Vérifier les logs
docker logs grammachat-mongodb
```

### Logs et Debug

#### Backend
```bash
# Logs en temps réel
docker-compose logs -f api

# Logs avec plus de détails
NODE_ENV=development npm run dev
```

#### Frontend
```bash
# Logs Expo
expo logs

# Debug React Native
npx react-native log-android  # Android
npx react-native log-ios       # iOS
```

## 📱 Configuration des Appareils

### Android
1. Activer le mode développeur
2. Activer le débogage USB
3. Installer l'application Expo Go
4. Scanner le QR code affiché par `expo start`

### iOS
1. Installer l'application Expo Go depuis l'App Store
2. Scanner le QR code affiché par `expo start`
3. Ou utiliser le simulateur iOS avec `expo start --ios`

## 🔐 Configuration de Sécurité

### Variables d'environnement sensibles
```bash
# Ne jamais commiter ces fichiers
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
echo "*.env.local" >> .gitignore
```

### Clés API
- **LanguageTool** : Obtenir une clé API sur [languagetool.org](https://languagetool.org/api-access)
- **Expo** : Configurer les tokens push dans le dashboard Expo
- **JWT** : Utiliser une clé secrète forte en production

## 📊 Monitoring

### Health Checks
```bash
# API Health
curl http://localhost:3000/api/health

# MongoDB Health
docker exec grammachat-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis Health
docker exec grammachat-redis redis-cli ping
```

### Métriques
- **API** : Disponible sur `/api/metrics`
- **MongoDB** : Utiliser MongoDB Compass ou mongosh
- **Redis** : Utiliser redis-cli ou RedisInsight

## 🚀 Prochaines Étapes

Après l'installation réussie :

1. **Configuration** : Consulter [Configuration](configuration.md)
2. **Développement** : Suivre le [Guide de Développement](development.md)
3. **API** : Explorer la [Documentation API](api/README.md)
4. **Déploiement** : Consulter le [Guide de Déploiement](deployment.md)

## 📞 Support

En cas de problème :
1. Consulter les [FAQ](faq.md)
2. Vérifier les [Issues GitHub](https://github.com/grammachat/issues)
3. Contacter l'équipe de développement
