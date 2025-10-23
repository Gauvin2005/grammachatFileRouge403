import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';
import User from '../../backend/src/models/User';
import Message from '../../backend/src/models/Message';

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalDuration: number;
  passCount: number;
  failCount: number;
  skipCount: number;
}

class DatabaseTester {
  private mongoUri: string;
  private dbName: string;
  private mongoClient: MongoClient | null = null;
  private db: Db | null = null;
  private results: TestSuite[] = [];

  constructor(mongoUri: string = 'mongodb://localhost:27017', dbName: string = 'grammachat') {
    this.mongoUri = mongoUri;
    this.dbName = dbName;
    
    // Configuration Mongoose globale pour les tests
    mongoose.set('bufferCommands', true);
  }

  async runAllTests(): Promise<void> {
    console.log('\x1b[36m=== TESTS BASE DE DONNÉES GRAMMACHAT ===\x1b[0m\n');

    try {
      await this.runTestSuite('Connection', this.testConnection.bind(this));
      await this.runTestSuite('User Model', this.testUserModel.bind(this));
      await this.runTestSuite('Message Model', this.testMessageModel.bind(this));
      await this.runTestSuite('Relations', this.testRelations.bind(this));
      await this.runTestSuite('Indexes', this.testIndexes.bind(this));
      await this.runTestSuite('Constraints', this.testConstraints.bind(this));
      await this.runTestSuite('Performance', this.testPerformance.bind(this));

      this.printFinalResults();
    } finally {
      // Toujours nettoyer les connexions
      await this.cleanup();
    }
  }

  private async runTestSuite(suiteName: string, testFunction: () => Promise<void>): Promise<void> {
    console.log(`\n\x1b[33m--- ${suiteName} ---\x1b[0m`);
    const suite: TestSuite = {
      name: suiteName,
      tests: [],
      totalDuration: 0,
      passCount: 0,
      failCount: 0,
      skipCount: 0
    };

    // Ajouter la suite avant d'exécuter les tests
    this.results.push(suite);

    const startTime = Date.now();
    
    try {
      await testFunction();
    } catch (error) {
      console.error(`Suite ${suiteName} failed:`, error);
    }

    suite.totalDuration = Date.now() - startTime;
    suite.passCount = suite.tests.filter(t => t.status === 'PASS').length;
    suite.failCount = suite.tests.filter(t => t.status === 'FAIL').length;
    suite.skipCount = suite.tests.filter(t => t.status === 'SKIP').length;
  }

  private async cleanupDatabase(): Promise<void> {
    try {
      // Nettoyer les collections de test
      await User.deleteMany({ email: { $regex: /test|perf|unique/ } });
      await Message.deleteMany({ content: { $regex: /test|Test/ } });
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  }

  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    const currentSuite = this.results[this.results.length - 1];

    if (!currentSuite) {
      throw new Error('No active test suite');
    }

    try {
      await testFunction();
      const duration = Date.now() - startTime;
      currentSuite.tests.push({
        testName,
        status: 'PASS',
        duration
      });
      console.log(`\x1b[32m✓ ${testName} (${duration}ms)\x1b[0m`);
      
      // Nettoyer après chaque test
      await this.cleanupDatabase();
    } catch (error) {
      const duration = Date.now() - startTime;
      currentSuite.tests.push({
        testName,
        status: 'FAIL',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`\x1b[31m✗ ${testName} (${duration}ms) - ${error}\x1b[0m`);
      
      // Nettoyer même en cas d'erreur
      await this.cleanupDatabase();
    }
  }

  private async testConnection(): Promise<void> {
    await this.runTest('MongoDB Connection', async () => {
      this.mongoClient = new MongoClient(this.mongoUri);
      await this.mongoClient.connect();
      this.db = this.mongoClient.db(this.dbName);
      
      if (!this.db) {
        throw new Error('Failed to connect to database');
      }
    });

    await this.runTest('Mongoose Connection', async () => {
      const mongoUri = `${this.mongoUri}/${this.dbName}`;
      
      // Fermer toute connexion existante
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 60000,
        maxPoolSize: 1,
        minPoolSize: 1,
        bufferCommands: false
      });
      
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Mongoose connection not established');
      }
    });

    await this.runTest('Database Access', async () => {
      if (!this.db) {
        throw new Error('Database not available');
      }

      const collections = await this.db.listCollections().toArray();
      console.log(`Found ${collections.length} collections`);
    });
  }

  private async testUserModel(): Promise<void> {
    await this.runTest('User Creation', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now().toString().slice(-6)}`,
        password: 'TestPassword123!',
        role: 'user',
        xp: 0,
        level: 1
      };

      const user = new User(userData);
      const savedUser = await user.save();

      if (!savedUser._id) {
        throw new Error('User not saved properly');
      }

      if (savedUser.email !== userData.email) {
        throw new Error('User email mismatch');
      }

      await User.deleteOne({ _id: savedUser._id });
    });

    await this.runTest('User Validation', async () => {
      const invalidUser = new User({
        email: 'invalid-email',
        username: 'ab',
        password: '123',
        role: 'user'
      });

      try {
        await invalidUser.save();
        throw new Error('Invalid user should not be saved');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('validation failed')) {
          throw new Error('Expected validation error');
        }
      }
    });

    await this.runTest('User Password Hashing', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now().toString().slice(-6)}`,
        password: 'TestPassword123!',
        role: 'user'
      };

      const user = new User(userData);
      await user.save();

      if (user.password === userData.password) {
        throw new Error('Password not hashed');
      }

      await User.deleteOne({ _id: user._id });
    });

    await this.runTest('User XP System', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now().toString().slice(-6)}`,
        password: 'TestPassword123!',
        role: 'user'
      };

      const user = new User(userData);
      await user.save();

      const initialXP = user.xp;
      const initialLevel = user.level;

      await user.addXP(100);

      if (user.xp !== initialXP + 100) {
        throw new Error('XP not added correctly');
      }

      if (user.level <= initialLevel) {
        throw new Error('Level not updated correctly');
      }

      await User.deleteOne({ _id: user._id });
    });
  }

  private async testMessageModel(): Promise<void> {
    let testUser: any;

    await this.runTest('Message Creation', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now().toString().slice(-6)}`,
        password: 'TestPassword123!',
        role: 'user'
      };

      testUser = new User(userData);
      await testUser.save();

      const messageData = {
        senderId: testUser._id,
        content: 'This is a test message',
        xpEarned: 25,
        errorsFound: []
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();

      if (!savedMessage._id) {
        throw new Error('Message not saved properly');
      }

      if (savedMessage.content !== messageData.content) {
        throw new Error('Message content mismatch');
      }

      await Message.deleteOne({ _id: savedMessage._id });
    });

    await this.runTest('Message Validation', async () => {
      const invalidMessage = new Message({
        senderId: testUser._id,
        content: '',
        xpEarned: -10
      });

      try {
        await invalidMessage.save();
        throw new Error('Invalid message should not be saved');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('validation failed')) {
          throw new Error('Expected validation error');
        }
      }
    });

    await this.runTest('Message Timestamps', async () => {
      const messageData = {
        senderId: testUser._id,
        content: 'Test message with timestamps',
        xpEarned: 30
      };

      const message = new Message(messageData);
      await message.save();

      if (!(message as any).createdAt) {
        throw new Error('CreatedAt timestamp missing');
      }

      if (!(message as any).updatedAt) {
        throw new Error('UpdatedAt timestamp missing');
      }

      await Message.deleteOne({ _id: message._id });
    });

    await this.runTest('Cleanup Test User', async () => {
      await User.deleteOne({ _id: testUser._id });
    });
  }

  private async testRelations(): Promise<void> {
    let testUser: any;
    let testMessages: any[] = [];

    await this.runTest('User-Message Relationship', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        username: `testuser${Date.now().toString().slice(-6)}`,
        password: 'TestPassword123!',
        role: 'user'
      };

      testUser = new User(userData);
      await testUser.save();

      for (let i = 0; i < 3; i++) {
        const message = new Message({
          senderId: testUser._id,
          content: `Test message ${i + 1}`,
          xpEarned: 20
        });
        const savedMessage = await message.save();
        testMessages.push(savedMessage);
      }

      const messagesWithUser = await Message.find({ senderId: testUser._id })
        .populate('senderId')
        .exec();

      if (messagesWithUser.length !== 3) {
        throw new Error(`Expected 3 messages, got ${messagesWithUser.length}`);
      }

      for (const message of messagesWithUser) {
        if (!message.senderId) {
          throw new Error('Sender not populated');
        }
      }
    });

    await this.runTest('Cleanup Relations', async () => {
      for (const message of testMessages) {
        await Message.deleteOne({ _id: message._id });
      }
      await User.deleteOne({ _id: testUser._id });
    });
  }

  private async testIndexes(): Promise<void> {
    await this.runTest('User Email Index', async () => {
      if (!this.db) {
        throw new Error('Database not available');
      }

      const userCollection = this.db.collection('users');
      const indexes = await userCollection.indexes();

      const emailIndex = indexes.find(index => 
        index.key && index.key.email === 1
      );

      if (!emailIndex) {
        throw new Error('Email index not found');
      }
    });

    await this.runTest('User Username Index', async () => {
      if (!this.db) {
        throw new Error('Database not available');
      }

      const userCollection = this.db.collection('users');
      const indexes = await userCollection.indexes();

      const usernameIndex = indexes.find(index => 
        index.key && index.key.username === 1
      );

      if (!usernameIndex) {
        throw new Error('Username index not found');
      }
    });

    await this.runTest('Message SenderId Index', async () => {
      if (!this.db) {
        throw new Error('Database not available');
      }

      const messageCollection = this.db.collection('messages');
      const indexes = await messageCollection.indexes();

      const senderIdIndex = indexes.find(index => 
        index.key && index.key.senderId === 1
      );

      if (!senderIdIndex) {
        throw new Error('SenderId index not found');
      }
    });
  }

  private async testConstraints(): Promise<void> {
    await this.runTest('Email Uniqueness', async () => {
      const email = `unique-${Date.now()}@example.com`;
      
      const user1 = new User({
        email,
        username: `user1${Date.now()}`,
        password: 'TestPassword123!',
        role: 'user'
      });
      await user1.save();

      const user2 = new User({
        email,
        username: `user2${Date.now()}`,
        password: 'TestPassword123!',
        role: 'user'
      });

      try {
        await user2.save();
        throw new Error('Duplicate email should not be allowed');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('duplicate key')) {
          throw new Error('Expected duplicate key error');
        }
      }

      await User.deleteOne({ _id: user1._id });
    });

    await this.runTest('Username Uniqueness', async () => {
      const timestamp = Date.now();
      const username = `u${timestamp}`; // Nom d'utilisateur court
      
      const user1 = new User({
        email: `user1-${timestamp}@example.com`,
        username,
        password: 'TestPassword123!',
        role: 'user'
      });
      await user1.save();

      const user2 = new User({
        email: `user2-${timestamp}@example.com`,
        username,
        password: 'TestPassword123!',
        role: 'user'
      });

      try {
        await user2.save();
        throw new Error('Duplicate username should not be allowed');
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('duplicate key')) {
          throw new Error('Expected duplicate key error');
        }
      }

      await User.deleteOne({ _id: user1._id });
    });
  }

  private async testPerformance(): Promise<void> {
    await this.runTest('Bulk User Creation', async () => {
      const users = [];
      const timestamp = Date.now();
      for (let i = 0; i < 100; i++) {
        users.push({
          email: `perf-${timestamp}-${i}@example.com`,
          username: `perf${i}`, // Nom d'utilisateur court
          password: 'TestPassword123!',
          role: 'user' // Ajouter le champ role requis
        });
      }

      const startTime = Date.now();
      await User.insertMany(users);
      const duration = Date.now() - startTime;

      console.log(`Created 100 users in ${duration}ms`);

      if (duration > 5000) {
        throw new Error(`Bulk creation too slow: ${duration}ms`);
      }

      await User.deleteMany({ email: { $regex: /^perf-/ } });
    });

    await this.runTest('Query Performance', async () => {
      const timestamp = Date.now();
      const userData = {
        email: `perf-${timestamp}@example.com`,
        username: `perf${timestamp}`, // Nom d'utilisateur court
        password: 'TestPassword123!',
        role: 'user'
      };

      const user = new User(userData);
      await user.save();

      const startTime = Date.now();
      const foundUser = await User.findOne({ email: userData.email });
      const duration = Date.now() - startTime;

      if (!foundUser) {
        throw new Error('User not found');
      }

      if (duration > 100) {
        throw new Error(`Query too slow: ${duration}ms`);
      }

      await User.deleteOne({ _id: user._id });
    });
  }

  private printFinalResults(): void {
    console.log('\n=== RÉSULTATS FINAUX ===\n');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDuration = 0;

    this.results.forEach(suite => {
      totalTests += suite.tests.length;
      totalPassed += suite.passCount;
      totalFailed += suite.failCount;
      totalSkipped += suite.skipCount;
      totalDuration += suite.totalDuration;

      const successRate = suite.tests.length > 0 ? (suite.passCount / suite.tests.length) * 100 : 0;
      console.log(`${suite.name}: ${suite.passCount}/${suite.tests.length} (${successRate.toFixed(1)}%)`);
    });

    console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed`);
    console.log(`Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

    if (totalFailed > 0) {
      console.log('\nFailed Tests:');
      this.results.forEach(suite => {
        suite.tests.filter(t => t.status === 'FAIL').forEach(test => {
          console.log(`  - ${suite.name}: ${test.testName} - ${test.error}`);
        });
      });
    }

    if (totalPassed === totalTests) {
      console.log('\nAll database tests passed successfully!');
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.mongoClient) {
        await this.mongoClient.close();
        this.mongoClient = null;
      }
    } catch (error) {
      console.log('Error closing MongoDB client:', error);
    }
    
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
    } catch (error) {
      console.log('Error disconnecting Mongoose:', error);
    }
  }
}

export default DatabaseTester;
