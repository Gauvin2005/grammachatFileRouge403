# Démarrage Rapide

## Installation

```bash
git clone <repo>
cd grammachat
cp env.example .env # Mettre la bonne clé secrète dans le fichier de configuration !
docker-compose up -d
cd frontend && npm install
cd ../backend && npm run create-admin
cd ../frontend && npm start
```

## Accès

- **App Mobile** : Expo Go sur téléphone
- **API** : http://localhost:3000/api/health
- **Swagger** : http://localhost:3000/api-docs

## Test

```bash
# Compte admin créé automatiquement
Email: admin@grammachat.com
Password: admin123
```

## Arrêt

```bash
docker-compose down
```
