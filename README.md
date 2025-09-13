# Grammachat - Application de Messagerie Gamifiée

## 🎯 Vue d'ensemble

Grammachat est une application mobile de messagerie gamifiée qui récompense les utilisateurs pour leur bonne orthographe et grammaire. Les utilisateurs gagnent de l'XP en envoyant des messages corrects et peuvent voir leur niveau progresser.

## 🏗️ Architecture

- **Frontend Mobile**: React Native avec Expo (iOS/Android)
- **Backend API**: Node.js avec Express
- **Base de données**: MongoDB (NoSQL)
- **Containérisation**: Docker
- **Vérification orthographique**: LanguageTool API
- **Notifications**: Expo Notifications

## 📁 Structure du Projet

```
grammachat/
├── frontend/          # Application React Native/Expo
├── backend/           # API Node.js
├── docker/            # Configuration Docker
├── docs/              # Documentation
├── tests/             # Tests d'intégration
├── .gitlab-ci.yml     # Pipeline CI/CD
└── README.md
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd grammachat
```

2. **Lancer avec Docker**
```bash
docker-compose up -d
```

3. **Installer les dépendances frontend**
```bash
cd frontend
npm install
```

4. **Créer le premier administrateur**
```bash
cd backend
npm run create-admin
```

5. **Lancer l'application mobile**
```bash
cd frontend
npm start
```

6. **Tester l'application**
```bash
# Tests automatisés
cd backend && npm test

# Tests d'intégration
./scripts/test-integration.sh
```

## 📱 Fonctionnalités MVP

- ✅ **Authentification complète** : Inscription/connexion avec gestion des rôles
- ✅ **Interface d'inscription moderne** : Formulaire React Native avec validation
- ✅ **Gestion des rôles** : Utilisateurs normaux et administrateurs
- ✅ **Sécurité JWT** : Authentification stateless sécurisée
- ✅ **Envoi de messages** : Messagerie avec vérification orthographique
- ✅ **Système de gamification** : XP, niveaux et classement
- ✅ **Profil utilisateur** : Gestion des données personnelles
- ✅ **API sécurisée** : Routes protégées selon les rôles
- ✅ **Tests complets** : Tests automatisés et manuels

## 🛠️ Technologies

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Base de données**: MongoDB
- **Authentification**: JWT
- **Tests**: Jest, Supertest
- **CI/CD**: GitLab CI

## 📖 Documentation

Voir le dossier `docs/` pour la documentation complète :
- [Guide de démarrage rapide](docs/quick-start-guide.md)
- [Authentification et rôles](docs/authentication-and-roles.md)
- [Guide d'installation](docs/installation.md)
- [API Documentation](docs/api/README.md)
- [Architecture](docs/architecture.md)
- [Tests manuels](tests/manual/role-testing.md)

## 🎨 Design

- **Logo principal**: `Grammachat.png` (logo complet avec texte)
- **Mascotte**: `Grammachat2.png` (phénix seul)

## 📄 Licence

MIT License
