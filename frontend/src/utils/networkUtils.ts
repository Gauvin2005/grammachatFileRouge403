/**
 * Utilitaires pour la gestion du réseau et la détection d'IP
 */

import { Platform } from 'react-native';

export interface NetworkConfig {
  baseUrl: string;
  isLocal: boolean;
  platform: string;
}

/**
 * Détecte automatiquement l'IP locale de votre machine
 */
export const detectLocalIP = async (): Promise<string | null> => {
  try {
    // Pour Android, utiliser l'adresse spéciale de l'émulateur
    if (Platform.OS === 'android') {
      return '10.0.2.2';
    }
    
    // Pour iOS, localhost fonctionne généralement
    if (Platform.OS === 'ios') {
      return 'localhost';
    }
    
    // Fallback générique
    return 'localhost';
  } catch (error) {
    console.error('Erreur lors de la détection de l\'IP:', error);
    return null;
  }
};

/**
 * Génère une liste d'URLs à tester selon la plateforme
 */
export const getTestUrls = (port: number = 3000): string[] => {
  const baseUrls = [
    'http://10.0.2.2',      // Android Emulator
    'http://localhost',     // iOS Simulator / Local
    'http://127.0.0.1',     // Localhost alternatif
  ];
  
  // Ajouter des IPs locales communes (à adapter selon votre réseau)
  const localIPs = [
    'http://10.8.252.168',   // IP actuelle
    'http://10.8.251.148',  // Ancienne IP (compatibilité)
    'http://192.168.1.100',
    'http://192.168.0.100',
    'http://192.168.1.1',
    'http://192.168.0.1'
  ];
  
  const allUrls = [...baseUrls, ...localIPs];
  return allUrls.map(url => `${url}:${port}/api`);
};

/**
 * Configuration réseau recommandée selon l'environnement
 */
export const getNetworkConfig = (): NetworkConfig => {
  if (__DEV__) {
    const platform = Platform.OS;
    let baseUrl: string;
    
    // Force l'utilisation de l'IP actuelle pour tous les environnements de dev
    baseUrl = 'http://10.8.252.168:3000/api';
    
    console.log('Configuration réseau:', { platform, baseUrl });
    
    return {
      baseUrl,
      isLocal: true,
      platform
    };
  }
  
  return {
    baseUrl: 'https://ma-production-api.com/api',
    isLocal: false,
    platform: 'production'
  };
};

/**
 * Messages d'erreur réseau personnalisés
 */
export const getNetworkErrorMessage = (error: any): string => {
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
  }
  
  if (error.code === 'ECONNREFUSED') {
    return 'Le serveur refuse la connexion. Vérifiez que le serveur backend est démarré.';
  }
  
  if (error.code === 'TIMEOUT') {
    return 'Le serveur met trop de temps à répondre. Vérifiez votre connexion.';
  }
  
  return error.message || 'Erreur de connexion inconnue';
};

/**
 * Instructions pour configurer l'accès réseau
 */
export const getNetworkSetupInstructions = (): string => {
  return `
Pour résoudre les problèmes de connectivité :

1. **Android Emulator** : Utilisez http://10.0.2.2:3000/api
2. **iOS Simulator** : Utilisez http://localhost:3000/api  
3. **Appareil physique** : Trouvez votre IP locale avec :
   - Windows: ipconfig
   - Mac/Linux: ifconfig
   - Utilisez http://VOTRE_IP:3000/api

4. **Vérifiez que le serveur backend est démarré** sur le port 3000
5. **Vérifiez votre pare-feu** et les paramètres réseau
`;
};
