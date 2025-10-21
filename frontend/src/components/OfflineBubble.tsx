import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography } from '../utils/theme';
import { offlineStorageService } from '../services/offlineStorageService';
import { offlineSyncService } from '../services/offlineSyncService';

interface OfflineBubbleProps {
  isOffline: boolean;
  onSyncComplete?: () => void;
  lastSyncResult?: {
    success: boolean;
    syncedItems: number;
    message: string;
  } | null;
}

const { width: screenWidth } = Dimensions.get('window');

const OfflineBubble: React.FC<OfflineBubbleProps> = ({ 
  isOffline, 
  onSyncComplete,
  lastSyncResult
}) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [asyncStorageData, setAsyncStorageData] = useState<string>('');
  const [slideAnim] = useState(new Animated.Value(-100));

  // Récupérer les données AsyncStorage au format JSON
  const getAsyncStorageData = async () => {
    try {
      console.log('Récupération des données AsyncStorage...');
      const profileUpdates = await offlineStorageService.getPendingProfileUpdates();
      const messages = await offlineStorageService.getPendingMessages();
      
      console.log('ProfileUpdates trouvés:', profileUpdates);
      console.log('Messages trouvés:', messages);
      
      const data = {
        pendingProfileUpdates: profileUpdates,
        pendingMessages: messages
      };
      
      const jsonData = JSON.stringify(data, null, 2);
      console.log('Données JSON générées:', jsonData);
      setAsyncStorageData(jsonData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données AsyncStorage:', error);
      setAsyncStorageData('Erreur lors du chargement des données');
    }
  };

  // Mettre à jour le compteur d'éléments en attente
  const updatePendingCount = async () => {
    try {
      const count = await offlineStorageService.getPendingItemsCount();
      setPendingCount(count);
      // Mettre à jour aussi les données JSON
      await getAsyncStorageData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur:', error);
    }
  };

  useEffect(() => {
    updatePendingCount();
  }, []);

  // Afficher le message de synchronisation réussie
  useEffect(() => {
    if (lastSyncResult?.success && lastSyncResult.syncedItems > 0) {
      setSyncMessage(`Synchronisation réussie - ${lastSyncResult.syncedItems} élément(s) synchronisé(s)`);
      setShowSyncSuccess(true);
      updatePendingCount();
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    }
  }, [lastSyncResult, onSyncComplete]);

  // Mettre à jour les données JSON quand il y a des éléments en attente
  useEffect(() => {
    if (pendingCount > 0) {
      getAsyncStorageData();
    }
  }, [pendingCount]);

  // Test direct AsyncStorage
  const testAsyncStorage = async () => {
    try {
      console.log('Test direct AsyncStorage...');
      
      const keys = await AsyncStorage.getAllKeys();
      console.log('Toutes les clés AsyncStorage:', keys);
      
      const pendingData = await AsyncStorage.getItem('pendingProfileUpdates');
      console.log('Données brutes pendingProfileUpdates:', pendingData);
      
      if (pendingData) {
        const parsed = JSON.parse(pendingData);
        console.log('Données parsées:', parsed);
        setAsyncStorageData(JSON.stringify({ pendingProfileUpdates: parsed }, null, 2));
      } else {
        console.log('Aucune donnée trouvée dans pendingProfileUpdates');
        setAsyncStorageData('Aucune donnée trouvée');
      }
    } catch (error: any) {
      console.error('Erreur test AsyncStorage:', error);
      setAsyncStorageData('Erreur: ' + error.message);
    }
  };

  // Animation d'apparition/disparition
  useEffect(() => {
    if (isOffline) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim]);

  // Fonction pour déclencher la synchronisation manuelle FORCÉE
  const handleManualSync = async () => {
    try {
      console.log('Synchronisation manuelle FORCÉE...');
      const profileUpdates = await offlineStorageService.getPendingProfileUpdates();
      const messages = await offlineStorageService.getPendingMessages();
      
      console.log('Données trouvées:', { profileUpdates, messages });
      
      if (profileUpdates.length === 0 && messages.length === 0) {
        setSyncMessage('Aucune donnée à synchroniser');
        setShowSyncSuccess(true);
        return;
      }

      // Utiliser le vrai service de synchronisation
      const result = await offlineSyncService.syncAllOfflineData();
      
      console.log('Résultat sync manuelle:', result);
      
      if (result.success) {
        setSyncMessage(`${result.syncedItems} élément(s) synchronisé(s) avec succès`);
      } else {
        setSyncMessage(`Erreur: ${result.message}`);
      }
      
      setShowSyncSuccess(true);
      updatePendingCount();
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation manuelle:', error);
      setSyncMessage('Erreur lors de la synchronisation');
      setShowSyncSuccess(true);
    }
  };

  if (!isOffline && pendingCount === 0) {
    return null;
  }

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Card style={styles.bubble}>
          <Card.Content style={styles.content}>
            <View style={styles.leftSection}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={isOffline ? "cloud-offline" : "cloud-done"} 
                  size={20} 
                  color={colors.surface} 
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  {isOffline ? 'Mode hors-ligne' : 'Données en attente'}
                </Text>
                <Text style={styles.subtitle}>
                  {isOffline 
                    ? 'Connexion perdue - Modifications sauvegardées localement'
                    : `${pendingCount} modification(s) en attente de synchronisation`
                  }
                </Text>
                {!isOffline && pendingCount > 0 && asyncStorageData && (
                  <View style={styles.jsonContainer}>
                    <Text style={styles.jsonLabel}>Données AsyncStorage :</Text>
                    <Text style={styles.jsonData}>{asyncStorageData}</Text>
                  </View>
                )}
                {/* Debug info */}
                <Text style={styles.debugText}>
                  Debug: isOffline={isOffline.toString()}, pendingCount={pendingCount}, hasData={!!asyncStorageData}
                </Text>
              </View>
            </View>
            
            {!isOffline && pendingCount > 0 && (
              <IconButton
                icon="sync"
                size={20}
                iconColor={colors.surface}
                onPress={handleManualSync}
                style={styles.syncButton}
              />
            )}
            {/* Bouton de test */}
            <IconButton
              icon="bug"
              size={16}
              onPress={testAsyncStorage}
              iconColor={colors.surface}
              style={styles.syncButton}
            />
          </Card.Content>
        </Card>
      </Animated.View>

      <Snackbar
        visible={showSyncSuccess}
        onDismiss={() => setShowSyncSuccess(false)}
        duration={3000}
        style={styles.snackbar}
        action={{
          label: 'OK',
          onPress: () => setShowSyncSuccess(false),
        }}
      >
        {syncMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 10,
  },
  bubble: {
    backgroundColor: colors.warning,
    borderRadius: 16,
    elevation: 8,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.surface,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.small,
    color: colors.surface + 'CC',
    lineHeight: 16,
  },
  syncButton: {
    margin: 0,
    backgroundColor: colors.surface + '20',
  },
  snackbar: {
    backgroundColor: colors.success,
    marginBottom: spacing.xl,
  },
  jsonContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.surface + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surface + '40',
  },
  jsonLabel: {
    ...typography.small,
    color: colors.surface,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  jsonData: {
    ...typography.small,
    color: colors.surface + 'CC',
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 14,
  },
  debugText: {
    ...typography.small,
    color: colors.surface + '80',
    fontSize: 8,
    marginTop: spacing.xs,
  },
});

export default OfflineBubble;
