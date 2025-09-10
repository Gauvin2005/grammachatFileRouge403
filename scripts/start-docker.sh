#!/bin/bash

# Script de démarrage Docker pour Grammachat
# Ce script démarre tous les services avec configuration personnalisée

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🚀 Démarrage Docker pour Grammachat"
echo "===================================="

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

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    print_warning "Fichier .env non trouvé. Création à partir du template..."
    cp env.example .env
    print_message "Fichier .env créé"
fi

# Arrêter les conteneurs existants
print_info "Arrêt des conteneurs existants..."
docker-compose down 2>/dev/null || true

# Démarrer MongoDB et Redis
print_info "Démarrage de MongoDB et Redis..."
docker-compose up -d mongodb redis

# Attendre que MongoDB soit prêt
print_info "Attente du démarrage de MongoDB..."
sleep 10

# Vérifier MongoDB
if docker-compose ps mongodb | grep -q "Up"; then
    print_message "MongoDB est démarré"
else
    print_error "MongoDB n'est pas démarré"
    exit 1
fi

# Vérifier Redis
if docker-compose ps redis | grep -q "Up"; then
    print_message "Redis est démarré"
else
    print_error "Redis n'est pas démarré"
    exit 1
fi

# Démarrer l'API en mode développement
print_info "Démarrage de l'API en mode développement..."

# Tuer les processus Node.js existants
pkill -f "node.*simple-server.js" 2>/dev/null || true

# Démarrer l'API simple
cd backend
print_info "Démarrage du serveur API simple..."
node src/simple-server.js &
API_PID=$!

# Attendre que l'API soit prête
print_info "Attente du démarrage de l'API..."
sleep 5

# Vérifier l'API
if curl -s http://localhost:3000/api/health > /dev/null; then
    print_message "API est démarrée et répond"
else
    print_warning "API ne répond pas encore, attente supplémentaire..."
    sleep 5
    if curl -s http://localhost:3000/api/health > /dev/null; then
        print_message "API est maintenant démarrée"
    else
        print_error "API ne répond pas"
        exit 1
    fi
fi

# Démarrer Expo (optionnel)
read -p "📱 Voulez-vous démarrer Expo pour l'application mobile ? (y/N): " START_EXPO
if [[ $START_EXPO =~ ^[Yy]$ ]]; then
    print_info "Démarrage d'Expo..."
    cd ../frontend
    npm start &
    EXPO_PID=$!
    print_message "Expo démarré"
fi

echo ""
echo "🎉 Grammachat est maintenant opérationnel !"
echo "=========================================="
echo ""
print_info "Services disponibles :"
echo "  📱 API Backend: http://localhost:3000"
echo "  🗄️  MongoDB: localhost:27017"
echo "  ⚡ Redis: localhost:6379"
if [[ $START_EXPO =~ ^[Yy]$ ]]; then
    echo "  📱 Expo: http://localhost:19006"
fi
echo ""
print_info "Test de l'API :"
echo "  curl http://localhost:3000/api/health"
echo ""
print_info "Test d'inscription :"
echo "  curl -X POST http://localhost:3000/api/auth/register \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"email\":\"test@example.com\",\"username\":\"testuser\",\"password\":\"password123\"}'"
echo ""
print_info "Commandes utiles :"
echo "  📊 Voir les logs: docker-compose logs -f"
echo "  🔄 Redémarrer: docker-compose restart"
echo "  🛑 Arrêter: docker-compose down"
echo "  🧹 Nettoyer: docker-compose down -v"
echo ""

# Fonction de nettoyage à l'arrêt
cleanup() {
    print_info "Arrêt des services..."
    kill $API_PID 2>/dev/null || true
    if [[ $START_EXPO =~ ^[Yy]$ ]]; then
        kill $EXPO_PID 2>/dev/null || true
    fi
    docker-compose down
    print_message "Services arrêtés"
    exit 0
}

# Capturer les signaux d'arrêt
trap cleanup SIGINT SIGTERM

# Afficher les logs
read -p "📋 Voulez-vous voir les logs de l'API ? (y/N): " SHOW_LOGS
if [[ $SHOW_LOGS =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Logs de l'API (Ctrl+C pour quitter) :"
    echo "----------------------------------------"
    tail -f /dev/null &
    wait
fi

# Garder le script en vie
print_info "Services en cours d'exécution... (Ctrl+C pour arrêter)"
wait
