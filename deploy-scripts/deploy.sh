#!/bin/bash

# Script de déploiement automatique pour Grammachat
# ================================================

set -e  # Arrêter en cas d'erreur

# Configuration
APP_DIR="/opt/grammachat/grammachatFileRouge403"
BACKUP_DIR="/opt/grammachat/grammachatFileRouge403/backups"
LOG_FILE="/var/log/grammachat/deploy.log"
USER="grammachat"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Créer les répertoires nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "Début du déploiement Grammachat"

# 1. Sauvegarde de l'ancienne version
if [ -d "$APP_DIR/backend" ]; then
    log "Sauvegarde de l'ancienne version..."
    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    # Exclure le dossier backups de la sauvegarde pour éviter la récursion
    rsync -av --exclude='backups' "$APP_DIR/" "$BACKUP_DIR/$BACKUP_NAME/"
    log "Sauvegarde créée: $BACKUP_NAME"
fi

# 2. Arrêt des services
log "Arrêt des services..."
sudo systemctl stop grammachat-api || true
sudo systemctl stop grammachat-frontend || true
pm2 stop grammachat-api || true
pm2 stop grammachat-frontend || true

# 3. Mise à jour du code depuis GitHub
log "Récupération du code depuis GitHub..."
cd "$APP_DIR"
sudo -u "$USER" git fetch origin
sudo -u "$USER" git reset --hard origin/main

# 4. Installation des dépendances Backend
log "Installation des dépendances Backend..."
cd "$APP_DIR/backend"
sudo -u "$USER" npm ci --production

# 5. Build du Backend
log "Build du Backend..."
sudo -u "$USER" npm run build

# 6. Installation des dépendances Frontend
log "Installation des dépendances Frontend..."
cd "$APP_DIR/frontend"
sudo -u "$USER" npm ci

# 7. Build du Frontend (Expo)
log "Build du Frontend..."
sudo -u "$USER" npx expo export --platform web

# 8. Démarrage des services avec PM2
log "Démarrage des services..."

# Configuration PM2 pour le Backend
cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'grammachat-api',
      script: './backend/dist/server.js',
      cwd: '/opt/grammachat/grammachatFileRouge403',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/grammachat/api-error.log',
      out_file: '/var/log/grammachat/api-out.log',
      log_file: '/var/log/grammachat/api-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'grammachat-frontend',
      script: 'npx',
      args: 'serve -s frontend/dist -l 8082',
      cwd: '/opt/grammachat/grammachatFileRouge403',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 8082
      },
      error_file: '/var/log/grammachat/frontend-error.log',
      out_file: '/var/log/grammachat/frontend-out.log',
      log_file: '/var/log/grammachat/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# Démarrage avec PM2
pm2 start "$APP_DIR/ecosystem.config.js"
pm2 save
pm2 startup

# 9. Redémarrage des services Docker
log "Redémarrage des services Docker..."
cd "$APP_DIR"
sudo -u "$USER" docker-compose down
sudo -u "$USER" docker-compose up -d

# 10. Attendre que les services soient prêts
log "Attente du démarrage des services..."
sleep 30

# 11. Vérification de la santé des services
log "Vérification de la santé des services..."

# Vérifier l'API
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "API Backend opérationnelle"
else
    error "API Backend non accessible"
    exit 1
fi

# Vérifier le Frontend
if curl -f http://localhost:8082 > /dev/null 2>&1; then
    log "Frontend opérationnel"
else
    error "Frontend non accessible"
    exit 1
fi

# 12. Redémarrage de Nginx
log "Redémarrage de Nginx..."
sudo systemctl reload nginx

log "Déploiement terminé avec succès!"
log "API disponible sur: http://$(hostname -I | awk '{print $1}'):3000"
log "Frontend disponible sur: http://$(hostname -I | awk '{print $1}'):8082"

# Nettoyage des anciennes sauvegardes (garder seulement les 5 dernières)
log "Nettoyage des anciennes sauvegardes..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf

log "Déploiement complet!"
