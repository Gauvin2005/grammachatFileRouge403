# Guide de Déploiement Grammachat - Serveur Local

Ce guide vous explique comment déployer votre application Grammachat sur un serveur Linux local avec déploiement automatique via webhooks GitHub.

## Prérequis

- Serveur Linux (Ubuntu/Debian recommandé)
- Accès root ou sudo
- Connexion Internet
- Domaine ou IP statique (recommandé) -> 10.6.0.7

## 🛠️ Installation Initiale

### 1. Préparation du Serveur

```bash
# Cloner le repository sur votre serveur
git clone https://github.com/Gauvin2005/grammachatFileRouge403.git /opt/grammachat/grammachatFileRouge403
cd /opt/grammachat/grammachatFileRouge403

# Rendre les scripts exécutables
chmod +x deploy-scripts/*.sh
chmod +x deploy-scripts/*.js

# Exécuter le script de configuration initiale
sudo ./deploy-scripts/setup-server.sh
```

### 2. Configuration des Variables d'Environnement

```bash
# Copier le fichier d'environnement
cp deploy-scripts/env.production /opt/grammachat/grammachatFileRouge403/.env

# Éditer les variables importantes
nano /opt/grammachat/grammachatFileRouge403/.env
```

**Variables importantes à modifier :**
- `JWT_SECRET` : Secret JWT sécurisé
- `LANGUAGETOOL_API_KEY` : Clé API LanguageTool
- `EXPO_PUSH_TOKEN` : Token Expo pour les notifications

### 3. Configuration du Webhook GitHub

```bash
# Modifier le secret webhook
nano /opt/grammachat/grammachatFileRouge403/deploy-scripts/webhook-server.js
# Changer la ligne : const SECRET = 'your-webhook-secret-change-this';

# Modifier la configuration PM2
nano /opt/grammachat/grammachatFileRouge403/deploy-scripts/pm2-ecosystem.config.js
# Changer : GITHUB_WEBHOOK_SECRET: 'your-webhook-secret-change-this'
```

## Configuration GitHub

### 1. Ajouter les Secrets GitHub

Dans votre repository GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez :

```
DEV_DEPLOY_WEBHOOK = http://10.6.0.7:9000/webhook
PROD_DEPLOY_WEBHOOK = http://10.6.0.7:9000/webhook
DOCKER_USERNAME = votre_username_dockerhub
DOCKER_PASSWORD = votre_password_dockerhub
SNYK_TOKEN = votre_token_snyk
SLACK_WEBHOOK = votre_webhook_slack (optionnel)
```

### 2. Configuration du Webhook GitHub

Dans **Settings > Webhooks** de votre repository :

- **Payload URL** : `http://10.6.0.7:9000/webhook`
- **Content type** : `application/json`
- **Secret** : Le même secret que dans votre configuration serveur
- **Events** : Sélectionner "Just the push event"

## Déploiement Manuel

### Premier Déploiement

```bash
# Se connecter en tant qu'utilisateur grammachat
sudo su - grammachat

# Aller dans le répertoire de l'application
cd /opt/grammachat/grammachatFileRouge403

# Exécuter le script de déploiement
./deploy-scripts/deploy.sh
```

### Déploiement via Webhook

```bash
# Tester le webhook manuellement
curl -X POST http://localhost:9000/deploy \
  -H "Content-Type: application/json" \
  -d '{"branch": "main", "environment": "production"}'
```

## Monitoring et Gestion

### Commandes Utiles

```bash
# Status des services
systemctl status grammachat-webhook
sudo -u grammachat pm2 status

# Logs en temps réel
journalctl -u grammachat-webhook -f
sudo -u grammachat pm2 logs

# Redémarrage des services
systemctl restart grammachat-webhook
sudo -u grammachat pm2 restart all

# Maintenance
/opt/grammachat/maintenance.sh
```

### URLs d'Accès

- **API Backend** : `http://10.6.0.7:3000`
- **Frontend** : `http://10.6.0.7:8082`
- **Webhook** : `http://10.6.0.7:9000/webhook`
- **Health Check** : `http://10.6.0.7:9000/health`

## Sécurité

### Configuration SSL (Optionnel)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d your-domain.com

# Le certificat sera automatiquement renouvelé
```

### Pare-feu

Le script configure automatiquement UFW avec les ports nécessaires :
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (API)
- 8082 (Frontend)
- 9000 (Webhook)

## Dépannage

### Problèmes Courants

1. **Service webhook ne démarre pas**
   ```bash
   journalctl -u grammachat-webhook -f
   ```

2. **Erreur de permissions**
   ```bash
   sudo chown -R grammachat:grammachat /opt/grammachat
   ```

3. **Port déjà utilisé**
   ```bash
   sudo netstat -tlnp | grep :9000
   sudo kill -9 PID
   ```

4. **Problème de build**
   ```bash
   cd /opt/grammachat/backend
   sudo -u grammachat npm ci
   sudo -u grammachat npm run build
   ```

### Logs Importants

- **Webhook** : `/var/log/grammachat/webhook-*.log`
- **API** : `/var/log/grammachat/api-*.log`
- **Frontend** : `/var/log/grammachat/frontend-*.log`
- **Nginx** : `/var/log/nginx/grammachat_*.log`
- **Systemd** : `journalctl -u grammachat-webhook`

## Optimisations

### Performance

- **PM2 Cluster** : L'API utilise 2 instances en mode cluster
- **Nginx Caching** : Cache des assets statiques
- **Docker** : Services MongoDB/Redis containerisés

### Monitoring

- **Logs rotatifs** : Configuration automatique avec logrotate
- **Maintenance automatique** : Cron job quotidien à 2h
- **Health checks** : Endpoints de santé pour tous les services

## Mise à Jour

### Mise à jour du code

Le déploiement automatique se fait via GitHub Actions + webhook. Pour une mise à jour manuelle :

```bash
cd /opt/grammachat/grammachatFileRouge403
sudo -u grammachat git pull origin main
./deploy-scripts/deploy.sh
```

### Mise à jour des scripts

```bash
cd /opt/grammachat/grammachatFileRouge403
sudo -u grammachat git pull origin main
sudo chmod +x deploy-scripts/*.sh
sudo chmod +x deploy-scripts/*.js
```

## Support

En cas de problème :

1. Vérifier les logs
2. Tester les endpoints de santé
3. Vérifier la configuration des services
4. Consulter la documentation GitHub Actions

---

