import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/utils/theme';
import { initializeAuth } from './src/store/authSlice';
import { useAppDispatch } from './src/hooks/redux';
import { KeyboardProvider } from './src/contexts/KeyboardContext';
import { initializeIPDetection } from './src/utils/ipInitializer';
// 🔔 NOTIFICATIONS TEMPORAIREMENT DÉSACTIVÉES
// import notificationService from './src/services/notificationService';

// Empêcher l'auto-hide du splash screen
SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialiser la détection automatique d'IP en premier
        console.log('Initialisation de la détection d\'IP...');
        await initializeIPDetection();
        
        // Initialiser l'authentification
        await dispatch(initializeAuth());
        
        // 🔔 NOTIFICATIONS TEMPORAIREMENT DÉSACTIVÉES
        // TODO: Réactiver les notifications quand les fonctionnalités prioritaires seront terminées
        // Voir NOTIFICATIONS-TEMPORARY-DISABLE.md pour plus d'informations
        // await notificationService.configureAndroidNotifications();
        // await notificationService.setupNotificationListeners();
        // 
        // // Enregistrer pour les notifications push et récupérer le token
        // const pushToken = await notificationService.registerForPushNotifications();
        // if (pushToken) {
        //   console.log('Token de notification push obtenu:', pushToken);
        //   // Ici tu peux envoyer le token à ton backend
        // }
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
      } finally {
        // Masquer le splash screen
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </PaperProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
};

export default App;
