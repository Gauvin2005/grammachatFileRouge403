/**
 * Détecteur d'IP simplifié - Version stable
 */

import { Platform } from 'react-native';

/**
 * Retourne l'IP à utiliser selon la plateforme
 */
export const getWorkingIP = async (): Promise<string> => {
  try {
    // Utiliser l'IP actuelle pour tous les environnements de dev
    return '10.8.251.168';
    
  } catch (error) {
    console.error('Erreur lors de la détection d\'IP:', error);
    return '10.8.251.168';
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
 * Teste si une IP est accessible (pour debug uniquement)
 */
export const testIPConnection = async (ip: string): Promise<boolean> => {
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
 * Force une nouvelle détection d'IP (retourne juste l'IP par défaut)
 */
export const forceIPDetection = async (): Promise<string> => {
  console.log('Détection forcée - utilisation de l\'IP par défaut');
  return await getWorkingIP();
};

/**
 * Monitoring simplifié (ne fait rien)
 */
export const startIPMonitoring = (intervalMs: number = 30000): () => void => {
  console.log('Monitoring IP désactivé pour éviter les conflits');
  return () => {}; // Fonction vide
};
