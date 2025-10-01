# Documentation Cache Redis - Grammachat

## Principe du Cache Redis

**Cache = Stockage temporaire** de données fréquemment utilisées pour éviter les requêtes répétées à la base de données.

### Comment ça marche :
1. **Première requête** : Données récupérées depuis MongoDB → Stockées dans Redis
2. **Requêtes suivantes** : Données servies directement depuis Redis (ultra-rapide)
3. **Expiration** : Après le TTL, les données sont supprimées automatiquement
4. **Nouvelle requête** : Cycle recommence

## Types de Cache Configurés

| Type de Données          | TTL        | Comportement                                                        |
|--------------------------|------------|---------------------------------------------------------------------|
| **Sessions utilisateur** | 7 jours    | Stockage des infos de session, évite les vérifications JWT répétées |
| **Messages**             | 5 minutes  | Cache des listes de messages, invalidation après nouvel envoi       |
| **Leaderboard**          | 10 minutes | Classement des utilisateurs, mis à jour périodiquement              |
| **Profils utilisateur**  | 15 minutes | Données de profil, invalidation après modification                  |
| **Statistiques**         | 30 minutes | XP, niveaux, stats de jeu                                           |

## Cycle de Vie des Données

### Messages (5 minutes) :
- **0-5min** : Données servies depuis Redis (instantané)
- **5min+** : Cache expiré, prochaine requête va chercher en MongoDB
- **Après envoi** : Cache invalidé immédiatement, données fraîches

### Leaderboard (10 minutes) :
- **0-10min** : Classement servi depuis Redis
- **10min+** : Cache expiré, recalcul depuis MongoDB
- **Après modification XP** : Cache invalidé pour mise à jour

## Avantages

- **Performance** : Réponse 10x plus rapide depuis Redis
- **Charge serveur** : Réduction des requêtes MongoDB
- **Expérience utilisateur** : Navigation fluide, données instantanées
- **Scalabilité** : Support de plus d'utilisateurs simultanés

## Configuration (.env)

```bash
# TTL en secondes (modifiables)
REDIS_SESSION_TTL=604800    # 7 jours
REDIS_MESSAGES_TTL=300       # 5 minutes  
REDIS_LEADERBOARD_TTL=600    # 10 minutes
REDIS_PROFILE_TTL=900        # 15 minutes
REDIS_STATS_TTL=1800         # 30 minutes
```

## Gestion des Erreurs

- **Redis down** : Application continue sans cache (mode dégradé)
- **Données corrompues** : Cache ignoré, fallback vers MongoDB
- **Connexion perdue** : Reconnexion automatique

## Monitoring

```typescript
// Vérifier l'état Redis
const stats = redisService.getCacheStats();
console.log(`Redis: ${stats.connected ? 'OK' : 'DOWN'}, Keys: ${stats.keys}`);
```

## Invalidation Intelligente

- **Automatique** : Après création/modification de données
- **Manuelle** : `redisService.invalidateUserCache(userId)`
- **Globale** : `redisService.clearAllCache()` (maintenance)

## Exemple Concret

**Scénario** : Utilisateur consulte ses messages
1. **Premier chargement** : MongoDB (200ms) → Cache Redis
2. **Navigation retour** : Redis (5ms) ⚡
3. **Nouveau message** : Cache invalidé → MongoDB (200ms) → Nouveau cache
4. **Consultation suivante** : Redis (5ms) ⚡
