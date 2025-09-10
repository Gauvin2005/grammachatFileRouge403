# Configuration des Notifications Push Expo

## 🎯 Objectif
Configurer les notifications push pour l'application Grammachat en utilisant Expo CLI et EAS.

## ✅ Configuration terminée

### 1. Expo CLI et EAS configurés
- ✅ Expo CLI installé globalement
- ✅ EAS CLI installé et configuré
- ✅ Projet EAS créé avec l'ID: `0ff4ca6f-09d3-4931-b376-b14d33f855dc`
- ✅ Configuration `eas.json` générée

### 2. Service de notifications créé
- ✅ `src/services/notificationService.ts` - Service complet pour gérer les notifications
- ✅ Intégration dans `App.tsx` pour l'initialisation automatique
- ✅ Support des permissions et configuration Android

### 3. Scripts utilitaires
- ✅ `scripts/get-push-token.js` - Guide pour obtenir le token
- ✅ `scripts/test-push-notification.js` - Test d'envoi de notifications
- ✅ Scripts npm ajoutés dans `package.json`

## 🚀 Comment obtenir ton token de notification push

### Étape 1: Lancer l'application
```bash
npm start
```

### Étape 2: Ouvrir sur un appareil physique
- **Important**: Les notifications push ne fonctionnent que sur un appareil physique, pas sur l'émulateur
- Utilise l'app Expo Go ou construis une version de développement

### Étape 3: Récupérer le token
- Le token sera affiché dans la console de l'app
- Il ressemble à: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

### Étape 4: Utiliser le token
Remplace `your-expo-push-token` dans ton fichier `.env` par le vrai token obtenu.

## 🧪 Tester les notifications

### Avec le script de test
```bash
npm run test-push <TON_TOKEN>
```

### Exemple
```bash
npm run test-push ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

## 📱 Configuration dans l'app

Le service de notifications est automatiquement initialisé au démarrage de l'app et :

1. **Demande les permissions** de notification
2. **Configure les canaux Android** si nécessaire
3. **Enregistre l'appareil** pour les notifications push
4. **Récupère le token** Expo Push
5. **Configure les listeners** pour les notifications reçues

## 🔧 Utilisation dans le code

```typescript
import notificationService from './src/services/notificationService';

// Obtenir le token actuel
const token = notificationService.getPushToken();

// Envoyer une notification locale
await notificationService.sendLocalNotification(
  'Titre',
  'Message',
  { data: 'optionnelle' }
);
```

## 📋 Prochaines étapes

1. **Lancer l'app** sur un appareil physique
2. **Récupérer le token** affiché dans la console
3. **Mettre à jour** la variable `EXPO_PUSH_TOKEN` dans ton `.env`
4. **Tester** avec le script de test
5. **Intégrer** l'envoi de notifications depuis ton backend

## 🔗 Liens utiles

- [Documentation Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Configuration EAS](https://docs.expo.dev/eas/)

## ⚠️ Notes importantes

- Les notifications push ne fonctionnent que sur des appareils physiques
- Le token change si l'app est désinstallée/réinstallée
- Pour la production, utilise EAS Build pour créer des builds optimisés
- Les notifications peuvent être limitées par les paramètres système de l'appareil

