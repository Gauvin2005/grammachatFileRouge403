/**
 * Composant de debug pour tester la connexion
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card, ActivityIndicator, TextInput } from 'react-native-paper';
import { testConnection, testMultipleUrls } from '../utils/connectionTest';
import { colors, spacing, typography } from '../utils/theme';

export const ConnectionDebugComponent: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [multipleResults, setMultipleResults] = useState<any[]>([]);
  const [email, setEmail] = useState('admin@grammachat.com');
  const [password, setPassword] = useState('admin123');

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      const result = await testConnection();
      setTestResults(result);
    } catch (error: any) {
      setTestResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const runMultipleUrlTest = async () => {
    setIsTesting(true);
    setMultipleResults([]);
    
    try {
      const results = await testMultipleUrls();
      setMultipleResults(results);
    } catch (error: any) {
      console.error('Erreur test multiple URLs:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const testCustomLogin = async () => {
    setIsTesting(true);
    
    try {
      const testUrl = Platform.OS === 'android' ? 'http://10.8.252.74:3000/api' : 'http://localhost:3000/api';
      
      const response = await fetch(`${testUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
        // Timeout réduit pour test rapide
        signal: AbortSignal.timeout(3000)
      });
      
      const data = await response.json();
      
      setTestResults({
        success: response.ok,
        data,
        url: testUrl,
        customTest: true
      });
      
    } catch (error: any) {
      setTestResults({
        success: false,
        error: error.message,
        customTest: true
      });
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setMultipleResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Debug Connexion</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>Plateforme:</Text>
            <Text style={styles.infoValue}>{Platform.OS}</Text>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoLabel}>URL attendue:</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === 'android' ? 'http://10.8.252.74:3000/api' : 'http://localhost:3000/api'}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={runConnectionTest}
              disabled={isTesting}
              style={styles.button}
            >
              Test Connexion Standard
            </Button>
            
            <Button
              mode="outlined"
              onPress={runMultipleUrlTest}
              disabled={isTesting}
              style={styles.button}
            >
              Test Toutes URLs
            </Button>
            
            <Button
              mode="text"
              onPress={clearResults}
              disabled={isTesting}
              style={styles.button}
            >
              Effacer Résultats
            </Button>
          </View>
          
          {/* Test de connexion personnalisé */}
          <View style={styles.customTestContainer}>
            <Text style={styles.sectionTitle}>Test de connexion personnalisé</Text>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry
            />
            
            <Button
              mode="contained"
              onPress={testCustomLogin}
              disabled={isTesting}
              style={styles.button}
            >
              Test Login Personnalisé
            </Button>
          </View>
          
          {isTesting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Test en cours...</Text>
            </View>
          )}
          
          {/* Résultats du test standard */}
          {testResults && !testResults.customTest && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Résultats Test Standard:</Text>
              <Text style={styles.resultItem}>
                Statut: {testResults.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}
              </Text>
              <Text style={styles.resultItem}>
                URL: {testResults.url}
              </Text>
              {testResults.error && (
                <Text style={styles.errorItem}>
                  Erreur: {testResults.error}
                </Text>
              )}
              {testResults.loginData && (
                <Text style={styles.resultItem}>
                  Login: {testResults.loginData.success ? 'OK' : 'ÉCHEC'}
                </Text>
              )}
            </View>
          )}
          
          {/* Résultats du test personnalisé */}
          {testResults && testResults.customTest && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Résultats Test Personnalisé:</Text>
              <Text style={styles.resultItem}>
                Statut: {testResults.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}
              </Text>
              <Text style={styles.resultItem}>
                URL: {testResults.url}
              </Text>
              {testResults.error && (
                <Text style={styles.errorItem}>
                  Erreur: {testResults.error}
                </Text>
              )}
              {testResults.data && (
                <Text style={styles.resultItem}>
                  Message: {testResults.data.message}
                </Text>
              )}
            </View>
          )}
          
          {/* Résultats des tests multiples */}
          {multipleResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Résultats Tests Multiples:</Text>
              {multipleResults.map((result, index) => (
                <Text key={index} style={styles.resultItem}>
                  {result.url}: {result.success ? '✅ OK' : '❌ ÉCHEC'}
                  {result.error && ` (${result.error})`}
                </Text>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'bold',
    minWidth: 100,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  buttonContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  button: {
    marginBottom: spacing.sm,
  },
  customTestContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  resultsContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  resultsTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  resultItem: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  errorItem: {
    ...typography.small,
    color: colors.error,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
