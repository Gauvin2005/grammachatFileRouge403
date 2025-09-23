# Tests Automatisés Grammachat

Ce dossier contient les tests automatisés pour vérifier le bon fonctionnement de l'application Grammachat.

## Test de Création d'Utilisateur

Le fichier `createUser.test.js` implémente un test automatisé complet qui :

### Objectifs du Test

1. **Lance le serveur backend avec Docker** (simule `docker-compose up`)
2. **Utilise Puppeteer** pour envoyer une requête POST vers `/api/users`
3. **Vérifie directement en base** via le driver officiel MongoDB
4. **Contrôle que le document inséré** a bien `role="user"`
5. **Loggue "Compte créé et vérifié"** si succès, sinon l'erreur

### Prérequis

- Docker et Docker Compose installés
- Node.js installé
- Accès aux ports 3000 (API) et 27017 (MongoDB)

### Lancement du Test

#### Méthode 1 : Script automatique (recommandé)
```bash
cd tests
./run-test.sh
```

#### Méthode 2 : Lancement manuel
```bash
cd tests
npm install
npm test
```

### Ce que fait le test

#### Étape 1 : Démarrage Docker
- Lance `docker-compose up --build`
- Attend que l'API soit accessible sur le port 3000
- Surveille les logs pour détecter le démarrage complet

#### Étape 2 : Test API avec Puppeteer
- Lance un navigateur headless avec Puppeteer
- Envoie une requête POST vers `/api/users` avec :
  ```json
  {
    "email": "test-{timestamp}@example.com",
    "password": "testpassword123",
    "username": "testuser{timestamp}"
  }
  ```
- Vérifie que la réponse est un succès (status 201)

#### Étape 3 : Vérification Base de Données
- Se connecte directement à MongoDB via le driver officiel
- Recherche l'utilisateur créé par email
- Vérifie que le rôle est bien `"user"` (forcé côté backend)
- Contrôle les autres champs (xp: 0, level: 1)

#### Étape 4 : Nettoyage
- Ferme le navigateur Puppeteer
- Ferme la connexion MongoDB
- Arrête les services Docker

### Résultat Attendu

En cas de succès, le test affiche :
```
COMPTE CRÉÉ ET VÉRIFIÉ
Résumé du test:
  - API Response: Succès
  - Database Check: Utilisateur trouvé
  - Role Check: Rôle correct
  - User ID: [ObjectId]
  - Email: test-{timestamp}@example.com
  - Username: testuser{timestamp}
  - Role: user
  - XP: 0
  - Level: 1
```

### Dépannage

#### Erreur : "Services Docker n'ont pas démarré"
- Vérifiez que Docker est en cours d'exécution
- Vérifiez que les ports 3000 et 27017 sont libres
- Vérifiez le fichier `.env` dans le répertoire racine

#### Erreur : "API non accessible"
- Attendez plus longtemps le démarrage des services
- Vérifiez les logs Docker avec `docker-compose logs`

#### Erreur : "Utilisateur non trouvé en base"
- Vérifiez la connexion MongoDB
- Vérifiez que l'endpoint `/api/users` fonctionne correctement

### Structure des Fichiers

```
tests/
├── createUser.test.js    # Test principal
├── package.json          # Dépendances de test
├── run-test.sh          # Script de lancement
└── README.md            # Cette documentation
```

### Logs Détaillés

Le test produit des logs détaillés pour chaque étape :
- Démarrage Docker
- Attente API
- Lancement Puppeteer
- Envoi requête POST
- Réception réponse
- Connexion MongoDB
- Vérifications réussies
- Erreurs détectées
- Nettoyage ressources

### Contraintes Respectées

**Contrainte 1** : Bouton + formulaire fonctionnel  
**Contrainte 2** : Backend + base en Docker  
**Contrainte 3** : Test automatisé avec Puppeteer + MongoDB  
**Contrainte 4** : Commentaires clairs et séparation stricte  

Le test vérifie que toutes les contraintes sont respectées et que l'application fonctionne correctement en mode production avec Docker.

