# Documentation API - Grammachat

## 📋 Vue d'ensemble

L'API RESTful de Grammachat permet de gérer l'authentification, les messages, les utilisateurs et le système de gamification. Elle est construite avec Node.js, Express et TypeScript.

## 🔗 Base URL

- **Développement** : `http://localhost:3000/api`
- **Production** : `https://api.grammachat.com/api`

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Incluez le token dans l'en-tête `Authorization` :

```
Authorization: Bearer <your-jwt-token>
```

## 📚 Endpoints

### Authentification

#### POST `/auth/register`
Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
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

#### POST `/auth/login`
Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "xp": 150,
      "level": 2
    },
    "token": "jwt_token"
  }
}
```

#### GET `/auth/profile`
Récupérer le profil de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Profil récupéré avec succès",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "xp": 150,
      "level": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Messages

#### POST `/messages`
Envoyer un nouveau message.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Bonjour, ceci est un message de test."
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "message": {
      "id": "message_id",
      "content": "Bonjour, ceci est un message de test.",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "xpEarned": 25,
      "errorsFound": [],
      "sender": {
        "id": "user_id",
        "username": "username",
        "email": "user@example.com"
      }
    },
    "xpCalculation": {
      "baseXP": 25,
      "bonusXP": 10,
      "penaltyXP": 0,
      "totalXP": 35,
      "errorsCount": 0,
      "levelUp": false,
      "newLevel": 2
    }
  }
}
```

#### GET `/messages`
Récupérer les messages avec pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Nombre d'éléments par page (défaut: 20)

**Response (200):**
```json
{
  "success": true,
  "message": "Messages récupérés avec succès",
  "data": {
    "data": [
      {
        "id": "message_id",
        "content": "Message content",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "xpEarned": 25,
        "errorsFound": [],
        "sender": {
          "id": "user_id",
          "username": "username",
          "email": "user@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET `/messages/:id`
Récupérer un message spécifique.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Message récupéré avec succès",
  "data": {
    "message": {
      "id": "message_id",
      "content": "Message content",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "xpEarned": 25,
      "errorsFound": [],
      "sender": {
        "id": "user_id",
        "username": "username",
        "email": "user@example.com"
      }
    }
  }
}
```

#### DELETE `/messages/:id`
Supprimer un message.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Message supprimé avec succès"
}
```

### Utilisateurs

#### GET `/users`
Récupérer la liste des utilisateurs (Admin seulement).

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `page` (optional): Numéro de page
- `limit` (optional): Nombre d'éléments par page
- `sortBy` (optional): Champ de tri (xp, level, username, createdAt)
- `sortOrder` (optional): Ordre de tri (asc, desc)

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateurs récupérés avec succès",
  "data": {
    "data": [
      {
        "id": "user_id",
        "email": "user@example.com",
        "username": "username",
        "role": "user",
        "xp": 150,
        "level": 2,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET `/users/leaderboard`
Récupérer le classement des utilisateurs par XP.

**Query Parameters:**
- `limit` (optional): Nombre d'utilisateurs à retourner (défaut: 10)

**Response (200):**
```json
{
  "success": true,
  "message": "Classement récupéré avec succès",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "GrammarMaster",
        "xp": 2500,
        "level": 25
      },
      {
        "rank": 2,
        "username": "SpellingChamp",
        "xp": 2300,
        "level": 23
      }
    ]
  }
}
```

#### GET `/users/:id`
Récupérer un utilisateur spécifique.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur récupéré avec succès",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "role": "user",
      "xp": 150,
      "level": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT `/users/:id`
Mettre à jour le profil utilisateur.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "new_username"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "new_username",
      "role": "user",
      "xp": 150,
      "level": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### DELETE `/users/:id`
Supprimer un utilisateur (Admin seulement).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

### Santé de l'API

#### GET `/health`
Vérifier l'état de l'API.

**Response (200):**
```json
{
  "success": true,
  "message": "API Grammachat fonctionnelle",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

## 📊 Codes de Statut HTTP

- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Non authentifié
- **403** : Accès interdit
- **404** : Ressource non trouvée
- **409** : Conflit (ex: email déjà utilisé)
- **500** : Erreur serveur interne

## 🔍 Gestion des Erreurs

### Format des erreurs
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Détails supplémentaires (en développement)"
}
```

### Exemples d'erreurs

#### Validation des données
```json
{
  "success": false,
  "message": "Données invalides",
  "error": "Email invalide"
}
```

#### Authentification
```json
{
  "success": false,
  "message": "Token d'accès requis"
}
```

#### Autorisation
```json
{
  "success": false,
  "message": "Accès administrateur requis"
}
```

## 🎮 Système de Gamification

### Calcul des XP

#### XP de base
- **1 XP** par caractère dans le message

#### Bonus
- **+10 XP** si aucun erreur détectée

#### Pénalités
- **-5 XP** par erreur d'orthographe détectée

#### Montée de niveau
- **100 XP** requis pour passer au niveau suivant
- Formule : `niveau = floor(xp / 100) + 1`

### Exemple de calcul
```json
{
  "message": "Bonjour, comment allez-vous ?",
  "characterCount": 28,
  "errorsFound": 0,
  "calculation": {
    "baseXP": 28,
    "bonusXP": 10,
    "penaltyXP": 0,
    "totalXP": 38
  }
}
```

## 🔒 Sécurité

### Authentification JWT
- **Secret** : Configuré via `JWT_SECRET`
- **Expiration** : 7 jours par défaut
- **Algorithme** : HS256

### Validation des données
- **Email** : Format RFC 5322
- **Mot de passe** : Minimum 6 caractères
- **Nom d'utilisateur** : 3-20 caractères, alphanumériques + underscore
- **Message** : 1-1000 caractères

### Limitation du taux
- **100 requêtes** par IP toutes les 15 minutes
- **Headers** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### CORS
- **Origines autorisées** : Configurées via `CORS_ORIGIN`
- **Méthodes** : GET, POST, PUT, DELETE, OPTIONS
- **Headers** : Authorization, Content-Type

## 📈 Monitoring et Métriques

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Métriques (à implémenter)
- **Temps de réponse** : Moyenne, P95, P99
- **Taux d'erreur** : 4xx, 5xx
- **Débit** : Requêtes par seconde
- **Utilisation des ressources** : CPU, RAM, Disque

## 🧪 Tests

### Tests unitaires
```bash
cd backend
npm test
```

### Tests d'intégration
```bash
cd tests/automation
node run-tests.js
```

### Tests de charge
```bash
# Utiliser Artillery ou k6
artillery run load-test.yml
```

## 📚 Exemples d'utilisation

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Inscription
const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Connexion
const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const token = response.data.data.token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return response.data;
};

// Envoyer un message
const sendMessage = async (content) => {
  const response = await api.post('/messages', { content });
  return response.data;
};
```

### Python
```python
import requests

class GrammachatAPI:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
    
    def register(self, email, username, password):
        response = self.session.post(f'{self.base_url}/auth/register', json={
            'email': email,
            'username': username,
            'password': password
        })
        return response.json()
    
    def login(self, email, password):
        response = self.session.post(f'{self.base_url}/auth/login', json={
            'email': email,
            'password': password
        })
        data = response.json()
        self.token = data['data']['token']
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}'
        })
        return data
    
    def send_message(self, content):
        response = self.session.post(f'{self.base_url}/messages', json={
            'content': content
        })
        return response.json()
```

### cURL
```bash
# Inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Envoyer un message
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content":"Bonjour, ceci est un test !"}'
```

## 🔄 Changelog

### Version 1.0.0
- Authentification JWT
- Gestion des messages avec vérification orthographique
- Système de gamification (XP, niveaux)
- Gestion des utilisateurs et rôles
- API RESTful complète
- Tests automatisés
- Documentation complète
