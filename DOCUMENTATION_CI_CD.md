# Documentation CI/CD - Projet Grammachat

**Lien du workflow CI/CD :** [.github/workflows/ci-cd.yml](https://github.com/Gauvin2005/grammachatFileRouge403/blob/main/.github/workflows/ci-cd.yml)

## 1. Documentation générale

La CI/CD (Continuous Integration / Continuous Deployment) est un système automatisé qui teste, vérifie et déploie votre code à chaque modification. Pour Grammachat, cela signifie :

- **Détection automatique** : Dès qu'un développeur pousse du code sur les branches `main` ou `develop`, le pipeline se déclenche
- **Tests automatiques** : Le code est testé pour s'assurer qu'il fonctionne correctement
- **Vérification de qualité** : Le code est analysé pour détecter les erreurs et problèmes de sécurité
- **Déploiement automatique** : Si tout est OK, le code est déployé automatiquement en production

Cette approche permet d'avoir une base de code toujours fonctionnelle et déployable.

## 2. Schéma textuel du pipeline

```
┌─────────────────────────────────────────────────────────┐
│              DÉCLENCHEUR (Push sur main/develop)        │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  JOB 1 : test-and-lint                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Checkout du code                             │  │
│  │  2. Setup Node.js 18                             │  │
│  │  3. Démarrage MongoDB (test)                     │  │
│  │  4. Démarrage Redis (test)                       │  │
│  │  5. Installation dépendances                     │  │
│  │  6. Lint (vérification du style de code)         │  │
│  │  7. Format check (vérification du formatage)     │  │
│  │  8. Tests unitaires                              │  │
│  │  9. Audit de sécurité                            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
                      Tout OK ?
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│  JOB 2 : build-and-deploy                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Checkout du code                             │  │
│  │  2. Setup Docker Buildx                          │  │
│  │  3. Création .env.prod                           │  │
│  │  4. Build de l'image Docker                      │  │
│  │  5. Stop ancien conteneur                        │  │
│  │  6. Démarrage nouveau conteneur                  │  │
│  │  7. Vérification du déploiement                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────┐
│  JOB 3 : notify                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Envoi notification Slack du résultat           │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
```

## 3. Détails des stages

### 3.1 Stage Test & Lint

**Rôle :** Vérifier que le code fonctionne et respecte les standards de qualité.

**Environnement :** Un serveur Ubuntu temporaire avec MongoDB et Redis de test

**Étapes détaillées :**

1. **Checkout du code** : Récupération du code source depuis GitHub
2. **Setup Node.js** : Installation de Node.js version 18 avec cache des dépendances
3. **Installation des dépendances** : Installation des packages nécessaires au backend
4. **Lint** : Vérification du style de code avec ESLint
5. **Format check** : Vérification du formatage du code avec Prettier
6. **Tests unitaires** : Exécution de tous les tests automatiques
7. **Security Audit** : Détection de vulnérabilités dans les dépendances

**Pourquoi c'est important :** Cette étape garantit que le code est propre, fonctionne correctement et ne contient pas de failles de sécurité avant le déploiement.

### 3.2 Stage Security Audit

**Rôle :** Identifier les vulnérabilités de sécurité dans les dépendances npm.

**Ce qui est vérifié :**
- Failles connues dans les packages utilisés
- Versions obsolètes contenant des bugs de sécurité
- Dépendances malveillantes

**Niveau de vérification :** `moderate` (modéré) - Les vulnérabilités moyennes et critiques sont détectées.

**Action en cas d'échec :** Le pipeline est interrompu et une notification est envoyée.

### 3.3 Stage Build & Deploy

**Rôle :** Construire une image Docker exécutable et la déployer sur le serveur de production.

**Environnement :** Runner self-hosted (votre serveur de production)

**Étapes détaillées :**

#### 3.3.1 Création du fichier d'environnement

```bash
# Le fichier .env.prod est généré à partir des secrets GitHub
# Il contient toutes les variables d'environnement nécessaires en production
```

**Secrets utilisés :**
- `MONGODB_URI` : URL de connexion à MongoDB
- `MONGODB_DATABASE` : Nom de la base de données
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `REDIS_URL` : URL de connexion à Redis
- `REDIS_PASSWORD` : Mot de passe Redis
- `LANGUAGETOOL_API_KEY` : Clé API pour LanguageTool

#### 3.3.2 Build de l'image Docker

```bash
# Version basée sur un timestamp
APP_VERSION=$(date +'%Y%m%d%H%M%S')
# Exemple : 20250110153045

# Construction de l'image
docker build -t grammachat-backend:20250110153045 ./backend
```

**Ce qui se passe lors du build :**
1. Copie des fichiers `package.json` dans l'image
2. Installation de toutes les dépendances Node.js
3. Compilation du code TypeScript en JavaScript
4. Nettoyage des dépendances de développement
5. Création d'un utilisateur non-root pour la sécurité
6. Configuration du healthcheck

#### 3.3.3 Déploiement du conteneur

```bash
# Arrêt de l'ancien conteneur (si existe)
docker stop grammachat-backend || true
docker rm grammachat-backend || true

# Démarrage du nouveau conteneur
docker run -d \
  --name grammachat-backend \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.prod \
  grammachat-backend:20250110153045
```

**Caractéristiques du conteneur :**
- **Nom :** `grammachat-backend`
- **Port exposé :** 3000 (accessible depuis l'extérieur)
- **Restart policy :** `unless-stopped` (redémarre automatiquement)
- **Variables d'environnement :** Chargées depuis `.env.prod`

#### 3.3.4 Vérification

```bash
# Vérification que le conteneur tourne
docker ps | grep grammachat-backend

# Affichage des logs récents
docker logs --tail 50 grammachat-backend
```

## 4. Environnements et serveurs

### Séparation des rôles

Il existe **deux types de serveurs** bien distincts :

#### Serveur CI/CD (GitHub Actions)

- **Rôle :** Exécuter les tests et la vérification du code
- **Type :** Serveurs temporaires fournis par GitHub (ubuntu-latest)
- **Durée de vie :** Quelques minutes, puis destruction
- **Ce qu'il fait :**
  - Lance les tests
  - Vérifie le code
  - Construit l'image Docker
  
**Important :** Ce serveur ne contient jamais de données de production.

#### Serveur de production (Self-hosted)

- **Rôle :** Héberger l'application en production
- **Type :** Votre propre serveur (self-hosted)
- **Durée de vie :** Permanent
- **Ce qu'il fait :**
  - Reçoit l'image Docker construite
  - Exécute l'application
  - Stocke les données de production (MongoDB, Redis)
  - Expose l'API sur le port 3000

**Important :** Ce serveur ne reçoit jamais le code source, seulement l'image Docker exécutable et sécurisée.

### Pourquoi cette séparation ?

1. **Sécurité** : Le code source ne doit jamais être présent sur le serveur de production
2. **Isolation** : Un problème en développement n'affecte pas la production
3. **Traçabilité** : Chaque version est identifiée par un timestamp unique
4. **Rollback facile** : On peut revenir à une version précédente instantanément

## 5. Variables d'environnement et secrets

### Où sont stockés les secrets ?

Les secrets sensibles sont stockés dans **GitHub Secrets** :

```
Settings > Secrets and variables > Actions > New repository secret
```

**Secrets nécessaires au projet Grammachat :**

| Secret | Description | Exemple |
|--------|-------------|---------|
| `MONGODB_URI` | URL de connexion MongoDB | `mongodb://mongodb:27017/grammachat` |
| `MONGODB_DATABASE` | Nom de la base de données | `grammachat` |
| `JWT_SECRET` | Clé secrète pour JWT | Chaîne aléatoire de 32 caractères |
| `REDIS_URL` | URL de connexion Redis | `redis://redis:6379` |
| `REDIS_PASSWORD` | Mot de passe Redis | Mot de passe sécurisé |
| `LANGUAGETOOL_API_KEY` | Clé API LanguageTool | Clé API fournie |
| `SLACK_WEBHOOK` | Webhook pour notifications | URL du webhook Slack |

### Comment mettre à jour la configuration ?

**Mise à jour des secrets GitHub :**

1. Aller sur GitHub : `Settings > Secrets and variables > Actions`
2. Cliquer sur le secret à modifier
3. Modifier la valeur
4. Sauvegarder
5. Les prochains déploiements utiliseront automatiquement la nouvelle valeur

**Mise à jour du fichier .env.prod dans le pipeline :**

Le fichier `.env.prod` est généré automatiquement à chaque déploiement depuis les secrets GitHub. Pour modifier les variables non-secrètes (par exemple les ports ou les TTL), il faut éditer directement le workflow CI/CD :

```yaml
# Dans .github/workflows/ci-cd.yml
- name: Create production environment file
  run: |
    cat > .env.prod << EOF
    API_PORT=3000  # <- Modifier ici
    ...
    EOF
```

**Important :** Après modification du workflow, commit et push sur `main` ou `develop` pour appliquer les changements.

## 6. Résumé pour débutant

### Qu'est-ce que la CI/CD ?

La CI/CD est comme un **assistant automatique** qui :
1. S'active à chaque modification de code
2. Vérifie que le code fonctionne correctement (tests)
3. Vérifie que le code est propre et sûr (lint, audit)
4. Construit une version exécutable (image Docker)
5. Déploie cette version sur le serveur de production

### Analogie simple

Imaginez la CI/CD comme une **usine de production automobile** :

- **Tests & Lint** = Contrôle qualité : vérifie que chaque pièce fonctionne
- **Security Audit** = Détection des défauts de sécurité : s'assure que la voiture est sûre
- **Build & Deploy** = Assemblage et livraison : monte la voiture et la livre au client
- **Serveur CI/CD** = Atelier de test temporaire : vérifie tout avant l'assemblage
- **Serveur de production** = Concession : où la voiture est utilisée par les clients

### Points clés à retenir

1. **Automatisation** : Tout se fait sans intervention manuelle
2. **Sécurité** : Le code source ne va jamais en production, seulement l'exécutable
3. **Traçabilité** : Chaque version est unique et identifiable
4. **Rollback** : En cas de problème, on peut revenir en arrière facilement
5. **Tests** : Aucun code non testé ne va en production

### Déroulement classique

```
Développeur pousse du code
         ↓
Pipeline détecte le changement
         ↓
Tests automatiques (1-2 minutes)
         ↓
   Tout OK ? → Build de l'image Docker
         ↓
Déploiement sur le serveur de production
         ↓
Vérification que le conteneur tourne
         ↓
Notification du résultat sur Slack
         ↓
Application mise à jour automatiquement
```

**Temps total :** Environ 5-10 minutes du commit au déploiement.

**Avantage principal :** Le code est toujours testé et déployé de manière cohérente, sans erreur humaine possible lors du déploiement.


