import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginUser, clearError } from '../store/authSlice';
import { LoginFormData, RegisterFormData } from '../types';
import { colors, spacing, typography } from '../utils/theme';
import { apiService } from '../services/api';

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Formulaire d'inscription
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      role: 'user', // Rôle forcé à 'user' par défaut
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Début de la connexion avec:', data.email);
      const result = await dispatch(loginUser(data)).unwrap();
      console.log('Connexion réussie:', result);
    } catch (error: any) {
      console.log('Erreur de connexion dans onSubmit:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || 
                          'Échec de la connexion';
      Alert.alert('Erreur de connexion', errorMessage);
    }
  };

  // Mode démo
  const onDemoMode = async () => {
    try {
      console.log('Activation du mode démo');
      const demoData: LoginFormData = {
        email: 'demo@grammachat.com',
        password: 'demo123'
      };
      const result = await dispatch(loginUser(demoData)).unwrap();
      console.log('Mode démo activé:', result);
    } catch (error: any) {
      console.log('Erreur mode démo:', error);
      Alert.alert('Erreur mode démo', 'Impossible d\'activer le mode démo');
    }
  };

  // Inscription utilisateur
  const onRegister = async (data: RegisterFormData) => {
    try {
      setIsRegistering(true);
      console.log('Début de l\'inscription avec:', data.email, data.username);
      
      // Préparer les données pour l'API (rôle forcé à 'user')
      const registerData = {
        email: data.email,
        password: data.password,
        username: data.username,
        role: 'user' as const, // Force le rôle à 'user'
      };
      
      // Envoyer la requête POST vers /api/users
      const result = await apiService.register(registerData);
      console.log('Inscription réussie:', result);
      
      // Fermer le modal et réinitialiser le formulaire
      setShowRegisterModal(false);
      resetRegisterForm();
      
      Alert.alert(
        'Inscription réussie', 
        'Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.log('Erreur inscription:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Échec de l\'inscription';
      Alert.alert('Erreur d\'inscription', errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="flame" size={80} color={colors.phoenix} />
          <Text style={styles.title}>Grammachat</Text>
          <Text style={styles.subtitle}>
            Votre messagerie gamifiée pour améliorer votre orthographe
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Connexion</Text>

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email requis',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Format email invalide',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onChange={typeof window !== 'undefined' ? (e: any) => onChange(e.target.value) : undefined}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!errors.email}
                  style={styles.input}
                  onFocus={clearErrorMessage}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Mot de passe requis',
                minLength: {
                  value: 6,
                  message: 'Le mot de passe doit contenir au moins 6 caractères',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Mot de passe"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onChange={typeof window !== 'undefined' ? (e: any) => onChange(e.target.value) : undefined}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={!!errors.password}
                  style={styles.input}
                  onFocus={clearErrorMessage}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              )}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password.message}</Text>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            {/* Bouton Mode Démo */}
            <Button
              mode="outlined"
              onPress={onDemoMode}
              disabled={isLoading}
              style={styles.demoButton}
              buttonColor={colors.surface}
              textColor={colors.phoenix}
              icon="play-circle"
            >
              Mode Démo (Test)
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pas encore de compte ?{' '}
          </Text>
          <Button
            mode="text"
            onPress={() => setShowRegisterModal(true)}
            textColor={colors.primary}
            style={styles.registerButton}
            compact
          >
            Créer un compte
          </Button>
        </View>
      </ScrollView>

      {/* Modal d'inscription */}
      <Portal>
        <Dialog 
          visible={showRegisterModal} 
          onDismiss={() => setShowRegisterModal(false)}
          style={styles.registerModal}
        >
          <Dialog.Title style={styles.modalTitle}>
            Créer un compte
          </Dialog.Title>
          
          <Dialog.Content>
            <Text style={styles.modalSubtitle}>
              Rejoignez Grammachat et améliorez votre orthographe !
            </Text>

            {/* Champ Nom d'utilisateur */}
            <Controller
              control={registerControl}
              name="username"
              rules={{
                required: 'Nom d\'utilisateur requis',
                minLength: {
                  value: 3,
                  message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
                },
                maxLength: {
                  value: 20,
                  message: 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Nom d'utilisateur"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  autoCapitalize="none"
                  autoComplete="username"
                  error={!!registerErrors.username}
                  style={styles.modalInput}
                />
              )}
            />
            {registerErrors.username && (
              <Text style={styles.errorText}>{registerErrors.username.message}</Text>
            )}

            {/* Champ Email */}
            <Controller
              control={registerControl}
              name="email"
              rules={{
                required: 'Email requis',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Format email invalide',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Email"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!registerErrors.email}
                  style={styles.modalInput}
                />
              )}
            />
            {registerErrors.email && (
              <Text style={styles.errorText}>{registerErrors.email.message}</Text>
            )}

            {/* Champ Mot de passe */}
            <Controller
              control={registerControl}
              name="password"
              rules={{
                required: 'Mot de passe requis',
                minLength: {
                  value: 6,
                  message: 'Le mot de passe doit contenir au moins 6 caractères',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Mot de passe"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={!!registerErrors.password}
                  style={styles.modalInput}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              )}
            />
            {registerErrors.password && (
              <Text style={styles.errorText}>{registerErrors.password.message}</Text>
            )}

            {/* Champ Confirmation mot de passe */}
            <Controller
              control={registerControl}
              name="confirmPassword"
              rules={{
                required: 'Confirmation du mot de passe requise',
                validate: (value, formValues) => 
                  value === formValues.password || 'Les mots de passe ne correspondent pas',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirmer le mot de passe"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  error={!!registerErrors.confirmPassword}
                  style={styles.modalInput}
                />
              )}
            />
            {registerErrors.confirmPassword && (
              <Text style={styles.errorText}>{registerErrors.confirmPassword.message}</Text>
            )}

            {/* Note sur le rôle */}
            <Text style={styles.roleNote}>
              Votre compte sera créé avec le rôle "utilisateur" par défaut
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowRegisterModal(false);
                resetRegisterForm();
              }}
              disabled={isRegistering}
            >
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={handleRegisterSubmit(onRegister)}
              loading={isRegistering}
              disabled={isRegistering}
              style={styles.registerSubmitButton}
            >
              {isRegistering ? 'Création...' : 'Créer le compte'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
    elevation: 4,
  },
  cardTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  demoButton: {
    marginTop: spacing.sm,
    borderColor: colors.phoenix,
    borderWidth: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Styles pour le bouton d'inscription
  registerButton: {
    marginTop: spacing.xs,
  },
  // Styles pour le modal d'inscription
  registerModal: {
    maxHeight: '80%',
  },
  modalTitle: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalInput: {
    marginBottom: spacing.sm,
  },
  roleNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  registerSubmitButton: {
    marginLeft: spacing.sm,
  },
});

export default LoginScreen;
