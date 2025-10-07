import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import {
  Text,
  TextInput,
  Card,
  ActivityIndicator,
  Chip,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { optimizedApi } from '../services/optimizedApi';
import { colors, spacing, typography } from '../utils/theme';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  xp?: number;
  level?: number;
}

interface AccountSelectorProps {
  onAccountSelect: (email: string, password: string) => void;
  onClose: () => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({
  onAccountSelect,
  onClose,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Comptes par défaut connus (pour le cas où l'API ne fonctionne pas)
  const defaultAccounts: User[] = [
    {
      _id: 'default-user1',
      username: 'user1',
      email: 'user1@grammachat.com',
      role: 'user',
      xp: 100,
      level: 1,
    },
    {
      _id: 'default-user2',
      username: 'user2',
      email: 'user2@grammachat.com',
      role: 'user',
      xp: 250,
      level: 2,
    },
    {
      _id: 'default-admin',
      username: 'admin',
      email: 'admin@grammachat.com',
      role: 'admin',
      xp: 1000,
      level: 5,
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser uniquement les comptes par défaut pour éviter l'erreur 401
      // L'API getUsers nécessite une authentification admin
      console.log('Utilisation des comptes par défaut pour la sélection');
      setUsers(defaultAccounts);
    } catch (error) {
      console.log('Erreur lors du chargement des utilisateurs:', error);
      setUsers(defaultAccounts);
      setError('Utilisation des comptes par défaut');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleAccountSelect = (user: User) => {
    // Ne passer que l'email, sans le mot de passe
    onAccountSelect(user.email, '');
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleAccountSelect(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.userCard}>
        <Card.Content style={styles.userContent}>
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Text style={styles.username}>{item.username}</Text>
              <Chip 
                mode="outlined" 
                compact
                style={[
                  styles.roleChip,
                  item.role === 'admin' ? styles.adminChip : styles.userChip
                ]}
                textStyle={styles.roleText}
              >
                {item.role}
              </Chip>
            </View>
            <Text style={styles.email}>{item.email}</Text>
            {item.xp !== undefined && (
              <View style={styles.stats}>
                <Text style={styles.statsText}>
                  XP: {item.xp} • Niveau: {item.level || 1}
                </Text>
              </View>
            )}
          </View>
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={colors.primary}
          />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des comptes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.title}>Comptes disponibles</Text>
        </View>
        <IconButton
          icon="close"
          size={24}
          iconColor={colors.textSecondary}
          onPress={onClose}
        />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          label="Rechercher un compte..."
          mode="outlined"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
          placeholder="Nom d'utilisateur, email ou rôle"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle" size={16} color={colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        style={styles.userList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun compte trouvé' : 'Aucun compte disponible'}
            </Text>
            {searchQuery && (
              <Text style={styles.emptySubtext}>
                Essayez avec un autre terme de recherche
              </Text>
            )}
          </View>
        }
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {filteredUsers.length} compte{filteredUsers.length > 1 ? 's' : ''} disponible{filteredUsers.length > 1 ? 's' : ''}
        </Text>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.background,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.sm,
    flex: 1,
  },
  userList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  userItem: {
    marginBottom: spacing.md,
  },
  userCard: {
    elevation: 3,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  username: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  roleChip: {
    height: 28,
    borderRadius: 14,
  },
  adminChip: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error,
  },
  userChip: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

export default AccountSelector;
