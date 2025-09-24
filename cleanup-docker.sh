#!/bin/bash

# Script de nettoyage Docker pour Grammachat
# Résout les problèmes de permissions avec les conteneurs existants

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Fonction de nettoyage
cleanup_docker() {
    log_info "=== Nettoyage des conteneurs Grammachat ==="
    
    # Lister les conteneurs existants
    log_info "Conteneurs existants :"
    docker ps --filter "name=grammachat" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    log_warning "Arrêt forcé des conteneurs Grammachat..."
    
    # Arrêter avec sudo si nécessaire
    sudo docker stop grammachat-mongodb grammachat-redis grammachat-api 2>/dev/null || true
    
    log_info "Suppression des conteneurs..."
    sudo docker rm -f grammachat-mongodb grammachat-redis grammachat-api 2>/dev/null || true
    
    log_info "Nettoyage des volumes orphelins..."
    sudo docker volume prune -f 2>/dev/null || true
    
    log_info "Nettoyage des réseaux orphelins..."
    sudo docker network prune -f 2>/dev/null || true
    
    log_success "Nettoyage terminé !"
    
    # Vérifier qu'il n'y a plus de conteneurs Grammachat
    remaining=$(docker ps --filter "name=grammachat" --format "{{.Names}}" | wc -l)
    if [ "$remaining" -eq 0 ]; then
        log_success "Aucun conteneur Grammachat restant"
    else
        log_warning "Il reste $remaining conteneur(s) Grammachat"
        docker ps --filter "name=grammachat"
    fi
}

# Fonction pour relancer proprement
restart_clean() {
    log_info "=== Relance propre des services ==="
    
    # S'assurer qu'on est dans le bon répertoire
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml non trouvé. Exécutez ce script depuis la racine du projet."
        exit 1
    fi
    
    # Lancer avec docker compose
    log_info "Lancement des services..."
    docker compose up -d
    
    # Vérifier le statut
    sleep 5
    log_info "Statut des services :"
    docker compose ps
    
    log_success "Services relancés avec succès !"
}

# Fonction principale
main() {
    case "${1:-cleanup}" in
        "cleanup")
            cleanup_docker
            ;;
        "restart")
            restart_clean
            ;;
        "full")
            cleanup_docker
            echo ""
            restart_clean
            ;;
        "help")
            echo "Usage: $0 [cleanup|restart|full|help]"
            echo "  cleanup: Nettoyer les conteneurs existants (défaut)"
            echo "  restart: Relancer les services proprement"
            echo "  full: Nettoyage + relance"
            echo "  help: Afficher cette aide"
            ;;
        *)
            log_error "Commande inconnue: $1"
            echo "Utilisez '$0 help' pour voir les commandes disponibles"
            exit 1
            ;;
    esac
}

main "$@"
