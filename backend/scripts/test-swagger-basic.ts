import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Script de test Swagger basique
 * Teste simplement l'accès et la structure de Swagger UI
 */

class BasicSwaggerTester {
  private browser: Browser | null = null;
  private page: Page | null = null;

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

  async testSwaggerAccess(): Promise<boolean> {
    try {
      console.log('📖 Test de l\'accès à Swagger UI...');
      
      // Naviguer vers Swagger UI
      await this.page!.goto(`${this.baseUrl}/api-docs/`, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });

      // Vérifier que Swagger UI est chargé
      await this.page!.waitForSelector('.swagger-ui', { timeout: 10000 });
      console.log('✅ Swagger UI accessible');

      // Vérifier la présence des sections principales
      const sections = await this.page!.$$eval('.opblock-tag', elements => 
        elements.map(el => el.textContent?.trim())
      );
      
      console.log('📋 Sections trouvées:', sections);
      
      // Vérifier qu'on a les sections attendues
      const expectedSections = ['Authentication', 'Messages', 'Users', 'System'];
      const foundSections = expectedSections.filter(section => 
        sections.some(s => s?.includes(section))
      );
      
      console.log(`✅ Sections trouvées: ${foundSections.length}/${expectedSections.length}`);
      
      return foundSections.length >= 2; // Au moins 2 sections sur 4
      
    } catch (error) {
      console.error('❌ Erreur lors du test d\'accès Swagger:', error);
      return false;
    }
  }

  async testEndpointVisibility(): Promise<boolean> {
    try {
      console.log('🔍 Test de la visibilité des endpoints...');
      
      // Vérifier la présence d'endpoints
      const endpoints = await this.page!.$$eval('.opblock', elements => 
        elements.map(el => {
          const method = el.className.match(/opblock-(\w+)/)?.[1];
          const path = el.getAttribute('data-path');
          return { method, path };
        }).filter(e => e.method && e.path)
      );
      
      console.log(`📋 Endpoints trouvés: ${endpoints.length}`);
      
      // Afficher quelques endpoints
      endpoints.slice(0, 5).forEach(endpoint => {
        console.log(`   ${endpoint.method?.toUpperCase()} ${endpoint.path}`);
      });
      
      return endpoints.length >= 5; // Au moins 5 endpoints
      
    } catch (error) {
      console.error('❌ Erreur lors du test de visibilité:', error);
      return false;
    }
  }

  async testSwaggerJSON(): Promise<boolean> {
    try {
      console.log('📄 Test de l\'accès à la spec JSON...');
      
      // Naviguer vers la spec JSON
      await this.page!.goto(`${this.baseUrl}/api-docs.json`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });

      // Vérifier que c'est du JSON valide
      const content = await this.page!.content();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const spec = JSON.parse(jsonMatch[0]);
          console.log(`✅ Spec JSON valide - Version: ${spec.info?.version}`);
          console.log(`   Titre: ${spec.info?.title}`);
          console.log(`   Endpoints: ${Object.keys(spec.paths || {}).length}`);
          return true;
        } catch (parseError) {
          console.error('❌ JSON invalide:', parseError);
          return false;
        }
      } else {
        console.error('❌ Aucun JSON trouvé dans la réponse');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du test JSON:', error);
      return false;
    }
  }

  async testHealthEndpoint(): Promise<boolean> {
    try {
      console.log('🏥 Test de l\'endpoint health...');
      
      // Naviguer vers l'endpoint health directement
      await this.page!.goto(`${this.baseUrl}/api/health`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });

      // Vérifier que c'est du JSON valide
      const content = await this.page!.content();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const health = JSON.parse(jsonMatch[0]);
          console.log(`✅ Health endpoint accessible`);
          console.log(`   Status: ${health.success ? 'OK' : 'ERROR'}`);
          console.log(`   Message: ${health.message}`);
          console.log(`   Environment: ${health.environment}`);
          return health.success === true;
        } catch (parseError) {
          console.error('❌ JSON invalide:', parseError);
          return false;
        }
      } else {
        console.error('❌ Aucun JSON trouvé dans la réponse health');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du test health:', error);
      return false;
    }
  }

  async runBasicTests(): Promise<void> {
    console.log('🎯 Tests basiques de Swagger\n');

    const results = {
      swaggerAccess: false,
      endpointVisibility: false,
      swaggerJSON: false,
      healthEndpoint: false
    };

    try {
      await this.initialize();
      
      results.swaggerAccess = await this.testSwaggerAccess();
      
      if (results.swaggerAccess) {
        results.endpointVisibility = await this.testEndpointVisibility();
      }
      
      results.swaggerJSON = await this.testSwaggerJSON();
      results.healthEndpoint = await this.testHealthEndpoint();

    } catch (error) {
      console.error('💥 Erreur fatale:', error);
    } finally {
      await this.cleanup();
    }

    // Résultats
    console.log('\n📊 RÉSULTATS DES TESTS BASIQUES');
    console.log('==================================\n');
    
    const tests = [
      { name: 'Accès Swagger UI', result: results.swaggerAccess },
      { name: 'Visibilité des endpoints', result: results.endpointVisibility },
      { name: 'Spec JSON accessible', result: results.swaggerJSON },
      { name: 'Endpoint health', result: results.healthEndpoint }
    ];

    tests.forEach(test => {
      const status = test.result ? '✅' : '❌';
      console.log(`${status} ${test.name}`);
    });

    const successCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n📈 Score: ${successCount}/${totalTests} tests réussis`);
    
    if (successCount === totalTests) {
      console.log('🎉 Tous les tests basiques sont passés !');
      console.log('💡 Tu peux maintenant lancer les tests plus avancés :');
      console.log('   npm run test:swagger:routes');
    } else if (successCount >= 2) {
      console.log('✅ Tests basiques majoritairement réussis');
      console.log('💡 Swagger est fonctionnel, vérifie les erreurs restantes');
    } else {
      console.log('⚠️ Problèmes détectés avec Swagger');
      console.log('💡 Vérifie que l\'API est démarrée et accessible');
    }
  }
}

// Fonction principale
async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const tester = new BasicSwaggerTester(baseUrl);
  await tester.runBasicTests();
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

export default BasicSwaggerTester;
