#!/bin/bash

# Script de setup et lancement complet pour Grammachat
# Clone le projet, installe les dépendances et lance tous les services

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé. Veuillez installer Git d'abord."
        exit 1
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Veuillez installer Node.js 18+ d'abord."
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé. Veuillez installer npm d'abord."
        exit 1
    fi
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé. Veuillez installer Docker d'abord."
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
        exit 1
    fi
    
    # Vérifier Expo CLI
    if ! command -v expo &> /dev/null; then
        log_warning "Expo CLI n'est pas installé. Installation..."
        npm install -g @expo/cli
    fi
    
    log_success "Tous les prérequis sont satisfaits!"
}

# Cloner le projet
clone_project() {
    log_info "Clonage du projet depuis GitHub..."
    
    REPO_URL="git@github.com:Gauvin2005/grammachatFileRouge403.git"
    PROJECT_DIR="grammachatFileRouge403"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "Le dossier $PROJECT_DIR existe déjà. Suppression..."
        rm -rf "$PROJECT_DIR"
    fi
    
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    log_success "Projet cloné avec succès!"
}

# Créer le fichier .env
create_env_file() {
    log_info "Création du fichier .env..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        log_success "Fichier .env créé à partir de env.example"
    else
        log_warning "Le fichier .env existe déjà"
    fi
}

# Installer les dépendances
install_dependencies() {
    log_info "Installation des dépendances..."
    
    # Dépendances racine
    log_info "Installation des dépendances racine..."
    npm install
    
    # Dépendances backend
    log_info "Installation des dépendances backend..."
    cd backend
    npm install
    cd ..
    
    log_success "Toutes les dépendances sont installées!"
}

# Construire le backend
build_backend() {
    log_info "Construction du backend..."
    
    cd backend
    npm run build
    cd ..
    
    log_success "Backend construit avec succès!"
}

# Lancer les services Docker
start_docker_services() {
    log_info "Lancement des services Docker (MongoDB, Redis, API)..."
    
    # Arrêter les services existants s'ils tournent
    docker compose down 2>/dev/null || true
    
    # Lancer les services
    docker compose up -d
    
    # Attendre que les services soient prêts
    log_info "Attente que les services soient prêts..."
    sleep 10
    
    # Vérifier le statut des services
    log_info "Vérification du statut des services..."
    docker compose ps
    
    log_success "Services Docker lancés avec succès!"
}

# Lancer le frontend
start_frontend() {
    log_info "Lancement du frontend..."
    
    # Attendre un peu que l'API soit prête
    sleep 5
    
    log_info "Démarrage du serveur de développement Expo..."
    log_warning "Le frontend va s'ouvrir dans votre navigateur. Appuyez sur Ctrl+C pour arrêter."
    
    # Lancer Expo
    npm start
}

# Fonction principale
main() {
    log_info "=== Script de setup et lancement Grammachat ==="
    
    check_prerequisites
    clone_project
    create_env_file
    install_dependencies
    build_backend
    start_docker_services
    
    log_success "=== Setup terminé avec succès! ==="
    log_info "Services disponibles:"
    log_info "- API: http://localhost:3000"
    log_info "- MongoDB: localhost:27017"
    log_info "- Redis: localhost:6379"
    log_info "- Documentation API: http://localhost:3000/api-docs"
    
    echo ""
    log_info "Pour lancer le frontend, exécutez: npm start"
    log_info "Ou appuyez sur Entrée pour lancer automatiquement le frontend maintenant..."
    
    read -r
    start_frontend
}

# Gestion des signaux pour un arrêt propre
cleanup() {
    log_info "Arrêt des services..."
    docker compose down
    log_success "Services arrêtés proprement"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Lancer le script principal
main "$@"
