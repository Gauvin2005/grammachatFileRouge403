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

- Authentification JWT avec cache Redis
- Messagerie avec vérification orthographique (LanguageTool)
- Système de gamification (XP, niveaux, classement)
- Interface mobile moderne avec cache optimisé
- Système de cache intelligent (70% réduction des appels API)

##  Documentation

- [Démarrage Rapide](QUICK-START.md)
- [Documentation Technique](TECH.md)
- [Installation](docs/installation.md)
- [Développement](docs/development.md)
- [Performance et Cache](docs/performance.md)
- [API Backend](backend/README.md)
- [Cache Frontend](frontend/docs/api-cache.md)
- [Cache Backend](backend/docs/redis-cache.md)

##  Tests

```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test
```

##  Licence

MIT
