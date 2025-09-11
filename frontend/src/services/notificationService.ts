import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface PushToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

class NotificationService {
  private pushToken: string | null = null;

  /**
   * Demande les permissions de notification
   */
  async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } else {
      console.log('Les notifications push ne fonctionnent que sur un appareil physique');
      return false;
    }
  }

  /**
   * Enregistre l'appareil pour les notifications push et récupère le token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Sur le web, les notifications push nécessitent une configuration VAPID
      if (Platform.OS === 'web') {
        console.log('Notifications push non supportées sur le web en mode développement');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Permission de notification refusée');
        return null;
      }

      // Récupérer le token Expo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.pushToken = tokenData.data;
      console.log('Token Expo Push:', this.pushToken);
      
      return this.pushToken;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications:', error);
      return null;
    }
  }

  /**
   * Configure les listeners de notifications
   */
  setupNotificationListeners() {
    // Listener pour les notifications reçues quand l'app est ouverte
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Listener pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction avec notification:', response);
      // Ici tu peux naviguer vers une écran spécifique
    });
  }

  /**
   * Envoie une notification locale
   */
  async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Immédiatement
    });
  }

  /**
   * Récupère le token push actuel
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Configure les notifications pour Android
   */
  async configureAndroidNotifications() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }
  }
}

export default new NotificationService();

