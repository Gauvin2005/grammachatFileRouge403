# Installation

## Prérequis
- Node.js 18+
- Docker & Docker Compose
- Git

## Installation

```bash
# 1. Cloner et configurer
git clone <repo>
cd grammachat
cp env.example .env

# 2. Démarrer les services
docker-compose up -d

# 3. Installer frontend
cd frontend && npm install

# 4. Créer admin
cd ../backend && npm run create-admin

# 5. Lancer l'app
cd ../frontend && npm start
```

## Configuration (.env)

```bash
API_PORT=3000
MONGODB_URI=mongodb://mongodb:27017/grammachat
JWT_SECRET=cle_secrete_ici
LANGUAGETOOL_API_URL=https://api.languagetool.org/v2/check
```

## Vérification

```bash
# API
curl http://localhost:3000/api/health

# Swagger
open http://localhost:3000/api-docs
```

## Dépannage

| Problème | Solution |
|----------|----------|
| Port 3000 occupé | Changer `API_PORT` dans `.env` |
| MongoDB erreur | `docker-compose restart mongodb` |
| Permission Docker | `sudo usermod -aG docker $USER` |