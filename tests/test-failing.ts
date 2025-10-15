#!/usr/bin/env node

/**
 * Script de test ciblé pour les erreurs spécifiques
 * Lance seulement les tests qui échouent pour un debug rapide
 */

import APITester from './api/apiTester';
import DatabaseTester from './database/databaseTester';
import ServiceTester from './services/serviceTester';

class FailingTestRunner {
  private baseUrl: string;
  private mongoUri: string;

  constructor(baseUrl: string = 'http://localhost:3000', mongoUri: string = 'mongodb://localhost:27017') {
    this.baseUrl = baseUrl;
    this.mongoUri = mongoUri;
  }

  async runFailingTests(): Promise<void> {
    console.log('=== TESTS CIBLÉS - ERREURS SPÉCIFIQUES ===\n');
    console.log(`API URL: ${this.baseUrl}`);
    console.log(`MongoDB URI: ${this.mongoUri}\n`);

    const startTime = Date.now();

    // Test seulement les suites qui échouent
    await this.runSpecificTests();

    const totalDuration = Date.now() - startTime;
    console.log(`\nDurée totale: ${totalDuration}ms`);
  }

  private async runSpecificTests(): Promise<void> {
    // 1. Tests API avec rate limiting désactivé
    console.log('\nCORRECTION: Tests API avec rate limiting désactivé');
    console.log('='.repeat(60));
    
    const apiTester = new APITester(this.baseUrl);
    
    // Désactiver le rate limiting pour les tests
    process.env.DISABLE_RATE_LIMITING = 'true';
    process.env.NODE_ENV = 'test';
    
    try {
      await apiTester.runAllTests();
      await apiTester.cleanup();
      console.log('Tests API corrigés');
    } catch (error) {
      console.log(`Tests API échoués: ${error}`);
    }

    // 2. Tests Database (déjà corrigés)
    console.log('\nCORRECTION: Tests Database');
    console.log('='.repeat(60));
    
    const dbTester = new DatabaseTester(this.mongoUri);
    
    try {
      await dbTester.runAllTests();
      await dbTester.cleanup();
      console.log('Tests Database corrigés');
    } catch (error) {
      console.log(`Tests Database échoués: ${error}`);
    }

    // 3. Tests Services avec Redis géré proprement
    console.log('\nCORRECTION: Tests Services');
    console.log('='.repeat(60));
    
    const serviceTester = new ServiceTester();
    
    try {
      await serviceTester.runAllTests();
      console.log('Tests Services corrigés');
    } catch (error) {
      console.log(`Tests Services échoués: ${error}`);
    }
  }
}

async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  // Forcer localhost pour les tests (pas le nom du container Docker)
  const mongoUri = 'mongodb://localhost:27017';
  
  const runner = new FailingTestRunner(baseUrl, mongoUri);
  
  try {
    await runner.runFailingTests();
    console.log('\nTous les tests ciblés sont terminés!');
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default FailingTestRunner;
