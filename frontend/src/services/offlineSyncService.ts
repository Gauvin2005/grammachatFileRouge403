import { offlineStorageService, PendingProfileUpdate, PendingMessage } from './offlineStorageService';
import { optimizedApi } from './optimizedApi';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  errors: string[];
  message: string;
}

class OfflineSyncService {
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];

  // Ajouter un listener pour les résultats de synchronisation
  addSyncListener(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notifier tous les listeners
  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result));
  }

  // Synchroniser toutes les données hors-ligne
  async syncAllOfflineData(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Synchronisation déjà en cours, ignorée');
      return {
        success: false,
        syncedItems: 0,
        errors: ['Synchronisation déjà en cours'],
        message: 'Synchronisation déjà en cours',
      };
    }

    this.isSyncing = true;
    console.log('Début de la synchronisation des données hors-ligne');

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      errors: [],
      message: '',
    };

    try {
      // Synchroniser les mises à jour de profil
      const profileSyncResult = await this.syncProfileUpdates();
      result.syncedItems += profileSyncResult.syncedItems;
      result.errors.push(...profileSyncResult.errors);

      // Synchroniser les messages
      const messageSyncResult = await this.syncMessages();
      result.syncedItems += messageSyncResult.syncedItems;
      result.errors.push(...messageSyncResult.errors);

      // Déterminer le succès global
      result.success = result.errors.length === 0;
      result.message = result.syncedItems > 0 
        ? `${result.syncedItems} élément(s) synchronisé(s) avec succès`
        : 'Aucune donnée à synchroniser';

      console.log('Synchronisation terminée:', result);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      result.success = false;
      result.errors.push('Erreur générale de synchronisation');
      result.message = 'Erreur lors de la synchronisation';
    } finally {
      this.isSyncing = false;
    }

    this.notifyListeners(result);
    return result;
  }

  // Synchroniser les mises à jour de profil
  private async syncProfileUpdates(): Promise<{ syncedItems: number; errors: string[] }> {
    const result = { syncedItems: 0, errors: [] as string[] };

    try {
      console.log('Récupération des mises à jour de profil...');
      const pendingUpdates = await offlineStorageService.getPendingProfileUpdates();
      console.log(`${pendingUpdates.length} mise(s) à jour de profil trouvée(s):`, pendingUpdates);

      for (const update of pendingUpdates) {
        try {
          console.log(`Synchronisation de la mise à jour: ${update.id}`);
          
          // Valider les données avant synchronisation
          if (update.type === 'username' && update.data.username && update.data.username.length < 3) {
            console.log(`Suppression de la mise à jour invalide (username trop court): ${update.id}`);
            await offlineStorageService.removePendingProfileUpdate(update.id);
            result.errors.push(`Username trop court supprimé: ${update.data.username}`);
            continue;
          }
          
          await this.syncSingleProfileUpdate(update);
          await offlineStorageService.removePendingProfileUpdate(update.id);
          result.syncedItems++;
          console.log(`Mise à jour de profil synchronisée: ${update.id}`);
        } catch (error: any) {
          console.error(`Erreur lors de la synchronisation de la mise à jour ${update.id}:`, error);
          
          // Si c'est une erreur 500 (données invalides), supprimer quand même
          if (error.message?.includes('500') || error.message?.includes('Request failed with status code 500')) {
            console.log(`Suppression de la mise à jour après erreur 500: ${update.id}`);
            await offlineStorageService.removePendingProfileUpdate(update.id);
            result.errors.push(`Données invalides supprimées: ${update.id}`);
          } else {
            result.errors.push(`Erreur profil ${update.id}: ${error}`);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des mises à jour de profil:', error);
      result.errors.push('Erreur lors de la récupération des mises à jour de profil');
    }

    return result;
  }

  // Synchroniser une mise à jour de profil spécifique
  private async syncSingleProfileUpdate(update: PendingProfileUpdate): Promise<void> {
    try {
      console.log('Synchronisation de la mise à jour de profil:', update);
      
      // Valider les données avant envoi
      if (!update.userId || !update.data) {
        throw new Error('Données de mise à jour invalides');
      }
      
      let response;
      switch (update.type) {
        case 'username':
          if (!update.data.username || typeof update.data.username !== 'string') {
            throw new Error('Nom d\'utilisateur invalide');
          }
          console.log('Envoi de la mise à jour username:', { username: update.data.username });
          response = await optimizedApi.updateUserProfile(update.userId, { username: update.data.username });
          break;
        case 'email':
          if (!update.data.email || typeof update.data.email !== 'string') {
            throw new Error('Email invalide');
          }
          console.log('Envoi de la mise à jour email:', { email: update.data.email });
          response = await optimizedApi.updateUserProfile(update.userId, { email: update.data.email });
          break;
        default:
          console.log('Envoi de la mise à jour générique:', update.data);
          response = await optimizedApi.updateUserProfile(update.userId, update.data);
          break;
      }
      
      // Vérifier que la réponse est réussie
      if (!response.success) {
        throw new Error(`Échec de la mise à jour: ${response.message}`);
      }
      
      console.log('Mise à jour de profil synchronisée avec succès:', update.id);
    } catch (error: any) {
      // Vérifier si c'est une erreur réseau
      if (error.name === 'NetworkError' || error.message?.includes('Network Error')) {
        console.log('Erreur réseau détectée lors de la synchronisation du profil:', update.id);
        throw new Error('Erreur réseau - Connexion instable');
      }
      
      // Pour les autres erreurs, les propager
      console.error('Erreur lors de la synchronisation du profil:', update.id, error);
      throw error;
    }
  }

  // Synchroniser les messages
  private async syncMessages(): Promise<{ syncedItems: number; errors: string[] }> {
    const result = { syncedItems: 0, errors: [] as string[] };

    try {
      const pendingMessages = await offlineStorageService.getPendingMessages();
      console.log(`Synchronisation de ${pendingMessages.length} message(s)`);

      for (const message of pendingMessages) {
        try {
          await this.syncSingleMessage(message);
          await offlineStorageService.removePendingMessage(message.id);
          result.syncedItems++;
          console.log(`Message synchronisé: ${message.id}`);
        } catch (error) {
          console.error(`Erreur lors de la synchronisation du message ${message.id}:`, error);
          result.errors.push(`Erreur message ${message.id}: ${error}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      result.errors.push('Erreur lors de la récupération des messages');
    }

    return result;
  }

  // Synchroniser un message spécifique
  private async syncSingleMessage(message: PendingMessage): Promise<void> {
    try {
      await optimizedApi.sendMessage({
        content: message.content,
      });
    } catch (error: any) {
      // Vérifier si c'est une erreur réseau
      if (error.name === 'NetworkError' || error.message?.includes('Network Error')) {
        console.log('Erreur réseau détectée lors de la synchronisation du message:', message.id);
        throw new Error('Erreur réseau - Connexion instable');
      }
      
      // Pour les autres erreurs, les propager
      console.error('Erreur lors de la synchronisation du message:', message.id, error);
      throw error;
    }
  }

  // Synchroniser uniquement les mises à jour de profil
  async syncProfileUpdatesOnly(): Promise<SyncResult> {
    console.log('Synchronisation des mises à jour de profil uniquement');
    
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      errors: [],
      message: '',
    };

    try {
      const profileSyncResult = await this.syncProfileUpdates();
      result.syncedItems = profileSyncResult.syncedItems;
      result.errors = profileSyncResult.errors;
      result.success = result.errors.length === 0;
      result.message = result.syncedItems > 0 
        ? `${result.syncedItems} mise(s) à jour de profil synchronisée(s)`
        : 'Aucune mise à jour de profil à synchroniser';
    } catch (error) {
      console.error('Erreur lors de la synchronisation des profils:', error);
      result.success = false;
      result.errors.push('Erreur lors de la synchronisation des profils');
      result.message = 'Erreur lors de la synchronisation des profils';
    }

    this.notifyListeners(result);
    return result;
  }

  // Synchroniser uniquement les messages
  async syncMessagesOnly(): Promise<SyncResult> {
    console.log('Synchronisation des messages uniquement');
    
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      errors: [],
      message: '',
    };

    try {
      const messageSyncResult = await this.syncMessages();
      result.syncedItems = messageSyncResult.syncedItems;
      result.errors = messageSyncResult.errors;
      result.success = result.errors.length === 0;
      result.message = result.syncedItems > 0 
        ? `${result.syncedItems} message(s) synchronisé(s)`
        : 'Aucun message à synchroniser';
    } catch (error) {
      console.error('Erreur lors de la synchronisation des messages:', error);
      result.success = false;
      result.errors.push('Erreur lors de la synchronisation des messages');
      result.message = 'Erreur lors de la synchronisation des messages';
    }

    this.notifyListeners(result);
    return result;
  }

  // Vérifier s'il y a des données à synchroniser
  async hasPendingData(): Promise<boolean> {
    try {
      const count = await offlineStorageService.getPendingItemsCount();
      return count > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification des données en attente:', error);
      return false;
    }
  }

  // Obtenir le nombre d'éléments en attente
  async getPendingItemsCount(): Promise<number> {
    try {
      return await offlineStorageService.getPendingItemsCount();
    } catch (error) {
      console.error('Erreur lors du comptage des éléments en attente:', error);
      return 0;
    }
  }

  // Nettoyer toutes les données hors-ligne (en cas d'erreur persistante)
  async clearAllOfflineData(): Promise<void> {
    try {
      await offlineStorageService.clearAllOfflineData();
      console.log('Toutes les données hors-ligne ont été nettoyées');
    } catch (error) {
      console.error('Erreur lors du nettoyage des données hors-ligne:', error);
      throw error;
    }
  }

  // Obtenir l'état de synchronisation
  isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

export const offlineSyncService = new OfflineSyncService();