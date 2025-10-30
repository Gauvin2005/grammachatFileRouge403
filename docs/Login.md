Cette page décrit le fonctionnement du système d’authentification de GrammaChat (Frontend React Native/Expo, Backend Node.js/Express, MongoDB).
Le projet repose sur des JSON Web Tokens (JWT) pour gérer des sessions sécurisées sans stockage côté serveur.

1. Fonctionnement du Token JWT

Génération :
Lors d’une connexion (POST /api/auth/login) ou d’une inscription (POST /api/auth/register), le backend crée un JWT via generateToken(userId).
L’API renvoie ensuite :

{ "user": { ... }, "token": "<jwt>" }


Contenu du token :

userId → identifiant de l’utilisateur (MongoDB)

exp → date d’expiration (7 jours par défaut via JWT_EXPIRES_IN)

Signature → calculée avec JWT_SECRET

Le rôle de l’utilisateur n’est pas stocké dans le token : il est vérifié côté serveur à chaque requête.

Côté Frontend :

Le token est enregistré dans SecureStore (auth_token).

Les requêtes utilisent l’en-tête Authorization: Bearer <token>.

En cas de 401 : le token et les données utilisateur sont effacés.

Exemple d’environnement :

JWT_SECRET=exemple_secret
JWT_EXPIRES_IN=7d

2. Sécurisation des Routes

Middleware authenticateToken :

Vérifie la présence du header Authorization.

Décode le token avec jwt.verify.

Recharge l’utilisateur depuis la base (User.findById).

Si le token est invalide : renvoie une erreur 401.

Middleware requireAdmin :

Bloque l’accès si req.user.role !== 'admin' (erreur 403).

Utilisé pour les routes sensibles :

POST /api/users (création d’utilisateur)

GET /api/users (liste complète)

DELETE /api/users/:id (suppression)

3. Gestion des Rôles et Navigation

Rôles :

user → accès au chat, profil et classement

admin → accès en plus à un panneau de gestion (utilisateurs, actions CRUD)

Côté Frontend :

Après connexion : stockage du { user, token } → isAuthenticated = true.

L’application charge alors le MainTabNavigator.

L’écran admin (AdminDashboardScreen) affiche un message d’accès refusé si user.role !== 'admin'.

Sécurité :
L’interface adapte simplement l’affichage, mais la vérification réelle (authentification + rôle) reste gérée exclusivement côté backend.

4. Exemples de Code Clés

Backend – Génération du token :

// backend/src/middleware/auth.ts
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


Frontend – Ajout automatique du token :

// frontend/src/services/api.ts
this.api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


Modèle utilisateur :

// backend/src/models/User.ts
role: { type: String, enum: ['user', 'admin'], required: true }

5. Résumé du Processus

L’utilisateur envoie ses identifiants.

Le backend vérifie en base MongoDB.

Un JWT est généré et renvoyé.

Le frontend le stocke de manière sécurisée.

Chaque requête suivante utilise ce token.

Le backend vérifie le token et le rôle avant d’autoriser l’action.