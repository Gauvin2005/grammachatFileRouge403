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

4. **Lancer l'application mobile**
```bash
npm start
```

## 📱 Fonctionnalités MVP

- ✅ Authentification utilisateur (inscription/connexion)
- ✅ Envoi de messages texte
- ✅ Vérification orthographique avec LanguageTool
- ✅ Système de gamification (XP, niveaux)
- ✅ Profil utilisateur
- ✅ Rôles utilisateur (Standard/Admin)

## 🛠️ Technologies

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Base de données**: MongoDB
- **Authentification**: JWT
- **Tests**: Jest, Supertest
- **CI/CD**: GitLab CI

## 📖 Documentation

Voir le dossier `docs/` pour la documentation complète :
- [Guide d'installation](docs/installation.md)
- [API Documentation](docs/api.md)
- [Architecture](docs/architecture.md)
- [Tests](docs/tests.md)

## 🎨 Design

- **Logo principal**: `Grammachat.png` (logo complet avec texte)
- **Mascotte**: `Grammachat2.png` (phénix seul)

## 📄 Licence

MIT License
