import { useEffect, useCallback, useState, useRef } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineSyncService, SyncResult } from '../services/offlineSyncService';
import { useAppDispatch } from './redux';
import { loadUserProfile } from '../store/authSlice';

export interface UseOfflineSyncReturn {
  isOffline: boolean;
  isSyncing: boolean;
  pendingItemsCount: number;
  lastSyncResult: SyncResult | null;
  syncAll: () => Promise<SyncResult>;
  syncProfileUpdates: () => Promise<SyncResult>;
  syncMessages: () => Promise<SyncResult>;
  hasPendingData: () => Promise<boolean>;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const { isOffline, isConnected, isInternetReachable } = useNetworkStatus();
  const dispatch = useAppDispatch();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingItemsCount, setPendingItemsCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncAttemptRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  // Mettre à jour le compteur d'éléments en attente
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineSyncService.getPendingItemsCount();
      setPendingItemsCount(count);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur:', error);
    }
  }, []);

  // Vérifier si la connexion est vraiment stable
  const isConnectionStable = useCallback(() => {
    return isConnected === true && isInternetReachable === true;
  }, [isConnected, isInternetReachable]);

  // Synchronisation automatique au retour de connexion stable
  useEffect(() => {
    // Nettoyer le timeout précédent
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Vérifier si on peut synchroniser
    if (!isOffline && isConnectionStable() && !isSyncing && retryCountRef.current < 3) {
      const performAutoSync = async () => {
        try {
          console.log('Vérification des données en attente...');
          const hasData = await offlineSyncService.hasPendingData();
          console.log('Données en attente trouvées:', hasData);
          
          if (hasData) {
            console.log('Connexion stable détectée, synchronisation automatique en cours...');
            setIsSyncing(true);
            
            const result = await offlineSyncService.syncAllOfflineData();
            console.log('Résultat de la synchronisation:', result);
            setLastSyncResult(result);
            
            if (result.success) {
              console.log('Synchronisation automatique réussie:', result);
              retryCountRef.current = 0; // Reset du compteur de retry
            } else {
              console.log('Synchronisation automatique échouée:', result);
              // Incrémenter le compteur de retry
              retryCountRef.current += 1;
              
              // Si trop d'erreurs, arrêter les tentatives automatiques
              if (retryCountRef.current >= 3) {
                console.log('Trop d\'échecs de synchronisation, arrêt des tentatives automatiques');
                // Ne pas relancer la synchronisation automatique
                return;
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation automatique:', error);
          retryCountRef.current += 1;
          setLastSyncResult({
            success: false,
            syncedItems: 0,
            errors: ['Erreur lors de la synchronisation automatique'],
            message: 'Erreur lors de la synchronisation automatique',
          });
        } finally {
          setIsSyncing(false);
          updatePendingCount();
          lastSyncAttemptRef.current = Date.now();
        }
      };

      // Délai de 3 secondes avant synchronisation pour s'assurer que la connexion est stable
      syncTimeoutRef.current = setTimeout(performAutoSync, 3000);
    }

    // Cleanup function
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [isOffline, isConnectionStable, isSyncing, updatePendingCount]);

  // Écouter les résultats de synchronisation
  useEffect(() => {
    const unsubscribe = offlineSyncService.addSyncListener(async (result) => {
      setLastSyncResult(result);
      setIsSyncing(false);
      updatePendingCount();
      
      if (result.success) {
        console.log('Synchronisation réussie:', result.message);
        retryCountRef.current = 0; // Reset du compteur de retry
        
        // Recharger le profil utilisateur pour mettre à jour le store avec les données du serveur
        try {
          await dispatch(loadUserProfile()).unwrap();
          console.log('Profil utilisateur rechargé après synchronisation');
        } catch (error) {
          console.error('Erreur lors du rechargement du profil après synchronisation:', error);
        }
      } else {
        console.log('Synchronisation échouée:', result.message);
        retryCountRef.current += 1;
      }
    });

    return unsubscribe;
  }, [updatePendingCount, dispatch]);

  // Mettre à jour le compteur au montage
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Fonctions de synchronisation manuelle
  const syncAll = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Synchronisation déjà en cours'],
        message: 'Synchronisation déjà en cours',
      };
    }

    if (!isConnectionStable()) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Connexion non stable'],
        message: 'Connexion non stable, impossible de synchroniser',
      };
    }

    // Réinitialiser le compteur d'erreurs pour la synchronisation manuelle
    retryCountRef.current = 0;
    
    setIsSyncing(true);
    try {
      const result = await offlineSyncService.syncAllOfflineData();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  }, [isSyncing, isConnectionStable, updatePendingCount]);

  const syncProfileUpdates = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Synchronisation déjà en cours'],
        message: 'Synchronisation déjà en cours',
      };
    }

    if (!isConnectionStable()) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Connexion non stable'],
        message: 'Connexion non stable, impossible de synchroniser',
      };
    }

    setIsSyncing(true);
    try {
      const result = await offlineSyncService.syncProfileUpdatesOnly();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  }, [isSyncing, isConnectionStable, updatePendingCount]);

  const syncMessages = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Synchronisation déjà en cours'],
        message: 'Synchronisation déjà en cours',
      };
    }

    if (!isConnectionStable()) {
      return {
        success: false,
        syncedItems: 0,
        errors: ['Connexion non stable'],
        message: 'Connexion non stable, impossible de synchroniser',
      };
    }

    setIsSyncing(true);
    try {
      const result = await offlineSyncService.syncMessagesOnly();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  }, [isSyncing, isConnectionStable, updatePendingCount]);

  const hasPendingData = useCallback(async (): Promise<boolean> => {
    return await offlineSyncService.hasPendingData();
  }, []);

  return {
    isOffline,
    isSyncing,
    pendingItemsCount,
    lastSyncResult,
    syncAll,
    syncProfileUpdates,
    syncMessages,
    hasPendingData,
  };
};
