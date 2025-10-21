/**
 * Hook pour la gestion automatique de l'IP
 */

import { useEffect, useState } from 'react';
import { getWorkingIP, getApiUrl, startIPMonitoring } from '../utils/ipDetector';
import { apiService } from '../services/api';

interface IPStatus {
  ip: string | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const useIPDetection = () => {
  const [status, setStatus] = useState<IPStatus>({
    ip: null,
    isLoading: true,
    error: null,
    lastChecked: null
  });

  const detectIP = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      console.log('Détection d\'IP en cours...');
      const ip = await getWorkingIP();
      const apiUrl = await getApiUrl();
      
      setStatus({
        ip,
        isLoading: false,
        error: null,
        lastChecked: new Date()
      });
      
      console.log(`IP détectée: ${ip}, URL API: ${apiUrl}`);
      
      // Mettre à jour l'API service si nécessaire
      if (apiService.baseURL !== apiUrl) {
        console.log('Mise à jour de l\'URL API dans le service');
        apiService.baseURL = apiUrl;
        apiService.api.defaults.baseURL = apiUrl;
      }
      
    } catch (error: any) {
      console.error('Erreur lors de la détection d\'IP:', error);
      setStatus({
        ip: null,
        isLoading: false,
        error: error.message || 'Erreur de détection d\'IP',
        lastChecked: new Date()
      });
    }
  };

  const refreshIP = async () => {
    try {
      console.log('Refresh IP forcé...');
      await apiService.refreshIP();
      await detectIP();
    } catch (error: any) {
      console.error('Erreur lors du refresh IP:', error);
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Erreur de refresh IP'
      }));
    }
  };

  useEffect(() => {
    // Détection initiale
    detectIP();
    
    // Monitoring périodique (toutes les 30 secondes)
    const stopMonitoring = startIPMonitoring(30000);
    
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    ...status,
    detectIP,
    refreshIP,
    isConnected: !!status.ip && !status.error
  };
};
