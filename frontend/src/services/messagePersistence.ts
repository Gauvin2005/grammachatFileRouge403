/**
 * Service de persistance des messages pour assurer la continuité
 * entre les sessions et les rafraîchissements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const STORAGE_KEYS = {
  MESSAGES: 'grammachat_messages',
  LAST_SYNC: 'grammachat_last_sync',
  USER_MESSAGES: 'grammachat_user_messages'
} as const;

class MessagePersistenceService {
  /**
   * Sauvegarder les messages localement
   */
  async saveMessages(messages: Message[], userId?: string): Promise<void> {
    try {
      const data = {
        messages,
        timestamp: Date.now(),
        userId: userId || 'anonymous'
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      
      console.log(`Messages sauvegardés localement: ${messages.length} messages`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des messages:', error);
    }
  }

  /**
   * Récupérer les messages sauvegardés localement
   */
  async getSavedMessages(): Promise<Message[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return [];

      const parsed = JSON.parse(data);
      
      // Vérifier si les données ne sont pas trop anciennes (24h max)
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      if (Date.now() - parsed.timestamp > maxAge) {
        console.log('Messages locaux trop anciens, suppression');
        await this.clearSavedMessages();
        return [];
      }

      console.log(`Messages récupérés localement: ${parsed.messages.length} messages`);
      return parsed.messages || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return [];
    }
  }

  /**
   * Ajouter un nouveau message à la sauvegarde locale
   */
  async addMessage(message: Message): Promise<void> {
    try {
      const existingMessages = await this.getSavedMessages();
      const updatedMessages = [message, ...existingMessages];
      
      // Limiter à 100 messages pour éviter la surcharge
      const limitedMessages = updatedMessages.slice(0, 100);
      
      await this.saveMessages(limitedMessages);
      console.log('Message ajouté à la sauvegarde locale');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du message:', error);
    }
  }

  /**
   * Fusionner les messages du serveur avec ceux sauvegardés localement
   */
  async mergeMessages(serverMessages: Message[], userId?: string): Promise<Message[]> {
    try {
      const localMessages = await this.getSavedMessages();
      
      // Créer un Map pour éviter les doublons
      const messageMap = new Map<string, Message>();
      
      // Ajouter d'abord les messages du serveur (plus récents)
      serverMessages.forEach(msg => {
        messageMap.set(msg.id, msg);
      });
      
      // Ajouter les messages locaux qui ne sont pas déjà présents
      localMessages.forEach(msg => {
        if (!messageMap.has(msg.id)) {
          messageMap.set(msg.id, msg);
        }
      });
      
      // Convertir en array et trier par timestamp
      const mergedMessages = Array.from(messageMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Sauvegarder la version fusionnée
      await this.saveMessages(mergedMessages, userId);
      
      console.log(`Messages fusionnés: ${mergedMessages.length} messages`);
      return mergedMessages;
    } catch (error) {
      console.error('Erreur lors de la fusion des messages:', error);
      return serverMessages;
    }
  }

  /**
   * Vérifier si une synchronisation est nécessaire
   */
  async needsSync(): Promise<boolean> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (!lastSync) return true;
      
      const syncAge = Date.now() - parseInt(lastSync);
      const syncThreshold = 5 * 60 * 1000; // 5 minutes
      
      return syncAge > syncThreshold;
    } catch (error) {
      console.error('Erreur lors de la vérification de sync:', error);
      return true;
    }
  }

  /**
   * Marquer la synchronisation comme effectuée
   */
  async markSyncComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error('Erreur lors du marquage de sync:', error);
    }
  }

  /**
   * Vider les messages sauvegardés localement
   */
  async clearSavedMessages(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MESSAGES);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      console.log('Messages locaux supprimés');
    } catch (error) {
      console.error('Erreur lors de la suppression des messages:', error);
    }
  }

  /**
   * Obtenir des statistiques sur la persistance
   */
  async getStats(): Promise<{
    hasLocalMessages: boolean;
    lastSync: number | null;
    messageCount: number;
  }> {
    try {
      const messages = await this.getSavedMessages();
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      
      return {
        hasLocalMessages: messages.length > 0,
        lastSync: lastSync ? parseInt(lastSync) : null,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        hasLocalMessages: false,
        lastSync: null,
        messageCount: 0
      };
    }
  }
}

// Instance singleton
export const messagePersistence = new MessagePersistenceService();
export default messagePersistence;
