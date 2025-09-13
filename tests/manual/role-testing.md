# Tests manuels pour les rôles utilisateur

## Prérequis
- Backend démarré sur `http://localhost:3000`
- Base de données MongoDB accessible
- Outil pour faire des requêtes HTTP (Postman, curl, ou similaire)

## 1. Test d'inscription utilisateur

### Inscription normale (rôle 'user')
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "username": "testuser",
    "password": "password123"
  }'
```

**Résultat attendu :**
- Status: 201
- Rôle attribué: "user" (même si "admin" est spécifié)
- Token JWT retourné

### Inscription avec données invalides
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "username": "ab",
    "password": "123"
  }'
```

**Résultat attendu :**
- Status: 400
- Message d'erreur de validation

## 2. Test de création d'administrateur

### Créer le premier admin (via script)
```bash
cd backend
npm run create-admin
```

### Créer un admin via API (en tant qu'admin)
```bash
# D'abord, se connecter en tant qu'admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@grammachat.com",
    "password": "admin123456"
  }'

# Utiliser le token retourné pour créer un autre admin
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "admin2@test.com",
    "username": "admin2",
    "password": "password123"
  }'
```

**Résultat attendu :**
- Status: 201
- Rôle attribué: "admin"
- Pas de token retourné (l'admin doit se connecter séparément)

### Tentative de création d'admin par un utilisateur normal
```bash
# D'abord, se connecter en tant qu'utilisateur normal
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'

# Tenter de créer un admin
curl -X POST http://localhost:3000/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "email": "hacker@test.com",
    "username": "hacker",
    "password": "password123"
  }'
```

**Résultat attendu :**
- Status: 403
- Message: "Accès administrateur requis"

## 3. Test d'accès aux routes protégées

### Accès à la liste des utilisateurs (admin)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Résultat attendu :**
- Status: 200
- Liste de tous les utilisateurs

### Accès à la liste des utilisateurs (utilisateur normal)
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Résultat attendu :**
- Status: 403
- Message: "Accès administrateur requis"

### Accès au profil personnel
```bash
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Résultat attendu :**
- Status: 200
- Profil de l'utilisateur connecté

### Accès au profil d'un autre utilisateur (utilisateur normal)
```bash
curl -X GET http://localhost:3000/api/users/OTHER_USER_ID \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Résultat attendu :**
- Status: 403
- Message: "Accès non autorisé à cette ressource"

### Accès au profil d'un autre utilisateur (admin)
```bash
curl -X GET http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Résultat attendu :**
- Status: 200
- Profil de l'utilisateur demandé

## 4. Test de gestion des messages

### Envoi de message (utilisateur connecté)
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "content": "Bonjour, ceci est un test de message !"
  }'
```

**Résultat attendu :**
- Status: 201
- Message créé avec calcul d'XP

### Envoi de message sans authentification
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Message sans auth"
  }'
```

**Résultat attendu :**
- Status: 401
- Message: "Token d'accès requis"

## 5. Test de validation des tokens

### Token invalide
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer invalid-token"
```

**Résultat attendu :**
- Status: 403
- Message: "Token invalide"

### Sans token
```bash
curl -X GET http://localhost:3000/api/auth/profile
```

**Résultat attendu :**
- Status: 401
- Message: "Token d'accès requis"

## 6. Test du classement (route publique)

### Accès au classement sans authentification
```bash
curl -X GET http://localhost:3000/api/users/leaderboard
```

**Résultat attendu :**
- Status: 200
- Classement des utilisateurs par XP

## Checklist de validation

- [ ] L'inscription publique crée toujours des utilisateurs avec le rôle 'user'
- [ ] Seuls les admins peuvent créer des comptes administrateurs
- [ ] Les utilisateurs normaux ne peuvent pas accéder aux routes admin
- [ ] Les utilisateurs ne peuvent accéder qu'à leurs propres données
- [ ] Les admins peuvent accéder à toutes les données
- [ ] Les tokens JWT sont correctement validés
- [ ] Les messages nécessitent une authentification
- [ ] Le classement est accessible publiquement

## Notes importantes

1. **Sécurité** : Les mots de passe sont automatiquement hashés avec bcrypt
2. **Tokens** : Les tokens JWT expirent après 7 jours par défaut
3. **Validation** : Toutes les entrées sont validées côté serveur
4. **Rôles** : Le système distingue clairement les utilisateurs des administrateurs
5. **Permissions** : Chaque route a des permissions appropriées selon le rôle
