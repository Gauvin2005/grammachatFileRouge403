#!/usr/bin/env node

/**
 * Script de test optimisé pour CI/CD GitHub Actions
 * Gère les timeouts et les erreurs de connexion de manière robuste
 */

const { spawn } = require('child_process');
const path = require('path');

class CITestRunner {
  constructor() {
    this.startTime = null;
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  async runAllTests() {
    console.log('=== TESTS CI/CD GRAMMACHAT ===\n');
    this.startTime = Date.now();
    
    try {
      // Attendre que les services soient prêts
      await this.waitForServices();
      
      // Exécuter les tests avec retry
      await this.runTestsWithRetry();
      
      console.log('\n=== TESTS CI/CD TERMINÉS AVEC SUCCÈS ===');
      process.exit(0);
      
    } catch (error) {
      console.error(`\n=== ERREUR TESTS CI/CD ===`);
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  async waitForServices() {
    console.log('Attente que les services soient prêts...');
    
    // Attendre MongoDB
    await this.waitForService('MongoDB', async () => {
      try {
        const { TestUtils } = require('./utils/testUtils');
        const utils = new TestUtils();
        await utils.connectDB();
        await utils.disconnectDB();
        return true;
      } catch (error) {
        return false;
      }
    });

    // Attendre Redis (optionnel)
    await this.waitForService('Redis', async () => {
      try {
        const redis = require('redis');
        const client = redis.createClient({ url: 'redis://localhost:6379' });
        await client.connect();
        await client.ping();
        await client.disconnect();
        return true;
      } catch (error) {
        console.log('Redis non disponible - tests Redis seront ignorés');
        return true; // Redis est optionnel
      }
    });

    console.log('Tous les services sont prêts!\n');
  }

  async waitForService(serviceName, checkFunction, maxWait = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        if (await checkFunction()) {
          console.log(`[SUCCESS] ${serviceName} est prêt`);
          return;
        }
      } catch (error) {
        // Ignorer les erreurs de connexion temporaires
      }
      
      console.log(`[WAIT] Attente de ${serviceName}...`);
      await this.sleep(2000);
    }
    
    throw new Error(`${serviceName} n'est pas disponible après ${maxWait}ms`);
  }

  async runTestsWithRetry() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`\nTentative ${attempt}/${this.maxRetries} d'exécution des tests...`);
        await this.runTests();
        return; // Succès
      } catch (error) {
        console.error(`Tentative ${attempt} échouée:`, error.message);
        
        if (attempt === this.maxRetries) {
          throw error; // Dernière tentative échouée
        }
        
        console.log(`Attente ${this.retryDelay}ms avant la prochaine tentative...`);
        await this.sleep(this.retryDelay);
      }
    }
  }

  async runTests() {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npx', ['ts-node', 'comprehensiveTestRunner.ts'], {
        cwd: __dirname,
        stdio: 'inherit',
        env: { 
          ...process.env, 
          MONGODB_URI: 'mongodb://localhost:27018/grammachat_test',
          REDIS_URL: 'redis://localhost:6379',
          NODE_ENV: 'test',
          CI: 'true'
        }
      });

      // Timeout après 8 minutes pour CI
      const timeout = setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error('Tests timeout after 8 minutes'));
      }, 480000);

      testProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Fonction principale
async function main() {
  const runner = new CITestRunner();
  await runner.runAllTests();
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CITestRunner;
