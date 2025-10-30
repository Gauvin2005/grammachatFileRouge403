#!/bin/bash

# Script pour créer un compte administrateur
# Usage: ./create-admin.sh [email] [username] [password]

# Déterminer le répertoire du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/.."
PROJECT_ROOT="$BACKEND_DIR/.."

# Variables par défaut
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27018/grammachat}"
ADMIN_EMAIL="${ADMIN_EMAIL:-${1:-admin@grammachat.com}}"
ADMIN_USERNAME="${ADMIN_USERNAME:-${2:-admin}}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-${3:-admin123}}"

echo "==========================================="
echo "  Création du compte administrateur"
echo "==========================================="
echo ""
echo "Configuration:"
echo "  MongoDB URI: $MONGODB_URI"
echo "  Email: $ADMIN_EMAIL"
echo "  Username: $ADMIN_USERNAME"
echo "  Password: $ADMIN_PASSWORD"
echo ""

# Vérifier si MongoDB est accessible
echo "Vérification de la connexion MongoDB..."
if ! nc -z localhost 27018 2>/dev/null && ! docker ps | grep -q grammachat-mongodb; then
    echo "ERREUR: MongoDB n'est pas accessible."
    echo "Assurez-vous que MongoDB est en cours d'exécution (via Docker ou localement)."
    echo "Pour démarrer avec Docker: docker compose up -d mongodb"
    exit 1
fi

# Exécuter le script Node.js
cd "$BACKEND_DIR"
npm run create-admin

