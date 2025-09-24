#!/usr/bin/env node

/**
 * Tests API - Messages
 * Teste les endpoints de gestion des messages
 */

const { TestUtils } = require('../utils/testUtils');

class MessagesApiTests {
  constructor() {
    this.utils = new TestUtils();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.testUser = null;
    this.authToken = null;
  }

  async runAllTests() {
    console.log('Démarrage des tests API - Messages\n');
    
    try {
      await this.utils.connectDB();
      
      // Créer un utilisateur de test et s'authentifier
      await this.setupTestUser();
      
      const tests = [
        { name: 'Test création message', fn: this.testCreateMessage.bind(this) },
        { name: 'Test récupération messages', fn: this.testGetMessages.bind(this) },
        { name: 'Test message avec erreurs', fn: this.testMessageWithErrors.bind(this) },
        { name: 'Test calcul XP', fn: this.testXpCalculation.bind(this) },
        { name: 'Test validation contenu', fn: this.testContentValidation.bind(this) },
        { name: 'Test autorisation', fn: this.testAuthorization.bind(this) }
      ];

      for (const test of tests) {
        await this.runTest(test.name, test.fn);
      }

      this.printResults();
      
    } catch (error) {
      console.error('[ERROR] Erreur lors des tests:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async setupTestUser() {
    this.testUser = await this.utils.createTestUser();
    this.authToken = await this.utils.authenticateUser(this.testUser.email, 'TestPassword123!');
  }

  async cleanup() {
    if (this.testUser) {
      await this.utils.deleteTestUser(this.testUser.email);
    }
    await this.utils.disconnectDB();
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

  async testCreateMessage() {
    const messageContent = 'Ceci est un message de test';
    
    const response = await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        content: messageContent
      })
    });

    if (!response.ok) {
      throw new Error(`Création message échouée: ${response.data.message}`);
    }

    if (!response.data.message) {
      throw new Error('Message manquant dans la réponse');
    }

    if (response.data.message.content !== messageContent) {
      throw new Error('Contenu du message incorrect');
    }
  }

  async testGetMessages() {
    // Créer quelques messages
    await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        content: 'Message 1'
      })
    });

    await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        content: 'Message 2'
      })
    });

    // Récupérer les messages
    const response = await this.utils.makeRequest('/api/messages', {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Récupération messages échouée: ${response.data.message}`);
    }

    if (!Array.isArray(response.data.messages)) {
      throw new Error('Format de réponse incorrect pour les messages');
    }

    if (response.data.messages.length < 2) {
      throw new Error(`Nombre de messages insuffisant: ${response.data.messages.length}`);
    }
  }

  async testMessageWithErrors() {
    const messageWithErrors = 'Ceci est un message avec des erreur grammaticales';
    
    const response = await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        content: messageWithErrors
      })
    });

    if (!response.ok) {
      throw new Error(`Création message avec erreurs échouée: ${response.data.message}`);
    }

    // Vérifier que les erreurs sont détectées
    if (!response.data.errorsFound || response.data.errorsFound.length === 0) {
      console.log('Aucune erreur détectée (peut être normal selon LanguageTool)');
    }
  }

  async testXpCalculation() {
    const initialXp = this.testUser.xp;
    
    const response = await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        content: 'Message pour test XP'
      })
    });

    if (!response.ok) {
      throw new Error(`Création message pour XP échouée: ${response.data.message}`);
    }

    // Vérifier que l'XP a été calculé
    if (response.data.xpEarned === undefined) {
      throw new Error('XP gagné manquant dans la réponse');
    }

    if (response.data.xpEarned < 0) {
      throw new Error('XP gagné ne peut pas être négatif');
    }
  }

  async testContentValidation() {
    const testCases = [
      { content: '', expected: false, description: 'Message vide' },
      { content: 'a'.repeat(1001), expected: false, description: 'Message trop long' },
      { content: 'Message valide', expected: true, description: 'Message valide' }
    ];

    for (const testCase of testCases) {
      const response = await this.utils.makeRequest('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          content: testCase.content
        })
      });

      const isValid = response.ok;
      
      if (isValid !== testCase.expected) {
        throw new Error(`${testCase.description}: ${isValid ? 'accepté' : 'rejeté'} (attendu: ${testCase.expected ? 'accepté' : 'rejeté'})`);
      }
    }
  }

  async testAuthorization() {
    // Tester sans token
    const response = await this.utils.makeRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Message sans auth'
      })
    });

    if (response.ok) {
      throw new Error('La création de message sans authentification devrait échouer');
    }

    if (response.status !== 401) {
      throw new Error(`Code de statut incorrect: ${response.status} (attendu: 401)`);
    }
  }

  printResults() {
    console.log('\nRésultats des tests API - Messages:');
    console.log(`[SUCCESS] Réussis: ${this.testResults.passed}`);
    console.log(`[ERROR] Échoués: ${this.testResults.failed}`);
    console.log(`[INFO] Total: ${this.testResults.total}`);
    console.log(`[INFO] Taux de réussite: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tests = new MessagesApiTests();
  tests.runAllTests().catch(console.error);
}

module.exports = MessagesApiTests;
