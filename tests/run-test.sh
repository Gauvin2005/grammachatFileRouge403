#!/bin/bash

# Script de lancement du test automatisé de création d'utilisateur
# Ce script installe les dépendances et lance le test

echo "Démarrage du test automatisé de création d'utilisateur"
echo "Configuration requise:"
echo "  - Docker et Docker Compose installés"
echo "  - Node.js installé"
echo "  - Accès au port 3000 et 27017"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Veuillez installer Docker d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé (nouvelle syntaxe)
if ! docker compose version &> /dev/null; then
    echo "Docker Compose n'est pas installé. Veuillez installer Docker Compose d'abord."
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Node.js n'est pas installé. Veuillez installer Node.js d'abord."
    exit 1
fi

echo "Prérequis vérifiés"
echo ""

# Installer les dépendances de test
echo "Installation des dépendances de test..."
npm install

if [ $? -ne 0 ]; then
    echo "Échec de l'installation des dépendances"
    exit 1
fi

echo "Dépendances installées"
echo ""

# Lancer le test
echo "Lancement du test..."
npm test

# Capturer le code de sortie
TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "Test terminé avec succès !"
else
    echo "Test échoué avec le code d'erreur: $TEST_EXIT_CODE"
fi

exit $TEST_EXIT_CODE

