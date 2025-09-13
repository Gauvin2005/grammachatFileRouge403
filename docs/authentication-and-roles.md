# Documentation - Authentification et Gestion des Rôles

## Vue d'ensemble

GrammaChat implémente un système d'authentification robuste avec gestion des rôles utilisateur. Le système distingue deux types d'utilisateurs : les utilisateurs normaux (`user`) et les administrateurs (`admin`).

## Architecture d'authentification

### Technologies utilisées
- **JWT (JSON Web Tokens)** : Pour l'authentification stateless
- **bcrypt** : Pour le hachage sécurisé des mots de passe
- **MongoDB** : Pour la persistance des données utilisateur
- **Express.js** : Pour les middlewares d'authentification

### Structure des rôles

```typescript
type UserRole = 'user' | 'admin';

interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}
```

## Interface utilisateur (Frontend)

### Écran d'inscription

L'interface d'inscription est développée avec React Native/Expo et offre :

#### Fonctionnalités
- **Formulaire de validation** : Validation en temps réel des champs
- **Sélection de rôle** : Interface intuitive pour choisir le type de compte
- **Gestion des erreurs** : Affichage clair des messages d'erreur
- **Design moderne** : Interface utilisateur attrayante et responsive

#### Champs du formulaire
- **Nom d'utilisateur** : 3-20 caractères, lettres, chiffres et underscores uniquement
- **Email** : Format email valide, normalisé en minuscules
- **Mot de passe** : Minimum 6 caractères avec confirmation
- **Type de compte** : Sélection entre "Utilisateur" et "Administrateur"

#### Validation côté client
```typescript
const validationRules = {
  username: {
    required: 'Nom d\'utilisateur requis',
    minLength: { value: 3, message: 'Minimum 3 caractères' },
    maxLength: { value: 20, message: 'Maximum 20 caractères' },
    pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Caractères autorisés : lettres, chiffres, underscores' }
  },
  email: {
    required: 'Email requis',
    pattern: { value: /^\S+@\S+$/i, message: 'Format email invalide' }
  },
  password: {
    required: 'Mot de passe requis',
    minLength: { value: 6, message: 'Minimum 6 caractères' }
  },
  confirmPassword: {
    required: 'Confirmation requise',
    validate: (value: string) => value === password || 'Les mots de passe ne correspondent pas'
  }
};
```

## API Backend

### Endpoints d'authentification

#### 1. Inscription publique
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "role": "user" // Ignoré, forcé à "user"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Compte utilisateur créé avec succès",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "xp": 0,
      "level": 1
    },
    "token": "jwt_token"
  }
}
```

#### 2. Connexion
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 3. Création d'administrateur (Admin seulement)
```http
POST /api/auth/create-admin
Authorization: Bearer admin_token
Content-Type: application/json

{
  "email": "admin@example.com",
  "username": "admin",
  "password": "password123"
}
```

#### 4. Profil utilisateur
```http
GET /api/auth/profile
Authorization: Bearer user_token
```

### Middlewares de sécurité

#### 1. Authentification JWT
```typescript
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  // Vérification du token JWT
  // Extraction de l'utilisateur depuis la base de données
  // Ajout de l'utilisateur à req.user
};
```

#### 2. Vérification du rôle admin
```typescript
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Vérification que l'utilisateur est authentifié
  // Vérification que le rôle est 'admin'
};
```

#### 3. Vérification de propriété
```typescript
export const requireOwnership = (req: Request, res: Response, next: NextFunction) => {
  // Vérification que l'utilisateur accède à ses propres données
  // Ou que l'utilisateur est admin
};
```

## Gestion des rôles

### Rôle 'user' (Utilisateur normal)
**Permissions :**
- ✅ S'inscrire et se connecter
- ✅ Voir son propre profil
- ✅ Modifier son propre profil
- ✅ Envoyer des messages
- ✅ Voir les messages
- ✅ Consulter le classement
- ❌ Créer des comptes administrateurs
- ❌ Voir la liste de tous les utilisateurs
- ❌ Supprimer d'autres utilisateurs

### Rôle 'admin' (Administrateur)
**Permissions :**
- ✅ Toutes les permissions des utilisateurs normaux
- ✅ Créer des comptes administrateurs
- ✅ Voir la liste de tous les utilisateurs
- ✅ Voir le profil de n'importe quel utilisateur
- ✅ Supprimer des utilisateurs
- ✅ Accéder aux statistiques avancées

## Sécurité

### Hachage des mots de passe
```typescript
// Utilisation de bcrypt avec un salt de 12 rounds
const salt = await bcrypt.genSalt(12);
const hashedPassword = await bcrypt.hash(password, salt);
```

### Validation des tokens JWT
```typescript
// Configuration JWT
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

// Génération du token
const token = jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });
```

### Protection contre les attaques
- **Rate limiting** : Limitation du nombre de requêtes
- **Validation stricte** : Validation de tous les inputs
- **CORS** : Configuration appropriée des en-têtes
- **Helmet** : Sécurisation des en-têtes HTTP

## Scripts d'administration

### Création du premier administrateur
```bash
cd backend
npm run create-admin
```

**Variables d'environnement :**
```env
ADMIN_EMAIL=admin@grammachat.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456
```

### Vérification des utilisateurs
```bash
cd backend
npm run check-users
```

## Tests

### Tests automatisés
```bash
# Tests complets
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests manuels
Voir le fichier `tests/manual/role-testing.md` pour les procédures de test détaillées.

## Configuration

### Variables d'environnement requises
```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/grammachat

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Admin par défaut
ADMIN_EMAIL=admin@grammachat.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123456

# Niveau et XP
LEVEL_UP_THRESHOLD=100
```

### Configuration de production
- Utiliser des secrets JWT forts et uniques
- Configurer HTTPS pour toutes les communications
- Implémenter une rotation des secrets
- Surveiller les tentatives de connexion échouées
- Limiter les tentatives de connexion par IP

## Dépannage

### Problèmes courants

#### 1. Token JWT invalide
**Symptôme :** Erreur 403 "Token invalide"
**Solution :** Vérifier que le token n'est pas expiré et que JWT_SECRET est correct

#### 2. Accès refusé aux routes admin
**Symptôme :** Erreur 403 "Accès administrateur requis"
**Solution :** Vérifier que l'utilisateur a bien le rôle 'admin'

#### 3. Échec de connexion
**Symptôme :** Erreur 401 "Email ou mot de passe incorrect"
**Solution :** Vérifier les credentials et l'état de la base de données

#### 4. Erreur de validation
**Symptôme :** Erreur 400 "Données invalides"
**Solution :** Vérifier le format des données envoyées

### Logs et monitoring
```typescript
// Exemple de logging des tentatives d'authentification
console.log(`Tentative de connexion: ${email} - ${success ? 'Succès' : 'Échec'}`);
```

## Évolutions futures

### Fonctionnalités prévues
- **Rôles supplémentaires** : Modérateur, VIP, etc.
- **Authentification 2FA** : Authentification à deux facteurs
- **OAuth** : Connexion via Google, Facebook, etc.
- **Sessions** : Gestion des sessions utilisateur
- **Audit** : Logs détaillés des actions utilisateur

### Améliorations de sécurité
- **Rate limiting avancé** : Par utilisateur et par IP
- **Détection d'intrusion** : Surveillance des tentatives suspectes
- **Chiffrement** : Chiffrement des données sensibles
- **Backup** : Sauvegarde sécurisée des données utilisateur
