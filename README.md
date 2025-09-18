# Grammachat

Application mobile de messagerie gamifiée qui récompense les utilisateurs pour leur bonne orthographe.

##  Démarrage Rapide

Voir [QUICK-START.md](QUICK-START.md) pour l'installation en 5 minutes.

##  Architecture

- **Frontend**: React Native + Expo
- **Backend**: Node.js + Express + TypeScript  
- **Base de données**: MongoDB + Redis
- **Containerisation**: Docker

##  Fonctionnalités

- Authentification JWT
- Messagerie avec vérification orthographique (LanguageTool)
- Système de gamification (XP, niveaux, classement)
- Interface mobile moderne

##  Documentation

- [Démarrage Rapide](QUICK-START.md)
- [Documentation Technique](TECH.md)
- [Installation](docs/installation.md)
- [Développement](docs/development.md)
- [API Backend](backend/README.md)

##  Tests

```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test
```

##  Licence

MIT
