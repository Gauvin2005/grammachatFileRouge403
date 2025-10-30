#!/bin/bash

# Script de configuration initiale du serveur Grammachat
# =====================================================

set -e

# Configuration
APP_DIR="/opt/grammachat/grammachatFileRouge403"
USER="grammachat"
NGINX_CONF="/etc/nginx/sites-available/grammachat"
NGINX_ENABLED="/etc/nginx/sites-enabled/grammachat"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log "Configuration initiale du serveur Grammachat"

# 1. Vérifier les privilèges root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root (sudo)"
fi

# 2. Mise à jour du système
log "Mise à jour du système..."
apt update && apt upgrade -y

# 3. Installation des dépendances
log "Installation des dépendances..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban

# 4. Installation Node.js 18
log "Installation de Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 5. Installation PM2
log "Installation de PM2..."
npm install -g pm2

# 6. Installation Docker
log "Installation de Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# 7. Création de l'utilisateur
log "Création de l'utilisateur $USER..."
if ! id "$USER" &>/dev/null; then
    useradd -m -s /bin/bash "$USER"
    usermod -aG docker "$USER"
    log "Utilisateur $USER créé"
else
    log "Utilisateur $USER existe déjà"
fi

# 8. Création des répertoires
log "Création des répertoires..."
mkdir -p "/opt/grammachat"
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/backups"
mkdir -p "$APP_DIR/deploy-scripts"
mkdir -p "/var/log/grammachat"
chown -R "$USER:$USER" "/opt/grammachat"
chown -R "$USER:$USER" "/var/log/grammachat"

# 9. Configuration des permissions
log "Configuration des permissions..."
chmod +x "$APP_DIR/deploy-scripts"/*.sh
chmod +x "$APP_DIR/deploy-scripts"/*.js

# 10. Configuration Nginx
log "Configuration de Nginx..."

# Copier la configuration Nginx
if [ -f "$APP_DIR/deploy-scripts/nginx-grammachat.conf" ]; then
    cp "$APP_DIR/deploy-scripts/nginx-grammachat.conf" "$NGINX_CONF"
    log "Configuration Nginx copiée"
else
    error "Fichier de configuration Nginx non trouvé"
fi

# Activer le site
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# Supprimer le site par défaut
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
nginx -t || error "Configuration Nginx invalide"

# Redémarrer Nginx
systemctl restart nginx
systemctl enable nginx

log "Nginx configuré et démarré"

# 11. Configuration du pare-feu
log "Configuration du pare-feu..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp  # API Backend
ufw allow 8081/tcp  # Frontend
ufw allow 9000/tcp  # Webhook
ufw allow 27018/tcp # MongoDB (si exposé)
ufw allow 6379/tcp  # Redis (si exposé)

log "Pare-feu configuré"

# 12. Configuration Fail2ban
log "Configuration de Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
EOF

systemctl restart fail2ban
systemctl enable fail2ban

log "Fail2ban configuré"

# 13. Configuration PM2
log "Configuration de PM2..."
sudo -u "$USER" pm2 startup systemd -u "$USER" --hp /home/"$USER"
log "PM2 configuré pour le démarrage automatique"

# 14. Configuration des services systemd
log "Configuration des services systemd..."

# Copier le service webhook
if [ -f "$APP_DIR/deploy-scripts/systemd-services/grammachat-webhook.service" ]; then
    cp "$APP_DIR/deploy-scripts/systemd-services/grammachat-webhook.service" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable grammachat-webhook
    log "Service webhook configuré"
else
    warning "Service webhook non trouvé, configuration manuelle nécessaire"
fi

# 15. Configuration des logs
log "Configuration des logs..."
cat > /etc/logrotate.d/grammachat << 'EOF'
/var/log/grammachat/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 grammachat grammachat
    postrotate
        systemctl reload grammachat-webhook || true
    endscript
}
EOF

log "Rotation des logs configurée"

# 16. Configuration du monitoring
log "Configuration du monitoring..."
apt install -y htop iotop nethogs

# 17. Création du script de maintenance
log "Création du script de maintenance..."
cat > "$APP_DIR/maintenance.sh" << 'EOF'
#!/bin/bash
# Script de maintenance Grammachat

echo "Maintenance du système Grammachat"
echo "====================================="

# Nettoyage des logs anciens
echo "Nettoyage des logs..."
find /var/log/grammachat -name "*.log" -mtime +30 -delete

# Nettoyage des sauvegardes anciennes
echo "Nettoyage des sauvegardes..."
find /opt/grammachat/grammachatFileRouge403/backups -type d -mtime +7 -exec rm -rf {} +

# Mise à jour des packages
echo "Mise à jour des packages..."
apt update && apt upgrade -y

# Redémarrage des services
echo "Redémarrage des services..."
systemctl restart grammachat-webhook
pm2 restart all

echo "Maintenance terminée"
EOF

chmod +x "$APP_DIR/maintenance.sh"
chown "$USER:$USER" "$APP_DIR/maintenance.sh"

log "Script de maintenance créé"

# 18. Configuration du cron pour la maintenance
log "Configuration du cron..."
(crontab -u "$USER" -l 2>/dev/null; echo "0 2 * * * $APP_DIR/maintenance.sh") | crontab -u "$USER" -

log "Cron configuré pour la maintenance quotidienne"

# 19. Affichage des informations finales
log "Configuration terminée!"
echo ""
echo "Informations importantes:"
echo "============================="
echo "• Utilisateur: $USER"
echo "• Répertoire app: $APP_DIR"
echo "• Repository GitHub: https://github.com/Gauvin2005/grammachatFileRouge403"
echo "• Logs: /var/log/grammachat/"
echo "• Configuration Nginx: $NGINX_CONF"
echo "• Service webhook: grammachat-webhook"
echo ""
echo "URLs d'accès:"
echo "• API: http://$(hostname -I | awk '{print $1}'):3000"
echo "• Frontend: http://$(hostname -I | awk '{print $1}'):8081"
echo "• Webhook: http://$(hostname -I | awk '{print $1}'):9000/webhook"
echo ""
echo "Commandes utiles:"
echo "• Status services: systemctl status grammachat-webhook"
echo "• Logs webhook: journalctl -u grammachat-webhook -f"
echo "• PM2 status: sudo -u $USER pm2 status"
echo "• Maintenance: $APP_DIR/maintenance.sh"
echo ""
echo " N'oubliez pas de:"
echo "• Configurer les variables d'environnement dans $APP_DIR/.env"
echo "• Modifier le secret webhook dans les fichiers de config"
echo "• Configurer votre domaine dans la config Nginx"
echo "• Tester le déploiement avec: $APP_DIR/deploy-scripts/deploy.sh"
echo ""
echo "Pour cloner le repository:"
echo "git clone https://github.com/Gauvin2005/grammachatFileRouge403.git $APP_DIR"
