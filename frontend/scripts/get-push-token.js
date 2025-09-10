#!/usr/bin/env node

/**
 * Script pour obtenir le token de notification push Expo
 * Usage: node scripts/get-push-token.js
 */

const { Expo } = require('expo-server-sdk');

async function getPushToken() {
  try {
    console.log('🔧 Configuration des notifications push Expo...\n');
    
    // Vérifier si Expo CLI est installé
    const { execSync } = require('child_process');
    
    try {
      execSync('expo --version', { stdio: 'pipe' });
      console.log('✅ Expo CLI détecté');
    } catch (error) {
      console.log('❌ Expo CLI non trouvé. Installez-le avec: npm install -g @expo/cli');
      return;
    }

    // Vérifier la configuration du projet
    const fs = require('fs');
    const path = require('path');
    
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    if (!fs.existsSync(appJsonPath)) {
      console.log('❌ app.json non trouvé');
      return;
    }
    
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const projectId = appConfig.expo?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.log('❌ Project ID EAS non trouvé dans app.json');
      console.log('💡 Exécutez: eas init pour configurer le projet');
      return;
    }
    
    console.log(`✅ Project ID EAS: ${projectId}`);
    
    // Instructions pour obtenir le token
    console.log('\n📱 Pour obtenir votre token de notification push:');
    console.log('1. Lancez votre app avec: npm start');
    console.log('2. Ouvrez l\'app sur un appareil physique (pas l\'émulateur)');
    console.log('3. Le token sera affiché dans la console');
    console.log('4. Copiez le token et utilisez-le dans votre variable EXPO_PUSH_TOKEN');
    
    console.log('\n🔗 Liens utiles:');
    console.log('- Documentation Expo Notifications: https://docs.expo.dev/push-notifications/overview/');
    console.log('- EAS Build: https://docs.expo.dev/build/introduction/');
    console.log('- Expo Push API: https://docs.expo.dev/push-notifications/sending-notifications/');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

getPushToken();

