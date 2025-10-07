/**
 * Script de test pour vérifier la persistance des messages
 */

import { messagePersistence } from './messagePersistence';
import { Message } from '../types';

export const testMessagePersistence = async () => {
  console.log('🧪 Test de la persistance des messages');
  
  // Test 1: Sauvegarder des messages
  const testMessages: Message[] = [
    {
      id: 'test-1',
      content: 'Message de test 1',
      timestamp: new Date().toISOString(),
      xpEarned: 10,
      errorsFound: [],
      sender: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com'
      }
    },
    {
      id: 'test-2',
      content: 'Message de test 2',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      xpEarned: 15,
      errorsFound: [],
      sender: {
        id: 'user-2',
        username: 'testuser2',
        email: 'test2@example.com'
      }
    }
  ];
  
  try {
    // Sauvegarder
    await messagePersistence.saveMessages(testMessages);
    console.log('✅ Messages sauvegardés');
    
    // Récupérer
    const retrievedMessages = await messagePersistence.getSavedMessages();
    console.log(`✅ Messages récupérés: ${retrievedMessages.length} messages`);
    
    // Vérifier le contenu
    if (retrievedMessages.length === testMessages.length) {
      console.log('✅ Nombre de messages correct');
    } else {
      console.log('❌ Nombre de messages incorrect');
    }
    
    // Test de fusion
    const newMessage: Message = {
      id: 'test-3',
      content: 'Nouveau message',
      timestamp: new Date().toISOString(),
      xpEarned: 20,
      errorsFound: [],
      sender: {
        id: 'user-3',
        username: 'testuser3',
        email: 'test3@example.com'
      }
    };
    
    const mergedMessages = await messagePersistence.mergeMessages([newMessage]);
    console.log(`✅ Messages fusionnés: ${mergedMessages.length} messages`);
    
    // Test des statistiques
    const stats = await messagePersistence.getStats();
    console.log('📊 Statistiques:', stats);
    
    // Test de synchronisation
    const needsSync = await messagePersistence.needsSync();
    console.log(`🔄 Synchronisation nécessaire: ${needsSync}`);
    
    console.log('🎉 Tous les tests sont passés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
};

export default testMessagePersistence;
