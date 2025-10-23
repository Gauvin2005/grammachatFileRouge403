/**
 * Script de test de connectivité pour diagnostiquer les problèmes de connexion
 */

import { Platform } from 'react-native';

export const testConnection = async () => {
  console.log('=== Test de connectivité rapide ===');
  console.log('Plateforme:', Platform.OS);
  
  // Déterminer l'URL à tester selon la plateforme
  let testUrl: string;
  if (Platform.OS === 'android') {
    testUrl = 'http://10.8.252.168:3000/api';
  } else if (Platform.OS === 'ios') {
    testUrl = 'http://localhost:3000/api';
  } else {
    testUrl = 'http://10.8.252.168:3000/api';
  }
  
  console.log('URL testée:', testUrl);
  
  try {
    // Test rapide: Login direct (pas de health check séparé)
    console.log('Test de connexion rapide...');
    const loginResponse = await fetch(`${testUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@grammachat.com',
        password: 'admin123'
      }),
      // Timeout réduit pour test rapide
      signal: AbortSignal.timeout(5000)
    });
    
    const loginData = await loginResponse.json();
    console.log('Test rapide:', loginData);
    
    if (!loginResponse.ok) {
      throw new Error(`Connexion échouée: ${loginResponse.status} - ${loginData.message}`);
    }
    
    console.log('✅ Connexion rapide réussie !');
    return {
      success: true,
      loginData,
      url: testUrl
    };
    
  } catch (error: any) {
    console.error('❌ Erreur de test rapide:', error);
    return {
      success: false,
      error: error.message,
      url: testUrl
    };
  }
};

export const testMultipleUrls = async () => {
  console.log('=== Test rapide de plusieurs URLs ===');
  
  const testUrls = [
    'http://10.8.252.168:3000/api',
    'http://10.0.2.2:3000/api',
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api'
  ];
  
  const results = [];
  
  for (const url of testUrls) {
    try {
      console.log(`Test rapide de ${url}...`);
      const response = await fetch(`${url}/health`, {
        // Timeout très court pour test rapide
        signal: AbortSignal.timeout(2000)
      });
      const data = await response.json();
      
      results.push({
        url,
        success: response.ok,
        data
      });
      
      console.log(`${url}: ${response.ok ? 'OK' : 'ÉCHEC'}`);
      
    } catch (error: any) {
      results.push({
        url,
        success: false,
        error: error.message
      });
      console.log(`${url}: ÉCHEC - ${error.message}`);
    }
  }
  
  return results;
};
