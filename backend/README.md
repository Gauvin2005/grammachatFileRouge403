# Backend API

Express API avec TypeScript, MongoDB et Redis. Système de cache optimisé pour les performances.

## Démarrage

```bash
# Docker
docker-compose up -d

# Local
npm install && npm run dev
```

## API

- Swagger : http://localhost:3000/api-docs
- Health : http://localhost:3000/api/health

## Tests

```bash
npm test
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Développement |
| `npm run build` | Compilation |
| `npm run start` | Production |
| `npm run create-admin` | Créer admin |

## Configuration (.env)

```bash
API_PORT=3000
MONGODB_URI=mongodb://mongodb:27017/grammachat
JWT_SECRET=...
LANGUAGETOOL_API_URL=...

# Cache Redis (optionnel)
REDIS_SESSION_TTL=604800    # 7 jours
REDIS_MESSAGES_TTL=300       # 5 minutes  
REDIS_LEADERBOARD_TTL=600    # 10 minutes
REDIS_PROFILE_TTL=900        # 15 minutes
REDIS_STATS_TTL=1800         # 30 minutes
```

## Structure

```
src/
├── controllers/ # Logique métier
├── middleware/  # Auth, validation
├── models/      # Mongoose schemas
├── routes/      # Routes Express
├── services/    # Services externes
└── server.ts    # Point d'entrée
```
