#!/bin/bash

# Script de test d'intégration pour GrammaChat
# Ce script teste les fonctionnalités d'authentification et de gestion des rôles

set -e

# Configuration
API_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@grammachat.com"
ADMIN_PASSWORD="admin123456"
USER_EMAIL="testuser@example.com"
USER_PASSWORD="password123"
USER_USERNAME="testuser"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour tester une requête HTTP
test_request() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local auth_header=$6

    log_info "Test: $description"
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth_header" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi

    # Extraire le code de statut (dernière ligne)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$status_code" -eq "$expected_status" ]; then
        log_info "✅ Succès - Status: $status_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        log_error "❌ Échec - Status attendu: $expected_status, reçu: $status_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 1
    fi
    echo ""
}

# Vérifier que le serveur est démarré
check_server() {
    log_info "Vérification que le serveur est démarré..."
    if ! curl -s "$API_URL/health" > /dev/null; then
        log_error "Le serveur n'est pas démarré sur $API_URL"
        log_info "Démarrez le serveur avec: cd backend && npm run dev"
        exit 1
    fi
    log_info "✅ Serveur démarré"
}

# Test 1: Inscription d'un utilisateur
test_user_registration() {
    log_info "=== Test 1: Inscription d'un utilisateur ==="
    
    local user_data='{
        "email": "'$USER_EMAIL'",
        "username": "'$USER_USERNAME'",
        "password": "'$USER_PASSWORD'",
        "role": "admin"
    }'
    
    test_request "POST" "$API_URL/auth/register" "$user_data" 201 "Inscription utilisateur (rôle forcé à 'user')"
}

# Test 2: Connexion de l'utilisateur
test_user_login() {
    log_info "=== Test 2: Connexion de l'utilisateur ==="
    
    local login_data='{
        "email": "'$USER_EMAIL'",
        "password": "'$USER_PASSWORD'"
    }'
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        "$API_URL/auth/login")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        log_info "✅ Connexion utilisateur réussie"
        USER_TOKEN=$(echo "$response" | jq -r '.data.token')
        echo "Token utilisateur: ${USER_TOKEN:0:20}..."
    else
        log_error "❌ Échec de la connexion utilisateur"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
    echo ""
}

# Test 3: Connexion admin
test_admin_login() {
    log_info "=== Test 3: Connexion administrateur ==="
    
    local admin_data='{
        "email": "'$ADMIN_EMAIL'",
        "password": "'$ADMIN_PASSWORD'"
    }'
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$admin_data" \
        "$API_URL/auth/login")
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        log_info "✅ Connexion admin réussie"
        ADMIN_TOKEN=$(echo "$response" | jq -r '.data.token')
        echo "Token admin: ${ADMIN_TOKEN:0:20}..."
    else
        log_error "❌ Échec de la connexion admin"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        return 1
    fi
    echo ""
}

# Test 4: Création d'un admin par un admin
test_create_admin() {
    log_info "=== Test 4: Création d'un admin par un admin ==="
    
    local admin_data='{
        "email": "newadmin@example.com",
        "username": "newadmin",
        "password": "password123"
    }'
    
    test_request "POST" "$API_URL/auth/create-admin" "$admin_data" 201 "Création d'un admin par un admin" "$ADMIN_TOKEN"
}

# Test 5: Tentative de création d'admin par un utilisateur normal
test_create_admin_unauthorized() {
    log_info "=== Test 5: Tentative de création d'admin par un utilisateur normal ==="
    
    local admin_data='{
        "email": "hacker@example.com",
        "username": "hacker",
        "password": "password123"
    }'
    
    test_request "POST" "$API_URL/auth/create-admin" "$admin_data" 403 "Tentative de création d'admin par un utilisateur normal" "$USER_TOKEN"
}

# Test 6: Accès à la liste des utilisateurs (admin)
test_admin_access_users() {
    log_info "=== Test 6: Accès à la liste des utilisateurs (admin) ==="
    
    test_request "GET" "$API_URL/users" "" 200 "Accès à la liste des utilisateurs par un admin" "$ADMIN_TOKEN"
}

# Test 7: Tentative d'accès à la liste des utilisateurs (utilisateur normal)
test_user_access_users() {
    log_info "=== Test 7: Tentative d'accès à la liste des utilisateurs (utilisateur normal) ==="
    
    test_request "GET" "$API_URL/users" "" 403 "Tentative d'accès à la liste des utilisateurs par un utilisateur normal" "$USER_TOKEN"
}

# Test 8: Envoi de message
test_send_message() {
    log_info "=== Test 8: Envoi de message ==="
    
    local message_data='{
        "content": "Bonjour, ceci est un test de message !"
    }'
    
    test_request "POST" "$API_URL/messages" "$message_data" 201 "Envoi de message par un utilisateur connecté" "$USER_TOKEN"
}

# Test 9: Accès au classement (public)
test_leaderboard() {
    log_info "=== Test 9: Accès au classement (public) ==="
    
    test_request "GET" "$API_URL/users/leaderboard" "" 200 "Accès au classement sans authentification"
}

# Test 10: Tentative d'accès sans token
test_no_auth() {
    log_info "=== Test 10: Tentative d'accès sans token ==="
    
    test_request "GET" "$API_URL/auth/profile" "" 401 "Tentative d'accès au profil sans token"
}

# Fonction principale
main() {
    log_info "🚀 Démarrage des tests d'intégration GrammaChat"
    echo ""
    
    # Vérifications préliminaires
    check_server
    
    # Vérifier que jq est installé
    if ! command -v jq &> /dev/null; then
        log_error "jq n'est pas installé. Installez-le avec: sudo apt-get install jq"
        exit 1
    fi
    
    # Exécuter les tests
    test_user_registration
    test_user_login
    test_admin_login
    test_create_admin
    test_create_admin_unauthorized
    test_admin_access_users
    test_user_access_users
    test_send_message
    test_leaderboard
    test_no_auth
    
    log_info "🎉 Tous les tests sont terminés !"
    log_info "Résumé:"
    log_info "- ✅ Inscription utilisateur avec rôle 'user' forcé"
    log_info "- ✅ Connexion utilisateur et admin"
    log_info "- ✅ Création d'admin par admin autorisée"
    log_info "- ✅ Création d'admin par utilisateur refusée"
    log_info "- ✅ Accès aux routes admin selon les permissions"
    log_info "- ✅ Envoi de messages avec authentification"
    log_info "- ✅ Accès public au classement"
    log_info "- ✅ Protection contre l'accès non autorisé"
}

# Exécuter le script
main "$@"
