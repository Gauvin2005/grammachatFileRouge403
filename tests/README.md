# Tests Grammachat

Suite de tests organisée et structurée pour l'application Grammachat.

## Dossier Structure

```
tests/
├── api/                    # Tests API
│   ├── auth.test.js        # Tests d'authentification
│   └── messages.test.js     # Tests de messages
├── database/               # Tests de base de données
│   └── connection.test.js  # Tests de connexion et CRUD
├── frontend/               # Tests frontend
│   └── ui.test.js          # Tests d'interface utilisateur
├── integration/            # Tests d'intégration
├── utils/                  # Utilitaires partagés
│   └── testUtils.js        # Classe utilitaire principale
├── run-tests.js            # Script principal
├── package.json           # Dépendances des tests
└── README.md              # Ce fichier
```

## Démarrage Utilisation

### Installation des dépendances
```bash
cd tests
npm install
```

### Exécution des tests

**Tous les tests :**
```bash
npm test
# ou
node run-tests.js
```

**Tests par catégorie :**
```bash
npm run test:api          # Tests API seulement
npm run test:database     # Tests database seulement
npm run test:frontend     # Tests frontend seulement
npm run test:integration  # Tests d'intégration seulement
```

**Options avancées :**
```bash
node run-tests.js --category api        # Catégorie spécifique
node run-tests.js --no-frontend        # Ignorer les tests frontend
node run-tests.js --verbose            # Mode verbeux
node run-tests.js --help               # Aide
```

## Test Types de tests

### Tests API (`tests/api/`)
- **auth.test.js** : Authentification, inscription, validation
- **messages.test.js** : Création, récupération, calcul XP

### Tests Database (`tests/database/`)
- **connection.test.js** : Connexion MongoDB, CRUD, contraintes

### Tests Frontend (`tests/frontend/`)
- **ui.test.js** : Interface utilisateur avec Puppeteer

### Tests d'Intégration (`tests/integration/`)
- Tests end-to-end complets

## Configuration Configuration

### Variables d'environnement
Les tests utilisent les variables suivantes (avec valeurs par défaut) :

```env
MONGODB_URI=mongodb://localhost:27017/grammachat
API_BASE_URL=http://localhost:3000
```

### Prérequis
- MongoDB accessible
- API Grammachat en cours d'exécution
- Puppeteer installé (pour les tests frontend)

## Résultats Résultats

Le script affiche :
- [SUCCESS] Tests réussis
- [ERROR] Tests échoués  
- [INFO] Total des tests
- [INFO] Taux de réussite
- [INFO] Durée d'exécution
- Dossier Résultats par catégorie

## Outils Développement

### Ajouter un nouveau test

1. Créer un fichier `.test.js` dans la catégorie appropriée
2. Importer `TestUtils` depuis `../utils/testUtils`
3. Créer une classe avec méthode `runAllTests()`
4. Utiliser `this.utils` pour les opérations communes

Exemple :
```javascript
const { TestUtils } = require('../utils/testUtils');

class MonTest {
  constructor() {
    this.utils = new TestUtils();
    this.testResults = { passed: 0, failed: 0, total: 0 };
  }

  async runAllTests() {
    // Vos tests ici
  }
}

module.exports = MonTest;
```

### Utilitaires disponibles

La classe `TestUtils` fournit :
- `connectDB()` / `disconnectDB()` : Gestion MongoDB
- `createTestUser()` / `deleteTestUser()` : Gestion utilisateurs
- `makeRequest()` : Requêtes HTTP
- `authenticateUser()` : Authentification
- `cleanDatabase()` : Nettoyage DB
- `generateTestData()` : Données de test
- `log()` : Logging coloré

## Dépannage Dépannage

### MongoDB non accessible
```bash
# Vérifier que MongoDB tourne
sudo systemctl status mongod
# ou
docker ps | grep mongo
```

### API non accessible
```bash
# Vérifier que l'API tourne
curl http://localhost:3000/api/health
```

### Puppeteer échoue
```bash
# Installer les dépendances système
sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2
```

## Notes Notes

- Les tests nettoient automatiquement les données de test
- Les tests frontend nécessitent un navigateur (mode headless disponible)
- Les tests API nécessitent l'API en cours d'exécution
- Les tests database nécessitent MongoDB accessible