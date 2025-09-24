#!/bin/bash

# Script de migration des anciens tests vers la nouvelle structure
# Archive les anciens fichiers et crée des liens vers la nouvelle structure

echo "Migration Migration des anciens tests vers la nouvelle structure..."

# Créer le dossier d'archive s'il n'existe pas
mkdir -p archive/tests-old

# Déplacer les anciens fichiers de tests
echo "Archivage Archivage des anciens fichiers de tests..."
mv test-*.js archive/tests-old/ 2>/dev/null || echo "Aucun fichier test-*.js trouvé"
mv debug-auth.js archive/tests-old/ 2>/dev/null || echo "debug-auth.js non trouvé"
mv TEST-GUIDE.md archive/tests-old/ 2>/dev/null || echo "TEST-GUIDE.md non trouvé"

# Créer un fichier de mapping pour référence
cat > archive/tests-old/MIGRATION-MAPPING.md << 'EOF'
# Migration des tests - Mapping des anciens vers nouveaux

## Anciens fichiers → Nouveaux fichiers

### Tests API
- `test-api-login.js` → `tests/api/auth.test.js`
- `test-registration-api.js` → `tests/api/auth.test.js`
- `test-frontend-api.js` → `tests/api/messages.test.js`

### Tests Database  
- `test-database.js` → `tests/database/connection.test.js`
- `test-create-users.js` → `tests/database/connection.test.js`

### Tests Frontend
- `test-frontend-backend.js` → `tests/frontend/ui.test.js`
- `test-frontend-registration.js` → `tests/frontend/ui.test.js`
- `test-web-login.js` → `tests/frontend/ui.test.js`
- `test-puppeteer-simple.js` → `tests/frontend/ui.test.js`

### Tests de validation
- `test-form-validation.js` → `tests/api/auth.test.js`
- `test-password.js` → `tests/api/auth.test.js`

### Tests Redux/State
- `test-redux-state.js` → `tests/frontend/ui.test.js`

## Nouveaux utilitaires

- `tests/utils/testUtils.js` : Classe utilitaire partagée
- `tests/run-tests.js` : Script principal d'exécution
- `tests/package.json` : Dépendances des tests
- `tests/README.md` : Documentation complète

## Utilisation

```bash
cd tests
npm install
npm test                    # Tous les tests
npm run test:api           # Tests API seulement
npm run test:database      # Tests database seulement
npm run test:frontend      # Tests frontend seulement
```

## Avantages de la nouvelle structure

1. **Organisation claire** : Tests groupés par catégorie
2. **Code partagé** : Utilitaires communs dans `testUtils.js`
3. **Pas de duplication** : Modèles et fonctions partagés
4. **Scripts npm** : Commandes simples et standardisées
5. **Documentation** : README complet avec exemples
6. **Extensibilité** : Facile d'ajouter de nouveaux tests
EOF

echo "[SUCCESS] Migration terminée !"
echo ""
echo "Dossier Anciens fichiers archivés dans: archive/tests-old/"
echo "Nouveau Nouveaux tests organisés dans: tests/"
echo ""
echo "Démarrage Pour utiliser les nouveaux tests:"
echo "   cd tests"
echo "   npm install"
echo "   npm test"
echo ""
echo "Documentation Documentation complète: tests/README.md"
