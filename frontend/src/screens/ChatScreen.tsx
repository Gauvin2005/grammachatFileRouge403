import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '../contexts/KeyboardContext';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Chip,
  Avatar,
  ProgressBar,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { sendMessage, fetchMessages, clearError, loadMessagesFromCache } from '../store/messageSlice';
import { updateUserXP, loadUserProfile } from '../store/authSlice';
import { updateUserXP as updateUserXPInList } from '../store/userSlice';
import { MessageFormData, Message } from '../types';
import { colors, spacing, typography } from '../utils/theme';
import { optimizedApi } from '../services/optimizedApi';

const ChatScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { messages, isLoading, error } = useAppSelector((state) => state.messages);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  // États pour l'animation d'XP
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [previousXP, setPreviousXP] = useState(user?.xp || 0);
  // Initialiser avec la progression actuelle au lieu de 0
  const currentXPProgress = ((user?.xp || 0) % 100) / 100;
  const xpProgressAnim = useRef(new Animated.Value(currentXPProgress)).current;
  const xpGlowAnim = useRef(new Animated.Value(0)).current;

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
    // Charger les messages depuis le cache local d'abord (instantané)
    dispatch(loadMessagesFromCache()).catch(error => {
      console.log('Erreur lors du chargement du cache local (non critique):', error?.message || error);
    });
    
    // Puis synchroniser avec le serveur
    console.log('Synchronisation avec le serveur');
    dispatch(fetchMessages({})).catch(error => {
      console.log('Erreur lors de la synchronisation (gérée silencieusement):', error?.message || error);
    });
  }, [dispatch]);

  // Effet pour synchroniser l'état local avec l'état Redux au chargement
  useEffect(() => {
    if (user?.xp !== undefined) {
      setPreviousXP(user.xp);
      // Synchroniser la barre de progression avec la valeur réelle au chargement
      const currentProgress = ((user.xp || 0) % 100) / 100;
      if (!showXPAnimation) {
        xpProgressAnim.setValue(currentProgress);
      }
    }
  }, [user?.xp]);

  // Effet pour surveiller les changements d'XP et déclencher l'animation
  useEffect(() => {
    // Vérifier si l'XP a changé et qu'une animation est en cours
    if (showXPAnimation && xpGained > 0 && user?.xp !== previousXP) {
      
      // Calculer la progression XP actuelle
      const newXPProgress = ((user?.xp || 0) % 100) / 100;
      
      // Animer depuis la position précédente vers la nouvelle position
      Animated.sequence([
        Animated.timing(xpProgressAnim, {
          toValue: newXPProgress,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(xpGlowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(xpGlowAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start(() => {
        // Masquer le texte "+XP" après 3 secondes, mais garder la barre visible
        setTimeout(() => {
          setShowXPAnimation(false);
        }, 3000);
      });
    }
  }, [user?.xp, showXPAnimation, xpGained, previousXP]);

  // Fonction pour déclencher l'animation d'XP
  const triggerXPAnimation = (xpEarned: number) => {
    setXpGained(xpEarned);
    setShowXPAnimation(true);
  };


  const onSubmit = async (data: MessageFormData) => {
    try {
      const result = await dispatch(sendMessage(data)).unwrap();
      
      // Le résultat contient { message: { xpCalculation: ... } }
      const messageData = result.message || result;
      
      // Rafraîchir le profil utilisateur depuis l'API pour obtenir les données mises à jour
      if (messageData && 'xpCalculation' in messageData && messageData.xpCalculation) {
        const xpCalc = messageData.xpCalculation as any;
        
        // Sauvegarder l'XP précédent pour l'animation
        setPreviousXP(user?.xp || 0);
        
        try {
          // Invalider le cache du profil utilisateur pour forcer une requête fraîche
          optimizedApi.invalidateUserProfileCache();
          
          // Utiliser optimizedApi directement avec forceRefresh pour récupérer les données fraîches
          const profileResponse = await optimizedApi.getUserProfile({ forceRefresh: true });
          
          if (profileResponse.success && profileResponse.data?.user) {
            const updatedUser = profileResponse.data.user;
            
            // Mettre à jour le store auth avec les données fraîches de l'API
            dispatch(updateUserXP({
              xp: updatedUser.xp,
              level: updatedUser.level,
            }));
            
            // Mettre à jour l'XP dans la liste des utilisateurs (pour admin dashboard, leaderboard, etc.)
            if (user?.id) {
              dispatch(updateUserXPInList({
                userId: user.id,
                xp: updatedUser.xp,
                level: updatedUser.level
              }));
            }
            
            triggerXPAnimation(xpCalc.totalXP);
          }
        } catch (profileError) {
          console.error('Erreur lors de la récupération du profil mis à jour:', profileError);
          
          // Fallback : utiliser les valeurs calculées localement si l'API échoue
          const currentXP = user?.xp || 0;
          const currentLevel = user?.level || 1;
          const newXP = currentXP + xpCalc.totalXP;
          const newLevel = xpCalc.newLevel || currentLevel;
          
          dispatch(updateUserXP({
            xp: newXP,
            level: newLevel,
          }));
          
          if (user?.id) {
            dispatch(updateUserXPInList({
              userId: user.id,
              xp: newXP,
              level: newLevel
            }));
          }
          
          triggerXPAnimation(xpCalc.totalXP);
        }
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
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
      Alert.alert('Erreur', `Échec de l'envoi du message: ${errorMessage}`);
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  // Composant pour la barre de progression d'XP animée
  const XPProgressBar = () => {
    // Utiliser directement les valeurs du state Redux pour garantir la synchronisation
    const currentXP = user?.xp || 0;
    const currentLevel = user?.level || 1;
    
    // Calculer l'XP nécessaire pour le niveau suivant (formule simple)
    const xpForNextLevel = currentLevel * 100;
    const xpProgress = (currentXP % 100) / 100;
    
    // Animation basée sur la valeur animée de la progression (qui persiste)
    const animatedWidth = xpProgressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    const glowOpacity = xpGlowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.8],
    });

    return (
      <View style={styles.xpContainer}>
        <View style={styles.xpInfo}>
          <Text style={styles.xpText}>
            Niveau {currentLevel} • {currentXP} XP
          </Text>
          {showXPAnimation && (
            <Animatable.Text 
              animation="bounceIn" 
              style={styles.xpGainedText}
              duration={600}
            >
              +{xpGained} XP
            </Animatable.Text>
          )}
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                {
                  width: animatedWidth,
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.progressBarGlow,
                {
                  opacity: glowOpacity,
                  width: animatedWidth,
                }
              ]}
            />
          </View>
          <Text style={styles.xpToNext}>
            {xpForNextLevel - (currentXP % 100)} XP jusqu'au niveau {currentLevel + 1}
          </Text>
        </View>
      </View>
    );
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
            {item.sender?.username || 'NO_USERNAME'}
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
                label={(item.sender?.username || 'U').charAt(0).toUpperCase()}
                style={[
                  styles.avatar,
                  isOwnMessage ? styles.ownAvatar : styles.otherAvatar
                ]}
              />
              {item.xpEarned > 0 && (
                <Chip 
                  icon="star" 
                  style={styles.xpChip}
                  textStyle={styles.xpChipText}
                  compact
                >
                  +{item.xpEarned}
                </Chip>
              )}
            </View>
            
            {/* Contenu du message */}
            <Text style={styles.simpleMessageText}>
              {item.content || 'Message vide'}
            </Text>
            
            {/* Erreurs détectées */}
            {item.errorsFound && Array.isArray(item.errorsFound) && item.errorsFound.length > 0 && (
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={40} 
            label={(user?.username || 'U').charAt(0).toUpperCase()}
            style={styles.userAvatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.username}</Text>
            <XPProgressBar />
          </View>
        </View>
      </View>

        <FlatList
        ref={flatListRef}
        data={messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer,
          {
            paddingBottom: insets.bottom + keyboardHeight + 100, // Espace pour le champ de saisie
          }
        ]}
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

      <View style={[
        styles.inputContainer,
        {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + keyboardHeight,
        }
      ]}>
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
                  onFocus={() => {
                    clearErrorMessage();
                    // Scroll automatique vers le bas pour voir les derniers messages
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
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
      </View>
    </View>
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
    zIndex: 100, // S'assurer que le header reste au-dessus des messages
    elevation: 4, // Pour Android
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // Styles pour l'animation d'XP
  xpContainer: {
    flex: 1,
    paddingBottom: spacing.sm, // Espace supplémentaire pour éviter la coupure du texte
  },
  xpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm, // Augmenté pour plus d'espace
    minHeight: 24, // Hauteur minimale pour éviter la coupure
  },
  xpText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  xpGainedText: {
    ...typography.caption,
    color: '#22c55e', // Vert plus visible
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // Fond subtil pour meilleure visibilité
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    elevation: 2, // Élévation pour passer au-dessus des autres éléments
    zIndex: 10, // Z-index élevé pour s'assurer qu'il soit visible
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs, // Espacement supplémentaire
  },
  progressBarBackground: {
    flex: 1,
    height: 8, // Hauteur augmentée pour meilleure visibilité
    backgroundColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    elevation: 1, // Légère élévation pour la profondeur
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressBarGlow: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  xpToNext: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 10,
    minWidth: 80,
    textAlign: 'right',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: spacing.md,
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
  xpChipText: {
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
  inputContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputCard: {
    margin: spacing.sm,
    elevation: 4,
  },
  messageInput: {
    backgroundColor: colors.surface,
    maxHeight: 80,
    minHeight: 40,
  },
  inputError: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default ChatScreen;
