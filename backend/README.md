# Backend API

Express API avec TypeScript, MongoDB et Redis.

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
