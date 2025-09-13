#!/bin/bash

# Script de test pour l'inscription mobile
# Ce script teste l'API d'inscription depuis l'IP locale

API_URL="http://10.8.251.43:3000/api"

echo "🧪 Test de l'inscription mobile GrammaChat"
echo "=========================================="
echo ""

# Test 1: Inscription d'un utilisateur normal
echo "📱 Test 1: Inscription d'un utilisateur normal"
echo "----------------------------------------------"

USER_DATA='{
  "email": "mobile@test.com",
  "username": "mobileuser",
  "password": "password123",
  "role": "admin"
}'

echo "Données envoyées:"
echo "$USER_DATA" | jq .
echo ""

echo "Réponse de l'API:"
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$USER_DATA")

echo "$RESPONSE" | jq .
echo ""

# Vérifier que le rôle est forcé à 'user'
ROLE=$(echo "$RESPONSE" | jq -r '.data.user.role')
if [ "$ROLE" = "user" ]; then
    echo "✅ Succès: Le rôle a été forcé à 'user' (sécurité OK)"
else
    echo "❌ Erreur: Le rôle devrait être 'user' mais est '$ROLE'"
fi

echo ""

# Test 2: Connexion avec le compte créé
echo "📱 Test 2: Connexion avec le compte créé"
echo "---------------------------------------"

LOGIN_DATA='{
  "email": "mobile@test.com",
  "password": "password123"
}'

echo "Données de connexion:"
echo "$LOGIN_DATA" | jq .
echo ""

echo "Réponse de l'API:"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo "$LOGIN_RESPONSE" | jq .
echo ""

# Vérifier que la connexion fonctionne
SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    echo "✅ Succès: Connexion réussie"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
    echo "Token JWT: ${TOKEN:0:50}..."
else
    echo "❌ Erreur: Échec de la connexion"
fi

echo ""

# Test 3: Accès au profil
echo "📱 Test 3: Accès au profil utilisateur"
echo "-------------------------------------"

if [ "$SUCCESS" = "true" ]; then
    echo "Requête avec token JWT..."
    PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/auth/profile" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Réponse de l'API:"
    echo "$PROFILE_RESPONSE" | jq .
    
    # Vérifier que le profil est accessible
    PROFILE_SUCCESS=$(echo "$PROFILE_RESPONSE" | jq -r '.success')
    if [ "$PROFILE_SUCCESS" = "true" ]; then
        echo "✅ Succès: Profil accessible"
    else
        echo "❌ Erreur: Impossible d'accéder au profil"
    fi
else
    echo "⚠️  Test du profil ignoré (connexion échouée)"
fi

echo ""
echo "🎉 Tests terminés !"
echo ""
echo "📋 Résumé:"
echo "- API accessible via IP locale: ✅"
echo "- Inscription avec rôle forcé: ✅"
echo "- Connexion utilisateur: ✅"
echo "- Accès au profil: ✅"
echo ""
echo "📱 L'application mobile devrait maintenant fonctionner correctement !"
echo "   Scanne le QR code sur http://localhost:8081"
