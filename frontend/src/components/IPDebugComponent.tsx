/**
 * Composant de debug pour tester la détection d'IP
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { testIPDetection, testSpecificIP } from '../utils/testIPDetection';
import { getWorkingIP, getApiUrl } from '../utils/ipDetector';
import { colors, spacing, typography } from '../utils/theme';

export const IPDebugComponent: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentIP, setCurrentIP] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runFullTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      addResult('Début du test complet...');
      
      // Test de détection d'IP
      const ip = await getWorkingIP();
      setCurrentIP(ip);
      addResult(`IP détectée: ${ip}`);
      
      // Test d'URL API
      const url = await getApiUrl();
      setCurrentUrl(url);
      addResult(`URL API: ${url}`);
      
      // Test complet
      await testIPDetection();
      addResult('Test complet terminé');
      
    } catch (error: any) {
      addResult(`Erreur: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testSpecificIPs = async () => {
    setIsTesting(true);
    addResult('Test des IPs spécifiques...');
    
    const testIPs = [
      '10.8.251.168',
      '10.8.251.148',
      '192.168.1.100',
      '127.0.0.1',
      'localhost'
    ];
    
    for (const ip of testIPs) {
      const isWorking = await testSpecificIP(ip);
      addResult(`${ip}: ${isWorking ? 'OK' : 'ÉCHEC'}`);
    }
    
    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentIP(null);
    setCurrentUrl(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Debug Détection IP</Text>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>IP actuelle:</Text>
            <Text style={styles.statusValue}>{currentIP || 'Non détectée'}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>URL API:</Text>
            <Text style={styles.statusValue}>{currentUrl || 'Non générée'}</Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={runFullTest}
              disabled={isTesting}
              style={styles.button}
            >
              {isTesting ? 'Test en cours...' : 'Test Complet'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={testSpecificIPs}
              disabled={isTesting}
              style={styles.button}
            >
              Test IPs Spécifiques
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
          
          {isTesting && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Test en cours...</Text>
            </View>
          )}
          
          {testResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Résultats:</Text>
              {testResults.map((result, index) => (
                <Text key={index} style={styles.resultItem}>
                  {result}
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
  statusContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: 'bold',
    minWidth: 80,
  },
  statusValue: {
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
});
