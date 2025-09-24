#!/usr/bin/env node

/**
 * Script de test principal pour Grammachat
 * Orchestre l'exécution de tous les tests organisés
 */

const path = require('path');
const fs = require('fs');

// Couleurs pour les messages
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      categories: {}
    };
    this.startTime = null;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runAllTests() {
    this.startTime = Date.now();
    this.log('Démarrage de la suite de tests Grammachat', 'cyan');
    this.log('=' .repeat(60), 'blue');
    
    try {
      // Vérifier que les services sont disponibles
      await this.checkPrerequisites();
      
      // Exécuter les tests par catégorie
      await this.runCategoryTests('database', 'Tests Database');
      await this.runCategoryTests('api', 'Tests API');
      await this.runCategoryTests('frontend', 'Tests Frontend');
      await this.runCategoryTests('integration', 'Tests d\'Intégration');
      
      this.printFinalResults();
      
    } catch (error) {
      this.log(`[ERROR] Erreur critique: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    this.log('\nVérification Vérification des prérequis...', 'yellow');
    
    // Vérifier que MongoDB est accessible
    try {
      const { TestUtils } = require('./utils/testUtils');
      const utils = new TestUtils();
      await utils.connectDB();
      await utils.disconnectDB();
      this.log('[SUCCESS] MongoDB accessible', 'green');
    } catch (error) {
      throw new Error(`MongoDB non accessible: ${error.message}`);
    }
    
    // Vérifier que l'API est accessible
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        throw new Error(`API non accessible: ${response.status}`);
      }
      this.log('[SUCCESS] API accessible', 'green');
    } catch (error) {
      this.log(`[WARNING] API non accessible: ${error.message}`, 'yellow');
      this.log('   Les tests API seront ignorés', 'yellow');
    }
    
    // Vérifier Puppeteer
    try {
      const puppeteer = require('puppeteer');
      this.log('[SUCCESS] Puppeteer disponible', 'green');
    } catch (error) {
      this.log(`[WARNING] Puppeteer non disponible: ${error.message}`, 'yellow');
      this.log('   Les tests frontend seront ignorés', 'yellow');
    }
  }

  async runCategoryTests(category, categoryName) {
    this.log(`\nCatégorie ${categoryName}`, 'magenta');
    this.log('-'.repeat(40), 'blue');
    
    const categoryPath = path.join(__dirname, category);
    
    if (!fs.existsSync(categoryPath)) {
      this.log(`[WARNING] Dossier ${category} non trouvé`, 'yellow');
      return;
    }
    
    const testFiles = fs.readdirSync(categoryPath)
      .filter(file => file.endsWith('.test.js'))
      .sort();
    
    if (testFiles.length === 0) {
      this.log(`[WARNING] Aucun fichier de test trouvé dans ${category}`, 'yellow');
      return;
    }
    
    this.results.categories[category] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    for (const testFile of testFiles) {
      await this.runTestFile(category, testFile);
    }
    
    this.printCategoryResults(category, categoryName);
  }

  async runTestFile(category, testFile) {
    const testPath = path.join(__dirname, category, testFile);
    const testName = testFile.replace('.test.js', '');
    
    this.log(`\nTest: ${testName}...`, 'cyan');
    
    try {
      // Charger et exécuter le test
      const TestClass = require(testPath);
      const testInstance = new TestClass();
      
      if (typeof testInstance.runAllTests === 'function') {
        await testInstance.runAllTests();
        
        // Récupérer les résultats du test
        if (testInstance.testResults) {
          this.results.categories[category].total += testInstance.testResults.total;
          this.results.categories[category].passed += testInstance.testResults.passed;
          this.results.categories[category].failed += testInstance.testResults.failed;
          
          this.results.total += testInstance.testResults.total;
          this.results.passed += testInstance.testResults.passed;
          this.results.failed += testInstance.testResults.failed;
        }
      } else {
        throw new Error('Méthode runAllTests non trouvée');
      }
      
    } catch (error) {
      this.log(`[ERROR] Erreur dans ${testName}: ${error.message}`, 'red');
      this.results.categories[category].failed++;
      this.results.categories[category].total++;
      this.results.failed++;
      this.results.total++;
    }
  }

  printCategoryResults(category, categoryName) {
    const categoryResults = this.results.categories[category];
    const successRate = Math.round((categoryResults.passed / categoryResults.total) * 100);
    
    this.log(`\nRésultats ${categoryName}:`, 'magenta');
    this.log(`   [SUCCESS] Réussis: ${categoryResults.passed}`, 'green');
    this.log(`   [ERROR] Échoués: ${categoryResults.failed}`, 'red');
    this.log(`   [INFO] Total: ${categoryResults.total}`, 'blue');
    this.log(`   [INFO] Taux de réussite: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  }

  printFinalResults() {
    const duration = Date.now() - this.startTime;
    const successRate = Math.round((this.results.passed / this.results.total) * 100);
    
    this.log('\n' + '='.repeat(60), 'blue');
    this.log('Résultats RÉSULTATS FINAUX', 'bright');
    this.log('='.repeat(60), 'blue');
    
    this.log(`[SUCCESS] Tests réussis: ${this.results.passed}`, 'green');
    this.log(`[ERROR] Tests échoués: ${this.results.failed}`, 'red');
    this.log(`[INFO] Total des tests: ${this.results.total}`, 'blue');
    this.log(`[INFO] Taux de réussite global: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    this.log(`[INFO] Durée totale: ${Math.round(duration / 1000)}s`, 'cyan');
    
    // Résultats par catégorie
    this.log('\nCatégorie Résultats par catégorie:', 'magenta');
    for (const [category, results] of Object.entries(this.results.categories)) {
      const rate = Math.round((results.passed / results.total) * 100);
      this.log(`   ${category}: ${results.passed}/${results.total} (${rate}%)`, 
               rate >= 80 ? 'green' : 'yellow');
    }
    
    // Recommandations
    this.log('\nRecommandations Recommandations:', 'cyan');
    if (successRate < 80) {
      this.log('   [WARNING] Taux de réussite faible - vérifiez les tests échoués', 'yellow');
    }
    if (this.results.failed > 0) {
      this.log('   Vérification Consultez les logs détaillés ci-dessus', 'yellow');
    }
    if (successRate >= 95) {
      this.log('   Excellent Excellent taux de réussite !', 'green');
    }
    
    this.log('\n' + '='.repeat(60), 'blue');
    
    // Code de sortie
    if (this.results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
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
  --category <cat>     Exécuter seulement une catégorie (database, api, frontend, integration)
  --verbose, -v        Mode verbeux
  --no-frontend        Ignorer les tests frontend
  --no-api            Ignorer les tests API

Exemples:
  node run-tests.js
  node run-tests.js --category api
  node run-tests.js --no-frontend
    `);
    process.exit(0);
  }
  
  const runner = new TestRunner();
  
  if (args.includes('--category')) {
    const categoryIndex = args.indexOf('--category');
    const category = args[categoryIndex + 1];
    
    if (!category) {
      console.error('[ERROR] Catégorie non spécifiée');
      process.exit(1);
    }
    
    // Exécuter seulement la catégorie spécifiée
    await runner.runCategoryTests(category, `Tests ${category}`);
  } else {
    await runner.runAllTests();
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TestRunner;
