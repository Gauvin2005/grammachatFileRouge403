# Développement

## Démarrage

```bash
# Services
docker-compose up -d

# Backend (dev)
cd backend && npm run dev

# Frontend
cd frontend && npm start
```

## Structure

```
grammachat/
├── backend/     # API Node.js/Express
├── frontend/    # App React Native
└── docker-compose.yml
```

## Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## API

- Swagger : http://localhost:3000/api-docs
- Health : http://localhost:3000/api/health

## Dépannage

| Problème | Solution |
|----------|----------|
| Port 3000 occupé | `lsof -ti:3000 \| xargs kill` |
| MongoDB erreur | `docker-compose restart mongodb` |
| Cache npm | `npm cache clean --force` |