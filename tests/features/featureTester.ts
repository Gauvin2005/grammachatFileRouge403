import axios, { AxiosResponse } from 'axios';
import mongoose from 'mongoose';
import User from '../../backend/src/models/User';
import Message from '../../backend/src/models/Message';
import { redisService } from '../../backend/src/services/redisService';

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

class FeatureTester {
  private baseUrl: string;
  private jwtToken: string | null = null;
  private testUser: { email: string; password: string; username: string };
  private results: TestSuite[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testUser = {
      email: `feature-${Date.now()}@example.com`,
      password: 'FeatureTest123!',
      username: `featureuser${Date.now().toString().slice(-6)}`
    };
  }

  async runAllTests(): Promise<void> {
    console.log('\x1b[36m=== TESTS FONCTIONNALITÉS GRAMMACHAT ===\x1b[0m\n');

    await this.runTestSuite('User Registration Flow', this.testUserRegistrationFlow.bind(this));
    await this.runTestSuite('Authentication Flow', this.testAuthenticationFlow.bind(this));
    await this.runTestSuite('Message System Flow', this.testMessageSystemFlow.bind(this));
    await this.runTestSuite('XP and Leveling System', this.testXPLevelingSystem.bind(this));
    await this.runTestSuite('Leaderboard System', this.testLeaderboardSystem.bind(this));
    await this.runTestSuite('Cache Integration', this.testCacheIntegration.bind(this));
    await this.runTestSuite('Error Recovery', this.testErrorRecovery.bind(this));

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

  private async testUserRegistrationFlow(): Promise<void> {
    await this.runTest('Complete Registration Process', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: this.testUser.email,
        password: this.testUser.password,
        username: this.testUser.username
      });

      if (response.status !== 201) {
        throw new Error(`Registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success) {
        throw new Error(`Registration unsuccessful: ${response.data.message}`);
      }

      if (!response.data.data?.user) {
        throw new Error('User data not returned');
      }

      const user = response.data.data.user;
      if (user.email !== this.testUser.email) {
        throw new Error('Email mismatch in response');
      }

      if (user.username !== this.testUser.username) {
        throw new Error('Username mismatch in response');
      }

      if (user.role !== 'user') {
        throw new Error('Default role should be user');
      }

      if (user.xp !== 0) {
        throw new Error('Initial XP should be 0');
      }

      if (user.level !== 1) {
        throw new Error('Initial level should be 1');
      }
    });

    await this.runTest('Database User Creation', async () => {
      const dbUser = await User.findOne({ email: this.testUser.email });
      if (!dbUser) {
        throw new Error('User not found in database');
      }

      if (dbUser.username !== this.testUser.username) {
        throw new Error('Database username mismatch');
      }

      if (dbUser.xp !== 0) {
        throw new Error('Database XP mismatch');
      }

      if (dbUser.level !== 1) {
        throw new Error('Database level mismatch');
      }
    });
  }

  private async testAuthenticationFlow(): Promise<void> {
    await this.runTest('Login Process', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (response.status !== 200) {
        throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success) {
        throw new Error(`Login unsuccessful: ${response.data.message}`);
      }

      if (!response.data.data?.token) {
        throw new Error('JWT token not returned');
      }

      this.jwtToken = response.data.data.token;
    });

    await this.runTest('Profile Access with Token', async () => {
      if (!this.jwtToken) {
        throw new Error('No JWT token available');
      }

      const response = await this.makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Profile access failed: ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Profile access unsuccessful: ${response.data.message}`);
      }

      if (!response.data.data?.user) {
        throw new Error('User profile not returned');
      }
    });

    await this.runTest('Token Validation', async () => {
      if (!this.jwtToken) {
        throw new Error('No JWT token available');
      }

      const response = await this.makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error('Token validation failed');
      }
    });
  }

  private async testMessageSystemFlow(): Promise<void> {
    if (!this.jwtToken) {
      throw new Error('Authentication required for message tests');
    }

    await this.runTest('Send Message', async () => {
      const messageContent = 'This is a comprehensive test message for the messaging system.';
      const response = await this.makeRequest('POST', '/api/messages', {
        content: messageContent
      }, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 201) {
        throw new Error(`Message sending failed: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success) {
        throw new Error(`Message sending unsuccessful: ${response.data.message}`);
      }

      if (!response.data.data?.message) {
        throw new Error('Message data not returned');
      }

      const message = response.data.data.message;
      if (message.content !== messageContent) {
        throw new Error('Message content mismatch');
      }

      if (typeof message.xpEarned !== 'number') {
        throw new Error('XP earned should be a number');
      }

      if (message.xpEarned <= 0) {
        throw new Error('XP earned should be positive');
      }
    });

    await this.runTest('Retrieve Messages', async () => {
      const response = await this.makeRequest('GET', '/api/messages', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Message retrieval failed: ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Message retrieval unsuccessful: ${response.data.message}`);
      }

      if (!Array.isArray(response.data.data?.messages)) {
        throw new Error('Messages should be an array');
      }

      if (response.data.data.messages.length === 0) {
        throw new Error('No messages found');
      }
    });

    await this.runTest('Database Message Storage', async () => {
      const dbMessages = await Message.find({ senderId: this.testUser.email });
      if (dbMessages.length === 0) {
        throw new Error('No messages found in database');
      }

      const latestMessage = dbMessages[dbMessages.length - 1];
      if (!latestMessage.content) {
        throw new Error('Message content missing in database');
      }

      if (typeof latestMessage.xpEarned !== 'number') {
        throw new Error('XP earned missing in database');
      }
    });
  }

  private async testXPLevelingSystem(): Promise<void> {
    if (!this.jwtToken) {
      throw new Error('Authentication required for XP tests');
    }

    await this.runTest('XP Calculation', async () => {
      const shortMessage = 'Hi';
      const response = await this.makeRequest('POST', '/api/messages', {
        content: shortMessage
      }, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 201) {
        throw new Error(`Short message failed: ${response.status}`);
      }

      const message = response.data.data.message;
      if (message.xpEarned !== shortMessage.length) {
        throw new Error(`XP calculation incorrect: expected ${shortMessage.length}, got ${message.xpEarned}`);
      }
    });

    await this.runTest('User XP Update', async () => {
      const dbUser = await User.findOne({ email: this.testUser.email });
      if (!dbUser) {
        throw new Error('User not found in database');
      }

      if (dbUser.xp <= 0) {
        throw new Error('User XP should be positive after sending messages');
      }
    });

    await this.runTest('Level Calculation', async () => {
      const dbUser = await User.findOne({ email: this.testUser.email });
      if (!dbUser) {
        throw new Error('User not found in database');
      }

      const expectedLevel = Math.floor(dbUser.xp / 100) + 1;
      if (dbUser.level !== expectedLevel) {
        throw new Error(`Level calculation incorrect: expected ${expectedLevel}, got ${dbUser.level}`);
      }
    });
  }

  private async testLeaderboardSystem(): Promise<void> {
    await this.runTest('Leaderboard Retrieval', async () => {
      const response = await this.makeRequest('GET', '/api/users/leaderboard');

      if (response.status !== 200) {
        throw new Error(`Leaderboard retrieval failed: ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Leaderboard retrieval unsuccessful: ${response.data.message}`);
      }

      if (!Array.isArray(response.data.data?.users)) {
        throw new Error('Leaderboard should be an array');
      }

      const users = response.data.data.users;
      if (users.length === 0) {
        throw new Error('Leaderboard should not be empty');
      }

      for (let i = 1; i < users.length; i++) {
        if (users[i].xp > users[i - 1].xp) {
          throw new Error('Leaderboard not sorted by XP');
        }
      }
    });

    await this.runTest('Leaderboard Pagination', async () => {
      const response = await this.makeRequest('GET', '/api/users/leaderboard?limit=5');

      if (response.status !== 200) {
        throw new Error(`Leaderboard pagination failed: ${response.status}`);
      }

      const users = response.data.data.users;
      if (users.length > 5) {
        throw new Error('Leaderboard limit not respected');
      }
    });

    await this.runTest('User in Leaderboard', async () => {
      const response = await this.makeRequest('GET', '/api/users/leaderboard');
      const users = response.data.data.users;
      
      const testUserInLeaderboard = users.find((user: any) => user.email === this.testUser.email);
      if (!testUserInLeaderboard) {
        throw new Error('Test user not found in leaderboard');
      }
    });
  }

  private async testCacheIntegration(): Promise<void> {
    await this.runTest('Messages Cache', async () => {
      const messages = [
        { id: '1', content: 'Test message 1', author: 'user1' },
        { id: '2', content: 'Test message 2', author: 'user2' }
      ];

      await redisService.setMessagesCache('test:key', messages);
      const cached = await redisService.getMessagesCache('test:key');

      if (!cached) {
        throw new Error('Messages cache not working');
      }

      if (cached.length !== messages.length) {
        throw new Error('Messages cache length mismatch');
      }
    });

    await this.runTest('Leaderboard Cache', async () => {
      const leaderboard = [
        { username: 'user1', xp: 1000, level: 5 },
        { username: 'user2', xp: 800, level: 4 }
      ];

      await redisService.setLeaderboardCache(10, leaderboard);
      const cached = await redisService.getLeaderboardCache(10);

      if (!cached) {
        throw new Error('Leaderboard cache not working');
      }

      if (cached.length !== leaderboard.length) {
        throw new Error('Leaderboard cache length mismatch');
      }
    });

    await this.runTest('User Session Cache', async () => {
      const sessionData = {
        userId: this.testUser.email,
        email: this.testUser.email,
        role: 'user',
        loginTime: Date.now()
      };

      await redisService.setUserSession(this.testUser.email, sessionData);
      const cached = await redisService.getUserSession(this.testUser.email);

      if (!cached) {
        throw new Error('User session cache not working');
      }

      if (cached.email !== this.testUser.email) {
        throw new Error('User session cache data mismatch');
      }
    });
  }

  private async testErrorRecovery(): Promise<void> {
    await this.runTest('Invalid Endpoint Recovery', async () => {
      const response = await this.makeRequest('GET', '/api/invalid-endpoint');

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}`);
      }

      if (!response.data.message) {
        throw new Error('Error message not returned');
      }
    });

    await this.runTest('Unauthorized Access Recovery', async () => {
      const response = await this.makeRequest('GET', '/api/messages');

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    });

    await this.runTest('Invalid Data Recovery', async () => {
      const response = await this.makeRequest('POST', '/api/messages', {
        content: ''
      }, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}`);
      }
    });

    await this.runTest('System Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/health');

      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error('Health check unsuccessful');
      }
    });
  }

  private async makeRequest(method: string, endpoint: string, data?: any, headers?: any): Promise<AxiosResponse> {
    const config = {
      method: method.toLowerCase() as any,
      url: `${this.baseUrl}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000,
      validateStatus: () => true
    };

    return await axios(config);
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
      console.log('\nAll feature tests passed successfully!');
    }
  }

  async cleanup(): Promise<void> {
    if (this.jwtToken) {
      try {
        await User.deleteOne({ email: this.testUser.email });
        await Message.deleteMany({ senderId: this.testUser.email });
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  }
}

export default FeatureTester;
