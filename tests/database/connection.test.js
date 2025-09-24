#!/usr/bin/env node

/**
 * Tests Database - Connexion et opérations de base
 * Teste la connexion MongoDB et les opérations CRUD de base
 */

const { TestUtils, User, Message } = require('../utils/testUtils');

class DatabaseTests {
  constructor() {
    this.utils = new TestUtils();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runAllTests() {
    console.log('Démarrage des tests Database\n');
    
    try {
      const tests = [
        { name: 'Test connexion MongoDB', fn: this.testMongoConnection.bind(this) },
        { name: 'Test création utilisateur', fn: this.testUserCreation.bind(this) },
        { name: 'Test validation utilisateur', fn: this.testUserValidation.bind(this) },
        { name: 'Test création message', fn: this.testMessageCreation.bind(this) },
        { name: 'Test relations utilisateur-message', fn: this.testUserMessageRelations.bind(this) },
        { name: 'Test opérations CRUD', fn: this.testCrudOperations.bind(this) },
        { name: 'Test index et contraintes', fn: this.testIndexesAndConstraints.bind(this) }
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

  async testMongoConnection() {
    await this.utils.connectDB();
    
    // Vérifier que la connexion est active
    if (!this.utils.isConnected) {
      throw new Error('Connexion MongoDB non établie');
    }

    // Vérifier l'accès à la base de données
    const db = this.utils.utils?.connection?.db;
    if (!db) {
      throw new Error('Accès à la base de données impossible');
    }

    // Lister les collections
    const collections = await db.listCollections().toArray();
    console.log(`Collections trouvées: ${collections.length}`);
  }

  async testUserCreation() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    const userData = this.utils.generateTestData('user');
    const user = await this.utils.createTestUser(userData);

    // Vérifier que l'utilisateur a été créé
    const foundUser = await User.findById(user._id);
    if (!foundUser) {
      throw new Error('Utilisateur non trouvé après création');
    }

    if (foundUser.email !== userData.email) {
      throw new Error('Email utilisateur incorrect');
    }

    if (foundUser.username !== userData.username) {
      throw new Error('Username utilisateur incorrect');
    }

    // Vérifier les valeurs par défaut
    if (foundUser.level !== 1) {
      throw new Error('Level par défaut incorrect');
    }

    if (foundUser.xp !== 0) {
      throw new Error('XP par défaut incorrect');
    }

    await this.utils.deleteTestUser(userData.email);
  }

  async testUserValidation() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    const testCases = [
      {
        data: { email: 'invalid-email', username: 'test', password: 'Test123!' },
        shouldFail: true,
        description: 'Email invalide'
      },
      {
        data: { email: 'test@example.com', username: 'ab', password: 'Test123!' },
        shouldFail: true,
        description: 'Username trop court'
      },
      {
        data: { email: 'test@example.com', username: 'test', password: '123' },
        shouldFail: true,
        description: 'Mot de passe trop court'
      },
      {
        data: { email: 'test@example.com', username: 'testuser', password: 'TestPassword123!' },
        shouldFail: false,
        description: 'Données valides'
      }
    ];

    for (const testCase of testCases) {
      try {
        const user = new User(testCase.data);
        await user.save();
        
        if (testCase.shouldFail) {
          throw new Error(`${testCase.description}: devrait échouer mais a réussi`);
        }
        
        // Nettoyer si le test a réussi
        await User.deleteOne({ email: testCase.data.email });
        
      } catch (error) {
        if (!testCase.shouldFail) {
          throw new Error(`${testCase.description}: ${error.message}`);
        }
        // C'est normal que ça échoue pour les cas invalides
      }
    }
  }

  async testMessageCreation() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    // Créer un utilisateur d'abord
    const user = await this.utils.createTestUser();
    
    const messageData = {
      content: 'Ceci est un message de test',
      author: user._id
    };

    const message = await this.utils.createTestMessage(messageData);

    // Vérifier que le message a été créé
    const foundMessage = await Message.findById(message._id);
    if (!foundMessage) {
      throw new Error('Message non trouvé après création');
    }

    if (foundMessage.content !== messageData.content) {
      throw new Error('Contenu du message incorrect');
    }

    if (foundMessage.author.toString() !== user._id.toString()) {
      throw new Error('Auteur du message incorrect');
    }

    // Vérifier les valeurs par défaut
    if (foundMessage.xpEarned !== 0) {
      throw new Error('XP gagné par défaut incorrect');
    }

    if (!Array.isArray(foundMessage.errorsFound)) {
      throw new Error('Erreurs trouvées doit être un tableau');
    }

    await this.utils.deleteTestUser(user.email);
  }

  async testUserMessageRelations() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    // Créer un utilisateur
    const user = await this.utils.createTestUser();
    
    // Créer plusieurs messages
    const messages = [];
    for (let i = 0; i < 3; i++) {
      const message = await this.utils.createTestMessage({
        content: `Message ${i + 1}`,
        author: user._id
      });
      messages.push(message);
    }

    // Récupérer les messages avec populate
    const messagesWithAuthor = await Message.find({ author: user._id })
      .populate('author')
      .exec();

    if (messagesWithAuthor.length !== 3) {
      throw new Error(`Nombre de messages incorrect: ${messagesWithAuthor.length}`);
    }

    // Vérifier que l'auteur est bien peuplé
    for (const message of messagesWithAuthor) {
      if (!message.author) {
        throw new Error('Auteur non peuplé');
      }
      if (message.author.email !== user.email) {
        throw new Error('Email de l\'auteur incorrect');
      }
    }

    await this.utils.deleteTestUser(user.email);
  }

  async testCrudOperations() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    // CREATE
    const user = await this.utils.createTestUser();
    
    // READ
    const foundUser = await User.findById(user._id);
    if (!foundUser) {
      throw new Error('Lecture utilisateur échouée');
    }

    // UPDATE
    foundUser.level = 5;
    foundUser.xp = 1000;
    await foundUser.save();

    const updatedUser = await User.findById(user._id);
    if (updatedUser.level !== 5 || updatedUser.xp !== 1000) {
      throw new Error('Mise à jour utilisateur échouée');
    }

    // DELETE
    await User.deleteOne({ _id: user._id });
    const deletedUser = await User.findById(user._id);
    if (deletedUser) {
      throw new Error('Suppression utilisateur échouée');
    }
  }

  async testIndexesAndConstraints() {
    await this.utils.connectDB();
    await this.utils.cleanDatabase();

    // Créer un utilisateur
    const user1 = await this.utils.createTestUser({
      email: 'user1@example.com',
      username: 'user1'
    });

    // Tester l'unicité de l'email
    try {
      await this.utils.createTestUser({
        email: 'user1@example.com',
        username: 'user2'
      });
      throw new Error('Contrainte d\'unicité email non respectée');
    } catch (error) {
      if (!error.message.includes('duplicate key')) {
        throw new Error(`Erreur inattendue pour l'unicité email: ${error.message}`);
      }
    }

    // Tester l'unicité du username
    try {
      await this.utils.createTestUser({
        email: 'user2@example.com',
        username: 'user1'
      });
      throw new Error('Contrainte d\'unicité username non respectée');
    } catch (error) {
      if (!error.message.includes('duplicate key')) {
        throw new Error(`Erreur inattendue pour l'unicité username: ${error.message}`);
      }
    }

    await this.utils.deleteTestUser(user1.email);
  }

  printResults() {
    console.log('\nRésultats des tests Database:');
    console.log(`[SUCCESS] Réussis: ${this.testResults.passed}`);
    console.log(`[ERROR] Échoués: ${this.testResults.failed}`);
    console.log(`[INFO] Total: ${this.testResults.total}`);
    console.log(`[INFO] Taux de réussite: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tests = new DatabaseTests();
  tests.runAllTests().catch(console.error);
}

module.exports = DatabaseTests;
