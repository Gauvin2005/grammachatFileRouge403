import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useKeyboard } from '../contexts/KeyboardContext';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  RadioButton,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { registerUser, clearError } from '../store/authSlice';
import { RegisterFormData } from '../types';
import { colors, spacing, typography } from '../utils/theme';

const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const insets = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboard();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      role: 'user',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await dispatch(registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        role: data.role,
      })).unwrap();
      
      Alert.alert('Succès', `Compte ${data.role} créé avec succès !`);
    } catch (error) {
      Alert.alert('Erreur', 'Échec de la création du compte');
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContainer,
        {
          paddingBottom: insets.bottom + keyboardHeight,
        }
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      extraScrollHeight={keyboardHeight}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraHeight={keyboardHeight}
    >
        <View style={styles.header}>
          <Ionicons name="flame" size={80} color={colors.phoenix} />
          <Text style={styles.title}>Grammachat</Text>
          <Text style={styles.subtitle}>
            Rejoignez notre communauté et améliorez votre orthographe !
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Créer un compte</Text>

            <Controller
              control={control}
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
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores',
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
                  error={!!errors.username}
                  style={styles.input}
                  onFocus={() => {
                    clearErrorMessage();
                  }}
                />
              )}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}

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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={!!errors.email}
                  style={styles.input}
                  onFocus={() => {
                    clearErrorMessage();
                  }}
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
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  error={!!errors.password}
                  style={styles.input}
                  onFocus={() => {
                    clearErrorMessage();
                  }}
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

            <Controller
              control={control}
              name="confirmPassword"
              rules={{
                required: 'Confirmation du mot de passe requise',
                validate: (value) =>
                  value === password || 'Les mots de passe ne correspondent pas',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Confirmer le mot de passe"
                  mode="outlined"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  error={!!errors.confirmPassword}
                  style={styles.input}
                  onFocus={() => {
                    clearErrorMessage();
                  }}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  }
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
            )}

            <Text style={styles.roleLabel}>Type de compte :</Text>
            <Controller
              control={control}
              name="role"
              rules={{
                required: 'Veuillez sélectionner un type de compte',
              }}
              render={({ field: { onChange, value } }) => (
                <View style={styles.roleContainer}>
                  <View style={styles.roleOption}>
                    <RadioButton
                      value="user"
                      status={value === 'user' ? 'checked' : 'unchecked'}
                      onPress={() => onChange('user')}
                    />
                    <Text style={styles.roleText}>Utilisateur</Text>
                  </View>
                  <View style={styles.roleOption}>
                    <RadioButton
                      value="admin"
                      status={value === 'admin' ? 'checked' : 'unchecked'}
                      onPress={() => onChange('admin')}
                    />
                    <Text style={styles.roleText}>Administrateur</Text>
                  </View>
                </View>
              )}
            />
            {errors.role && (
              <Text style={styles.errorText}>{errors.role.message}</Text>
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
              {isLoading ? 'Création...' : 'Créer le compte'}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Déjà un compte ?{' '}
            <Text style={styles.linkText}>Se connecter</Text>
          </Text>
        </View>
    </KeyboardAwareScrollView>
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
  roleLabel: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.xs,
  },
});

export default RegisterScreen;
