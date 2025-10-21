/**
 * Script de test pour la détection automatique d'IP
 */

import { getWorkingIP, getApiUrl, testIPConnection } from './ipDetector';

export const testIPDetection = async (): Promise<void> => {
  console.log('=== Test de la détection automatique d\'IP ===');
  
  try {
    // Test 1: Détection d'IP
    console.log('1. Test de détection d\'IP...');
    const detectedIP = await getWorkingIP();
    console.log(`IP détectée: ${detectedIP}`);
    
    // Test 2: URL API complète
    console.log('2. Test de génération d\'URL API...');
    const apiUrl = await getApiUrl();
    console.log(`URL API: ${apiUrl}`);
    
    // Test 3: Test de connectivité directe
    console.log('3. Test de connectivité directe...');
    const isConnected = await testIPConnection(detectedIP);
    console.log(`Connectivité: ${isConnected ? 'OK' : 'ÉCHEC'}`);
    
    if (isConnected) {
      console.log('✅ Détection d\'IP fonctionnelle !');
    } else {
      console.log('❌ Problème de connectivité détecté');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
  
  console.log('=== Fin du test ===');
};

// Fonction pour tester une IP spécifique
export const testSpecificIP = async (ip: string): Promise<boolean> => {
  console.log(`Test de l'IP spécifique: ${ip}`);
  try {
    const isWorking = await testIPConnection(ip);
    console.log(`Résultat: ${isWorking ? 'OK' : 'ÉCHEC'}`);
    return isWorking;
  } catch (error) {
    console.error(`Erreur lors du test de ${ip}:`, error);
    return false;
  }
};
