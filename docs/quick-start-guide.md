# Guide de démarrage rapide - GrammaChat

## Installation et configuration

### 1. Prérequis
- Node.js 18+ 
- MongoDB
- Expo CLI (pour le frontend mobile)

### 2. Installation des dépendances

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Configuration de l'environnement

#### Backend (.env)
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/grammachat

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Admin par défaut
ADMIN_EMAIL=admin@grammachat.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456

# Niveau et XP
LEVEL_UP_THRESHOLD=100
```

#### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Démarrage des services

#### Base de données MongoDB
```bash
# Avec Docker
docker-compose up -d mongodb

# Ou localement
mongod
```

#### Backend
```bash
cd backend
npm run dev
```

#### Frontend
```bash
cd frontend
npm start
```

## Première utilisation

### 1. Créer le premier administrateur
```bash
cd backend
npm run create-admin
```

### 2. Tester l'inscription d'un utilisateur
1. Ouvrir l'application mobile
2. Aller sur l'écran d'inscription
3. Remplir le formulaire avec :
   - Email : `user@test.com`
   - Username : `testuser`
   - Mot de passe : `password123`
   - Type de compte : Utilisateur

### 3. Tester la connexion
1. Aller sur l'écran de connexion
2. Utiliser les identifiants créés
3. Vérifier que la connexion fonctionne

### 4. Tester les fonctionnalités admin
1. Se connecter avec le compte admin
2. Créer un autre compte administrateur via l'API
3. Vérifier l'accès aux fonctionnalités admin

## Tests

### Tests automatisés
```bash
cd backend
npm test
```

### Tests manuels
Suivre le guide dans `tests/manual/role-testing.md`

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription utilisateur
- `POST /api/auth/login` - Connexion
- `POST /api/auth/create-admin` - Créer admin (admin seulement)
- `GET /api/auth/profile` - Profil utilisateur

### Utilisateurs
- `GET /api/users` - Liste utilisateurs (admin seulement)
- `GET /api/users/:id` - Profil utilisateur
- `PUT /api/users/:id` - Modifier profil
- `DELETE /api/users/:id` - Supprimer utilisateur (admin seulement)
- `GET /api/users/leaderboard` - Classement (public)

### Messages
- `POST /api/messages` - Envoyer message
- `GET /api/messages` - Liste messages
- `GET /api/messages/:id` - Détail message
- `DELETE /api/messages/:id` - Supprimer message

## Dépannage

### Problèmes courants

#### Backend ne démarre pas
- Vérifier que MongoDB est démarré
- Vérifier les variables d'environnement
- Vérifier que le port 3000 est libre

#### Frontend ne se connecte pas au backend
- Vérifier l'URL de l'API dans .env
- Vérifier que le backend est démarré
- Vérifier la configuration CORS

#### Erreurs d'authentification
- Vérifier JWT_SECRET dans .env
- Vérifier que les tokens ne sont pas expirés
- Vérifier les permissions des rôles

### Logs utiles
```bash
# Backend logs
cd backend
npm run dev

# MongoDB logs
docker-compose logs mongodb
```

## Support

Pour plus d'informations :
- Documentation complète : `docs/authentication-and-roles.md`
- Tests manuels : `tests/manual/role-testing.md`
- Architecture : `docs/architecture.md`
