/**
 * Détecteur automatique d'IP pour éviter les problèmes de changement d'adresse
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_CACHE_KEY = 'detected_ip';
const IP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface IPDetectionResult {
  ip: string;
  timestamp: number;
  working: boolean;
}

/**
 * Détecte l'IP locale de la machine hôte
 */
export const detectHostIP = async (): Promise<string | null> => {
  try {
    // Pour Android Emulator, utiliser l'adresse spéciale
    if (Platform.OS === 'android') {
      return '10.0.2.2';
    }
    
    // Pour iOS Simulator, localhost fonctionne généralement
    if (Platform.OS === 'ios') {
      return 'localhost';
    }
    
    // Pour les autres cas, essayer de détecter via les URLs de test
    return await findWorkingIP();
  } catch (error) {
    console.error('Erreur lors de la détection d\'IP:', error);
    return null;
  }
};

/**
 * Trouve une IP qui fonctionne en testant plusieurs URLs
 */
const findWorkingIP = async (): Promise<string | null> => {
  const testIPs = [
    '10.8.252.74',
    '10.8.251.148',
    '192.168.1.100',
    '192.168.0.100',
    '192.168.1.1',
    '192.168.0.1',
    '127.0.0.1',
    'localhost'
  ];

  for (const ip of testIPs) {
    try {
      const isWorking = await testIPConnection(ip);
      if (isWorking) {
        console.log(`IP fonctionnelle trouvée: ${ip}`);
        return ip;
      }
    } catch (error) {
      console.log(`IP ${ip} non accessible:`, error instanceof Error ? error.message : String(error));
      continue;
    }
  }

  console.log('Aucune IP fonctionnelle trouvée');
  return null;
};

/**
 * Teste si une IP est accessible
 */
const testIPConnection = async (ip: string): Promise<boolean> => {
  try {
    const url = `http://${ip}:3000/api/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Met en cache l'IP détectée
 */
const cacheDetectedIP = async (ip: string): Promise<void> => {
  try {
    const cacheData: IPDetectionResult = {
      ip,
      timestamp: Date.now(),
      working: true
    };
    await AsyncStorage.setItem(IP_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`IP mise en cache: ${ip}`);
  } catch (error) {
    console.error('Erreur lors de la mise en cache de l\'IP:', error);
  }
};

/**
 * Récupère l'IP depuis le cache si elle est encore valide
 */
const getCachedIP = async (): Promise<string | null> => {
  try {
    const cached = await AsyncStorage.getItem(IP_CACHE_KEY);
    if (!cached) return null;

    const cacheData: IPDetectionResult = JSON.parse(cached);
    const now = Date.now();
    
    // Vérifier si le cache est encore valide
    if (now - cacheData.timestamp < IP_CACHE_TTL) {
      // Tester si l'IP mise en cache fonctionne encore
      const stillWorking = await testIPConnection(cacheData.ip);
      if (stillWorking) {
        console.log(`Utilisation de l'IP en cache: ${cacheData.ip}`);
        return cacheData.ip;
      } else {
        console.log('IP en cache ne fonctionne plus, suppression du cache');
        await AsyncStorage.removeItem(IP_CACHE_KEY);
      }
    } else {
      console.log('Cache IP expiré');
      await AsyncStorage.removeItem(IP_CACHE_KEY);
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'IP en cache:', error);
    return null;
  }
};

/**
 * Fonction principale qui retourne l'IP à utiliser
 */
export const getWorkingIP = async (): Promise<string> => {
  try {
    // 1. Essayer de récupérer depuis le cache
    const cachedIP = await getCachedIP();
    if (cachedIP) {
      return cachedIP;
    }

    // 2. Détecter une nouvelle IP
    console.log('Détection d\'une nouvelle IP...');
    const detectedIP = await detectHostIP();
    
    if (detectedIP) {
      // Mettre en cache la nouvelle IP
      await cacheDetectedIP(detectedIP);
      return detectedIP;
    }

    // 3. Fallback vers l'IP par défaut
    console.log('Utilisation de l\'IP par défaut');
    const defaultIP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return defaultIP;
    
  } catch (error) {
    console.error('Erreur lors de la détection d\'IP:', error);
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
};

/**
 * Force une nouvelle détection d'IP (ignore le cache)
 */
export const forceIPDetection = async (): Promise<string> => {
  try {
    await AsyncStorage.removeItem(IP_CACHE_KEY);
    console.log('Cache IP supprimé, nouvelle détection forcée');
    return await getWorkingIP();
  } catch (error) {
    console.error('Erreur lors de la détection forcée d\'IP:', error);
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  }
};

/**
 * Obtient l'URL complète de l'API avec l'IP détectée
 */
export const getApiUrl = async (): Promise<string> => {
  const ip = await getWorkingIP();
  return `http://${ip}:3000/api`;
};

/**
 * Vérifie périodiquement si l'IP fonctionne encore
 */
export const startIPMonitoring = (intervalMs: number = 30000): () => void => {
  const interval = setInterval(async () => {
    try {
      const cached = await AsyncStorage.getItem(IP_CACHE_KEY);
      if (cached) {
        const cacheData: IPDetectionResult = JSON.parse(cached);
        const stillWorking = await testIPConnection(cacheData.ip);
        
        if (!stillWorking) {
          console.log('IP ne fonctionne plus, suppression du cache');
          await AsyncStorage.removeItem(IP_CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Erreur lors du monitoring IP:', error);
    }
  }, intervalMs);

  return () => clearInterval(interval);
};
