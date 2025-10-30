#!/bin/bash

# Script simple pour créer un compte admin Grammachat
# Usage: ./create-admin.sh

BACKEND_DIR="$(dirname "$0")/backend"

echo "Création du compte administrateur..."
echo ""

cd "$BACKEND_DIR"
MONGODB_URI=mongodb://localhost:27018/grammachat npm run create-admin

