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
    echo "  - Valeur par défaut : * (toutes les URLs)"
    read -p "Modifier CORS_ORIGIN (ou appuyez sur Entrée pour garder *) : " cors_origin
    if [ ! -z "$cors_origin" ]; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=$cors_origin|" .env
        log_success "CORS_ORIGIN configuré"
    fi
    
    # Docker Credentials
    echo ""
    log_info "Configuration Docker (optionnel) :"
    echo "  - Credentials pour Docker Hub (pour push/pull d'images)"
    read -p "Entrez votre Docker Hub username (optionnel) : " docker_username
    if [ ! -z "$docker_username" ]; then
        sed -i "s/DOCKER_USERNAME=.*/DOCKER_USERNAME=$docker_username/" .env
        read -p "Entrez votre Docker Hub password/token : " docker_password
        if [ ! -z "$docker_password" ]; then
            sed -i "s/DOCKER_PASSWORD=.*/DOCKER_PASSWORD=$docker_password/" .env
            log_success "Credentials Docker configurés"
        fi
    fi
    
    # Snyk Token
    echo ""
    log_info "Configuration Snyk (optionnel) :"
    echo "  - Token pour l'analyse de sécurité des dépendances"
    echo "  - Obtenez votre token sur : https://app.snyk.io/account"
    read -p "Entrez votre Snyk token (optionnel) : " snyk_token
    if [ ! -z "$snyk_token" ]; then
        sed -i "s/SNYK_TOKEN=.*/SNYK_TOKEN=$snyk_token/" .env
        log_success "Snyk token configuré"
    fi
    
    # Webhook Configuration
    echo ""
    log_info "Configuration Webhook (optionnel) :"
    echo "  - URLs pour les webhooks de déploiement"
    read -p "Entrez l'URL du webhook de dev (ou appuyez sur Entrée pour garder la valeur par défaut) : " dev_webhook
    if [ ! -z "$dev_webhook" ]; then
        sed -i "s|DEV_DEPLOY_WEBHOOK =.*|DEV_DEPLOY_WEBHOOK = $dev_webhook|" .env
    fi
    
    read -p "Entrez l'URL du webhook de prod (ou appuyez sur Entrée pour garder la valeur par défaut) : " prod_webhook
    if [ ! -z "$prod_webhook" ]; then
        sed -i "s|PROD_DEPLOY_WEBHOOK =.*|PROD_DEPLOY_WEBHOOK = $prod_webhook|" .env
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
    echo "DOCKER_USERNAME: $(grep "DOCKER_USERNAME=" .env | cut -d'=' -f2)"
    echo "DOCKER_PASSWORD: $(grep "DOCKER_PASSWORD=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "SNYK_TOKEN: $(grep "SNYK_TOKEN=" .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "DEV_DEPLOY_WEBHOOK: $(grep "DEV_DEPLOY_WEBHOOK" .env | cut -d'=' -f2)"
    echo "PROD_DEPLOY_WEBHOOK: $(grep "PROD_DEPLOY_WEBHOOK" .env | cut -d'=' -f2)"
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
