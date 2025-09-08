# Guide de Développement - Grammachat

## 🛠️ Vue d'ensemble

Ce guide couvre les bonnes pratiques de développement pour Grammachat, incluant la configuration de l'environnement, les conventions de code, et les processus de développement.

## 📋 Prérequis

### Outils de développement
- **Node.js** : Version 18+
- **npm** : Version 8+
- **Git** : Version 2.30+
- **Docker** : Version 20.10+
- **VS Code** : Éditeur recommandé
- **Expo CLI** : Pour le développement mobile

### Extensions VS Code recommandées
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

## 🏗️ Configuration de l'Environnement

### 1. Cloner le projet
```bash
git clone <repository-url>
cd grammachat
```

### 2. Configuration des branches
```bash
# Créer une branche de développement
git checkout -b PRO403-1-feature-description

# Configurer le remote upstream
git remote add upstream <original-repository-url>
```

### 3. Installation des dépendances
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Tests
cd ../tests/automation
npm install
```

### 4. Configuration des variables d'environnement
```bash
# Copier les fichiers d'exemple
cp env.example .env
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
```

## 📝 Conventions de Code

### 1. Structure des commits
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types :**
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, point-virgules, etc.
- `refactor` : Refactoring
- `test` : Tests
- `chore` : Tâches de maintenance

**Exemples :**
```bash
feat(auth): add JWT authentication
fix(messages): resolve XP calculation bug
docs(api): update authentication endpoints
test(backend): add integration tests for messages
```

### 2. Nommage des branches
```
PRO403-<issue-number>-<description>
```

**Exemples :**
```bash
PRO403-1-user-authentication
PRO403-2-message-gamification
PRO403-3-admin-dashboard
```

### 3. Conventions TypeScript

#### Interfaces et Types
```typescript
// ✅ Bon
interface UserProfile {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
}

// ❌ Éviter
interface userProfile {
  id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
}
```

#### Fonctions
```typescript
// ✅ Bon
const calculateXP = (message: string, errors: LanguageToolError[]): XPCalculationResult => {
  // Implementation
};

// ❌ Éviter
const calculateXP = (message, errors) => {
  // Implementation
};
```

#### Composants React
```typescript
// ✅ Bon
interface LoginScreenProps {
  onLogin: (credentials: AuthRequest) => void;
  isLoading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  // Implementation
};

// ❌ Éviter
const LoginScreen = ({ onLogin, isLoading }) => {
  // Implementation
};
```

### 4. Conventions CSS/Styling

#### React Native StyleSheet
```typescript
// ✅ Bon
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
});

// ❌ Éviter
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 24,
  },
});
```

## 🔧 Configuration des Outils

### 1. ESLint Configuration

#### Backend (.eslintrc.js)
```javascript
module.exports = {
  extends: ['@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    'no-console': 'off', // Console autorisé pour le backend
  },
};
```

#### Frontend (.eslintrc.js)
```javascript
module.exports = {
  extends: ['expo', '@typescript-eslint/recommended'],
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 'error',
    'react-native/no-inline-styles': 'warn',
  },
};
```

### 2. Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 3. VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.expo": true
  }
}
```

## 🧪 Tests

### 1. Tests Backend

#### Structure des tests
```typescript
// tests/backend/auth.test.ts
describe('Authentication API', () => {
  beforeEach(async () => {
    // Setup
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Test implementation
    });

    it('should reject invalid email', async () => {
      // Test implementation
    });
  });
});
```

#### Exécution des tests
```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### 2. Tests Frontend

#### Tests de composants
```typescript
// tests/frontend/LoginScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/screens/LoginScreen';

describe('LoginScreen', () => {
  it('should render login form', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('Connexion')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
  });

  it('should handle login submission', async () => {
    const mockOnLogin = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <LoginScreen onLogin={mockOnLogin} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'password123');
    fireEvent.press(getByText('Se connecter'));

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### 3. Tests d'intégration

#### Tests E2E avec Detox
```typescript
// e2e/auth.e2e.ts
describe('Authentication Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    await expect(element(by.id('chat-screen'))).toBeVisible();
  });
});
```

## 🔄 Workflow de Développement

### 1. Développement de fonctionnalités

#### Étapes
1. **Créer une branche**
   ```bash
   git checkout -b PRO403-1-user-authentication
   ```

2. **Développer la fonctionnalité**
   - Écrire le code
   - Ajouter les tests
   - Mettre à jour la documentation

3. **Tests locaux**
   ```bash
   # Backend
   cd backend && npm test
   
   # Frontend
   cd frontend && npm test
   
   # Tests d'intégration
   cd tests/automation && node run-tests.js
   ```

4. **Commit et push**
   ```bash
   git add .
   git commit -m "feat(auth): add JWT authentication"
   git push origin PRO403-1-user-authentication
   ```

5. **Créer une Pull Request**
   - Titre descriptif
   - Description détaillée
   - Liens vers les issues
   - Screenshots si applicable

### 2. Code Review

#### Checklist pour les reviewers
- [ ] Code respecte les conventions
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Pas de code dupliqué
- [ ] Gestion d'erreurs appropriée
- [ ] Performance acceptable
- [ ] Sécurité vérifiée

#### Checklist pour les développeurs
- [ ] Tests unitaires ajoutés
- [ ] Tests d'intégration passent
- [ ] Code formaté avec Prettier
- [ ] ESLint sans erreurs
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour

### 3. Déploiement

#### Environnements
- **Development** : Branche `develop`
- **Staging** : Branche `main` (tests)
- **Production** : Tag de version

#### Processus
1. Merge vers `develop`
2. Tests automatisés
3. Déploiement en staging
4. Tests de validation
5. Merge vers `main`
6. Déploiement en production

## 📚 Documentation

### 1. Documentation du code

#### JSDoc pour les fonctions
```typescript
/**
 * Calcule l'XP basé sur le texte et les erreurs trouvées
 * @param text - Le texte du message
 * @param errors - Les erreurs détectées par LanguageTool
 * @returns Le résultat du calcul d'XP
 */
const calculateXP = (text: string, errors: LanguageToolError[]): XPCalculationResult => {
  // Implementation
};
```

#### Commentaires pour la logique complexe
```typescript
// Calculer le niveau basé sur l'XP
// Formule: niveau = floor(xp / 100) + 1
// Exemple: 150 XP = niveau 2, 250 XP = niveau 3
const level = Math.floor(user.xp / XP_PER_LEVEL) + 1;
```

### 2. Documentation API

#### Swagger/OpenAPI
```yaml
# swagger.yaml
openapi: 3.0.0
info:
  title: Grammachat API
  version: 1.0.0
  description: API pour l'application de messagerie gamifiée

paths:
  /api/auth/login:
    post:
      summary: Connexion utilisateur
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 6
      responses:
        '200':
          description: Connexion réussie
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
```

### 3. Documentation utilisateur

#### README.md
- Instructions d'installation
- Guide de démarrage rapide
- Exemples d'utilisation
- Troubleshooting

#### Guides spécialisés
- `docs/installation.md` : Installation détaillée
- `docs/api/README.md` : Documentation API complète
- `docs/architecture.md` : Architecture du système
- `docs/deployment.md` : Guide de déploiement

## 🐛 Debugging

### 1. Debug Backend

#### Logs structurés
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Utilisation
logger.info('User logged in', { userId, email });
logger.error('Database connection failed', { error: err.message });
```

#### Debug avec VS Code
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### 2. Debug Frontend

#### React Native Debugger
```bash
# Installer React Native Debugger
npm install -g react-native-debugger

# Lancer avec debugger
react-native-debugger
```

#### Flipper
```bash
# Installer Flipper
# https://fbflipper.com/

# Configurer pour React Native
# Voir la documentation Flipper
```

#### Logs de debug
```typescript
import { Platform } from 'react-native';

const debugLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Utilisation
debugLog('User action', { action: 'login', userId });
```

## 🔒 Sécurité

### 1. Bonnes pratiques

#### Validation des données
```typescript
import { body, validationResult } from 'express-validator';

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mot de passe trop court'),
];

const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Continue...
};
```

#### Sanitisation
```typescript
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};
```

#### Gestion des secrets
```typescript
// ❌ Ne jamais faire
const JWT_SECRET = 'my-secret-key';

// ✅ Utiliser des variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
```

### 2. Tests de sécurité

#### Tests d'authentification
```typescript
describe('Security Tests', () => {
  it('should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/messages')
      .expect(401);
    
    expect(response.body.message).toContain('requis');
  });

  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/messages')
      .set('Authorization', 'Bearer invalid-token')
      .expect(403);
  });
});
```

## 📊 Performance

### 1. Optimisations Backend

#### Cache Redis
```typescript
import Redis from 'redis';

const redis = Redis.createClient();

const getCachedUser = async (userId: string): Promise<User | null> => {
  const cached = await redis.get(`user:${userId}`);
  return cached ? JSON.parse(cached) : null;
};

const setCachedUser = async (user: User): Promise<void> => {
  await redis.setex(`user:${user.id}`, 3600, JSON.stringify(user));
};
```

#### Pagination
```typescript
const getMessages = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [messages, total] = await Promise.all([
    Message.find().skip(skip).limit(limit).sort({ timestamp: -1 }),
    Message.countDocuments()
  ]);
  
  return {
    data: messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
```

### 2. Optimisations Frontend

#### Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));

const App = () => (
  <Suspense fallback={<LoadingScreen />}>
    <ProfileScreen />
  </Suspense>
);
```

#### Memoization
```typescript
import { useMemo, useCallback } from 'react';

const ChatScreen = ({ messages }: { messages: Message[] }) => {
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [messages]);

  const handleSendMessage = useCallback((content: string) => {
    // Handle message sending
  }, []);
};
```

## 🚀 Déploiement Local

### 1. Développement avec Docker

```bash
# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Redémarrer un service
docker-compose restart api
```

### 2. Développement sans Docker

```bash
# Terminal 1 - MongoDB
mongod --dbpath ./data/db

# Terminal 2 - Redis
redis-server

# Terminal 3 - Backend
cd backend && npm run dev

# Terminal 4 - Frontend
cd frontend && npm start
```

## 📈 Monitoring et Métriques

### 1. Métriques de développement

#### Bundle size
```bash
# Analyser la taille du bundle
cd frontend && npx expo export --platform web
npx bundle-analyzer dist/
```

#### Performance
```typescript
// Mesurer les performances
const startTime = performance.now();
await performOperation();
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);
```

### 2. Outils de monitoring

#### Backend
- **Winston** : Logging structuré
- **Prometheus** : Métriques
- **Grafana** : Dashboards

#### Frontend
- **Flipper** : Debug et profiling
- **React DevTools** : Inspection des composants
- **Expo Analytics** : Métriques d'usage

Ce guide de développement garantit une expérience de développement cohérente et productive pour toute l'équipe Grammachat.
