import APITester from './api/apiTester';
import DatabaseTester from './database/databaseTester';
import ServiceTester from './services/serviceTester';
import FeatureTester from './features/featureTester';

interface TestSuiteResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  successRate: number;
  error?: string;
}

class ComprehensiveTestRunner {
  private results: TestSuiteResult[] = [];
  private baseUrl: string;
  private mongoUri: string;

  constructor(baseUrl: string = 'http://localhost:3000', mongoUri: string = 'mongodb://localhost:27017') {
    this.baseUrl = baseUrl;
    this.mongoUri = mongoUri;
  }

  async runAllTests(): Promise<void> {
    console.log('=== SUITE DE TESTS COMPLÈTE GRAMMACHAT ===\n');
    console.log(`API URL: ${this.baseUrl}`);
    console.log(`MongoDB URI: ${this.mongoUri}\n`);

    const startTime = Date.now();

    await this.runTestSuite('API Tests', async () => {
      const tester = new APITester(this.baseUrl);
      await tester.runAllTests();
      await tester.cleanup();
    });

    await this.runTestSuite('Database Tests', async () => {
      const tester = new DatabaseTester(this.mongoUri);
      await tester.runAllTests();
      await tester.cleanup();
    });

    await this.runTestSuite('Service Tests', async () => {
      const tester = new ServiceTester();
      await tester.runAllTests();
    });

    await this.runTestSuite('Feature Tests', async () => {
      const tester = new FeatureTester(this.baseUrl);
      await tester.runAllTests();
      await tester.cleanup();
    });

    const totalDuration = Date.now() - startTime;
    this.printFinalResults(totalDuration);
  }

  private async runTestSuite(suiteName: string, testFunction: () => Promise<void>): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`EXÉCUTION: ${suiteName}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    let status: 'PASS' | 'FAIL' | 'SKIP' = 'PASS';
    let error: string | undefined;

    try {
      await testFunction();
    } catch (err) {
      status = 'FAIL';
      error = err instanceof Error ? err.message : String(err);
      console.error(`\nSuite ${suiteName} failed:`, error);
    }

    const duration = Date.now() - startTime;

    const result: TestSuiteResult = {
      name: suiteName,
      status,
      duration,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      successRate: 0,
      error
    };

    this.results.push(result);
  }

  private printFinalResults(totalDuration: number): void {
    console.log(`\n${'='.repeat(80)}`);
    console.log('RÉSULTATS FINAUX - SUITE DE TESTS COMPLÈTE');
    console.log(`${'='.repeat(80)}\n`);

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalDurationAll = 0;

    this.results.forEach(result => {
      totalDurationAll += result.duration;
      
      const statusIcon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '○';
      const durationStr = `${result.duration}ms`;
      
      console.log(`${statusIcon} ${result.name.padEnd(20)} ${durationStr.padStart(10)} ${result.status}`);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Suite Duration: ${Math.round(totalDurationAll / this.results.length)}ms`);

    const passedSuites = this.results.filter(r => r.status === 'PASS').length;
    const failedSuites = this.results.filter(r => r.status === 'FAIL').length;
    const skippedSuites = this.results.filter(r => r.status === 'SKIP').length;

    console.log(`\nSuites: ${passedSuites} passed, ${failedSuites} failed, ${skippedSuites} skipped`);
    console.log(`Success Rate: ${((passedSuites / this.results.length) * 100).toFixed(1)}%`);

    if (failedSuites === 0) {
      console.log(`\nALL TEST SUITES PASSED SUCCESSFULLY!`);
      console.log('Your Grammachat application is fully functional and ready for production.');
    } else {
      console.log(`\n${failedSuites} test suite(s) failed. Please review the errors above.`);
    }

    console.log(`\n${'='.repeat(80)}`);

    this.printRecommendations();
  }

  private printRecommendations(): void {
    console.log('\nRECOMMANDATIONS:');
    
    const failedSuites = this.results.filter(r => r.status === 'FAIL');
    
    if (failedSuites.length === 0) {
      console.log('All systems are functioning correctly');
      console.log('API endpoints are responding properly');
      console.log('Database operations are working');
      console.log('Services are operational');
      console.log('Features are working as expected');
      console.log('\nYour application is ready for deployment!');
    } else {
      failedSuites.forEach(suite => {
        switch (suite.name) {
          case 'API Tests':
            console.log('• Check that the API server is running: npm start');
            console.log('• Verify API configuration and environment variables');
            console.log('• Check API logs for errors');
            break;
          case 'Database Tests':
            console.log('• Ensure MongoDB is running: docker-compose up -d');
            console.log('• Check database connection string');
            console.log('• Verify database permissions');
            break;
          case 'Service Tests':
            console.log('• Check Redis connection: docker-compose up -d');
            console.log('• Verify LanguageTool API configuration');
            console.log('• Check service dependencies');
            break;
          case 'Feature Tests':
            console.log('• Review feature integration');
            console.log('• Check end-to-end functionality');
            console.log('• Verify user flows');
            break;
        }
      });
    }

    console.log('\nLIENS UTILES:');
    console.log(`• API Health Check: ${this.baseUrl}/api/health`);
    console.log(`• Swagger Documentation: ${this.baseUrl}/api-docs`);
    console.log(`• Database Status: Check MongoDB connection`);
    console.log(`• Cache Status: Check Redis connection`);
  }
}

async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  
  const runner = new ComprehensiveTestRunner(baseUrl, mongoUri);
  
  try {
    await runner.runAllTests();
    
    const failedSuites = runner['results'].filter((r: any) => r.status === 'FAIL').length;
    process.exit(failedSuites > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default ComprehensiveTestRunner;
