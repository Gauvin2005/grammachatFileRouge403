import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginUser, clearError } from '../store/authSlice';
import { LoginFormData } from '../types';
import { colors, spacing, typography } from '../utils/theme';

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('🚀 Début de la connexion avec:', data.email);
      const result = await dispatch(loginUser(data)).unwrap();
      console.log('✅ Connexion réussie:', result);
    } catch (error: any) {
      console.log('❌ Erreur de connexion dans onSubmit:', error);
      const errorMessage = typeof error === 'string' ? error : 
                          error?.message || 
                          'Échec de la connexion';
      Alert.alert('Erreur de connexion', errorMessage);
    }
  };

  // 🎭 NOUVELLE FONCTION : Mode démo
  const onDemoMode = async () => {
    try {
      console.log('🎭 Activation du mode démo');
      const demoData: LoginFormData = {
        email: 'demo@grammachat.com',
        password: 'demo123'
      };
      const result = await dispatch(loginUser(demoData)).unwrap();
      console.log('✅ Mode démo activé:', result);
    } catch (error: any) {
      console.log('❌ Erreur mode démo:', error);
      Alert.alert('Erreur mode démo', 'Impossible d\'activer le mode démo');
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

            {/* 🎭 NOUVEAU BOUTON MODE DÉMO */}
            <Button
              mode="outlined"
              onPress={onDemoMode}
              disabled={isLoading}
              style={styles.demoButton}
              buttonColor={colors.surface}
              textColor={colors.phoenix}
              icon="play-circle"
            >
              🎭 Mode Démo (Test)
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pas encore de compte ?{' '}
            <Text style={styles.linkText}>Créer un compte</Text>
          </Text>
        </View>
      </ScrollView>
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
});

export default LoginScreen;
