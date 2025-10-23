import { redisService } from '../../backend/src/services/redisService';
import { LanguageToolService } from '../../backend/src/services/LanguageToolService';

// Forcer l'URL Redis pour les tests
process.env.REDIS_URL = 'redis://localhost:6379';

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

class ServiceTester {
  private results: TestSuite[] = [];
  private languageToolService: LanguageToolService;

  constructor() {
    this.languageToolService = new LanguageToolService();
  }

  async runAllTests(): Promise<void> {
    console.log('\x1b[36m=== TESTS SERVICES GRAMMACHAT ===\x1b[0m\n');

    await this.runTestSuite('Redis Service', this.testRedisService.bind(this));
    await this.runTestSuite('Language Tool Service', this.testLanguageToolService.bind(this));

    this.printFinalResults();
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
    } catch (error) {
      const duration = Date.now() - startTime;
      currentSuite.tests.push({
        testName,
        status: 'FAIL',
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`\x1b[31m✗ ${testName} (${duration}ms) - ${error}\x1b[0m`);
    }
  }

  private async testRedisService(): Promise<void> {
    await this.runTest('Redis Connection', async () => {
      // Essayer de se connecter à Redis d'abord
      try {
        await redisService.connect();
        const isConnected = await redisService.isRedisConnected();
        if (!isConnected) {
          throw new Error('Redis connection failed');
        }
      } catch (error) {
        // Si Redis n'est pas accessible, skip les tests Redis
        console.log('Redis not available - skipping Redis tests');
        throw new Error('Redis connection failed - Redis may not be running');
      }
    });

    // Skip les autres tests Redis si la connexion échoue
    try {
      const isConnected = await redisService.isRedisConnected();
      if (!isConnected) {
        await this.runTest('User Session Cache', async () => {
          throw new Error('Skipped - Redis not connected');
        });
        await this.runTest('Messages Cache', async () => {
          throw new Error('Skipped - Redis not connected');
        });
        await this.runTest('Leaderboard Cache', async () => {
          throw new Error('Skipped - Redis not connected');
        });
        return;
      }
    } catch (error) {
      console.log('Redis connection check failed, skipping Redis tests');
      await this.runTest('User Session Cache', async () => {
        throw new Error('Skipped - Redis not connected');
      });
      await this.runTest('Messages Cache', async () => {
        throw new Error('Skipped - Redis not connected');
      });
      await this.runTest('Leaderboard Cache', async () => {
        throw new Error('Skipped - Redis not connected');
      });
      return;
    }

    await this.runTest('User Session Cache', async () => {
      const userId = 'test-user-123';
      const sessionData = { 
        userId, 
        email: 'test@example.com',
        role: 'user',
        loginTime: Date.now()
      };
      
      await redisService.setUserSession(userId, sessionData);
      const retrieved = await redisService.getUserSession(userId);
      
      if (!retrieved) {
        throw new Error('User session not cached');
      }
      
      if (retrieved.userId !== userId) {
        throw new Error('User session data mismatch');
      }
    });

    await this.runTest('Messages Cache', async () => {
      const messages = [
        { id: '1', content: 'Test message 1', author: 'user1' },
        { id: '2', content: 'Test message 2', author: 'user2' }
      ];
      
      await redisService.setMessagesCache('test:key', messages);
      const retrieved = await redisService.getMessagesCache('test:key');
      
      if (!retrieved) {
        throw new Error('Messages cache not retrieved');
      }
      
      if (retrieved.length !== messages.length) {
        throw new Error('Messages cache length mismatch');
      }
    });

    await this.runTest('Leaderboard Cache', async () => {
      const leaderboard = [
        { username: 'user1', xp: 1000, level: 5 },
        { username: 'user2', xp: 800, level: 4 }
      ];
      
      await redisService.setLeaderboardCache(10, leaderboard);
      const retrieved = await redisService.getLeaderboardCache(10);
      
      if (!retrieved) {
        throw new Error('Leaderboard cache not retrieved');
      }
      
      if (retrieved.length !== leaderboard.length) {
        throw new Error('Leaderboard cache length mismatch');
      }
    });

    await this.runTest('Cache Statistics', async () => {
      const stats = await redisService.getCacheStats();
      
      if (typeof stats.connected !== 'boolean') {
        throw new Error('Cache stats missing connection status');
      }
      
      if (typeof stats.keys !== 'number') {
        throw new Error('Cache stats missing keys count');
      }
    });

    await this.runTest('Cache Clear', async () => {
      await redisService.clearAllCache();
      
      // Test that cache is cleared by trying to get a non-existent key
      const retrieved = await redisService.getMessagesCache('non-existent');
      if (retrieved) {
        throw new Error('Cache should have been cleared');
      }
    });
  }

  private async testLanguageToolService(): Promise<void> {
    await this.runTest('Text Analysis - Valid Text', async () => {
      const text = 'This is a valid sentence with proper grammar.';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Text analysis failed');
      }
      
      if (typeof result.errors !== 'object') {
        throw new Error('Errors should be an object');
      }
      
      if (typeof result.xpCalculation !== 'object') {
        throw new Error('XP calculation should be an object');
      }
    });

    await this.runTest('Text Analysis - Invalid Text', async () => {
      const text = 'This is a sentance with grammer errors.';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Text analysis failed');
      }
      
      if (!Array.isArray(result.errors)) {
        throw new Error('Errors should be an array');
      }
    });

    await this.runTest('XP Calculation', async () => {
      const text = 'This is a test message for XP calculation.';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result.xpCalculation) {
        throw new Error('XP calculation missing');
      }
      
      if (typeof result.xpCalculation.totalXP !== 'number') {
        throw new Error('Total XP should be a number');
      }
      
      if (result.xpCalculation.totalXP <= 0) {
        throw new Error('Total XP should be positive');
      }
    });

    await this.runTest('Error Detection', async () => {
      const text = 'This sentance has grammer errors and speling mistakes.';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!Array.isArray(result.errors)) {
        throw new Error('Errors should be an array');
      }
    });

    await this.runTest('Empty Text Handling', async () => {
      const text = '';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Empty text analysis failed');
      }
      
      if (result.xpCalculation.totalXP !== 0) {
        throw new Error('Empty text should have 0 XP');
      }
    });

    await this.runTest('Long Text Handling', async () => {
      const text = 'This is a very long text. '.repeat(100);
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Long text analysis failed');
      }
      
      if (result.xpCalculation.totalXP <= 0) {
        throw new Error('Long text should have positive XP');
      }
    });

    await this.runTest('Special Characters Handling', async () => {
      const text = 'This text has special characters: @#$%^&*()_+{}|:<>?[]\\;\'",./';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Special characters analysis failed');
      }
    });

    await this.runTest('Unicode Characters Handling', async () => {
      const text = 'This text has unicode characters: éàçùñüöäëï';
      const result = await this.languageToolService.analyzeText(text);
      
      if (!result) {
        throw new Error('Unicode characters analysis failed');
      }
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
      console.log('\nAll service tests passed successfully!');
    }
  }
}

export default ServiceTester;