#!/usr/bin/env node

/**
 * Script de test avec serveur sans rate limiting
 * Démarre le serveur en mode test et lance les tests
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunnerWithServer {
  constructor() {
    this.serverProcess = null;
  }

  async runTests() {
    console.log('=== TESTS AVEC SERVEUR SANS RATE LIMITING ===\n');

    try {
      // Démarrer le serveur en mode test
      await this.startTestServer();
      
      // Attendre que le serveur soit prêt
      await this.waitForServer();
      
      // Lancer les tests
      await this.runTestSuite();
      
    } finally {
      // Arrêter le serveur
      await this.stopTestServer();
    }
  }

  async startTestServer() {
    console.log('Démarrage du serveur en mode test...');
    
    return new Promise((resolve, reject) => {
      // Démarrer le serveur avec les variables d'environnement de test
      this.serverProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, '../backend'),
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DISABLE_RATE_LIMITING: 'true',
          MONGODB_URI: 'mongodb://localhost:27017/grammachat',
          REDIS_URL: 'redis://localhost:6379'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on port') || output.includes('Rate limiting désactivé')) {
          console.log('Serveur démarré avec succès');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        // Ignorer les logs Redis en mode test
        if (!output.includes('Redis: Erreur de connexion')) {
          console.error('Serveur error:', output);
        }
      });

      this.serverProcess.on('error', (error) => {
        console.error('Erreur démarrage serveur:', error);
        reject(error);
      });

      // Timeout après 30 secondes
      setTimeout(() => {
        reject(new Error('Timeout démarrage serveur'));
      }, 30000);
    });
  }

  async waitForServer() {
    console.log('Attente que le serveur soit prêt...');
    
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch('http://localhost:3000/api/health');
        if (response.ok) {
          console.log('Serveur prêt pour les tests');
          return;
        }
      } catch (error) {
        // Continuer à attendre
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Serveur non accessible après 30 secondes');
  }

  async runTestSuite() {
    console.log('\nLancement des tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['run', 'test:failing'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DISABLE_RATE_LIMITING: 'true'
        }
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\nTous les tests sont passés avec succès!');
          resolve();
        } else {
          console.log(`\nTests échoués avec le code: ${code}`);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        console.error('Erreur lors des tests:', error);
        reject(error);
      });
    });
  }

  async stopTestServer() {
    if (this.serverProcess) {
      console.log('\nArrêt du serveur de test...');
      this.serverProcess.kill('SIGTERM');
      
      // Attendre que le processus se termine
      await new Promise(resolve => {
        this.serverProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Timeout après 5 secondes
      });
      
      console.log('Serveur arrêté');
    }
  }
}

// Fonction principale
async function main() {
  const runner = new TestRunnerWithServer();
  
  try {
    await runner.runTests();
    console.log('\nTests terminés avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunnerWithServer;
