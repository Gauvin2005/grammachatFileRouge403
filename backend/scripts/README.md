# Scripts utiles pour Grammachat

## Création d'un compte administrateur

### Option 1: Script npm (recommandé)
```bash
cd backend
MONGODB_URI=mongodb://localhost:27018/grammachat npm run create-admin
```

### Option 2: Script shell à la racine du projet
```bash
./create-admin.sh
```

### Option 3: Avec des identifiants personnalisés
```bash
cd backend
MONGODB_URI=mongodb://localhost:27018/grammachat \
ADMIN_EMAIL=monadmin@example.com \
ADMIN_USERNAME=monadmin \
ADMIN_PASSWORD=monsecurepassword \
npm run create-admin
```

### Forcer la création si un admin existe déjà
```bash
cd backend
MONGODB_URI=mongodb://localhost:27018/grammachat npm run create-admin -- --force
```

## Vérifier les utilisateurs dans la BDD

```bash
cd backend
MONGODB_URI=mongodb://localhost:27018/grammachat npx ts-node -r tsconfig-paths/register scripts/check-users.ts
```

## Paramètres par défaut

- **Email**: admin@grammachat.com
- **Username**: admin
- **Password**: admin123456
- **MongoDB URI**: mongodb://localhost:27018/grammachat

## Connexion au compte admin

Email: `admin@grammachat.com`  
Password: `admin123`  
Username: `admin`

## Scripts disponibles

- `create-admin.ts` - Créer un compte admin
- `create-default-accounts.ts` - Créer des comptes de test (user1, user2, admin)
- `check-users.ts` - Vérifier les utilisateurs dans la BDD

## Tests de connexion

Pour tester la connexion au compte admin, utilisez:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grammachat.com","password":"admin123"}'
```

