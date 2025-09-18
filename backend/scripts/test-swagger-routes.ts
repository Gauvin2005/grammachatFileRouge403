import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Script de test des routes spécifiques via Swagger UI
 * Teste chaque route individuellement avec des données de test
 */

interface RouteTest {
  endpoint: string;
  method: string;
  body?: any;
  expectedStatus?: number;
  description: string;
  requiresAuth?: boolean;
}

class RouteTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private jwtToken: string | null = null;

  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async initialize(): Promise<void> {
    console.log('🚀 Initialisation de Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    console.log('✅ Puppeteer initialisé');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Puppeteer fermé');
    }
  }

  async authenticate(): Promise<string> {
    console.log('🔐 Authentification...');
    
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`
    };

    // Inscription
    await this.executeRequest('/api/auth/register', 'POST', testUser);
    
    // Connexion
    const loginResult = await this.executeRequest('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResult.success && loginResult.data?.token) {
      this.jwtToken = loginResult.data.token;
      console.log('✅ Authentification réussie');
      return this.jwtToken;
    } else {
      throw new Error('Échec de l\'authentification');
    }
  }

  async executeRequest(endpoint: string, method: string, body?: any): Promise<any> {
    try {
      // Naviguer vers Swagger UI
      await this.page!.goto(`${this.baseUrl}/api-docs/`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });

      // Trouver et cliquer sur l'endpoint
      const selector = `.opblock.opblock-${method.toLowerCase()}[data-path="${endpoint}"]`;
      await this.page!.waitForSelector(selector, { timeout: 5000 });
      await this.page!.click(selector);

      // Attendre que le formulaire soit visible
      await this.page!.waitForSelector('.opblock-body', { timeout: 5000 });

      // Remplir le body si nécessaire
      if (body) {
        const textarea = await this.page!.waitForSelector('textarea', { timeout: 5000 });
        await textarea!.click({ clickCount: 3 });
        await textarea!.type(JSON.stringify(body, null, 2));
      }

      // Ajouter le token JWT si nécessaire
      if (this.jwtToken && this.isProtectedRoute(endpoint)) {
        await this.addJwtToken();
      }

      // Exécuter la requête
      const executeButton = await this.page!.waitForSelector('.btn.execute', { timeout: 5000 });
      await executeButton!.click();

      // Attendre la réponse
      await this.page!.waitForSelector('.responses-wrapper .response', { timeout: 10000 });

      // Extraire les informations de la réponse
      const responseElement = await this.page!.$('.responses-wrapper .response');
      const statusElement = await responseElement!.$('.response-col_status');
      const statusCode = await statusElement!.evaluate(el => el.textContent?.trim());
      
      const responseBodyElement = await responseElement!.$('.response-col_description pre');
      const responseText = await responseBodyElement!.evaluate(el => el.textContent?.trim());
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = responseText;
      }

      return {
        success: parseInt(statusCode || '0') < 400,
        statusCode: parseInt(statusCode || '0'),
        data: responseData
      };

    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de ${method} ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
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

    } catch (error) {
      console.warn('⚠️ Impossible d\'ajouter le token JWT:', error);
    }
  }

  async testAllRoutes(): Promise<void> {
    console.log('🎯 Test de toutes les routes via Swagger UI\n');

    // Authentification
    await this.authenticate();

    // Définition des routes à tester
    const routes: RouteTest[] = [
      // Routes d'authentification
      {
        endpoint: '/api/auth/profile',
        method: 'GET',
        description: 'Récupérer le profil utilisateur',
        requiresAuth: true,
        expectedStatus: 200
      },
      
      // Routes de messages
      {
        endpoint: '/api/messages',
        method: 'POST',
        body: { content: 'Message de test via Swagger UI' },
        description: 'Envoyer un message',
        requiresAuth: true,
        expectedStatus: 201
      },
      {
        endpoint: '/api/messages',
        method: 'GET',
        description: 'Récupérer la liste des messages',
        requiresAuth: true,
        expectedStatus: 200
      },
      
      // Routes d'utilisateurs
      {
        endpoint: '/api/users/leaderboard',
        method: 'GET',
        description: 'Récupérer le classement',
        requiresAuth: false,
        expectedStatus: 200
      },
      
      // Route système
      {
        endpoint: '/api/health',
        method: 'GET',
        description: 'Vérifier l\'état de l\'API',
        requiresAuth: false,
        expectedStatus: 200
      }
    ];

    const results = [];

    // Tester chaque route
    for (const route of routes) {
      console.log(`🧪 Test: ${route.description}`);
      
      const result = await this.executeRequest(route.endpoint, route.method, route.body);
      
      const testResult = {
        route: `${route.method} ${route.endpoint}`,
        description: route.description,
        success: result.success,
        statusCode: result.statusCode,
        expectedStatus: route.expectedStatus,
        passed: result.statusCode === route.expectedStatus,
        error: result.error
      };

      results.push(testResult);

      const status = testResult.passed ? '✅' : '❌';
      console.log(`${status} ${route.method} ${route.endpoint} - ${result.statusCode} (attendu: ${route.expectedStatus})`);
      
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }

      // Pause entre les tests
      await this.page!.waitForTimeout(1000);
    }

    // Afficher les résultats
    this.printResults(results);
  }

  private printResults(results: any[]): void {
    console.log('\n📊 RÉSULTATS DES TESTS DE ROUTES');
    console.log('===================================\n');

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const successRate = (passedCount / totalCount) * 100;

    console.log(`📈 Score global: ${passedCount}/${totalCount} (${successRate.toFixed(1)}%)`);
    console.log(`✅ Tests réussis: ${passedCount}`);
    console.log(`❌ Tests échoués: ${totalCount - passedCount}\n`);

    // Détail des résultats
    results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.route}`);
      console.log(`   ${result.description}`);
      console.log(`   Status: ${result.statusCode} (attendu: ${result.expectedStatus})`);
      
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
      console.log('');
    });

    // Statistiques par méthode HTTP
    const methods = [...new Set(results.map(r => r.route.split(' ')[0]))];
    console.log('📈 Statistiques par méthode HTTP:');
    methods.forEach(method => {
      const methodResults = results.filter(r => r.route.startsWith(method));
      const methodPassed = methodResults.filter(r => r.passed).length;
      const methodRate = (methodPassed / methodResults.length) * 100;
      
      console.log(`   ${method}: ${methodPassed}/${methodResults.length} (${methodRate.toFixed(1)}%)`);
    });

    // Recommandations
    console.log('\n💡 Recommandations:');
    if (passedCount === totalCount) {
      console.log('   🎉 Toutes les routes fonctionnent correctement !');
    } else {
      console.log('   - Vérifier les routes qui ont échoué');
      console.log('   - Contrôler la configuration Swagger');
      console.log('   - Vérifier les middlewares d\'authentification');
    }
  }
}

// Fonction principale
async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const tester = new RouteTester(baseUrl);
  
  try {
    await tester.initialize();
    await tester.testAllRoutes();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt des tests...');
  process.exit(0);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

export default RouteTester;
