/**
 * Composant de diagnostic réseau pour tester la connectivité
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { optimizedApi } from '../services/optimizedApi';
import { getTestUrls, getNetworkConfig } from '../utils/networkUtils';

interface NetworkTestResult {
  url: string;
  success: boolean;
  responseTime?: number;
  error?: string;
}

export const NetworkDiagnostic: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<NetworkTestResult[]>([]);
  const [currentConfig, setCurrentConfig] = useState(getNetworkConfig());

  const testConnectivity = async () => {
    setIsTesting(true);
    setResults([]);
    
    const testUrls = getTestUrls(3000);
    const testResults: NetworkTestResult[] = [];

    for (const url of testUrls) {
      const startTime = Date.now();
      try {
        console.log(`Test de connectivité: ${url}`);
        
        const testApi = await import('axios').then(axios => axios.default.create({
          baseURL: url,
          timeout: 5000,
        }));
        
        await testApi.get('/health');
        const responseTime = Date.now() - startTime;
        
        testResults.push({
          url,
          success: true,
          responseTime
        });
        
        console.log(`✅ ${url} - ${responseTime}ms`);
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        testResults.push({
          url,
          success: false,
          responseTime,
          error: error.message || 'Erreur inconnue'
        });
        
        console.log(`❌ ${url} - ${error.message}`);
      }
    }

    setResults(testResults);
    setIsTesting(false);

    // Trouver la première URL qui fonctionne
    const workingUrl = testResults.find(r => r.success);
    if (workingUrl) {
      Alert.alert(
        'Connexion réussie !',
        `Serveur accessible à : ${workingUrl.url}\nTemps de réponse : ${workingUrl.responseTime}ms`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Aucune connexion',
        'Impossible de se connecter au serveur. Vérifiez que :\n• Le serveur backend est démarré\n• Votre téléphone et PC sont sur le même WiFi\n• Le pare-feu n\'bloque pas la connexion',
        [{ text: 'OK' }]
      );
    }
  };

  const testRegistration = async () => {
    try {
      setIsTesting(true);
      
      const testData = {
        username: `test${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'test123'
      };
      
      console.log('Test d\'inscription avec:', testData.email);
      const response = await optimizedApi.register(testData);
      
      if (response.success) {
        Alert.alert('Succès !', 'Inscription testée avec succès');
      } else {
        Alert.alert('Échec', `Erreur d'inscription: ${response.message}`);
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Erreur lors du test d'inscription: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testLogin = async () => {
    try {
      setIsTesting(true);
      
      const credentials = {
        email: 'admin@grammachat.com',
        password: 'admin123'
      };
      
      console.log('Test de connexion avec:', credentials.email);
      const response = await optimizedApi.login(credentials);
      
      if (response.success) {
        Alert.alert('Succès !', 'Connexion testée avec succès');
      } else {
        Alert.alert('Échec', `Erreur de connexion: ${response.message}`);
      }
    } catch (error: any) {
      Alert.alert('Erreur', `Erreur lors du test de connexion: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Diagnostic Réseau</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration actuelle</Text>
        <Text style={styles.configText}>
          URL: {currentConfig.baseUrl}
        </Text>
        <Text style={styles.configText}>
          Plateforme: {currentConfig.platform}
        </Text>
        <Text style={styles.configText}>
          Mode: {currentConfig.isLocal ? 'Développement' : 'Production'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests de connectivité</Text>
        
        <TouchableOpacity 
          style={[styles.button, isTesting && styles.buttonDisabled]}
          onPress={testConnectivity}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Test en cours...' : 'Tester la connectivité'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary, isTesting && styles.buttonDisabled]}
          onPress={testLogin}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            Tester la connexion (admin)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary, isTesting && styles.buttonDisabled]}
          onPress={testRegistration}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            Tester l'inscription
          </Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats des tests</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={[
                styles.resultStatus,
                result.success ? styles.success : styles.error
              ]}>
                {result.success ? '✅' : '❌'}
              </Text>
              <View style={styles.resultDetails}>
                <Text style={styles.resultUrl}>{result.url}</Text>
                {result.responseTime && (
                  <Text style={styles.resultTime}>
                    {result.responseTime}ms
                  </Text>
                )}
                {result.error && (
                  <Text style={styles.resultError}>{result.error}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. S'assurer que le serveur backend est démarré{'\n'}
          2. Le téléphone et PC doivent être sur le même WiFi{'\n'}
          3. Si aucun test ne fonctionne, il faut vérifier le pare-feu{'\n'}
          4. L'IP du PC est : 10.8.251.168
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    minHeight: 600,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultStatus: {
    fontSize: 20,
    marginRight: 10,
  },
  success: {
    color: '#34C759',
  },
  error: {
    color: '#FF3B30',
  },
  resultDetails: {
    flex: 1,
  },
  resultUrl: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  resultTime: {
    fontSize: 12,
    color: '#666',
  },
  resultError: {
    fontSize: 12,
    color: '#FF3B30',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
