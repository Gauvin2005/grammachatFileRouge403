#!/bin/bash

# Script pour configurer les variables d'environnement
# Usage: ./configure-env.sh

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

# Fonction pour générer un JWT secret aléatoire
generate_jwt_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

# Configuration du fichier .env
configure_env() {
    log_info "Configuration du fichier .env..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        log_success "Fichier .env créé à partir de env.example"
    fi
    
    echo ""
    log_info "Configuration des variables d'environnement :"
    echo ""
    
    # JWT Secret
    current_jwt=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
    if [ "$current_jwt" = "quelque_chose_est_ici_haha" ]; then
        log_warning "JWT_SECRET utilise la valeur par défaut"
        read -p "Voulez-vous générer un nouveau JWT_SECRET sécurisé ? (y/N) : " generate_jwt
        if [[ $generate_jwt =~ ^[Yy]$ ]]; then
            new_jwt=$(generate_jwt_secret)
            sed -i "s/JWT_SECRET=.*/JWT_SECRET=$new_jwt/" .env
            log_success "JWT_SECRET généré automatiquement"
        fi
    fi
    
    # LanguageTool API Key
    current_lt=$(grep "LANGUAGETOOL_API_KEY=" .env | cut -d'=' -f2)
    if [ -z "$current_lt" ]; then
        echo ""
        log_info "LanguageTool API Key (optionnel) :"
        echo "  - Pour utiliser LanguageTool gratuitement : laissez vide"
        echo "  - Pour plus de requêtes : https://languagetool.org/api-access"
        read -p "Entrez votre LanguageTool API Key (optionnel) : " lt_key
        if [ ! -z "$lt_key" ]; then
            sed -i "s/LANGUAGETOOL_API_KEY=.*/LANGUAGETOOL_API_KEY=$lt_key/" .env
            log_success "LanguageTool API Key configurée"
        fi
    fi
    
    # Expo Push Token
    current_expo=$(grep "EXPO_PUSH_TOKEN=" .env | cut -d'=' -f2)
    if [ "$current_expo" = "quelque_chose_est_ici_haha" ]; then
        echo ""
        log_info "Expo Push Token (optionnel) :"
        echo "  - Pour les notifications push : https://docs.expo.dev/push-notifications/"
        read -p "Entrez votre Expo Push Token (optionnel) : " expo_token
        if [ ! -z "$expo_token" ]; then
            sed -i "s/EXPO_PUSH_TOKEN=.*/EXPO_PUSH_TOKEN=$expo_token/" .env
            log_success "Expo Push Token configurée"
        fi
    fi
    
    # CORS Origin
    echo ""
    log_info "Configuration CORS (optionnel) :"
    echo "  - URLs autorisées pour les requêtes CORS"
    echo "  - Valeur par défaut : localhost et IPs locales"
    read -p "Ajouter des URLs supplémentaires (séparées par des virgules) : " cors_extra
    if [ ! -z "$cors_extra" ]; then
        current_cors=$(grep "CORS_ORIGIN=" .env | cut -d'=' -f2)
        new_cors="$current_cors,$cors_extra"
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$new_cors|" .env
        log_success "URLs CORS supplémentaires ajoutées"
    fi
    
    echo ""
    log_success "Configuration .env terminée!"
    log_info "Vous pouvez maintenant lancer le projet avec : ./setup-and-run.sh"
}

# Fonction pour afficher la configuration actuelle
show_config() {
    log_info "Configuration actuelle du fichier .env :"
    echo ""
    echo "JWT_SECRET: $(grep "JWT_SECRET=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "LANGUAGETOOL_API_KEY: $(grep "LANGUAGETOOL_API_KEY=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "EXPO_PUSH_TOKEN: $(grep "EXPO_PUSH_TOKEN=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "CORS_ORIGIN: $(grep "CORS_ORIGIN=" .env | cut -d'=' -f2)"
}

# Fonction principale
main() {
    log_info "=== Configuration des variables d'environnement ==="
    
    if [ ! -f "env.example" ]; then
        log_error "Fichier env.example non trouvé. Exécutez ce script depuis la racine du projet."
        exit 1
    fi
    
    case "${1:-configure}" in
        "configure")
            configure_env
            ;;
        "show")
            show_config
            ;;
        "help")
            echo "Usage: $0 [configure|show|help]"
            echo "  configure: Configurer les variables d'environnement (défaut)"
            echo "  show: Afficher la configuration actuelle"
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
