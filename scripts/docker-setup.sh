#!/bin/bash

# Script de configuration Docker pour Grammachat
# Ce script configure automatiquement Docker avec vos informations personnelles

set -e

echo "🚀 Configuration Docker pour Grammachat"
echo "========================================"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

print_message "Docker et Docker Compose détectés"

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    print_warning "Fichier .env non trouvé. Création à partir du template..."
    cp env.example .env
    print_message "Fichier .env créé à partir du template"
fi

# Demander les informations personnelles
echo ""
print_info "Configuration de vos informations personnelles"
echo "---------------------------------------------------"

# JWT Secret
read -p "🔐 Entrez votre clé secrète JWT (ou appuyez sur Entrée pour utiliser la valeur par défaut): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="grammachat-super-secret-jwt-key-$(date +%s)"
fi

# LanguageTool API Key
read -p "🌐 Entrez votre clé API LanguageTool (ou appuyez sur Entrée pour ignorer): " LANGUAGETOOL_API_KEY

# Ports personnalisés
read -p "🔌 Port API (défaut: 3000): " API_PORT
API_PORT=${API_PORT:-3000}

read -p "🗄️  Port MongoDB (défaut: 27017): " MONGODB_PORT
MONGODB_PORT=${MONGODB_PORT:-27017}

read -p "⚡ Port Redis (défaut: 6379): " REDIS_PORT
REDIS_PORT=${REDIS_PORT:-6379}

# Configuration XP
read -p "🎮 XP par caractère (défaut: 1): " XP_PER_CHARACTER
XP_PER_CHARACTER=${XP_PER_CHARACTER:-1}

read -p "🎯 Bonus XP sans erreurs (défaut: 10): " XP_BONUS_NO_ERRORS
XP_BONUS_NO_ERRORS=${XP_BONUS_NO_ERRORS:-10}

read -p "⚠️  Pénalité XP par erreur (défaut: 5): " XP_PENALTY_PER_ERROR
XP_PENALTY_PER_ERROR=${XP_PENALTY_PER_ERROR:-5}

read -p "📈 Seuil de montée de niveau (défaut: 100): " LEVEL_UP_THRESHOLD
LEVEL_UP_THRESHOLD=${LEVEL_UP_THRESHOLD:-100}

# Mettre à jour le fichier .env
print_info "Mise à jour du fichier .env..."

# Sauvegarder l'ancien fichier
cp .env .env.backup

# Créer le nouveau fichier .env
cat > .env << EOF
# Configuration des ports Docker
API_PORT=${API_PORT}
MONGODB_PORT=${MONGODB_PORT}
REDIS_PORT=${REDIS_PORT}

# Configuration MongoDB
MONGODB_URI=mongodb://mongodb:27017/grammachat
MONGODB_DATABASE=grammachat

# Configuration API
NODE_ENV=development
API_HOST=0.0.0.0
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# LanguageTool API
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_API_KEY=${LANGUAGETOOL_API_KEY}

# Configuration XP et Gamification
XP_PER_CHARACTER=${XP_PER_CHARACTER}
XP_BONUS_NO_ERRORS=${XP_BONUS_NO_ERRORS}
XP_PENALTY_PER_ERROR=${XP_PENALTY_PER_ERROR}
LEVEL_UP_THRESHOLD=${LEVEL_UP_THRESHOLD}

# Configuration des notifications
EXPO_PUSH_TOKEN=your-expo-push-token-here

# Configuration CORS
CORS_ORIGIN=http://localhost:${API_PORT},http://localhost:19006,exp://192.168.1.100:19000

# Configuration Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# Configuration de développement
DEBUG=grammachat:*
LOG_LEVEL=info
EOF

print_message "Fichier .env mis à jour avec vos paramètres"

# Arrêter les conteneurs existants
print_info "Arrêt des conteneurs existants..."
docker-compose down 2>/dev/null || true

# Nettoyer les images et volumes (optionnel)
read -p "🧹 Voulez-vous nettoyer les images et volumes existants ? (y/N): " CLEANUP
if [[ $CLEANUP =~ ^[Yy]$ ]]; then
    print_info "Nettoyage des images et volumes..."
    docker-compose down -v --rmi all 2>/dev/null || true
    docker system prune -f
    print_message "Nettoyage terminé"
fi

# Construire et démarrer les services
print_info "Construction et démarrage des services Docker..."
docker-compose up -d --build

# Attendre que les services soient prêts
print_info "Attente du démarrage des services..."
sleep 10

# Vérifier le statut des services
print_info "Vérification du statut des services..."

# Vérifier MongoDB
if docker-compose ps mongodb | grep -q "Up"; then
    print_message "MongoDB est démarré"
else
    print_error "MongoDB n'est pas démarré"
fi

# Vérifier Redis
if docker-compose ps redis | grep -q "Up"; then
    print_message "Redis est démarré"
else
    print_error "Redis n'est pas démarré"
fi

# Vérifier l'API
if docker-compose ps api | grep -q "Up"; then
    print_message "API est démarrée"
else
    print_error "API n'est pas démarrée"
fi

# Tester l'API
print_info "Test de l'API..."
if curl -s http://localhost:${API_PORT}/api/health > /dev/null; then
    print_message "API répond correctement"
else
    print_warning "API ne répond pas encore (peut prendre quelques minutes)"
fi

echo ""
echo "🎉 Configuration Docker terminée !"
echo "=================================="
echo ""
print_info "Services disponibles :"
echo "  📱 API Backend: http://localhost:${API_PORT}"
echo "  🗄️  MongoDB: localhost:${MONGODB_PORT}"
echo "  ⚡ Redis: localhost:${REDIS_PORT}"
echo ""
print_info "Commandes utiles :"
echo "  📊 Voir les logs: docker-compose logs -f"
echo "  🔄 Redémarrer: docker-compose restart"
echo "  🛑 Arrêter: docker-compose down"
echo "  🧹 Nettoyer: docker-compose down -v --rmi all"
echo ""
print_info "Pour tester l'API :"
echo "  curl http://localhost:${API_PORT}/api/health"
echo ""
print_warning "Sauvegarde de votre configuration :"
echo "  Fichier .env sauvegardé dans .env.backup"
echo ""

# Afficher les logs de l'API
read -p "📋 Voulez-vous voir les logs de l'API ? (y/N): " SHOW_LOGS
if [[ $SHOW_LOGS =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Logs de l'API (Ctrl+C pour quitter) :"
    echo "----------------------------------------"
    docker-compose logs -f api
fi
