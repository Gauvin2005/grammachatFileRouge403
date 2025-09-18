import puppeteer, { Browser, Page } from 'puppeteer';
import { performance } from 'perf_hooks';

interface TestResult {
  route: string;
  method: string;
  status: 'success' | 'error' | 'skipped';
  responseTime: number;
  statusCode?: number;
  error?: string;
  response?: any;
}

interface TestConfig {
  baseUrl: string;
  swaggerUrl: string;
  timeout: number;
  headless: boolean;
}

class SwaggerTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private results: TestResult[] = [];
  private jwtToken: string | null = null;
  private testUser: { email: string; password: string; username: string } = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    username: `testuser${Date.now()}`
  };

  constructor(private config: TestConfig) {}

  async initialize(): Promise<void> {
    console.log('🚀 Initialisation de Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Configuration de la page
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36');
    
    console.log('✅ Puppeteer initialisé');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Puppeteer fermé');
    }
  }

  async navigateToSwagger(): Promise<void> {
    console.log(`📖 Navigation vers Swagger UI: ${this.config.swaggerUrl}`);
    await this.page!.goto(this.config.swaggerUrl, { 
      waitUntil: 'networkidle2',
      timeout: this.config.timeout 
    });
    
    // Attendre que Swagger UI soit chargé
    await this.page!.waitForSelector('.swagger-ui', { timeout: 10000 });
    console.log('✅ Swagger UI chargé');
  }

  async authenticate(): Promise<void> {
    console.log('🔐 Test de l\'authentification...');
    
    try {
      // Test d'inscription
      await this.testRoute('/api/auth/register', 'POST', {
        email: this.testUser.email,
        password: this.testUser.password,
        username: this.testUser.username
      });

      // Test de connexion
      const loginResult = await this.testRoute('/api/auth/login', 'POST', {
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (loginResult.status === 'success' && loginResult.response?.token) {
        this.jwtToken = loginResult.response.token;
        console.log('✅ Authentification réussie, token JWT obtenu');
      } else {
        throw new Error('Échec de l\'authentification');
      }
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error);
      throw error;
    }
  }

  async testRoute(endpoint: string, method: string, body?: any): Promise<TestResult> {
    const startTime = performance.now();
    const route = `${this.config.baseUrl}${endpoint}`;
    
    console.log(`🧪 Test ${method} ${endpoint}`);
    
    try {
      // Naviguer vers Swagger UI si nécessaire
      if (!this.page!.url().includes('/api-docs')) {
        await this.navigateToSwagger();
      }

      // Trouver et cliquer sur l'endpoint dans Swagger UI
      const endpointSelector = this.getEndpointSelector(endpoint, method);
      await this.page!.waitForSelector(endpointSelector, { timeout: 5000 });
      await this.page!.click(endpointSelector);

      // Attendre que le formulaire soit visible
      await this.page!.waitForSelector('.opblock-body', { timeout: 5000 });

      // Remplir le body si nécessaire
      if (body) {
        const bodyTextarea = await this.page!.waitForSelector('textarea', { timeout: 5000 });
        await bodyTextarea!.click({ clickCount: 3 });
        await bodyTextarea!.type(JSON.stringify(body, null, 2));
      }

      // Ajouter le token JWT si nécessaire
      if (this.jwtToken && this.isProtectedRoute(endpoint)) {
        await this.addJwtToken();
      }

      // Cliquer sur "Execute"
      const executeButton = await this.page!.waitForSelector('.btn.execute', { timeout: 5000 });
      await executeButton!.click();

      // Attendre la réponse
      await this.page!.waitForSelector('.responses-wrapper .response', { timeout: 10000 });

      // Extraire les informations de la réponse
      const responseElement = await this.page!.$('.responses-wrapper .response');
      const statusCodeElement = await responseElement!.$('.response-col_status');
      const statusCode = await statusElement!.evaluate(el => el.textContent?.trim());
      
      const responseBodyElement = await responseElement!.$('.response-col_description pre');
      const responseText = await responseBodyElement!.evaluate(el => el.textContent?.trim());
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      let response;
      try {
        response = responseText ? JSON.parse(responseText) : null;
      } catch {
        response = responseText;
      }

      const result: TestResult = {
        route: endpoint,
        method,
        status: 'success',
        responseTime,
        statusCode: parseInt(statusCode || '0'),
        response
      };

      console.log(`✅ ${method} ${endpoint} - ${statusCode} (${responseTime.toFixed(2)}ms)`);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result: TestResult = {
        route: endpoint,
        method,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      };

      console.log(`❌ ${method} ${endpoint} - Erreur: ${result.error}`);
      return result;
    }
  }

  private getEndpointSelector(endpoint: string, method: string): string {
    // Convertir l'endpoint en sélecteur Swagger UI
    const path = endpoint.replace(/\/api\//, '').replace(/\//g, '-').replace(/:/g, '');
    const methodClass = method.toLowerCase();
    return `.opblock.opblock-${methodClass}[data-path="${endpoint}"]`;
  }

  private isProtectedRoute(endpoint: string): boolean {
    const protectedRoutes = [
      '/api/auth/profile',
      '/api/auth/create-admin',
      '/api/messages',
      '/api/users'
    ];
    return protectedRoutes.some(route => endpoint.startsWith(route));
  }

  private async addJwtToken(): Promise<void> {
    try {
      // Cliquer sur le bouton "Authorize"
      const authorizeButton = await this.page!.waitForSelector('.auth-btn-wrapper .btn-done', { timeout: 5000 });
      await authorizeButton!.click();

      // Attendre la modal d'autorisation
      await this.page!.waitForSelector('.auth-container', { timeout: 5000 });

      // Remplir le champ Bearer token
      const tokenInput = await this.page!.waitForSelector('input[placeholder*="Bearer"]', { timeout: 5000 });
      await tokenInput!.click({ clickCount: 3 });
      await tokenInput!.type(this.jwtToken!);

      // Cliquer sur "Authorize"
      const authorizeSubmitButton = await this.page!.waitForSelector('.auth-btn-wrapper .btn-done', { timeout: 5000 });
      await authorizeSubmitButton!.click();

      // Fermer la modal
      const closeButton = await this.page!.waitForSelector('.auth-btn-wrapper .btn-done', { timeout: 5000 });
      await closeButton!.click();

      console.log('🔑 Token JWT ajouté à Swagger UI');
    } catch (error) {
      console.warn('⚠️ Impossible d\'ajouter le token JWT:', error);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🎯 Démarrage des tests Swagger...\n');

    // Tests d'authentification
    await this.authenticate();

    // Liste des routes à tester
    const routes = [
      // Routes d'authentification
      { endpoint: '/api/auth/profile', method: 'GET' },
      
      // Routes de messages
      { endpoint: '/api/messages', method: 'POST', body: { content: 'Test message via Swagger UI' } },
      { endpoint: '/api/messages', method: 'GET' },
      
      // Routes d'utilisateurs
      { endpoint: '/api/users/leaderboard', method: 'GET' },
      
      // Route système
      { endpoint: '/api/health', method: 'GET' }
    ];

    // Tests des routes
    for (const route of routes) {
      const result = await this.testRoute(route.endpoint, route.method, route.body);
      this.results.push(result);
      
      // Petite pause entre les tests
      await this.page!.waitForTimeout(1000);
    }

    // Tests d'erreurs
    await this.testErrorCases();

    this.printResults();
  }

  async testErrorCases(): Promise<void> {
    console.log('\n🔍 Tests des cas d\'erreur...');

    // Test avec token invalide
    const originalToken = this.jwtToken;
    this.jwtToken = 'invalid-token';
    
    const invalidTokenResult = await this.testRoute('/api/auth/profile', 'GET');
    this.results.push({
      ...invalidTokenResult,
      route: '/api/auth/profile (token invalide)'
    });

    // Restaurer le token valide
    this.jwtToken = originalToken;

    // Test avec données invalides
    const invalidDataResult = await this.testRoute('/api/auth/login', 'POST', {
      email: 'invalid-email',
      password: '123'
    });
    this.results.push({
      ...invalidDataResult,
      route: '/api/auth/login (données invalides)'
    });
  }

  private printResults(): void {
    console.log('\n📊 RÉSULTATS DES TESTS SWAGGER');
    console.log('=====================================\n');

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.responseTime, 0);

    console.log(`✅ Tests réussis: ${successCount}`);
    console.log(`❌ Tests échoués: ${errorCount}`);
    console.log(`⏱️ Temps total: ${totalTime.toFixed(2)}ms`);
    console.log(`📈 Temps moyen: ${(totalTime / this.results.length).toFixed(2)}ms\n`);

    // Détail des résultats
    this.results.forEach((result, index) => {
      const status = result.status === 'success' ? '✅' : '❌';
      const statusCode = result.statusCode ? ` (${result.statusCode})` : '';
      console.log(`${index + 1}. ${status} ${result.method} ${result.route}${statusCode} - ${result.responseTime.toFixed(2)}ms`);
      
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
    });

    // Statistiques par méthode HTTP
    const methods = [...new Set(this.results.map(r => r.method))];
    console.log('\n📈 Statistiques par méthode HTTP:');
    methods.forEach(method => {
      const methodResults = this.results.filter(r => r.method === method);
      const successRate = (methodResults.filter(r => r.status === 'success').length / methodResults.length) * 100;
      const avgTime = methodResults.reduce((sum, r) => sum + r.responseTime, 0) / methodResults.length;
      
      console.log(`   ${method}: ${successRate.toFixed(1)}% succès, ${avgTime.toFixed(2)}ms moyen`);
    });

    // Recommandations
    console.log('\n💡 Recommandations:');
    if (errorCount > 0) {
      console.log('   - Vérifier les routes qui ont échoué');
      console.log('   - Contrôler la configuration Swagger');
    }
    if (totalTime > 30000) {
      console.log('   - Les tests sont lents, considérer l\'optimisation');
    }
    if (successCount === this.results.length) {
      console.log('   - 🎉 Tous les tests sont passés avec succès !');
    }
  }
}

// Configuration
const config: TestConfig = {
  baseUrl: 'http://localhost:3000',
  swaggerUrl: 'http://localhost:3000/api-docs/',
  timeout: 30000,
  headless: process.env.HEADLESS !== 'false' // Par défaut en mode headless
};

// Fonction principale
async function main(): Promise<void> {
  const tester = new SwaggerTester(config);
  
  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Gestion des signaux
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt des tests...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt des tests...');
  process.exit(0);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

export default SwaggerTester;
