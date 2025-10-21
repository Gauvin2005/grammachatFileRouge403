import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Avatar,
  Divider,
  List,
  Switch,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logoutUser, updateUserXP, loadUserProfile, updateUserProfileLocally } from '../store/authSlice';
import { colors, spacing, typography } from '../utils/theme';
import { optimizedApi } from '../services/optimizedApi';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { offlineStorageService } from '../services/offlineStorageService';
import { offlineSyncService } from '../services/offlineSyncService';
import AdminDashboardScreen from './AdminDashboardScreen';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isOffline, isSyncing, pendingItemsCount } = useOfflineSync();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');

  // Si l'utilisateur est admin et veut voir le tableau de bord admin
  if (user?.role === 'admin' && showAdminDashboard) {
    return (
      <AdminDashboardScreen 
        onBack={() => setShowAdminDashboard(false)}
      />
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  const handleSaveUsername = async () => {
    if (username.trim() && username !== user?.username && user?.id) {
      // Validation du nom d'utilisateur
      if (username.trim().length < 3) {
        Alert.alert('Erreur', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
        return;
      }
      
      try {
        console.log('Mise à jour du nom d\'utilisateur');
        
        // Appliquer immédiatement la modification dans le store Redux (base de données locale)
        dispatch(updateUserProfileLocally({ username: username.trim() }));
        console.log('Nom d\'utilisateur mis à jour localement dans le store Redux');
        
        if (isOffline) {
          // Mode hors-ligne : sauvegarder dans AsyncStorage pour synchronisation future
          console.log('Sauvegarde hors-ligne...', {
            type: 'username',
            data: { username: username.trim() },
            userId: user.id,
          });
          
          await offlineStorageService.savePendingProfileUpdate({
            type: 'username',
            data: { username: username.trim() },
            userId: user.id,
          });
          
          console.log('Sauvegarde AsyncStorage terminée');
          
          setOfflineMessage('Modification enregistrée localement, synchronisation en attente de connexion.');
          setShowOfflineMessage(true);
          console.log('Modification sauvegardée dans AsyncStorage - Synchronisation en attente de connexion');
          
          // Mettre à jour l'état local pour l'affichage immédiat
          setIsEditing(false);
          
          return;
        }

        // Mode en ligne : synchronisation directe avec le serveur
        const response = await optimizedApi.updateUserProfile(user.id, { username: username.trim() });
        
        if (response.success && response.data) {
          // Recharger le profil pour mettre à jour le store avec les données du serveur
          await dispatch(loadUserProfile()).unwrap();
          Alert.alert('Succès', 'Nom d\'utilisateur mis à jour !');
          setIsEditing(false);
        } else {
          Alert.alert('Erreur', 'Échec de la mise à jour du nom d\'utilisateur');
        }
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour:', error);
        
        // Vérifier si c'est une erreur réseau
        if (error.name === 'NetworkError' || error.message?.includes('Network Error')) {
          // En cas d'erreur réseau, sauvegarder dans AsyncStorage pour synchronisation future
          try {
            await offlineStorageService.savePendingProfileUpdate({
              type: 'username',
              data: { username: username.trim() },
              userId: user.id,
            });
            
            setOfflineMessage('Modification enregistrée localement, synchronisation en attente de connexion.');
            setShowOfflineMessage(true);
            console.log('Modification sauvegardée dans AsyncStorage après erreur réseau - Synchronisation en attente de connexion');
            setIsEditing(false);
          } catch (storageError) {
            console.error('Erreur lors de la sauvegarde dans AsyncStorage:', storageError);
            Alert.alert('Erreur', 'Impossible de sauvegarder la modification');
          }
        } else {
          // Pour les autres erreurs, afficher un message d'erreur seulement si on est en ligne
          if (!isOffline) {
            Alert.alert('Erreur', 'Échec de la mise à jour du nom d\'utilisateur');
          } else {
            console.log('Erreur en mode hors-ligne (normal):', error);
          }
        }
      }
    } else {
      setIsEditing(false);
    }
  };


  const getLevelProgress = () => {
    if (!user) return 0;
    const xpPerLevel = 100; // Configurable
    const currentLevelXP = (user.level - 1) * xpPerLevel;
    const nextLevelXP = user.level * xpPerLevel;
    const progressXP = user.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    return Math.min((progressXP / neededXP) * 100, 100);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={username.charAt(0).toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        
        <View style={styles.levelContainer}>
          <View style={styles.levelInfo}>
            <Ionicons name="trophy" size={24} color={colors.level} />
            <Text style={styles.levelText}>Niveau {user?.level}</Text>
          </View>
          <View style={styles.xpInfo}>
            <Ionicons name="star" size={24} color={colors.xp} />
            <Text style={styles.xpText}>{user?.xp} XP</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getLevelProgress()}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getLevelProgress())}% vers le niveau {user ? user.level + 1 : 1}
          </Text>
        </View>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Informations du compte</Text>
          
          <List.Item
            title="Nom d'utilisateur"
            description={isEditing ? (
              <View>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  style={styles.editInput}
                  right={
                    <TextInput.Icon
                      icon="check"
                      onPress={handleSaveUsername}
                    />
                  }
                />
                {isOffline && (
                  <Text style={styles.offlineIndicator}>
                    Mode hors-ligne - Modification sauvegardée localement
                  </Text>
                )}
              </View>
            ) : (
              <TextInput
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.editInput}
                right={
                  <TextInput.Icon
                    icon="check"
                    onPress={handleSaveUsername}
              />
                }
              />
            )}
            left={(props) => <List.Icon {...props} icon="account" />}
            right={() => (
              !isEditing ? (
                <Button 
                  mode="text" 
                  onPress={() => setIsEditing(true)}
                  compact
                >
                  Modifier
                </Button>
              ) : (
                <Button 
                  mode="text" 
                  onPress={() => {
                    setIsEditing(false);
                    setUsername(user?.username || '');
                  }}
                  compact
                >
                  Annuler
                </Button>
              )
            )}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Email"
            description={user?.email}
            left={(props) => <List.Icon {...props} icon="email" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Rôle"
            description={
              user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'
            }
            left={(props) => <List.Icon {...props} icon="shield-account" />}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Membre depuis"
            description={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Statistiques</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={32} color={colors.xp} />
              <Text style={styles.statValue}>{user?.xp}</Text>
              <Text style={styles.statLabel}>XP Total</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={32} color={colors.level} />
              <Text style={styles.statValue}>{user?.level}</Text>
              <Text style={styles.statLabel}>Niveau</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="flame" size={32} color={colors.phoenix} />
              <Text style={styles.statValue}>
                {user?.xp ? Math.floor(user.xp / 10) : 0}
              </Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Paramètres</Text>
          
          {/* 🔔 NOTIFICATIONS TEMPORAIREMENT DÉSACTIVÉES */}
          {/* TODO: Réactiver quand les fonctionnalités prioritaires seront terminées */}
          {/* Voir NOTIFICATIONS-TEMPORARY-DISABLE.md pour plus d'informations */}
          {/* 
          <List.Item
            title="Notifications"
            description="Recevoir des notifications push"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => <Switch value={true} onValueChange={() => {}} />}
          />
          */}
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Mode sombre"
            description="Activer le thème sombre"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
        </Card.Content>
      </Card>


      {user?.role === 'admin' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Administration</Text>
            
            <List.Item
              title="Gestion des utilisateurs"
              description="Voir et gérer tous les utilisateurs"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowAdminDashboard(true)}
            />
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor={colors.error}
            textColor={colors.surface}
            icon="logout"
          >
            Se déconnecter
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Grammachat v1.0.0
        </Text>
        <Text style={styles.footerSubtext}>
          Améliorez votre orthographe en vous amusant !
        </Text>
        {pendingItemsCount > 0 && (
          <Text style={styles.pendingItemsText}>
            {pendingItemsCount} modification(s) en attente de synchronisation
          </Text>
        )}
      </View>

      <Snackbar
        visible={showOfflineMessage}
        onDismiss={() => setShowOfflineMessage(false)}
        duration={4000}
        style={styles.offlineSnackbar}
        action={{
          label: 'OK',
          onPress: () => setShowOfflineMessage(false),
        }}
      >
        {offlineMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  userName: {
    ...typography.h2,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
    color: colors.surface + 'CC',
    marginBottom: spacing.lg,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.lg,
  },
  levelInfo: {
    alignItems: 'center',
  },
  levelText: {
    ...typography.caption,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  xpInfo: {
    alignItems: 'center',
  },
  xpText: {
    ...typography.caption,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface + '40',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.surface + 'CC',
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  editInput: {
    marginTop: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutButton: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footerSubtext: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  offlineIndicator: {
    ...typography.small,
    color: colors.warning,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  pendingItemsText: {
    ...typography.small,
    color: colors.info,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  offlineSnackbar: {
    backgroundColor: colors.warning,
    marginBottom: spacing.xl,
  },
});

export default ProfileScreen;
