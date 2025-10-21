/**
 * Script d'initialisation pour la détection automatique d'IP
 * À appeler au démarrage de l'application
 */

import { getWorkingIP, getApiUrl, startIPMonitoring } from '../utils/simpleIPDetector';
import { apiService } from '../services/api';

export class IPInitializer {
  private static instance: IPInitializer;
  private isInitialized = false;
  private monitoringInterval: (() => void) | null = null;

  static getInstance(): IPInitializer {
    if (!IPInitializer.instance) {
      IPInitializer.instance = new IPInitializer();
    }
    return IPInitializer.instance;
  }

  /**
   * Initialise la détection automatique d'IP
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('IP Initializer déjà initialisé');
      return;
    }

    try {
      console.log('Initialisation de la détection automatique d\'IP...');
      
      // Détecter l'IP actuelle
      const detectedIP = await getWorkingIP();
      const apiUrl = await getApiUrl();
      
      console.log(`IP détectée: ${detectedIP}`);
      console.log(`URL API: ${apiUrl}`);
      
      // Mettre à jour l'API service
      if (apiService.baseURL !== apiUrl) {
        console.log(`Mise à jour de l'URL API: ${apiService.baseURL} -> ${apiUrl}`);
        apiService.baseURL = apiUrl;
        apiService.api.defaults.baseURL = apiUrl;
      }
      
      // Démarrer le monitoring périodique
      this.monitoringInterval = startIPMonitoring(30000); // Toutes les 30 secondes
      
      this.isInitialized = true;
      console.log('IP Initializer initialisé avec succès');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation IP:', error);
      throw error;
    }
  }

  /**
   * Force une nouvelle détection d'IP
   */
  async refreshIP(): Promise<void> {
    try {
      console.log('Refresh IP forcé...');
      await apiService.refreshIP();
      
      const detectedIP = await getWorkingIP();
      const apiUrl = await getApiUrl();
      
      console.log(`Nouvelle IP détectée: ${detectedIP}`);
      console.log(`Nouvelle URL API: ${apiUrl}`);
      
    } catch (error) {
      console.error('Erreur lors du refresh IP:', error);
      throw error;
    }
  }

  /**
   * Arrête le monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      this.monitoringInterval();
      this.monitoringInterval = null;
    }
    this.isInitialized = false;
    console.log('IP Initializer arrêté');
  }

  /**
   * Obtient le statut de l'initialisation
   */
  getStatus(): { isInitialized: boolean; hasMonitoring: boolean } {
    return {
      isInitialized: this.isInitialized,
      hasMonitoring: !!this.monitoringInterval
    };
  }
}

// Instance singleton
export const ipInitializer = IPInitializer.getInstance();

/**
 * Fonction utilitaire pour initialiser rapidement
 */
export const initializeIPDetection = async (): Promise<void> => {
  return await ipInitializer.initialize();
};

/**
 * Fonction utilitaire pour forcer le refresh
 */
export const refreshIPDetection = async (): Promise<void> => {
  return await ipInitializer.refreshIP();
};
