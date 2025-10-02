#!/usr/bin/env node

/**
 * Script de test principal pour Grammachat
 * Utilise la nouvelle suite de tests complète et professionnelle
 */

const { spawn } = require('child_process');
const path = require('path');

class TestRunner {
  constructor() {
    this.startTime = null;
  }

  async runAllTests() {
    console.log('=== TESTS GRAMMACHAT - SUITE COMPLÈTE ===\n');
    this.startTime = Date.now();
    
    try {
      // Vérifier que les services sont disponibles
      await this.checkPrerequisites();
      
      // Exécuter la suite de tests complète
      await this.runComprehensiveTests();
      
    } catch (error) {
      console.error(`[ERROR] Erreur critique: ${error.message}`);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('\nVérification des prérequis...');
    
    // Vérifier que MongoDB est accessible
    try {
      const { TestUtils } = require('./utils/testUtils');
      const utils = new TestUtils();
      await utils.connectDB();
      await utils.disconnectDB();
      console.log('[SUCCESS] MongoDB accessible');
    } catch (error) {
      throw new Error(`MongoDB non accessible: ${error.message}`);
    }
    
    // Vérifier que l'API est accessible
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        throw new Error(`API non accessible: ${response.status}`);
      }
      console.log('[SUCCESS] API accessible');
    } catch (error) {
      console.log(`[WARNING] API non accessible: ${error.message}`);
      console.log('   Les tests API seront ignorés');
    }
  }

  async runComprehensiveTests() {
    console.log('\nExécution de la suite de tests complète...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npx', ['ts-node', 'comprehensiveTestRunner.ts'], {
        cwd: __dirname,
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('\n[SUCCESS] Tous les tests sont passés avec succès!');
          resolve();
        } else {
          console.log(`\n[ERROR] Tests échoués avec le code: ${code}`);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        console.error('[ERROR] Erreur lors de l\'exécution des tests:', error);
        reject(error);
      });
    });
  }

}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node run-tests.js [options]

Options:
  --help, -h          Afficher cette aide

Description:
  Exécute la suite de tests complète pour Grammachat incluant:
  - Tests API (authentification, messages, utilisateurs)
  - Tests base de données (modèles, relations, contraintes)
  - Tests services (Redis, LanguageTool)
  - Tests fonctionnalités (flux complets)

Prérequis:
  - MongoDB en cours d'exécution
  - API backend démarrée
  - Redis disponible (optionnel)

Exemples:
  node run-tests.js
    `);
    process.exit(0);
  }
  
  const runner = new TestRunner();
  await runner.runAllTests();
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunner;
