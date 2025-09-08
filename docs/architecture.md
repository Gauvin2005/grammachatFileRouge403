# Architecture - Grammachat

## 🏗️ Vue d'ensemble

Grammachat est une application Full Stack de messagerie gamifiée construite avec une architecture moderne et scalable. L'application combine une API RESTful robuste avec une application mobile native pour créer une expérience utilisateur fluide et engageante.

## 📐 Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                    GRAMMACHAT ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Mobile    │    │   Mobile    │    │   Mobile    │     │
│  │    iOS      │    │   Android   │    │    Web      │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                API Gateway / Load Balancer              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Backend API                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   Express   │  │   MongoDB    │  │    Redis    │    │ │
│  │  │   Server    │  │  Database   │  │    Cache    │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                External Services                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │LanguageTool │  │   Expo      │  │   Docker    │    │ │
│  │  │     API     │  │Notifications│  │  Registry   │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Composants Principaux

### 1. Frontend Mobile (React Native/Expo)

#### Technologies
- **React Native** : Framework de développement mobile
- **Expo** : Plateforme de développement et déploiement
- **TypeScript** : Langage de programmation typé
- **Redux Toolkit** : Gestion d'état globale
- **React Native Paper** : Bibliothèque de composants UI

#### Architecture Frontend
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Screens   │    │ Components  │    │  Services   │     │
│  │             │    │             │    │             │     │
│  │ • Login     │    │ • Forms     │    │ • API       │     │
│  │ • Register  │    │ • Cards     │    │ • Storage   │     │
│  │ • Chat      │    │ • Lists     │    │ • Auth      │     │
│  │ • Profile   │    │ • Buttons   │    │ • Notifications│   │
│  │ • Leaderboard│   │ • Inputs    │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Redux Store                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │    Auth     │  │  Messages   │  │   Users     │    │ │
│  │  │   Slice     │  │   Slice     │  │   Slice     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Local Storage                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   Secure    │  │   Async     │  │   Cache     │    │ │
│  │  │   Store     │  │  Storage    │  │   Manager   │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Flux de données
1. **Actions** : Déclenchées par les composants
2. **Reducers** : Modifient l'état global
3. **Selectors** : Récupèrent les données depuis l'état
4. **Components** : Se re-rendent automatiquement

### 2. Backend API (Node.js/Express)

#### Technologies
- **Node.js** : Runtime JavaScript
- **Express** : Framework web
- **TypeScript** : Langage de programmation typé
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM pour MongoDB
- **JWT** : Authentification par tokens
- **Redis** : Cache et sessions

#### Architecture Backend
```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  API Layer                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   Routes    │  │ Middleware │  │ Controllers │    │ │
│  │  │             │  │            │  │             │    │ │
│  │  │ • /auth     │  │ • Auth     │  │ • Auth      │    │ │
│  │  │ • /messages │  │ • CORS     │  │ • Messages  │    │ │
│  │  │ • /users    │  │ • Rate     │  │ • Users     │    │ │
│  │  │ • /health   │  │   Limit    │  │             │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Business Logic                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │  Services   │  │   Models    │  │   Utils     │    │ │
│  │  │             │  │            │  │             │    │ │
│  │  │ • Language  │  │ • User     │  │ • JWT       │    │ │
│  │  │   Tool      │  │ • Message  │  │ • Validation│    │ │
│  │  │ • XP Calc   │  │ • Auth     │  │ • Crypto    │    │ │
│  │  │ • Notify    │  │            │  │             │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                             │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Data Layer                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │   MongoDB   │  │    Redis    │  │   External │    │ │
│  │  │             │  │            │  │   APIs      │    │ │
│  │  │ • Users     │  │ • Cache    │  │ • Language  │    │ │
│  │  │ • Messages  │  │ • Sessions │  │   Tool      │    │ │
│  │  │ • Analytics │  │ • Rate     │  │ • Expo      │    │ │
│  │  │             │  │   Limit    │  │   Push      │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Flux de traitement
1. **Requête HTTP** → Middleware (Auth, CORS, Rate Limit)
2. **Route Handler** → Validation des données
3. **Controller** → Logique métier
4. **Service** → Appels externes et calculs
5. **Model** → Persistance en base de données
6. **Response** → Retour au client

### 3. Base de Données (MongoDB)

#### Schéma de données
```javascript
// Collection Users
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  xp: Number (default: 0, indexed),
  level: Number (default: 1, indexed),
  createdAt: Date,
  updatedAt: Date
}

// Collection Messages
{
  _id: ObjectId,
  senderId: ObjectId (ref: User, indexed),
  content: String (1-1000 chars),
  timestamp: Date (indexed),
  xpEarned: Number (default: 0),
  errorsFound: [{
    message: String,
    shortMessage: String,
    replacements: [String],
    offset: Number,
    length: Number,
    context: String,
    sentence: String,
    type: { typeName: String },
    rule: {
      id: String,
      description: String,
      issueType: String
    }
  }]
}
```

#### Index pour optimiser les performances
```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ xp: -1 });
db.users.createIndex({ level: -1 });

// Messages
db.messages.createIndex({ senderId: 1, timestamp: -1 });
db.messages.createIndex({ timestamp: -1 });
db.messages.createIndex({ xpEarned: -1 });
```

### 4. Cache (Redis)

#### Utilisation du cache
- **Sessions utilisateur** : Stockage des tokens JWT
- **Rate limiting** : Compteurs de requêtes par IP
- **Données fréquentes** : Profils utilisateurs, classements
- **Résultats LanguageTool** : Cache des vérifications orthographiques

#### Configuration Redis
```javascript
// Configuration par défaut
{
  host: 'localhost',
  port: 6379,
  db: 0,
  ttl: 3600, // 1 heure
  keyPrefix: 'grammachat:'
}
```

## 🔄 Flux de Données

### 1. Authentification
```
Client → POST /auth/login → Controller → Service → Model → JWT → Client
```

### 2. Envoi de Message
```
Client → POST /messages → Auth Middleware → Controller → LanguageTool API → XP Calculation → MongoDB → Response
```

### 3. Synchronisation des Données
```
Mobile App ←→ Local Storage ←→ API ←→ MongoDB
     ↓              ↓           ↓        ↓
   Cache        Persistence  Business  Database
```

## 🛡️ Sécurité

### 1. Authentification
- **JWT Tokens** : Stateless, sécurisés
- **Expiration** : 7 jours par défaut
- **Refresh** : Rotation automatique des tokens
- **Blacklist** : Révocation des tokens compromis

### 2. Autorisation
- **RBAC** : Rôles (user, admin)
- **Middleware** : Vérification des permissions
- **Ownership** : Accès aux ressources personnelles

### 3. Validation des données
- **Input validation** : Express-validator
- **Sanitization** : Nettoyage des entrées
- **Type checking** : TypeScript strict

### 4. Protection contre les attaques
- **Rate limiting** : 100 req/15min par IP
- **CORS** : Origines autorisées
- **Helmet** : Headers de sécurité
- **SQL Injection** : MongoDB + Mongoose
- **XSS** : Sanitization des données

## 📊 Monitoring et Observabilité

### 1. Logging
- **Winston** : Logs structurés
- **Niveaux** : error, warn, info, debug
- **Formats** : JSON pour production
- **Rotation** : Logs quotidiens

### 2. Métriques
- **Performance** : Temps de réponse, débit
- **Erreurs** : Taux d'erreur 4xx/5xx
- **Ressources** : CPU, RAM, Disque
- **Business** : Messages envoyés, XP gagnés

### 3. Health Checks
```javascript
// Endpoint de santé
GET /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "languagetool": "available"
  },
  "version": "1.0.0"
}
```

## 🚀 Scalabilité

### 1. Horizontal Scaling
- **Load Balancer** : Distribution des requêtes
- **Multiple Instances** : API stateless
- **Database Sharding** : Partitionnement MongoDB
- **CDN** : Contenu statique

### 2. Vertical Scaling
- **Resources** : CPU, RAM, Disque
- **Optimization** : Requêtes, index
- **Caching** : Redis, mémoire
- **Connection Pooling** : MongoDB

### 3. Performance
- **Lazy Loading** : Chargement à la demande
- **Pagination** : Limitation des résultats
- **Compression** : Gzip, Brotli
- **Minification** : JavaScript, CSS

## 🔧 DevOps et Déploiement

### 1. Containerisation
- **Docker** : Images optimisées
- **Multi-stage builds** : Réduction de la taille
- **Health checks** : Vérification de l'état
- **Security** : Images non-root

### 2. CI/CD
- **GitLab CI** : Pipeline automatisé
- **GitHub Actions** : Alternative
- **Tests** : Unitaires, intégration, E2E
- **Deployment** : Blue-green, rolling

### 3. Infrastructure
- **Cloud** : AWS, GCP, Azure
- **Kubernetes** : Orchestration
- **Terraform** : Infrastructure as Code
- **Monitoring** : Prometheus, Grafana

## 📱 Mobile Architecture

### 1. React Native
- **Cross-platform** : iOS + Android
- **Native performance** : Modules natifs
- **Hot reload** : Développement rapide
- **Expo** : Outils et services

### 2. State Management
- **Redux Toolkit** : État global
- **RTK Query** : Cache et synchronisation
- **Persist** : Sauvegarde locale
- **DevTools** : Debugging

### 3. Navigation
- **React Navigation** : Routage
- **Deep linking** : URLs personnalisées
- **Authentication flow** : Gestion des écrans
- **Tab navigation** : Interface principale

## 🔮 Évolutions Futures

### 1. Fonctionnalités
- **Messages vocaux** : Reconnaissance vocale
- **Vidéoconférence** : WebRTC
- **IA avancée** : Suggestions intelligentes
- **Social features** : Amis, groupes

### 2. Architecture
- **Microservices** : Décomposition
- **Event-driven** : Architecture événementielle
- **GraphQL** : API moderne
- **Serverless** : Fonctions sans serveur

### 3. Performance
- **Edge computing** : CDN intelligent
- **Real-time** : WebSockets, SSE
- **Offline-first** : Synchronisation
- **Progressive Web App** : Web mobile

## 📚 Ressources

### Documentation
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Redis](https://redis.io/documentation)

### Outils
- [Docker](https://docs.docker.com/)
- [GitLab CI](https://docs.gitlab.com/ee/ci/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Jest](https://jestjs.io/docs/getting-started)
- [ESLint](https://eslint.org/docs/)

Cette architecture garantit une application robuste, scalable et maintenable, prête pour la croissance et l'évolution future de Grammachat.
