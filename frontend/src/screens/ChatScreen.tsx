import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Chip,
  Avatar,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { sendMessage, fetchMessages, clearError } from '../store/messageSlice';
import { updateUserXP } from '../store/authSlice';
import { MessageFormData, Message } from '../types';
import { colors, spacing, typography } from '../utils/theme';

const ChatScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messages, isLoading, error } = useAppSelector((state) => state.messages);
  const flatListRef = useRef<FlatList>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>({
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    // Charger les messages au montage du composant
    dispatch(fetchMessages({}));
  }, [dispatch]);

  const onSubmit = async (data: MessageFormData) => {
    try {
      const result = await dispatch(sendMessage(data)).unwrap();
      
      // Mettre à jour l'XP de l'utilisateur
      if (result && 'xpCalculation' in result && result.xpCalculation) {
        const xpCalc = result.xpCalculation as any;
        dispatch(updateUserXP({
          xp: user?.xp + xpCalc.totalXP || 0,
          level: xpCalc.newLevel || user?.level || 1,
        }));
      }

      // Afficher un message de succès avec les détails XP
      if (result && 'xpCalculation' in result && result.xpCalculation) {
        const xpCalc = result.xpCalculation as any;
        if (xpCalc.levelUp) {
          Alert.alert(
            'Félicitations !',
            `Vous avez gagné ${xpCalc.totalXP} XP et êtes passé au niveau ${xpCalc.newLevel} !`
          );
        }
      }

      reset();
      
      // Scroll vers le bas après envoi
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'envoi du message');
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender.id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {/* Nom et heure AU-DESSUS de la bulle */}
        <View style={styles.messageHeaderOutside}>
          <Text style={styles.senderNameOutside}>
            {item.sender.username || 'NO_USERNAME'}
          </Text>
          <Text style={styles.timestampOutside}>
            {new Date(item.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        {/* Bulle simplifiée */}
        <Card style={[
          styles.messageCard,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}>
          <Card.Content style={styles.messageContentContainer}>
            {/* Avatar et XP seulement */}
            <View style={styles.messageHeader}>
              <Avatar.Text 
                size={28} 
                label={item.sender.username.charAt(0).toUpperCase()}
                style={[
                  styles.avatar,
                  isOwnMessage ? styles.ownAvatar : styles.otherAvatar
                ]}
              />
              {item.xpEarned > 0 && (
                <Chip 
                  icon="star" 
                  style={styles.xpChip}
                  textStyle={styles.xpText}
                  compact
                >
                  +{item.xpEarned}
                </Chip>
              )}
            </View>
            
            {/* Contenu du message */}
            <Text style={styles.simpleMessageText}>
              {item.content || item.text || item.message || 'Message vide'}
            </Text>
            
            {/* Erreurs détectées */}
            {item.errorsFound && item.errorsFound.length > 0 && (
              <View style={styles.errorsContainer}>
                <Text style={styles.errorsTitle}>
                  <Ionicons name="warning" size={14} color={colors.warning} />{' '}
                  Erreurs ({item.errorsFound.length})
                </Text>
                {item.errorsFound.slice(0, 2).map((error, index) => (
                  <Text key={index} style={styles.errorItem}>
                    • {error.shortMessage}
                  </Text>
                ))}
                {item.errorsFound.length > 2 && (
                  <Text style={styles.moreErrors}>
                    +{item.errorsFound.length - 2} autres
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={40} 
            label={user?.username.charAt(0).toUpperCase() || 'U'}
            style={styles.userAvatar}
          />
          <View>
            <Text style={styles.userName}>{user?.username}</Text>
            <Text style={styles.userStats}>
              Niveau {user?.level} • {user?.xp} XP
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              Aucun message pour le moment
            </Text>
            <Text style={styles.emptySubtext}>
              Envoyez votre premier message pour commencer !
            </Text>
          </View>
        }
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Card style={styles.inputCard}>
        <Card.Content>
          <Controller
            control={control}
            name="content"
            rules={{
              required: 'Message requis',
              maxLength: {
                value: 1000,
                message: 'Le message ne peut pas dépasser 1000 caractères',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Tapez votre message..."
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                maxLength={1000}
                error={!!errors.content}
                style={styles.messageInput}
                onFocus={clearErrorMessage}
                right={
                  <TextInput.Icon
                    icon="send"
                    onPress={handleSubmit(onSubmit)}
                    disabled={isLoading || !value?.trim()}
                  />
                }
              />
            )}
          />
          {errors.content && (
            <Text style={styles.inputError}>{errors.content.message}</Text>
          )}
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
  },
  userStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.sm,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageCard: {
    maxWidth: '85%',
    minWidth: 120, // Largeur minimale pour les messages courts
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ownMessage: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  otherMessage: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  messageContentContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  avatar: {
    marginRight: spacing.xs,
  },
  ownAvatar: {
    backgroundColor: colors.surface,
  },
  otherAvatar: {
    backgroundColor: colors.accent,
  },
  messageInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderName: {
    ...typography.caption,
    fontWeight: 'bold',
    color: '#000000', // Force couleur noire
    fontSize: 12,
  },
  timestamp: {
    ...typography.small,
    color: '#666666', // Force couleur grise
    marginLeft: spacing.xs,
    fontSize: 10,
  },
  xpChip: {
    backgroundColor: colors.xp,
  },
  xpText: {
    color: colors.surface,
    fontSize: 10,
  },
  simpleMessageText: {
    fontSize: 16,
    color: '#000000', // Force couleur noire
    marginTop: spacing.xs,
    paddingVertical: 4,
    fontWeight: '400',
  },
  messageHeaderOutside: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  senderNameOutside: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  timestampOutside: {
    fontSize: 10,
    color: '#666666',
  },
  ownSenderName: {
    color: colors.surface,
  },
  otherSenderName: {
    color: colors.text,
  },
  ownTimestamp: {
    color: colors.surface + 'CC',
  },
  otherTimestamp: {
    color: colors.textSecondary,
  },
  errorsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '20',
    borderRadius: 8,
  },
  errorsTitle: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  errorItem: {
    ...typography.small,
    color: colors.warning,
    marginBottom: 2,
  },
  moreErrors: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: spacing.sm,
    margin: spacing.sm,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  inputCard: {
    margin: spacing.sm,
    elevation: 4,
  },
  messageInput: {
    backgroundColor: colors.surface,
  },
  inputError: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default ChatScreen;
