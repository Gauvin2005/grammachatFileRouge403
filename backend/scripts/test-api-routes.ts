import axios, { AxiosResponse } from 'axios';

/**
 * Script de test des routes API via HTTP direct
 * Teste toutes les routes de l'API sans passer par Swagger UI
 */

interface TestResult {
  route: string;
  method: string;
  status: 'success' | 'error' | 'skipped';
  statusCode?: number;
  responseTime: number;
  error?: string;
  response?: any;
}

interface TestConfig {
  baseUrl: string;
  timeout: number;
}

class APIRouteTester {
  private jwtToken: string | null = null;
  private testUser: { email: string; password: string; username: string } = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    username: `test${Date.now().toString().slice(-6)}`
  };
  private results: TestResult[] = [];

  constructor(private config: TestConfig) {}

  async authenticate(): Promise<void> {
    console.log('Authentification...');
    
    try {
      // Test d'inscription
      const registerResult = await this.testRoute('/api/auth/register', 'POST', {
        email: this.testUser.email,
        password: this.testUser.password,
        username: this.testUser.username
      });

      if (registerResult.status !== 'success') {
        console.log('Détails de l\'erreur d\'inscription:', registerResult.response);
        throw new Error(`Échec de l'inscription: ${registerResult.response?.message || 'Erreur inconnue'}`);
      }

      // Test de connexion
      const loginResult = await this.testRoute('/api/auth/login', 'POST', {
        email: this.testUser.email,
        password: this.testUser.password
      });

      if (loginResult.status === 'success' && loginResult.response?.data?.token) {
        this.jwtToken = loginResult.response.data.token;
        console.log('Authentification réussie');
      } else {
        console.log('Détails de l\'erreur de connexion:', loginResult.response);
        throw new Error(`Échec de la connexion: ${loginResult.response?.message || 'Token manquant'}`);
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      throw error;
    }
  }

  async testRoute(endpoint: string, method: string, body?: any, headers?: any): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${this.config.baseUrl}${endpoint}`;
    
    console.log(`Test ${method} ${endpoint}`);
    
    try {
      const config = {
        method: method.toLowerCase() as any,
        url,
        data: body,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: this.config.timeout,
        validateStatus: () => true // Accepter tous les codes de statut
      };

      const response: AxiosResponse = await axios(config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result: TestResult = {
        route: endpoint,
        method,
        status: response.status < 400 ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        response: response.data
      };

      const status = result.status === 'success' ? 'SUCCÈS:' : 'ERREUR:';
      console.log(`${status} ${method} ${endpoint} - ${response.status} (${responseTime}ms)`);
      
      return result;

    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result: TestResult = {
        route: endpoint,
        method,
        status: 'error',
        responseTime,
        error: error.message || String(error)
      };

      console.log(`${method} ${endpoint} - Erreur: ${result.error}`);
      return result;
    }
  }

  async testAllRoutes(): Promise<void> {
    console.log('Test de toutes les routes API\n');

    // Authentification
    await this.authenticate();

    // Liste des routes à tester
    const routes = [
      // Routes d'authentification
      { endpoint: '/api/auth/profile', method: 'GET', requiresAuth: true },
      
      // Routes de messages
      { 
        endpoint: '/api/messages', 
        method: 'POST', 
        body: { content: 'Message de test via API directe' },
        requiresAuth: true 
      },
      { endpoint: '/api/messages', method: 'GET', requiresAuth: true },
      
      // Routes d'utilisateurs
      { endpoint: '/api/users/leaderboard', method: 'GET', requiresAuth: false },
      
      // Route système
      { endpoint: '/api/health', method: 'GET', requiresAuth: false }
    ];

    // Tests des routes
    for (const route of routes) {
      const headers = route.requiresAuth && this.jwtToken 
        ? { 'Authorization': `Bearer ${this.jwtToken}` }
        : {};
      
      const result = await this.testRoute(route.endpoint, route.method, route.body, headers);
      this.results.push(result);
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Tests d'erreurs
    await this.testErrorCases();

    this.printResults();
  }

  async testErrorCases(): Promise<void> {
    console.log('\n Tests des cas d\'erreur...');

    // Test avec token invalide
    const invalidTokenResult = await this.testRoute('/api/auth/profile', 'GET', undefined, {
      'Authorization': 'Bearer invalid-token'
    });
    this.results.push({
      ...invalidTokenResult,
      route: '/api/auth/profile (token invalide)'
    });

    // Test avec données invalides
    const invalidDataResult = await this.testRoute('/api/auth/login', 'POST', {
      email: 'invalid-email',
      password: '123'
    });
    this.results.push({
      ...invalidDataResult,
      route: '/api/auth/login (données invalides)'
    });

    // Test route inexistante
    const notFoundResult = await this.testRoute('/api/inexistant', 'GET');
    this.results.push({
      ...notFoundResult,
      route: '/api/inexistant (route inexistante)'
    });
  }

  private printResults(): void {
    console.log('\nRÉSULTATS DES TESTS API');
    console.log('============================\n');

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const totalTime = this.results.reduce((sum, r) => sum + r.responseTime, 0);

    console.log(`Tests réussis: ${successCount}`);
    console.log(`Tests échoués: ${errorCount}`);
    console.log(`Temps total: ${totalTime}ms`);
    console.log(`Temps moyen: ${Math.round(totalTime / this.results.length)}ms\n`);

    // Détail des résultats
    this.results.forEach((result, index) => {
      const status = result.status === 'success' ? 'SUCCÈS:' : 'ERREUR:';
      const statusCode = result.statusCode ? ` (${result.statusCode})` : '';
      console.log(`${index + 1}. ${status} ${result.method} ${result.route}${statusCode} - ${result.responseTime}ms`);
      
      if (result.error) {
        console.log(`   Erreur: ${result.error}`);
      }
    });

    // Statistiques par méthode HTTP
    const methods = [...new Set(this.results.map(r => r.method))];
    console.log('\nStatistiques par méthode HTTP:');
    methods.forEach(method => {
      const methodResults = this.results.filter(r => r.method === method);
      const successRate = (methodResults.filter(r => r.status === 'success').length / methodResults.length) * 100;
      const avgTime = methodResults.reduce((sum, r) => sum + r.responseTime, 0) / methodResults.length;
      
      console.log(`   ${method}: ${successRate.toFixed(1)}% succès, ${Math.round(avgTime)}ms moyen`);
    });

    // Statistiques par code de statut
    const statusCodes = [...new Set(this.results.map(r => r.statusCode).filter(Boolean))];
    console.log('\nCodes de statut rencontrés:');
    statusCodes.forEach(code => {
      const count = this.results.filter(r => r.statusCode === code).length;
      console.log(`   ${code}: ${count} fois`);
    });

    // Recommandations
    console.log('\nRecommandations:');
    if (errorCount > 0) {
      console.log('   - Vérifier les routes qui ont échoué');
      console.log('   - Contrôler la configuration de l\'API');
    }
    if (totalTime > 10000) {
      console.log('   - Les tests sont lents, considérer l\'optimisation');
    }
    if (successCount === this.results.length) {
      console.log('   - Tous les tests sont passés avec succès !');
    }

    // Test de Swagger
    console.log('\nTest de Swagger:');
    console.log(`   Swagger UI: ${this.config.baseUrl}/api-docs`);
    console.log(`   Spec JSON: ${this.config.baseUrl}/api-docs.json`);
  }
}

// Configuration
const config: TestConfig = {
  baseUrl: process.env.API_URL || 'http://localhost:3000',
  timeout: 10000
};

// Fonction principale
async function main(): Promise<void> {
  const tester = new APIRouteTester(config);
  
  try {
    await tester.testAllRoutes();
  } catch (error) {
    console.error('Erreur fatale:', error);
    process.exit(1);
  }
}

// Gestion des signaux
process.on('SIGINT', async () => {
  console.log('\nArrêt des tests...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nArrêt des tests...');
  process.exit(0);
});

// Lancement
if (require.main === module) {
  main().catch(console.error);
}

export default APIRouteTester;
