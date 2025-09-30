import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  Avatar,
  Divider,
  Searchbar,
  FAB,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { colors, spacing, typography } from '../utils/theme';
import { optimizedApi } from '../services/optimizedApi';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface AdminDashboardScreenProps {
  onBack?: () => void;
  isDemoMode?: boolean;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack, isDemoMode = false }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Vérifier si l'utilisateur est admin ou en mode démo
  const isAdmin = user?.role === 'admin' || isDemoMode;
  
  if (!isAdmin) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="shield-outline" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Accès refusé</Text>
        <Text style={styles.errorText}>
          Vous devez être administrateur pour accéder à cette page.
        </Text>
        {onBack && (
          <Button
            mode="contained"
            onPress={onBack}
            style={styles.backButton}
          >
            Retour
          </Button>
        )}
      </View>
    );
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // En mode démo, utiliser des données fictives
      if (isDemoMode) {
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoUsers: User[] = [
          {
            id: 'demo-user-1',
            username: 'alice',
            email: 'alice@example.com',
            role: 'user',
            xp: 150,
            level: 2,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-user-2',
            username: 'bob',
            email: 'bob@example.com',
            role: 'user',
            xp: 95,
            level: 1,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-user-3',
            username: 'charlie',
            email: 'charlie@example.com',
            role: 'user',
            xp: 200,
            level: 3,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-user-4',
            username: 'diana',
            email: 'diana@example.com',
            role: 'user',
            xp: 80,
            level: 1,
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'demo-user-5',
            username: 'eve',
            email: 'eve@example.com',
            role: 'user',
            xp: 300,
            level: 4,
            createdAt: new Date(Date.now() - 432000000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        setUsers(demoUsers);
        return;
      }
      
      const response = await optimizedApi.getUsers();
      
      if (response.success && response.data) {
        setUsers(response.data.data);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleDeleteUser = (userId: string, username: string) => {
    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // En mode démo, simuler la suppression
              if (isDemoMode) {
                setUsers(prev => prev.filter(u => u.id !== userId));
                Alert.alert('Succès', 'Utilisateur supprimé avec succès (Mode Démo)');
                return;
              }
              
              const response = await optimizedApi.deleteUser(userId);
              if (response.success) {
                Alert.alert('Succès', 'Utilisateur supprimé avec succès');
                loadUsers();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
              }
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            }
          },
        },
      ]
    );
  };

  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      setCreateLoading(true);
      
      // En mode démo, simuler la création
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newDemoUser: User = {
          id: 'demo-user-' + Date.now(),
          username: newUser.username,
          email: newUser.email,
          role: 'user',
          xp: 0,
          level: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUsers(prev => [newDemoUser, ...prev]);
        Alert.alert('Succès', 'Utilisateur créé avec succès (Mode Démo)');
        setShowCreateModal(false);
        setNewUser({ username: '', email: '', password: '' });
        return;
      }
      
      const response = await optimizedApi.createUser(newUser);
      
      if (response.success) {
        Alert.alert('Succès', 'Utilisateur créé avec succès');
        setShowCreateModal(false);
        setNewUser({ username: '', email: '', password: '' });
        loadUsers();
      } else {
        Alert.alert('Erreur', 'Impossible de créer l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'utilisateur');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          {onBack && (
            <Button
              mode="text"
              onPress={onBack}
              textColor={colors.surface}
              icon="arrow-left"
              style={styles.headerBackButton}
            >
              Retour
            </Button>
          )}
          <Text style={styles.title}>Gestion des utilisateurs</Text>
          {isDemoMode && (
            <Text style={styles.demoModeText}>Mode Démo</Text>
          )}
          <Text style={styles.subtitle}>
            {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
          </Text>
        </View>

        <Card style={styles.searchCard}>
          <Card.Content>
            <Searchbar
              placeholder="Rechercher un utilisateur..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </Card.Content>
        </Card>

        <View style={styles.usersList}>
          {filteredUsers.map((user) => (
            <Card key={user.id} style={styles.userCard}>
              <Card.Content>
                <View style={styles.userHeader}>
                  <Avatar.Text
                    size={40}
                    label={user.username.charAt(0).toUpperCase()}
                    style={[
                      styles.avatar,
                      { backgroundColor: user.role === 'admin' ? colors.error : colors.primary }
                    ]}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userStats}>
                      <Text style={styles.userStat}>
                        Niveau {user.level} • {user.xp} XP
                      </Text>
                      <Text style={[
                        styles.userRole,
                        { color: user.role === 'admin' ? colors.error : colors.textSecondary }
                      ]}>
                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    {user.role !== 'admin' && (
                      <Button
                        mode="text"
                        onPress={() => handleDeleteUser(user.id, user.username)}
                        textColor={colors.error}
                        compact
                      >
                        Supprimer
                      </Button>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {filteredUsers.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowCreateModal(true)}
        label="Nouvel utilisateur"
      />

      <Portal>
        <Modal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.modalTitle}>Créer un nouvel utilisateur</Text>
              
              <TextInput
                label="Nom d'utilisateur"
                value={newUser.username}
                onChangeText={(text) => setNewUser({ ...newUser, username: text })}
                mode="outlined"
                style={styles.modalInput}
              />
              
              <TextInput
                label="Email"
                value={newUser.email}
                onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.modalInput}
              />
              
              <TextInput
                label="Mot de passe"
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                mode="outlined"
                secureTextEntry
                style={styles.modalInput}
              />
              
              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowCreateModal(false)}
                  style={styles.modalButton}
                >
                  Annuler
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateUser}
                  loading={createLoading}
                  disabled={createLoading}
                  style={styles.modalButton}
                >
                  Créer
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerBackButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  demoModeText: {
    ...typography.caption,
    color: colors.surface + 'CC',
    backgroundColor: colors.accent + '40',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.surface + 'CC',
  },
  searchCard: {
    margin: spacing.md,
    elevation: 2,
  },
  searchbar: {
    backgroundColor: colors.surface,
  },
  usersList: {
    paddingHorizontal: spacing.md,
  },
  userCard: {
    marginBottom: spacing.sm,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userRole: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  userActions: {
    alignItems: 'flex-end',
  },
  emptyCard: {
    margin: spacing.md,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    elevation: 8,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  backButton: {
    marginTop: spacing.lg,
  },
});

export default AdminDashboardScreen;
