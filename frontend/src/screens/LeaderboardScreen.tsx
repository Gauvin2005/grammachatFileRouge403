import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { LeaderboardEntry } from '../types';
import { colors, spacing, typography } from '../utils/theme';
import { optimizedApi } from '../services/optimizedApi';
import { fetchLeaderboard } from '../store/userSlice';

const LeaderboardScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { leaderboard, isLoading, error } = useAppSelector((state) => state.users);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async (forceRefresh = false) => {
    try {
      await dispatch(fetchLeaderboard()).unwrap();
    } catch (error) {
      console.error('Erreur lors du chargement du leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard(true); // Forcer le rafraîchissement
    setRefreshing(false);
  };

  useEffect(() => {
    // Charger le leaderboard seulement s'il n'est pas déjà chargé
    if (!leaderboard || leaderboard.length === 0) {
      console.log('Chargement initial du leaderboard');
      loadLeaderboard();
    } else {
      console.log('Leaderboard déjà chargé, utilisation du cache');
    }
  }, [dispatch]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={24} color="#FFD700" />;
      case 2:
        return <Ionicons name="medal" size={24} color="#C0C0C0" />;
      case 3:
        return <Ionicons name="medal" size={24} color="#CD7F32" />;
      default:
        return <Text style={styles.rankNumber}>#{rank}</Text>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return colors.phoenix;
      case 2:
        return colors.textSecondary;
      case 3:
        return colors.accent;
      default:
        return colors.text;
    }
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = item.username === user?.username;
    
    return (
      <Card style={[
        styles.leaderboardCard,
        isCurrentUser && styles.currentUserCard
      ]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.rankContainer}>
            {getRankIcon(item.rank)}
          </View>
          
          <Avatar.Text 
            size={48} 
            label={(item.username || 'U').charAt(0).toUpperCase()}
            style={[
              styles.avatar,
              { backgroundColor: getRankColor(item.rank) }
            ]}
          />
          
          <View style={styles.userInfo}>
            <Text style={[
              styles.username,
              isCurrentUser && styles.currentUserText
            ]}>
              {item.username}
              {isCurrentUser && ' (Vous)'}
            </Text>
            <View style={styles.statsContainer}>
              <Chip 
                icon="star" 
                style={styles.xpChip}
                textStyle={styles.chipText}
              >
                {item.xp} XP
              </Chip>
              <Chip 
                icon="trophy" 
                style={styles.levelChip}
                textStyle={styles.chipText}
              >
                Niveau {item.level}
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Ionicons name="trophy" size={48} color={colors.phoenix} />
      <Text style={styles.headerTitle}>Classement</Text>
      <Text style={styles.headerSubtitle}>
        Les meilleurs utilisateurs de Grammachat
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        Aucun classement disponible
      </Text>
      <Text style={styles.emptySubtext}>
        Envoyez des messages pour apparaître dans le classement !
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du classement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboard || []}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.username || 'unknown'}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContainer: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  leaderboardCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  avatar: {
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  currentUserText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  xpChip: {
    backgroundColor: colors.xp,
  },
  levelChip: {
    backgroundColor: colors.level,
  },
  chipText: {
    color: colors.surface,
    fontSize: 12,
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
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default LeaderboardScreen;
