import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isOffline: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isOffline: false,
  });

  useEffect(() => {
    // Obtenir l'état initial du réseau
    const getInitialNetworkState = async () => {
      try {
        const state = await NetInfo.fetch();
        setNetworkStatus({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
          isOffline: !state.isConnected || state.isInternetReachable === false,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'état réseau initial:', error);
        setNetworkStatus(prev => ({ ...prev, isOffline: true }));
      }
    };

    getInitialNetworkState();

    // Écouter les changements de connexion
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOffline = !state.isConnected || state.isInternetReachable === false;
      
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isOffline,
      });

      // Logger les changements de connexion
      if (isOffline) {
        console.log('Mode hors-ligne activé - Connexion perdue');
      } else {
        console.log('Mode en ligne activé - Connexion rétablie');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};
