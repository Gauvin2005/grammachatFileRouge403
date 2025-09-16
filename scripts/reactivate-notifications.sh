#!/bin/bash

# 🔔 Script de réactivation rapide des notifications
# Usage: ./scripts/reactivate-notifications.sh

echo "🔔 Réactivation des notifications..."

# Décommenter l'import dans App.tsx
sed -i 's|// import notificationService|import notificationService|g' frontend/App.tsx

# Décommenter les appels de notifications dans App.tsx
sed -i 's|// await notificationService|await notificationService|g' frontend/App.tsx
sed -i 's|// const pushToken|const pushToken|g' frontend/App.tsx
sed -i 's|// if (pushToken)|if (pushToken)|g' frontend/App.tsx
sed -i 's|//   console.log|  console.log|g' frontend/App.tsx
sed -i 's|//   // Ici tu peux|  // Ici tu peux|g' frontend/App.tsx
sed -i 's|// }|}|g' frontend/App.tsx

# Décommenter le switch dans ProfileScreen.tsx
sed -i 's|{/\* 🔔 NOTIFICATIONS TEMPORAIREMENT DÉSACTIVÉES \*/}||g' frontend/src/screens/ProfileScreen.tsx
sed -i 's|{/\* TODO: Réactiver quand les fonctionnalités prioritaires seront terminées \*/}||g' frontend/src/screens/ProfileScreen.tsx
sed -i 's|{/\* Voir NOTIFICATIONS-TEMPORARY-DISABLE.md pour plus d'informations \*/}||g' frontend/src/screens/ProfileScreen.tsx
sed -i 's|{/\*||g' frontend/src/screens/ProfileScreen.tsx
sed -i 's|\*/}||g' frontend/src/screens/ProfileScreen.tsx

echo "✅ Notifications réactivées !"
echo "📝 N'oublie pas de :"
echo "   1. Tester sur un appareil physique"
echo "   2. Vérifier les permissions"
echo "   3. Configurer les canaux Android si nécessaire"
echo "   4. Supprimer ce script après utilisation"
