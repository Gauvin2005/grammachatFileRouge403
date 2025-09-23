import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Script de test Swagger simplifié
 * Teste rapidement les fonctionnalités principales de Swagger UI
 */

class SimpleSwaggerTester {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async initialize(): Promise<void> {
    console.log('Initialisation de Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    console.log('Puppeteer initialisé');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('Puppeteer fermé');
    }
  }

  async testSwaggerUI(): Promise<boolean> {
    try {
      console.log('Test de l\'accès à Swagger UI...');
      
      // Naviguer vers Swagger UI
      await this.page!.goto(`${this.baseUrl}/api-docs/`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });

      // Vérifier que Swagger UI est chargé
      await this.page!.waitForSelector('.swagger-ui', { timeout: 5000 });
      console.log('Swagger UI accessible');

      // Vérifier la présence des sections principales
      const sections = await this.page!.$$eval('.opblock-tag', elements => 
        elements.map(el => el.textContent?.trim())
      );
      
      console.log('Sections trouvées:', sections);
      
      // Vérifier qu'on a les sections attendues
      const expectedSections = ['Authentication', 'Messages', 'Users', 'System'];
      const foundSections = expectedSections.filter(section => 
        sections.some(s => s?.includes(section))
      );
      
      console.log(`Sections trouvées: ${foundSections.length}/${expectedSections.length}`);
      
      return foundSections.length >= 3; // Au moins 3 sections sur 4
      
    } catch (error) {
      console.error('Erreur lors du test Swagger UI:', error);
      return false;
    }
  }

  async testAuthenticationFlow(): Promise<boolean> {
    try {
      console.log('Test du flux d\'authentification...');
      
      // Naviguer vers Swagger UI si pas déjà fait
      if (!this.page!.url().includes('/api-docs')) {
        await this.page!.goto(`${this.baseUrl}/api-docs/`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
      }

      // Trouver et cliquer sur l'endpoint POST /api/auth/register
      const registerSelector = '.opblock.opblock-post[data-path="/api/auth/register"]';
      await this.page!.waitForSelector(registerSelector, { timeout: 10000 });
      await this.page!.click(registerSelector);

      // Attendre que le formulaire soit visible
      await this.page!.waitForSelector('.opblock-body', { timeout: 5000 });

      // Remplir le formulaire d'inscription
      const testData = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        username: `testuser${Date.now()}`
      };

      const bodyTextarea = await this.page!.waitForSelector('textarea', { timeout: 5000 });
      await bodyTextarea!.click({ clickCount: 3 });
      await bodyTextarea!.type(JSON.stringify(testData, null, 2));

      // Exécuter la requête
      const executeButton = await this.page!.waitForSelector('.btn.execute', { timeout: 5000 });
      await executeButton!.click();

      // Attendre la réponse
      await this.page!.waitForSelector('.responses-wrapper .response', { timeout: 10000 });

      // Vérifier que la réponse est un succès (201)
      const statusElement = await this.page!.$('.response-col_status');
      const statusCode = await statusElement!.evaluate(el => el.textContent?.trim());
      
      console.log(`Inscription testée - Status: ${statusCode}`);
      
      // Maintenant tester la connexion
      const loginSelector = '.opblock.opblock-post[data-path="/api/auth/login"]';
      await this.page!.click(loginSelector);
      
      await this.page!.waitForSelector('.opblock-body', { timeout: 5000 });
      
      const loginData = {
        email: testData.email,
        password: testData.password
      };

      const loginTextarea = await this.page!.waitForSelector('textarea', { timeout: 5000 });
      await loginTextarea!.click({ clickCount: 3 });
      await loginTextarea!.type(JSON.stringify(loginData, null, 2));

      const loginExecuteButton = await this.page!.waitForSelector('.btn.execute', { timeout: 5000 });
      await loginExecuteButton!.click();

      await this.page!.waitForSelector('.responses-wrapper .response', { timeout: 10000 });

      const loginStatusElement = await this.page!.$('.response-col_status');
      const loginStatusCode = await loginStatusElement!.evaluate(el => el.textContent?.trim());
      
      console.log(`Connexion testée - Status: ${loginStatusCode}`);
      
      return statusCode === '201' && loginStatusCode === '200';
      
    } catch (error) {
      console.error('Erreur lors du test d\'authentification:', error);
      return false;
    }
  }

  async testProtectedRoute(): Promise<boolean> {
    try {
      console.log('Test d\'une route protégée...');
      
      // Trouver et cliquer sur l'endpoint GET /api/auth/profile
      const profileSelector = '.opblock.opblock-get[data-path="/api/auth/profile"]';
      await this.page!.waitForSelector(profileSelector, { timeout: 5000 });
      await this.page!.click(profileSelector);

      await this.page!.waitForSelector('.opblock-body', { timeout: 5000 });

      // Essayer d'exécuter sans token (doit échouer)
      const executeButton = await this.page!.waitForSelector('.btn.execute', { timeout: 5000 });
      await executeButton!.click();

      await this.page!.waitForSelector('.responses-wrapper .response', { timeout: 10000 });

      const statusElement = await this.page!.$('.response-col_status');
      const statusCode = await statusElement!.evaluate(el => el.textContent?.trim());
      
      console.log(`Route protégée testée - Status: ${statusCode} (attendu: 401)`);
      
      return statusCode === '401'; // Doit retourner 401 sans token
      
    } catch (error) {
      console.error('Erreur lors du test de route protégée:', error);
      return false;
    }
  }

  async runQuickTests(): Promise<void> {
    console.log('Tests rapides de Swagger UI\n');

    const results = {
      swaggerUI: false,
      authentication: false,
      protectedRoute: false
    };

    try {
      await this.initialize();
      
      results.swaggerUI = await this.testSwaggerUI();
      results.authentication = await this.testAuthenticationFlow();
      results.protectedRoute = await this.testProtectedRoute();

    } catch (error) {
      console.error('Erreur fatale:', error);
    } finally {
      await this.cleanup();
    }

    // Résultats
    console.log('\nRÉSULTATS DES TESTS RAPIDES');
    console.log('==================================\n');
    
    const tests = [
      { name: 'Accès Swagger UI', result: results.swaggerUI },
      { name: 'Flux d\'authentification', result: results.authentication },
      { name: 'Route protégée', result: results.protectedRoute }
    ];

    tests.forEach(test => {
      const status = test.result ? 'SUCCÈS:' : 'ERREUR:';
      console.log(`${status} ${test.name}`);
    });

    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\nScore: ${successCount}/${totalTests} tests réussis`);
    
    if (successCount === totalTests) {
      console.log('SUCCÈS: Tous les tests sont passés !');
    } else {
      console.log('ATTENTION: Certains tests ont échoué, vérifiez la configuration.');
    }
  }
}

// Fonction principale
async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const tester = new SimpleSwaggerTester(baseUrl);
  await tester.runQuickTests();
}

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\nArrêt des tests...');
  process.exit(0);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

export default SimpleSwaggerTester;
