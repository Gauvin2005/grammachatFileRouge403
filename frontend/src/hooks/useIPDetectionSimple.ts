/**
 * Hook simplifié pour la gestion de l'IP
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface IPStatus {
  ip: string | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const useIPDetection = () => {
  const [status, setStatus] = useState<IPStatus>({
    ip: '10.8.252.74', // IP fixe
    isLoading: false,
    error: null,
    lastChecked: new Date()
  });

  const detectIP = async () => {
    // Pas de détection nécessaire - IP fixe
    setStatus(prev => ({ 
      ...prev, 
      ip: '10.8.252.74',
      isLoading: false, 
      error: null,
      lastChecked: new Date()
    }));
  };

  const refreshIP = async () => {
    // Pas de refresh nécessaire - IP fixe
    console.log('Refresh IP - utilisation de l\'IP fixe');
    await detectIP();
  };

  useEffect(() => {
    detectIP();
  }, []);

  return {
    ip: status.ip,
    isLoading: status.isLoading,
    error: status.error,
    lastChecked: status.lastChecked,
    refreshIP
  };
};
