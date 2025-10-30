# Documentation Technique

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native │    │   Express API   │    │    MongoDB      │
│   (Expo)        │◄──►│   (TypeScript)  │◄──►│    + Redis      │
│   Frontend      │    │   Backend       │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Stack Technique

- **Frontend**: React Native, Expo, TypeScript, Redux Toolkit
- **Backend**: Node.js, Express, TypeScript, JWT
- **Database**: MongoDB, Redis (cache + sessions)
- **Cache**: Système de cache optimisé (frontend + backend)
- **Containerisation**: Docker, Docker Compose
- **API**: RESTful, Swagger/OpenAPI
- **Tests**: Jest, Supertest

## Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | Backend Express |
| MongoDB | 27018 | Base de données |
| Redis | 6379 | Cache |

## Endpoints Principaux

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/messages` - Messages
- `POST /api/messages` - Envoyer message
- `GET /api/users/leaderboard` - Classement

## Variables d'Environnement

```bash
API_PORT=3000
MONGODB_URI=mongodb://mongodb:27017/grammachat
JWT_SECRET=your-secret-key
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check

# Cache Redis
REDIS_SESSION_TTL=604800    # 7 jours
REDIS_MESSAGES_TTL=300       # 5 minutes  
REDIS_LEADERBOARD_TTL=600    # 10 minutes
REDIS_PROFILE_TTL=900        # 15 minutes
REDIS_STATS_TTL=1800         # 30 minutes
```

## Scripts Utiles

```bash
# Backend
npm run dev          # Développement
npm run build        # Compilation
npm test            # Tests
npm run create-admin # Créer admin

# Frontend
npm start           # Expo
npm test           # Tests
npm run build:android # Build Android
```
