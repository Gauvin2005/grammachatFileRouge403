#  Configuration Docker Personnalisée - Grammachat

##  Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)
```bash
./scripts/start-docker.sh
```

### Option 2 : Configuration Manuelle
```bash
# 1. Configurer l'environnement
cp env.example .env
nano .env  # Éditer vos paramètres

# 2. Démarrer les services
docker-compose up -d mongodb redis

# 3. Démarrer l'API
cd backend && node src/simple-server.js
```

##  Configuration du Fichier .env

###  Sécurité (OBLIGATOIRE)
```bash
# Clé secrète JWT - CHANGEZ EN PRODUCTION !
JWT_SECRET=clé-secrète-très-longue-et-complexe-2025

# Clé API LanguageTool (optionnelle)
LANGUAGETOOL_API_KEY=clé-api-languagetool
```

###  Ports Personnalisables
```bash
# Ports de mon choix
API_PORT=3000          # Port de l'API backend
MONGODB_PORT=27017     # Port de MongoDB
REDIS_PORT=6379        # Port de Redis
```

### 🎮 Gamification Personnalisée
```bash
# Système XP personnalisé
XP_PER_CHARACTER=1           # XP gagné par caractère
XP_BONUS_NO_ERRORS=10        # Bonus XP si aucune erreur
XP_PENALTY_PER_ERROR=5       # Pénalité XP par erreur
LEVEL_UP_THRESHOLD=100       # XP requis pour monter de niveau
```

###  CORS et Notifications
```bash
# Domaines autorisés (ajoutez vos domaines)
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,https://domaine.com

# Token Expo Push (pour les notifications)
EXPO_PUSH_TOKEN=token-expo-push
```

## Scripts Disponibles

### 1. Configuration Automatique
```bash
./scripts/docker-setup.sh
```
- Configure automatiquement tous les paramètres
- Demande vos informations personnelles
- Démarre tous les services

### 2. Démarrage Rapide
```bash
./scripts/start-docker.sh
```
- Démarre MongoDB, Redis et l'API
- Option de démarrer Expo
- Affiche les logs en temps réel

### 3. Configuration Manuelle
```bash
# Éditer le fichier .env
nano .env

# Démarrer les services
docker-compose up -d
```

## 📋 Exemple de Configuration Complète

```bash
# .env personnalisé
API_PORT=3000
MONGODB_PORT=27017
REDIS_PORT=6379

# Sécurité
JWT_SECRET=ma-clé-secrète-super-longue-et-complexe-avec-chiffres-et-symboles-2024
LANGUAGETOOL_API_KEY=abc123def456ghi789

# Gamification
XP_PER_CHARACTER=2
XP_BONUS_NO_ERRORS=20
XP_PENALTY_PER_ERROR=10
LEVEL_UP_THRESHOLD=200

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,https://monapp.com

# Notifications
EXPO_PUSH_TOKEN=ExponentPushToken[abc123def456ghi789]
```

##  Commandes Docker Utiles

### Gestion des Services
```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer services spécifiques
docker-compose up -d mongodb redis

# Redémarrer un service
docker-compose restart api

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### Surveillance
```bash
# Voir les logs
docker-compose logs -f

# Voir le statut
docker-compose ps

# Voir l'utilisation des ressources
docker stats
```

### Maintenance
```bash
# Nettoyer les images inutilisées
docker system prune -f

# Reconstruire l'API
docker-compose build --no-cache api

# Mettre à jour les images
docker-compose pull
```

##  Test de la Configuration

### 1. Test de l'API
```bash
# Health check
curl http://localhost:3000/api/health

# Inscription utilisateur
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test des Services
```bash
# MongoDB
docker exec grammachat-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec grammachat-redis redis-cli ping

# API
curl http://localhost:3000/api/health
```

##  Dépannage

### Problèmes Courants

#### 1. Port déjà utilisé
```bash
# Vérifier les ports
netstat -tulpn | grep :3000

# Changer le port dans .env
API_PORT=3001
```

#### 2. MongoDB ne démarre pas
```bash
# Vérifier les logs
docker-compose logs mongodb

# Redémarrer
docker-compose restart mongodb
```

#### 3. API ne répond pas
```bash
# Vérifier les logs
docker-compose logs api

# Tester
curl http://localhost:3000/api/health
```

#### 4. Erreurs de permissions
```bash
# Corriger les permissions
sudo chown -R $USER:$USER .

# Redémarrer Docker
sudo systemctl restart docker
```

##  Sécurité

### Bonnes Pratiques
1. **Changez toujours le JWT_SECRET** en production
2. **Utilisez des mots de passe forts**
3. **Limitez l'accès aux ports** avec un firewall
4. **Mettez à jour régulièrement** les images Docker
5. **Sauvegardez vos données** régulièrement

### Configuration Sécurisée
```bash
# .env sécurisé pour la production
NODE_ENV=production
JWT_SECRET=clé-très-longue-et-complexe-avec-chiffres-et-symboles-et-majuscules-et-minuscules
MONGODB_URI=mongodb://admin:motdepasse@mongodb:27017/grammachat?authSource=admin
REDIS_PASSWORD=motdepasse-redis-complexe
```

##  Monitoring

### Health Checks
```bash
# Vérifier tous les services
docker-compose ps

# Tester l'API
curl http://localhost:3000/api/health

# Tester MongoDB
docker exec grammachat-mongodb mongosh --eval "db.adminCommand('ping')"

# Tester Redis
docker exec grammachat-redis redis-cli ping
```

### Métriques
```bash
# Utilisation des ressources
docker stats --no-stream

# Espace disque
docker system df

# Taille des images
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

##  Prochaines Étapes

1. **Configurez vos paramètres** dans le fichier `.env`
2. **Lancez le script** `./scripts/start-docker.sh`
3. **Testez l'API** avec les commandes ci-dessus
4. **Démarrez Expo** pour tester l'application mobile
5. **Personnalisez** les paramètres de gamification

---

** Ma configuration Docker est prête !**  
Utilisez `./scripts/start-docker.sh` pour un démarrage automatique ou suivez le guide manuel ci-dessus.
