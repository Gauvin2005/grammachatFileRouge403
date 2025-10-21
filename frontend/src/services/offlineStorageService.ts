import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingProfileUpdate {
  id: string;
  type: 'username' | 'email' | 'other';
  data: any;
  timestamp: number;
  userId: string;
}

export interface PendingMessage {
  id: string;
  content: string;
  timestamp: number;
  userId: string;
}

const STORAGE_KEYS = {
  PENDING_PROFILE_UPDATES: 'pendingProfileUpdates',
  PENDING_MESSAGES: 'pendingMessages',
  OFFLINE_DATA: 'offlineData',
} as const;

class OfflineStorageService {
  // Sauvegarder une mise à jour de profil en attente
  async savePendingProfileUpdate(update: Omit<PendingProfileUpdate, 'id' | 'timestamp'>): Promise<void> {
    try {
      const pendingUpdate: PendingProfileUpdate = {
        ...update,
        id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const existingUpdates = await this.getPendingProfileUpdates();
      const updatedList = [...existingUpdates, pendingUpdate];

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_PROFILE_UPDATES,
        JSON.stringify(updatedList)
      );

      console.log('Mise à jour de profil sauvegardée localement:', pendingUpdate);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la mise à jour de profil:', error);
      throw error;
    }
  }

  // Récupérer toutes les mises à jour de profil en attente
  async getPendingProfileUpdates(): Promise<PendingProfileUpdate[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PROFILE_UPDATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des mises à jour de profil:', error);
      return [];
    }
  }

  // Supprimer une mise à jour de profil spécifique après synchronisation
  async removePendingProfileUpdate(updateId: string): Promise<void> {
    try {
      const existingUpdates = await this.getPendingProfileUpdates();
      const filteredUpdates = existingUpdates.filter(update => update.id !== updateId);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_PROFILE_UPDATES,
        JSON.stringify(filteredUpdates)
      );

      console.log('Mise à jour de profil supprimée du cache local:', updateId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la mise à jour de profil:', error);
      throw error;
    }
  }

  // Supprimer toutes les mises à jour de profil après synchronisation complète
  async clearAllPendingProfileUpdates(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PROFILE_UPDATES);
      console.log('Toutes les mises à jour de profil ont été supprimées du cache local');
    } catch (error) {
      console.error('Erreur lors du nettoyage des mises à jour de profil:', error);
      throw error;
    }
  }

  // Sauvegarder un message en attente
  async savePendingMessage(message: Omit<PendingMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      const pendingMessage: PendingMessage = {
        ...message,
        id: `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const existingMessages = await this.getPendingMessages();
      const updatedList = [...existingMessages, pendingMessage];

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_MESSAGES,
        JSON.stringify(updatedList)
      );

      console.log('Message sauvegardé localement:', pendingMessage);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      throw error;
    }
  }

  // Récupérer tous les messages en attente
  async getPendingMessages(): Promise<PendingMessage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  }

  // Supprimer un message spécifique après synchronisation
  async removePendingMessage(messageId: string): Promise<void> {
    try {
      const existingMessages = await this.getPendingMessages();
      const filteredMessages = existingMessages.filter(message => message.id !== messageId);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_MESSAGES,
        JSON.stringify(filteredMessages)
      );

      console.log('Message supprimé du cache local:', messageId);
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw error;
    }
  }

  // Supprimer tous les messages après synchronisation complète
  async clearAllPendingMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_MESSAGES);
      console.log('Tous les messages ont été supprimés du cache local');
    } catch (error) {
      console.error('Erreur lors du nettoyage des messages:', error);
      throw error;
    }
  }

  // Obtenir le nombre total d'éléments en attente
  async getPendingItemsCount(): Promise<number> {
    try {
      const profileUpdates = await this.getPendingProfileUpdates();
      const messages = await this.getPendingMessages();
      return profileUpdates.length + messages.length;
    } catch (error) {
      console.error('Erreur lors du comptage des éléments en attente:', error);
      return 0;
    }
  }

  // Nettoyer toutes les données hors-ligne
  async clearAllOfflineData(): Promise<void> {
    try {
      await Promise.all([
        this.clearAllPendingProfileUpdates(),
        this.clearAllPendingMessages(),
      ]);
      console.log('Toutes les données hors-ligne ont été nettoyées');
    } catch (error) {
      console.error('Erreur lors du nettoyage complet des données hors-ligne:', error);
      throw error;
    }
  }

  // Sauvegarder des données génériques hors-ligne
  async saveOfflineData(key: string, data: any): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      offlineData[key] = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_DATA,
        JSON.stringify(offlineData)
      );

      console.log('Données hors-ligne sauvegardées:', key);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données hors-ligne:', error);
      throw error;
    }
  }

  // Récupérer des données génériques hors-ligne
  async getOfflineData(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erreur lors de la récupération des données hors-ligne:', error);
      return {};
    }
  }

  // Supprimer des données génériques hors-ligne
  async removeOfflineData(key: string): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      delete offlineData[key];

      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_DATA,
        JSON.stringify(offlineData)
      );

      console.log('Données hors-ligne supprimées:', key);
    } catch (error) {
      console.error('Erreur lors de la suppression des données hors-ligne:', error);
      throw error;
    }
  }
}

export const offlineStorageService = new OfflineStorageService();
