#!/bin/bash

# Script de nettoyage et organisation du projet Grammachat
# Organise les fichiers par catégories et supprime les doublons

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

echo "Nettoyage Nettoyage et organisation du projet Grammachat"
echo "=================================================="

# Créer les dossiers d'organisation
log_info "Création de la structure d'organisation..."
mkdir -p archive/{old-tests,duplicates,unused}
mkdir -p scripts/{setup,deployment,maintenance}
mkdir -p docs/{api,deployment,development}

# Organiser les scripts
log_info "Organisation des scripts..."
if [ -f "setup-and-run.sh" ]; then
    mv setup-and-run.sh scripts/setup/
    log_success "Script setup-and-run.sh déplacé vers scripts/setup/"
fi

if [ -f "configure-env.sh" ]; then
    mv configure-env.sh scripts/setup/
    log_success "Script configure-env.sh déplacé vers scripts/setup/"
fi

if [ -f "cleanup-docker.sh" ]; then
    mv cleanup-docker.sh scripts/maintenance/
    log_success "Script cleanup-docker.sh déplacé vers scripts/maintenance/"
fi

if [ -f "migrate-tests.sh" ]; then
    mv migrate-tests.sh scripts/maintenance/
    log_success "Script migrate-tests.sh déplacé vers scripts/maintenance/"
fi

# Organiser les scripts de déploiement existants
if [ -d "deploy-scripts" ]; then
    mv deploy-scripts/* scripts/deployment/ 2>/dev/null || true
    rmdir deploy-scripts 2>/dev/null || true
    log_success "Scripts de déploiement organisés"
fi

# Organiser les scripts existants
if [ -d "scripts" ] && [ -f "scripts/reactivate-notifications.sh" ]; then
    mv scripts/reactivate-notifications.sh scripts/maintenance/
    log_success "Script reactivate-notifications.sh organisé"
fi

# Organiser la documentation
log_info "Organisation de la documentation..."
if [ -f "CONFIGURATION-DOCKER.md" ]; then
    mv CONFIGURATION-DOCKER.md docs/deployment/
    log_success "CONFIGURATION-DOCKER.md déplacé vers docs/deployment/"
fi

if [ -f "DOCKER-CONFIG.md" ]; then
    mv DOCKER-CONFIG.md docs/deployment/
    log_success "DOCKER-CONFIG.md déplacé vers docs/deployment/"
fi

if [ -f "QUICK-START.md" ]; then
    mv QUICK-START.md docs/development/
    log_success "QUICK-START.md déplacé vers docs/development/"
fi

if [ -f "TECH.md" ]; then
    mv TECH.md docs/development/
    log_success "TECH.md déplacé vers docs/development/"
fi

if [ -f "IMPLEMENTATION-SUMMARY.md" ]; then
    mv IMPLEMENTATION-SUMMARY.md docs/development/
    log_success "IMPLEMENTATION-SUMMARY.md déplacé vers docs/development/"
fi

# Organiser les fichiers de configuration
log_info "Organisation des fichiers de configuration..."
if [ -f "grammachat-api-spec.json" ]; then
    mv grammachat-api-spec.json docs/api/
    log_success "grammachat-api-spec.json déplacé vers docs/api/"
fi

# Organiser les images
log_info "Organisation des assets..."
mkdir -p assets/images
if [ -f "Grammachat.png" ]; then
    mv Grammachat.png assets/images/
    log_success "Grammachat.png déplacé vers assets/images/"
fi

if [ -f "Grammachat2.png" ]; then
    mv Grammachat2.png assets/images/
    log_success "Grammachat2.png déplacé vers assets/images/"
fi

# Créer un fichier de structure du projet
log_info "Création du fichier de structure..."
cat > PROJECT-STRUCTURE.md << 'EOF'
# Structure du Projet Grammachat

## Dossier Organisation

```
grammachatFileRouge403/
├── backend/                 # API Backend
│   ├── src/                # Code source
│   ├── scripts/            # Scripts backend
│   └── package.json        # Dépendances backend
├── frontend/               # Application React Native
│   ├── src/                # Code source frontend
│   ├── assets/             # Images et ressources
│   └── package.json        # Dépendances frontend
├── tests/                  # Suite de tests organisée
│   ├── api/                # Tests API
│   ├── database/           # Tests database
│   ├── frontend/           # Tests frontend
│   ├── utils/              # Utilitaires partagés
│   └── run-tests.js        # Script principal
├── scripts/                # Scripts d'administration
│   ├── setup/              # Scripts d'installation
│   ├── deployment/         # Scripts de déploiement
│   └── maintenance/        # Scripts de maintenance
├── docs/                   # Documentation
│   ├── api/                # Documentation API
│   ├── deployment/         # Documentation déploiement
│   └── development/        # Documentation développement
├── docker/                 # Configuration Docker
├── archive/                # Fichiers archivés
│   ├── old-tests/          # Anciens tests
│   ├── duplicates/          # Doublons
│   └── unused/             # Fichiers non utilisés
├── assets/                 # Ressources du projet
│   └── images/             # Images
├── docker-compose.yml      # Services Docker
├── package.json            # Dépendances racine
└── README.md               # Documentation principale
```

## Démarrage Scripts disponibles

### Installation et configuration
```bash
scripts/setup/setup-and-run.sh      # Installation complète
scripts/setup/configure-env.sh       # Configuration variables
```

### Maintenance
```bash
scripts/maintenance/cleanup-docker.sh    # Nettoyage Docker
scripts/maintenance/migrate-tests.sh     # Migration tests
```

### Tests
```bash
cd tests
npm test                    # Tous les tests
npm run test:api           # Tests API
npm run test:database      # Tests database
npm run test:frontend      # Tests frontend
```

### Déploiement
```bash
scripts/deployment/deploy.sh           # Déploiement
scripts/deployment/setup-server.sh     # Configuration serveur
```

## Documentation Documentation

- `README.md` : Documentation principale
- `docs/development/` : Guide de développement
- `docs/deployment/` : Guide de déploiement
- `docs/api/` : Documentation API
- `tests/README.md` : Guide des tests

## Configuration Configuration

- `env.example` : Variables d'environnement
- `docker-compose.yml` : Services Docker
- `tsconfig.json` : Configuration TypeScript
EOF

log_success "Fichier PROJECT-STRUCTURE.md créé"

# Créer des liens symboliques pour faciliter l'accès
log_info "Création des liens d'accès rapide..."
ln -sf scripts/setup/setup-and-run.sh setup.sh 2>/dev/null || true
ln -sf scripts/setup/configure-env.sh configure.sh 2>/dev/null || true
ln -sf scripts/maintenance/cleanup-docker.sh cleanup.sh 2>/dev/null || true

log_success "Liens d'accès rapide créés"

# Résumé final
echo ""
log_success "Nettoyage Nettoyage terminé !"
echo ""
log_info "Dossier Structure organisée:"
echo "   [SUCCESS] Scripts organisés dans scripts/"
echo "   [SUCCESS] Documentation organisée dans docs/"
echo "   [SUCCESS] Assets organisés dans assets/"
echo "   [SUCCESS] Anciens fichiers archivés dans archive/"
echo ""
log_info "Démarrage Accès rapide:"
echo "   ./setup.sh          # Installation complète"
echo "   ./configure.sh      # Configuration variables"
echo "   ./cleanup.sh        # Nettoyage Docker"
echo ""
log_info "Documentation Documentation:"
echo "   PROJECT-STRUCTURE.md  # Structure du projet"
echo "   README.md             # Documentation principale"
echo "   tests/README.md       # Guide des tests"
