#!/bin/bash

# Script de configuration automatique pour Grammachat
# Ce script configure l'environnement de développement complet

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Veuillez installer Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18+ requis. Version actuelle: $(node --version)"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        warning "Docker n'est pas installé. L'installation Docker est recommandée"
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        warning "Docker Compose n'est pas installé. L'installation Docker Compose est recommandée"
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        error "Git n'est pas installé"
        exit 1
    fi
    
    success "Prérequis vérifiés"
}

# Installer les dépendances backend
install_backend_dependencies() {
    log "Installation des dépendances backend..."
    
    cd backend
    
    if [ ! -f "package.json" ]; then
        error "package.json non trouvé dans le dossier backend"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        success "Dépendances backend installées"
    else
        error "Échec de l'installation des dépendances backend"
        exit 1
    fi
    
    cd ..
}

# Installer les dépendances frontend
install_frontend_dependencies() {
    log "Installation des dépendances frontend..."
    
    cd frontend
    
    if [ ! -f "package.json" ]; then
        error "package.json non trouvé dans le dossier frontend"
        exit 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        success "Dépendances frontend installées"
    else
        error "Échec de l'installation des dépendances frontend"
        exit 1
    fi
    
    cd ..
}

# Installer les dépendances des tests
install_test_dependencies() {
    log "Installation des dépendances des tests..."
    
    cd tests/automation
    
    if [ ! -f "package.json" ]; then
        log "Création du package.json pour les tests..."
        cat > package.json << EOF
{
  "name": "grammachat-tests",
  "version": "1.0.0",
  "description": "Tests automatisés pour Grammachat",
  "scripts": {
    "test": "node run-tests.js"
  },
  "dependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
EOF
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        success "Dépendances des tests installées"
    else
        error "Échec de l'installation des dépendances des tests"
        exit 1
    fi
    
    cd ../..
}

# Configurer les variables d'environnement
setup_environment() {
    log "Configuration des variables d'environnement..."
    
    # Créer le fichier .env principal
    if [ ! -f ".env" ]; then
        log "Création du fichier .env..."
        cp env.example .env
        success "Fichier .env créé"
    else
        warning "Fichier .env existe déjà"
    fi
    
    # Créer le fichier .env backend
    if [ ! -f "backend/.env" ]; then
        log "Création du fichier .env backend..."
        cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/grammachat
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
LANGUAGETOOL_API_KEY=your-languagetool-api-key
XP_PER_CHARACTER=1
XP_BONUS_NO_ERRORS=10
XP_PENALTY_PER_ERROR=5
LEVEL_UP_THRESHOLD=100
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
EOF
        success "Fichier .env backend créé"
    else
        warning "Fichier .env backend existe déjà"
    fi
    
    # Créer le fichier .env frontend
    if [ ! -f "frontend/.env" ]; then
        log "Création du fichier .env frontend..."
        cat > frontend/.env << EOF
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_ENVIRONMENT=development
EOF
        success "Fichier .env frontend créé"
    else
        warning "Fichier .env frontend existe déjà"
    fi
}

# Configurer Git hooks
setup_git_hooks() {
    log "Configuration des Git hooks..."
    
    # Créer le dossier .git/hooks s'il n'existe pas
    mkdir -p .git/hooks
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook pour Grammachat
echo "🔍 Exécution des vérifications pre-commit..."

# Vérifier ESLint backend
if [ -d "backend" ]; then
    cd backend
    if npm run lint > /dev/null 2>&1; then
        echo "✅ ESLint backend OK"
    else
        echo "❌ ESLint backend échoué"
        exit 1
    fi
    cd ..
fi

# Vérifier ESLint frontend
if [ -d "frontend" ]; then
    cd frontend
    if npm run lint > /dev/null 2>&1; then
        echo "✅ ESLint frontend OK"
    else
        echo "❌ ESLint frontend échoué"
        exit 1
    fi
    cd ..
fi

# Vérifier Prettier
if command -v prettier &> /dev/null; then
    if prettier --check "**/*.{ts,tsx,js,jsx,json,md}" > /dev/null 2>&1; then
        echo "✅ Prettier OK"
    else
        echo "❌ Prettier échoué - Formatage incorrect"
        exit 1
    fi
fi

echo "✅ Toutes les vérifications pre-commit sont passées"
EOF

    chmod +x .git/hooks/pre-commit
    success "Git hooks configurés"
}

# Compiler le backend
build_backend() {
    log "Compilation du backend..."
    
    cd backend
    
    if npm run build > /dev/null 2>&1; then
        success "Backend compilé avec succès"
    else
        error "Échec de la compilation du backend"
        exit 1
    fi
    
    cd ..
}

# Lancer les tests
run_tests() {
    log "Exécution des tests..."
    
    # Tests backend
    cd backend
    if npm test > /dev/null 2>&1; then
        success "Tests backend passés"
    else
        warning "Tests backend échoués (normal si pas encore implémentés)"
    fi
    cd ..
    
    # Tests frontend
    cd frontend
    if npm test > /dev/null 2>&1; then
        success "Tests frontend passés"
    else
        warning "Tests frontend échoués (normal si pas encore implémentés)"
    fi
    cd ..
}

# Créer les dossiers nécessaires
create_directories() {
    log "Création des dossiers nécessaires..."
    
    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p frontend/assets/images
    mkdir -p docs/images
    mkdir -p scripts
    
    success "Dossiers créés"
}

# Afficher les instructions finales
show_final_instructions() {
    echo ""
    echo "🎉 Configuration terminée avec succès !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo ""
    echo "1. 🔧 Configurer les variables d'environnement :"
    echo "   - Éditer .env et backend/.env"
    echo "   - Ajouter votre clé API LanguageTool"
    echo "   - Configurer les secrets JWT"
    echo ""
    echo "2. 🐳 Démarrer les services avec Docker :"
    echo "   docker-compose up -d"
    echo ""
    echo "3. 🚀 Démarrer l'application :"
    echo "   # Backend (Terminal 1)"
    echo "   cd backend && npm run dev"
    echo ""
    echo "   # Frontend (Terminal 2)"
    echo "   cd frontend && npm start"
    echo ""
    echo "4. 📱 Tester l'application :"
    echo "   - Ouvrir http://localhost:3000/api/health"
    echo "   - Scanner le QR code avec Expo Go"
    echo ""
    echo "5. 📚 Consulter la documentation :"
    echo "   - docs/installation.md"
    echo "   - docs/development.md"
    echo "   - docs/api/README.md"
    echo ""
    echo "🔗 Liens utiles :"
    echo "   - API Health: http://localhost:3000/api/health"
    echo "   - Documentation: ./docs/"
    echo "   - Tests: npm run test (dans chaque dossier)"
    echo ""
    echo "🐛 En cas de problème :"
    echo "   - Vérifier les logs: docker-compose logs"
    echo "   - Consulter docs/installation.md"
    echo "   - Vérifier les prérequis"
    echo ""
    success "Configuration terminée ! Bon développement ! 🚀"
}

# Fonction principale
main() {
    echo "🔥 Grammachat - Configuration automatique"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    create_directories
    install_backend_dependencies
    install_frontend_dependencies
    install_test_dependencies
    setup_environment
    setup_git_hooks
    build_backend
    run_tests
    show_final_instructions
}

# Exécuter le script principal
main "$@"
