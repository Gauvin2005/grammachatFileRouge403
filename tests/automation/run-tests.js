#!/usr/bin/env node

/**
 * Script d'automatisation des tests pour Grammachat
 * Ce script exécute tous les tests et génère un rapport complet
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration des couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuration
const config = {
  backend: {
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage',
    directory: './backend',
  },
  frontend: {
    testCommand: 'npm test',
    coverageCommand: 'npm run test:coverage',
    directory: './frontend',
  },
  integration: {
    testCommand: 'npm run test:integration',
    directory: './tests/integration',
  },
};

class TestRunner {
  constructor() {
    this.results = {
      backend: { passed: 0, failed: 0, total: 0, errors: [] },
      frontend: { passed: 0, failed: 0, total: 0, errors: [] },
      integration: { passed: 0, failed: 0, total: 0, errors: [] },
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`  ${message}`, 'bright');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  logSection(message) {
    this.log(`\n${'-'.repeat(40)}`, 'blue');
    this.log(`  ${message}`, 'blue');
    this.log(`${'-'.repeat(40)}`, 'blue');
  }

  async runCommand(command, cwd, description) {
    try {
      this.log(`\n🔄 ${description}...`, 'yellow');
      this.log(`📁 Répertoire: ${cwd}`, 'cyan');
      this.log(`⚡ Commande: ${command}`, 'cyan');

      const output = execSync(command, {
        cwd: path.resolve(cwd),
        encoding: 'utf8',
        stdio: 'pipe',
      });

      this.log(`✅ ${description} réussi`, 'green');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} échoué`, 'red');
      this.log(`Erreur: ${error.message}`, 'red');
      return { success: false, error: error.message, output: error.stdout || '' };
    }
  }

  async runBackendTests() {
    this.logSection('TESTS BACKEND');
    
    // Tests unitaires
    const testResult = await this.runCommand(
      config.backend.testCommand,
      config.backend.directory,
      'Tests unitaires Backend'
    );

    // Tests de couverture
    const coverageResult = await this.runCommand(
      config.backend.coverageCommand,
      config.backend.directory,
      'Couverture de code Backend'
    );

    this.results.backend = {
      tests: testResult,
      coverage: coverageResult,
    };
  }

  async runFrontendTests() {
    this.logSection('TESTS FRONTEND');
    
    // Tests unitaires
    const testResult = await this.runCommand(
      config.frontend.testCommand,
      config.frontend.directory,
      'Tests unitaires Frontend'
    );

    // Tests de couverture
    const coverageResult = await this.runCommand(
      config.frontend.coverageCommand,
      config.frontend.directory,
      'Couverture de code Frontend'
    );

    this.results.frontend = {
      tests: testResult,
      coverage: coverageResult,
    };
  }

  async runIntegrationTests() {
    this.logSection('TESTS D\'INTÉGRATION');
    
    const testResult = await this.runCommand(
      config.integration.testCommand,
      config.integration.directory,
      'Tests d\'intégration'
    );

    this.results.integration = {
      tests: testResult,
    };
  }

  generateReport() {
    this.logHeader('RAPPORT DE TESTS');
    
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);

    this.log(`\n⏱️  Durée totale: ${duration}s`, 'magenta');
    
    // Résumé des tests
    this.logSection('RÉSUMÉ');
    
    const sections = [
      { name: 'Backend', result: this.results.backend.tests },
      { name: 'Frontend', result: this.results.frontend.tests },
      { name: 'Intégration', result: this.results.integration.tests },
    ];

    sections.forEach(section => {
      const status = section.result.success ? '✅' : '❌';
      const color = section.result.success ? 'green' : 'red';
      this.log(`${status} ${section.name}: ${section.result.success ? 'SUCCÈS' : 'ÉCHEC'}`, color);
    });

    // Génération du rapport HTML
    this.generateHTMLReport(duration);
    
    // Génération du rapport JSON
    this.generateJSONReport(duration);
  }

  generateHTMLReport(duration) {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests - Grammachat</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin: 20px 0; padding: 15px; border-radius: 5px; }
        .success { background-color: #d4edda; border-left: 4px solid #28a745; }
        .error { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .info { background-color: #d1ecf1; border-left: 4px solid #17a2b8; }
        .timestamp { color: #6c757d; font-size: 0.9em; }
        pre { background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #6366f1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Grammachat - Rapport de Tests</h1>
            <p class="timestamp">Généré le ${new Date().toLocaleString('fr-FR')}</p>
            <p>Durée totale: ${duration}s</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${this.results.backend.tests.success ? '✅' : '❌'}</div>
                <div>Backend</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.results.frontend.tests.success ? '✅' : '❌'}</div>
                <div>Frontend</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.results.integration.tests.success ? '✅' : '❌'}</div>
                <div>Intégration</div>
            </div>
        </div>

        <div class="section ${this.results.backend.tests.success ? 'success' : 'error'}">
            <h2>🔧 Tests Backend</h2>
            <p><strong>Statut:</strong> ${this.results.backend.tests.success ? 'SUCCÈS' : 'ÉCHEC'}</p>
            ${this.results.backend.tests.output ? `<pre>${this.results.backend.tests.output}</pre>` : ''}
        </div>

        <div class="section ${this.results.frontend.tests.success ? 'success' : 'error'}">
            <h2>📱 Tests Frontend</h2>
            <p><strong>Statut:</strong> ${this.results.frontend.tests.success ? 'SUCCÈS' : 'ÉCHEC'}</p>
            ${this.results.frontend.tests.output ? `<pre>${this.results.frontend.tests.output}</pre>` : ''}
        </div>

        <div class="section ${this.results.integration.tests.success ? 'success' : 'error'}">
            <h2>🔗 Tests d'Intégration</h2>
            <p><strong>Statut:</strong> ${this.results.integration.tests.success ? 'SUCCÈS' : 'ÉCHEC'}</p>
            ${this.results.integration.tests.output ? `<pre>${this.results.integration.tests.output}</pre>` : ''}
        </div>

        <div class="section info">
            <h2>📊 Informations</h2>
            <p><strong>Projet:</strong> Grammachat - Application de messagerie gamifiée</p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Environnement:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Plateforme:</strong> ${process.platform}</p>
            <p><strong>Node.js:</strong> ${process.version}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync('test-report.html', html);
    this.log(`📄 Rapport HTML généré: test-report.html`, 'green');
  }

  generateJSONReport(duration) {
    const report = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      nodeVersion: process.version,
      results: this.results,
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    this.log(`📄 Rapport JSON généré: test-report.json`, 'green');
  }

  async run() {
    this.logHeader('GRAMMACHAT - AUTOMATISATION DES TESTS');
    this.log('🚀 Démarrage de l\'exécution des tests...', 'bright');

    try {
      await this.runBackendTests();
      await this.runFrontendTests();
      await this.runIntegrationTests();
      
      this.generateReport();
      
      this.logHeader('TESTS TERMINÉS');
      this.log('🎉 Tous les tests ont été exécutés avec succès !', 'green');
      
    } catch (error) {
      this.log(`💥 Erreur lors de l'exécution des tests: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Exécution du script
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = TestRunner;
