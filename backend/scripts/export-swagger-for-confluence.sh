#!/bin/bash
# Script d'export de la spec Swagger pour Confluence
# Usage: ./export-swagger-for-confluence.sh

set -e

echo "Export de la spec Swagger pour Confluence..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "Erreur: Ce script doit être exécuté depuis le répertoire backend/"
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Erreur: Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "Erreur: npm n'est pas installé"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

# Démarrer l'API en arrière-plan
echo "Démarrage de l'API..."
npm run dev &
API_PID=$!

# Fonction de nettoyage
cleanup() {
    echo "Arrêt de l'API..."
    kill $API_PID 2>/dev/null || true
    wait $API_PID 2>/dev/null || true
}

# Capturer les signaux pour nettoyer
trap cleanup EXIT INT TERM

# Attendre que l'API soit prête
echo "Attente du démarrage de l'API..."
sleep 15

# Vérifier que l'API répond
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "API prête"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "Tentative $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "Erreur: L'API n'a pas démarré dans le délai imparti"
    exit 1
fi

# Télécharger la spec Swagger
echo "Téléchargement de la spec Swagger..."
if curl -s http://localhost:3000/api-docs.json -o ../grammachat-api-spec.json; then
    echo "Spec exportée avec succès vers grammachat-api-spec.json"
    
    # Afficher les informations du fichier
    FILE_SIZE=$(wc -c < ../grammachat-api-spec.json)
    echo "Taille du fichier: $FILE_SIZE octets"
    
    # Vérifier que le JSON est valide
    if node -e "JSON.parse(require('fs').readFileSync('../grammachat-api-spec.json', 'utf8'))" 2>/dev/null; then
        echo "Fichier JSON valide"
    else
        echo "Attention: Le fichier JSON pourrait être invalide"
    fi
    
else
    echo "Erreur: Impossible de télécharger la spec Swagger"
    exit 1
fi

echo "Export terminé avec succès"
echo "Prochaines étapes:"
echo "1. Uploadez grammachat-api-spec.json dans Confluence"
echo "2. Insérez le macro Swagger/OpenAPI"
echo "3. Configurez la source comme 'Attachment'"
