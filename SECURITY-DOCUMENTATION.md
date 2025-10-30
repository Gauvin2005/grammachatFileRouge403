# Documentation de Sécurité - Grammachat


Ce document explique les mécanismes de sécurité implémentés dans l'application Grammachat, incluant l'authentification JWT, la protection des routes, et la gestion des rôles utilisateurs.

## Architecture de Sécurité

### 1. Authentification JWT (JSON Web Tokens)

#### Fonctionnement du Token JWT

Le système d'authentification utilise des tokens JWT pour sécuriser les communications entre le frontend et le backend.

**Structure du Token :**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1640995200,
  "exp": 1641600000
}
```

**Processus d'authentification :**

1. **Connexion utilisateur** (`POST /api/auth/login`)
   - L'utilisateur fournit email + mot de passe
   - Le serveur vérifie les identifiants
   - Si valides, génère un token JWT avec l'ID utilisateur
   - Le token est signé avec `JWT_SECRET`
   - Durée de vie : 7 jours par défaut

2. **Stockage du token**
   - Frontend : Stocké dans `SecureStore` (Expo)
   - Backend : Aucun stockage (stateless)

3. **Utilisation du token**
   - Chaque requête authentifiée inclut : `Authorization: Bearer <token>`
   - Le middleware `authenticateToken` vérifie et décode le token
   - L'utilisateur est attaché à `req.user`

#### Configuration JWT

```typescript
// Variables d'environnement requises
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d

// Génération du token
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

### 2. Protection des Routes

#### Middleware d'Authentification

**Fichier :** `backend/src/middleware/auth.ts`

```typescript
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    
    // 3. Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // 4. Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        message: 'Token invalide'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};
```

#### Middleware de Vérification des Rôles

```typescript
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès administrateur requis'
    });
  }

  next();
};
```

#### Middleware de Propriété

```typescript
export const requireOwnership = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const userId = req.params.userId || req.params.id;
  
  // Admin peut accéder à tout, utilisateur seulement à ses propres données
  if (req.user.role !== 'admin' && req.user._id?.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à cette ressource'
    });
  }

  next();
};
```

### 3. Routes Protégées

#### Routes Publiques (Aucune authentification requise)

```typescript
// Authentification
POST /api/auth/register    // Inscription
POST /api/auth/login       // Connexion

// Utilisateurs
POST /api/users            // Création d'utilisateur (admin seulement)
GET  /api/users/leaderboard // Classement public

// Messages
GET  /api/messages         // Liste des messages (authentifié)
POST /api/messages         // Envoyer message (authentifié)
```

#### Routes Authentifiées (Token JWT requis)

```typescript
// Profil utilisateur
GET /api/auth/profile      // Profil de l'utilisateur connecté

// Messages
GET  /api/messages         // Messages de l'utilisateur
POST /api/messages         // Envoyer un message
GET  /api/messages/:id     // Détails d'un message
DELETE /api/messages/:id   // Supprimer un message

// Utilisateurs
GET  /api/users/:id        // Profil d'un utilisateur
PUT  /api/users/:id        // Modifier profil (propriétaire ou admin)
```

#### Routes Administrateur (Rôle admin requis)

```typescript
// Gestion des utilisateurs
POST   /api/users          // Créer un utilisateur
GET    /api/users          // Liste tous les utilisateurs
DELETE /api/users/:id      // Supprimer un utilisateur

// Gestion des administrateurs
POST   /api/auth/create-admin // Créer un compte admin
```

### 4. Sécurité des Mots de Passe

#### Hachage avec bcrypt

**Configuration :**
- Algorithme : bcrypt
- Salt rounds : 12
- Coût : Équilibre sécurité/performance

**Implémentation :**

```typescript
// Middleware Mongoose pour hasher automatiquement
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode de comparaison
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
```

#### Validation des Mots de Passe

```typescript
// Règles de validation
- Longueur minimale : 6 caractères
- Validation côté client et serveur
- Pas de stockage en clair
- Comparaison sécurisée avec bcrypt
```

### 5. Gestion des Rôles

#### Types de Rôles

```typescript
enum UserRole {
  USER = 'user',    // Utilisateur standard
  ADMIN = 'admin'   // Administrateur
}
```

#### Permissions par Rôle

**Utilisateur Standard (`user`) :**
- Se connecter et voir son profil
- Envoyer des messages
- Voir le classement
- Modifier son propre profil

**Administrateur (`admin`) :**
- Toutes les permissions utilisateur
- Créer des utilisateurs
- Voir tous les utilisateurs
- Supprimer des utilisateurs
- Créer d'autres administrateurs

#### Vérification des Rôles

```typescript
// Dans les contrôleurs
if (req.user.role !== 'admin') {
  return res.status(403).json({
    success: false,
    message: 'Accès administrateur requis'
  });
}

// Dans le frontend
if (user?.role === 'admin') {
  // Afficher les options d'administration
}
```

### 6. Sécurité Frontend

#### Stockage Sécurisé

```typescript
// Utilisation d'Expo SecureStore
import * as SecureStore from 'expo-secure-store';

// Stockage du token
await SecureStore.setItemAsync('auth_token', token);

// Récupération du token
const token = await SecureStore.getItemAsync('auth_token');

// Suppression du token
await SecureStore.deleteItemAsync('auth_token');
```

#### Intercepteurs Axios

```typescript
// Ajout automatique du token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      // Rediriger vers la page de connexion
    }
    return Promise.reject(error);
  }
);
```

### 7. Bonnes Pratiques de Sécurité

#### Variables d'Environnement

```bash
# .env (NE JAMAIS COMMITER)
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
MONGODB_URI=mongodb://localhost:27018/grammachat
ADMIN_EMAIL=admin@grammachat.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-admin-password
```

#### Validation des Données

```typescript
// Validation côté serveur avec express-validator
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
];
```

#### Protection contre les Attaques

1. **Injection de requêtes** : Utilisation de Mongoose avec validation
2. **XSS** : Échappement des données utilisateur
3. **CSRF** : Tokens JWT dans les headers
4. **Brute force** : Rate limiting (à implémenter)
5. **Données sensibles** : Exclusion des mots de passe des réponses JSON

### 8. Gestion des Erreurs de Sécurité

#### Codes d'Erreur Standardisés

```typescript
// 401 - Non authentifié
{
  "success": false,
  "message": "Token d'accès requis"
}

// 403 - Non autorisé
{
  "success": false,
  "message": "Accès administrateur requis"
}

// 404 - Ressource non trouvée
{
  "success": false,
  "message": "Utilisateur non trouvé"
}

// 409 - Conflit
{
  "success": false,
  "message": "Email déjà utilisé"
}
```

#### Journalisation de Sécurité

```typescript
// Logs des tentatives d'accès non autorisées
console.error('Tentative d\'accès non autorisée:', {
  userId: req.user?._id,
  route: req.path,
  method: req.method,
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

### 9. Recommandations de Déploiement

#### Production

1. **Variables d'environnement sécurisées**
2. **HTTPS obligatoire**
3. **JWT_SECRET fort et unique**
4. **Base de données sécurisée**
5. **Monitoring des tentatives d'intrusion**

#### Développement

1. **Utilisation de tokens de test**
2. **Base de données de développement**
3. **Logs détaillés activés**
4. **Validation stricte désactivée pour les tests**

### 10. Scripts de Sécurité

#### Création d'Administrateur

```bash
# Script pour créer le premier admin
npm run create-admin

# Variables d'environnement requises
ADMIN_EMAIL=admin@grammachat.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

#### Vérification de Sécurité

```bash
# Vérifier la configuration
npm run check-security

# Tester les routes protégées
npm run test-auth
```

## Conclusion

Cette architecture de sécurité fournit une base solide pour l'application Grammachat avec :

- Authentification JWT stateless
- Protection des routes par rôles
- Hachage sécurisé des mots de passe
- Validation des données
- Gestion des erreurs standardisée
