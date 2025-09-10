#!/usr/bin/env node

/**
 * Script pour tester l'envoi de notifications push
 * Usage: node scripts/test-push-notification.js <EXPO_PUSH_TOKEN>
 */

const { Expo } = require('expo-server-sdk');

async function sendTestNotification(expoPushToken) {
  try {
    if (!expoPushToken) {
      console.log('❌ Token de notification push requis');
      console.log('Usage: node scripts/test-push-notification.js <EXPO_PUSH_TOKEN>');
      return;
    }

    // Créer un client Expo
    const expo = new Expo();

    // Vérifier que le token est valide
    if (!Expo.isExpoPushToken(expoPushToken)) {
      console.log('❌ Token Expo Push invalide');
      return;
    }

    console.log('📱 Envoi d\'une notification de test...');

    // Créer le message de notification
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: '🎉 Test Grammachat',
      body: 'Votre configuration de notifications push fonctionne !',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    // Envoyer la notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi:', error);
      }
    }

    console.log('✅ Notification envoyée !');
    console.log('📊 Tickets:', tickets);

    // Vérifier les erreurs
    const errors = tickets.filter(ticket => ticket.status === 'error');
    if (errors.length > 0) {
      console.log('❌ Erreurs détectées:');
      errors.forEach(error => {
        console.log(`- ${error.message}`);
      });
    } else {
      console.log('🎉 Notification envoyée avec succès !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Récupérer le token depuis les arguments
const expoPushToken = process.argv[2];
sendTestNotification(expoPushToken);

