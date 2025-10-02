# Tests Grammachat - Suite Complète et Professionnelle

Suite de tests complète et professionnelle pour l'application Grammachat, couvrant tous les aspects du backend, de l'API, de la base de données et des fonctionnalités.

## Structure des Tests

```
tests/
├── api/                    # Tests API complets
│   └── apiTester.ts        # Testeur API avec authentification, messages, utilisateurs
├── database/               # Tests base de données
│   └── databaseTester.ts   # Testeur base de données (modèles, relations, contraintes)
├── services/               # Tests services
│   └── serviceTester.ts    # Testeur services (Redis, LanguageTool)
├── features/               # Tests fonctionnalités
│   └── featureTester.ts   # Testeur flux complets end-to-end
├── utils/                  # Utilitaires partagés
│   └── testUtils.js       # Classe utilitaire pour les tests
├── comprehensiveTestRunner.ts  # Orchestrateur principal
└── run-tests.js           # Script d'entrée
```

## Types de Tests

### 1. Tests API (`apiTester.ts`)
- **Authentification** : Inscription, connexion, validation JWT
- **Gestion utilisateurs** : Profil, mise à jour
- **Système de messages** : Envoi, récupération, pagination
- **Classement** : Leaderboard avec pagination
- **Gestion d'erreurs** : Codes d'erreur appropriés
- **Rate limiting** : Protection contre les abus

### 2. Tests Base de Données (`databaseTester.ts`)
- **Connexion** : MongoDB et Mongoose
- **Modèle User** : Création, validation, hachage mot de passe, système XP
- **Modèle Message** : Création, validation, timestamps
- **Relations** : User-Message avec populate
- **Indexes** : Email, username, senderId
- **Contraintes** : Unicité email/username
- **Performance** : Création en masse, requêtes rapides

### 3. Tests Services (`serviceTester.ts`)
- **Redis Service** : Connexion, cache, expiration, invalidation
- **LanguageTool Service** : Analyse de texte, calcul XP, détection d'erreurs

### 4. Tests Fonctionnalités (`featureTester.ts`)
- **Flux d'inscription** : Processus complet utilisateur
- **Flux d'authentification** : Connexion et validation
- **Flux de messagerie** : Envoi et récupération
- **Système XP/Niveau** : Calcul et mise à jour
- **Système de classement** : Leaderboard et tri
- **Intégration cache** : Redis avec API
- **Récupération d'erreurs** : Gestion des cas d'erreur

## Utilisation

### Installation des Dépendances
```bash
cd tests
npm install
```

### Exécution des Tests
```bash
# Suite complète (recommandée)
npm test

# Ou directement
node run-tests.js

# Avec aide
node run-tests.js --help
```

### Tests Individuels
```bash
# Tests API seulement
npx ts-node api/apiTester.ts

# Tests base de données seulement
npx ts-node database/databaseTester.ts

# Tests services seulement
npx ts-node services/serviceTester.ts

# Tests fonctionnalités seulement
npx ts-node features/featureTester.ts
```

## Prérequis

### Services Requis
```bash
# Démarrer MongoDB et Redis
docker-compose up -d

# Démarrer l'API backend
cd ../backend
npm start
```

### Variables d'Environnement
```bash
API_URL=http://localhost:3000          # URL de l'API
MONGODB_URI=mongodb://localhost:27017  # URI MongoDB
```

## Résultats Attendus

### Tests API
- **Authentification** : 5/5 tests réussis
- **Gestion utilisateurs** : 2/2 tests réussis
- **Système de messages** : 3/3 tests réussis
- **Classement** : 3/3 tests réussis
- **Gestion d'erreurs** : 4/4 tests réussis
- **Rate limiting** : 1/1 test réussi

### Tests Base de Données
- **Connexion** : 3/3 tests réussis
- **Modèle User** : 4/4 tests réussis
- **Modèle Message** : 3/3 tests réussis
- **Relations** : 2/2 tests réussis
- **Indexes** : 3/3 tests réussis
- **Contraintes** : 2/2 tests réussis
- **Performance** : 2/2 tests réussis

### Tests Services
- **Redis Service** : 8/8 tests réussis
- **LanguageTool Service** : 8/8 tests réussis

### Tests Fonctionnalités
- **Flux d'inscription** : 2/2 tests réussis
- **Flux d'authentification** : 3/3 tests réussis
- **Flux de messagerie** : 3/3 tests réussis
- **Système XP/Niveau** : 3/3 tests réussis
- **Système de classement** : 3/3 tests réussis
- **Intégration cache** : 3/3 tests réussis
- **Récupération d'erreurs** : 4/4 tests réussis

## Fonctionnalités Testées

### Authentification
- Inscription utilisateur avec validation
- Connexion avec JWT
- Validation des tokens
- Gestion des erreurs d'authentification

### Système de Messages
- Envoi de messages avec calcul XP
- Récupération avec pagination
- Stockage en base de données
- Intégration avec LanguageTool

### Système XP/Niveau
- Calcul XP basé sur la longueur du texte
- Mise à jour automatique du niveau
- Persistance en base de données

### Classement
- Génération du leaderboard
- Tri par XP décroissant
- Pagination des résultats

### Cache Redis
- Mise en cache des sessions utilisateur
- Cache des messages et leaderboard
- Invalidation automatique
- Gestion de l'expiration

### Gestion d'Erreurs
- Codes d'erreur appropriés (400, 401, 404, 409)
- Messages d'erreur informatifs
- Récupération gracieuse des erreurs

## Monitoring et Debugging

### Logs Détaillés
Chaque test affiche :
- Nom du test
- Statut (PASS/FAIL)
- Durée d'exécution
- Détails des erreurs si applicable

### Statistiques
- Nombre total de tests
- Tests réussis/échoués
- Taux de réussite global
- Durée totale d'exécution

### Recommandations
Le système fournit des recommandations spécifiques en cas d'échec :
- Vérification des services
- Configuration des variables d'environnement
- Diagnostic des problèmes

## Maintenance

### Ajout de Nouveaux Tests
1. Créer un nouveau test dans le dossier approprié
2. Suivre le pattern des tests existants
3. Ajouter le test au runner principal si nécessaire

### Mise à Jour des Tests
- Les tests sont conçus pour être maintenables
- Structure modulaire pour faciliter les modifications
- Documentation intégrée dans le code

## Support

En cas de problème :
1. Vérifier que tous les services sont démarrés
2. Consulter les logs détaillés
3. Vérifier la configuration des variables d'environnement
4. Tester les services individuellement