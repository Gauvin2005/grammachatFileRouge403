# 🐳 Configuration Docker Personnalisée - Grammachat

## 🚀 Démarrage Rapide

### Option 1 : Configuration Automatique (Recommandée)
```bash
./scripts/docker-setup.sh
```

### Option 2 : Configuration Manuelle
```bash
# 1. Copier le fichier d'environnement
cp env.example .env

# 2. Éditer vos paramètres
nano .env

# 3. Démarrer Docker
docker-compose up -d
```

## ⚙️ Configuration du Fichier .env

### 🔐 Sécurité
```bash
# Clé secrète JWT (OBLIGATOIRE - changez en production)
JWT_SECRET=clé-secrète-très-longue-et-complexe

# Clé API LanguageTool (optionnelle)
LANGUAGETOOL_API_KEY=clé-api-languagetool
```

### 🔌 Ports
```bash
# Ports personnalisables
API_PORT=3000          # Port de l'API backend
MONGODB_PORT=27017     # Port de MongoDB
REDIS_PORT=6379        # Port de Redis
```

### 🎮 Gamification
```bash
# Configuration du système XP
XP_PER_CHARACTER=1           # XP gagné par caractère
XP_BONUS_NO_ERRORS=10        # Bonus XP si aucune erreur
XP_PENALTY_PER_ERROR=5       # Pénalité XP par erreur
LEVEL_UP_THRESHOLD=100       # XP requis pour monter de niveau
```

### 🌐 CORS et Notifications
```bash
# Origines autorisées (ajoutez vos domaines)
CORS_ORIGIN=http://localhost:3000,http://localhost:19006,https://domaine.com

# Token Expo Push (pour les notifications)
EXPO_PUSH_TOKEN=token-expo-push
```

## 🛠️ Commandes Docker Utiles

### Gestion des Services
```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d mongodb redis

# Redémarrer un service
docker-compose restart api

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### Surveillance et Logs
```bash
# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f api

# Voir le statut des services
docker-compose ps

# Voir l'utilisation des ressources
docker stats
```

### Maintenance
```bash
# Nettoyer les images inutilisées
docker system prune -f

# Nettoyer tout (images, volumes, réseaux)
docker system prune -a --volumes

# Reconstruire l'API
docker-compose build --no-cache api

# Mettre à jour les images
docker-compose pull
```

## 🔧 Configuration Avancée

### Variables d'Environnement Personnalisées
```bash
# Ajoutez dans votre .env
NODE_ENV=production
LOG_LEVEL=debug
DEBUG=grammachat:*

# Configuration MongoDB avancée
MONGODB_URI=mongodb://mongodb:27017/grammachat
MONGODB_DATABASE=grammachat

# Configuration Redis avancée
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=mot-de-passe-redis
```

### Volumes Personnalisés
```yaml
# Dans docker-compose.yml
volumes:
  mongodb_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /chemin/vers/vos/donnees
```

### Réseaux Personnalisés
```yaml
# Dans docker-compose.yml
networks:
  grammachat-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## 🐛 Dépannage

### Problèmes Courants

#### 1. Port déjà utilisé
```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :3000

# Changer le port dans .env
API_PORT=3001
```

#### 2. MongoDB ne démarre pas
```bash
# Vérifier les logs
docker-compose logs mongodb

# Redémarrer MongoDB
docker-compose restart mongodb

# Supprimer les données et redémarrer
docker-compose down -v
docker-compose up -d
```

#### 3. API ne répond pas
```bash
# Vérifier les logs
docker-compose logs api

# Vérifier la santé de l'API
curl http://localhost:3000/api/health

# Redémarrer l'API
docker-compose restart api
```

#### 4. Erreurs de permissions
```bash
# Corriger les permissions
sudo chown -R $USER:$USER .

# Redémarrer Docker
sudo systemctl restart docker
```

### Logs Détaillés
```bash
# Logs avec timestamps
docker-compose logs -f -t

# Logs des 100 dernières lignes
docker-compose logs --tail=100 api

# Logs depuis une date spécifique
docker-compose logs --since="2024-01-01T00:00:00" api
```

## 📊 Monitoring

### Health Checks
```bash
# Vérifier la santé de tous les services
docker-compose ps

# Tester l'API
curl http://localhost:3000/api/health

# Tester MongoDB
docker exec grammachat-mongodb mongosh --eval "db.adminCommand('ping')"

# Tester Redis
docker exec grammachat-redis redis-cli ping
```

### Métriques de Performance
```bash
# Utilisation des ressources
docker stats --no-stream

# Espace disque utilisé
docker system df

# Taille des images
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

## 🔒 Sécurité

### Bonnes Pratiques
1. **Changez toujours le JWT_SECRET** en production
2. **Utilisez des mots de passe forts** pour MongoDB et Redis
3. **Limitez l'accès aux ports** avec un firewall
4. **Mettez à jour régulièrement** les images Docker
5. **Sauvegardez vos données** régulièrement

### Configuration Sécurisée
```bash
# .env sécurisé pour la production
NODE_ENV=production
JWT_SECRET=clé-très-longue-et-complexe-avec-chiffres-et-symboles
MONGODB_URI=mongodb://admin:motdepasse@mongodb:27017/grammachat?authSource=admin
REDIS_PASSWORD=motdepasse-redis-complexe
```

## 📚 Ressources Supplémentaires

- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation MongoDB Docker](https://hub.docker.com/_/mongo)
- [Documentation Redis Docker](https://hub.docker.com/_/redis)
- [Guide de sécurité Docker](https://docs.docker.com/engine/security/)

---

**🎉 Votre configuration Docker est prête !**  
Utilisez `./scripts/docker-setup.sh` pour une configuration automatique ou suivez le guide manuel ci-dessus.
