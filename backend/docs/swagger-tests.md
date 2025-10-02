#  Scripts de Test Swagger

##  Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| `test-swagger-basic.ts` | `npm run test:swagger:basic` | Tests Swagger UI (Puppeteer) |
| `test-api-routes.ts` | `npm run test:api` | Tests API directs (HTTP) |
| `test-all.ts` | `npm run test:all` | Tous les tests |

##  Utilisation

```bash
# Prérequis
docker-compose up -d
npm install

# Tests
npm run test:swagger:basic  # Recommandé
npm run test:api           # Plus rapide
npm run test:all           # Complet
```

## Variables d'environnement

```bash
API_URL=http://localhost:3000  # URL API
HEADLESS=false                  # Mode debug
```

##  Dépannage

| Erreur | Solution |
|--------|----------|
| `Cannot find module` | `npm install` |
| `Timeout` | Vérifier `docker-compose up -d` |
| `Navigation timeout` | Vérifier port 3000 libre |

##  Résultats attendus

- **API** : 5/8 tests réussis (erreurs intentionnelles)
- **Swagger** : 3/4 tests réussis
- **Codes** : 403, 400, 404 = normaux
