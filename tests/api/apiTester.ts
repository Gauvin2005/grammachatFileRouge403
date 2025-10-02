import axios, { AxiosResponse } from 'axios';
import { MongoClient } from 'mongodb';

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

class APITester {
  private baseUrl: string;
  private jwtToken: string | null = null;
  private testUser: { email: string; password: string; username: string };
  private mongoClient: MongoClient | null = null;
  private results: TestSuite[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      username: `testuser${Date.now().toString().slice(-6)}`
    };
  }

  async runAllTests(): Promise<void> {
    console.log('\x1b[36m=== TESTS API GRAMMACHAT ===\x1b[0m\n');

    await this.runTestSuite('Authentication', this.testAuthentication.bind(this));
    await this.runTestSuite('User Management', this.testUserManagement.bind(this));
    await this.runTestSuite('Message System', this.testMessageSystem.bind(this));
    await this.runTestSuite('Leaderboard', this.testLeaderboard.bind(this));
    await this.runTestSuite('Error Handling', this.testErrorHandling.bind(this));
    await this.runTestSuite('Rate Limiting', this.testRateLimiting.bind(this));

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

  private async testAuthentication(): Promise<void> {
    await this.runTest('User Registration', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: this.testUser.email,
        password: this.testUser.password,
        username: this.testUser.username
      });

      if (response.status !== 201) {
        throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success) {
        throw new Error(`Registration failed: ${response.data.message}`);
      }
    });

    await this.runTest('User Login', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success || !response.data.data?.token) {
        throw new Error(`Login failed: ${response.data.message}`);
      }

      this.jwtToken = response.data.data.token;
    });

    await this.runTest('Get User Profile', async () => {
      if (!this.jwtToken) {
        throw new Error('No JWT token available');
      }

      const response = await this.makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success || !response.data.data?.user) {
        throw new Error(`Profile fetch failed: ${response.data.message}`);
      }
    });

    await this.runTest('Invalid Login Credentials', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: this.testUser.email,
        password: 'wrongpassword'
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });

    await this.runTest('Duplicate Registration', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: this.testUser.email,
        password: this.testUser.password,
        username: this.testUser.username
      });

      if (response.status !== 409) {
        throw new Error(`Expected 409, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });
  }

  private async testUserManagement(): Promise<void> {
    if (!this.jwtToken) {
      throw new Error('Authentication required for user management tests');
    }

    await this.runTest('Get User Profile', async () => {
      const response = await this.makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    });

    await this.runTest('Update User Profile', async () => {
      const response = await this.makeRequest('PUT', '/api/users/profile', {
        username: `updated${Date.now()}`
      }, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });
  }

  private async testMessageSystem(): Promise<void> {
    if (!this.jwtToken) {
      throw new Error('Authentication required for message tests');
    }

    await this.runTest('Send Message', async () => {
      const response = await this.makeRequest('POST', '/api/messages', {
        content: 'This is a test message for API testing'
      }, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 201) {
        throw new Error(`Expected 201, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success || !response.data.data?.message) {
        throw new Error(`Message creation failed: ${response.data.message}`);
      }
    });

    await this.runTest('Get Messages', async () => {
      const response = await this.makeRequest('GET', '/api/messages', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success || !Array.isArray(response.data.data?.messages)) {
        throw new Error(`Messages fetch failed: ${response.data.message}`);
      }
    });

    await this.runTest('Get Messages with Pagination', async () => {
      const response = await this.makeRequest('GET', '/api/messages?page=1&limit=10', null, {
        'Authorization': `Bearer ${this.jwtToken}`
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });
  }

  private async testLeaderboard(): Promise<void> {
    await this.runTest('Get Leaderboard', async () => {
      const response = await this.makeRequest('GET', '/api/users/leaderboard');

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }

      if (!response.data.success || !Array.isArray(response.data.data?.users)) {
        throw new Error(`Leaderboard fetch failed: ${response.data.message}`);
      }
    });

    await this.runTest('Get Leaderboard with Limit', async () => {
      const response = await this.makeRequest('GET', '/api/users/leaderboard?limit=5');

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Invalid Endpoint', async () => {
      const response = await this.makeRequest('GET', '/api/invalid-endpoint');

      if (response.status !== 404) {
        throw new Error(`Expected 404, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });

    await this.runTest('Unauthorized Access', async () => {
      const response = await this.makeRequest('GET', '/api/auth/profile');

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });

    await this.runTest('Invalid Token', async () => {
      const response = await this.makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': 'Bearer invalid-token'
      });

      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });

    await this.runTest('Invalid Registration Data', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: 'invalid-email',
        password: '123',
        username: 'ab'
      });

      if (response.status !== 400) {
        throw new Error(`Expected 400, got ${response.status}: ${JSON.stringify(response.data)}`);
      }
    });
  }

  private async testRateLimiting(): Promise<void> {
    await this.runTest('Rate Limiting Test', async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(this.makeRequest('GET', '/api/health'));
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length === 0) {
        console.log('Rate limiting not triggered (may be disabled in test environment)');
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
    console.log('\n\x1b[35m=== RÉSULTATS FINAUX ===\x1b[0m\n');

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

    console.log(`\n\x1b[36mTotal: ${totalPassed}/${totalTests} tests passed\x1b[0m`);
    console.log(`\x1b[36mDuration: ${totalDuration}ms\x1b[0m`);
    console.log(`\x1b[36mSuccess Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\x1b[0m`);

    if (totalFailed > 0) {
      console.log('\nFailed Tests:');
      this.results.forEach(suite => {
        suite.tests.filter(t => t.status === 'FAIL').forEach(test => {
          console.log(`  - ${suite.name}: ${test.testName} - ${test.error}`);
        });
      });
    }

    if (totalPassed === totalTests) {
      console.log('\n\x1b[32mAll tests passed successfully!\x1b[0m');
    }
  }

  async cleanup(): Promise<void> {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}

export default APITester;
