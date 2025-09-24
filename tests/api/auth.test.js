#!/usr/bin/env node

/**
 * Tests API - Authentification
 * Teste les endpoints d'authentification de l'API
 */

const { TestUtils } = require('../utils/testUtils');

class AuthApiTests {
  constructor() {
    this.utils = new TestUtils();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runAllTests() {
    console.log('Démarrage des tests API - Authentification\n');
    
    try {
      await this.utils.connectDB();
      
      const tests = [
        { name: 'Test connexion utilisateur valide', fn: this.testValidLogin.bind(this) },
        { name: 'Test connexion utilisateur invalide', fn: this.testInvalidLogin.bind(this) },
        { name: 'Test inscription nouvel utilisateur', fn: this.testUserRegistration.bind(this) },
        { name: 'Test inscription email existant', fn: this.testDuplicateEmailRegistration.bind(this) },
        { name: 'Test validation mot de passe', fn: this.testPasswordValidation.bind(this) },
        { name: 'Test validation email', fn: this.testEmailValidation.bind(this) }
      ];

      for (const test of tests) {
        await this.runTest(test.name, test.fn);
      }

      this.printResults();
      
    } catch (error) {
      console.error('[ERROR] Erreur lors des tests:', error.message);
    } finally {
      await this.utils.disconnectDB();
    }
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    console.log(`\nTest: ${testName}...`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`[SUCCESS] ${testName} - RÉUSSI`);
    } catch (error) {
      this.testResults.failed++;
      console.log(`[ERROR] ${testName} - ÉCHOUÉ: ${error.message}`);
    }
  }

  async testValidLogin() {
    // Créer un utilisateur de test
    const user = await this.utils.createTestUser();
    
    // Tester la connexion
    const response = await this.utils.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        password: 'TestPassword123!'
      })
    });

    if (!response.ok) {
      throw new Error(`Connexion échouée: ${response.data.message}`);
    }

    if (!response.data.token) {
      throw new Error('Token manquant dans la réponse');
    }

    // Nettoyer
    await this.utils.deleteTestUser(user.email);
  }

  async testInvalidLogin() {
    const response = await this.utils.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      })
    });

    if (response.ok) {
      throw new Error('La connexion avec des identifiants invalides devrait échouer');
    }

    if (response.status !== 401) {
      throw new Error(`Code de statut incorrect: ${response.status} (attendu: 401)`);
    }
  }

  async testUserRegistration() {
    const testData = this.utils.generateTestData('user');
    
    const response = await this.utils.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`Inscription échouée: ${response.data.message}`);
    }

    if (!response.data.user) {
      throw new Error('Utilisateur manquant dans la réponse');
    }

    if (!response.data.token) {
      throw new Error('Token manquant dans la réponse');
    }

    // Nettoyer
    await this.utils.deleteTestUser(testData.email);
  }

  async testDuplicateEmailRegistration() {
    // Créer un utilisateur
    const user = await this.utils.createTestUser();
    
    // Essayer de créer un autre utilisateur avec le même email
    const response = await this.utils.makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        username: 'differentuser',
        password: 'TestPassword123!'
      })
    });

    if (response.ok) {
      throw new Error('L\'inscription avec un email existant devrait échouer');
    }

    if (response.status !== 400) {
      throw new Error(`Code de statut incorrect: ${response.status} (attendu: 400)`);
    }

    // Nettoyer
    await this.utils.deleteTestUser(user.email);
  }

  async testPasswordValidation() {
    const testCases = [
      { password: '123', expected: false, description: 'Mot de passe trop court' },
      { password: 'nouveau', expected: false, description: 'Mot de passe sans majuscule/chiffre' },
      { password: 'TestPassword123!', expected: true, description: 'Mot de passe valide' }
    ];

    for (const testCase of testCases) {
      const response = await this.utils.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          username: `user${Date.now()}`,
          password: testCase.password
        })
      });

      const isValid = response.ok;
      
      if (isValid !== testCase.expected) {
        throw new Error(`${testCase.description}: ${isValid ? 'accepté' : 'rejeté'} (attendu: ${testCase.expected ? 'accepté' : 'rejeté'})`);
      }
    }
  }

  async testEmailValidation() {
    const testCases = [
      { email: 'invalid-email', expected: false, description: 'Email invalide' },
      { email: 'test@', expected: false, description: 'Email incomplet' },
      { email: 'test@example.com', expected: true, description: 'Email valide' }
    ];

    for (const testCase of testCases) {
      const response = await this.utils.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testCase.email,
          username: `user${Date.now()}`,
          password: 'TestPassword123!'
        })
      });

      const isValid = response.ok;
      
      if (isValid !== testCase.expected) {
        throw new Error(`${testCase.description}: ${isValid ? 'accepté' : 'rejeté'} (attendu: ${testCase.expected ? 'accepté' : 'rejeté'})`);
      }
    }
  }

  printResults() {
    console.log('\nRésultats des tests API - Authentification:');
    console.log(`[SUCCESS] Réussis: ${this.testResults.passed}`);
    console.log(`[ERROR] Échoués: ${this.testResults.failed}`);
    console.log(`[INFO] Total: ${this.testResults.total}`);
    console.log(`[INFO] Taux de réussite: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tests = new AuthApiTests();
  tests.runAllTests().catch(console.error);
}

module.exports = AuthApiTests;
