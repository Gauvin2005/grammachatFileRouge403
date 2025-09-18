import APIRouteTester from './test-api-routes';
import BasicSwaggerTester from './test-swagger-basic';

/**
 * Script de test complet
 * Lance tous les tests disponibles
 */

class AllTestsRunner {
  private results: { [key: string]: boolean } = {};

  constructor(private baseUrl: string = 'http://localhost:3000') {}

  async runAllTests(): Promise<void> {
    console.log('🎯 TESTS COMPLETS DE L\'API GRAMMACHAT');
    console.log('=====================================\n');

    // Test API directs
    console.log('\n🧪 Tests API directs');
    console.log('='.repeat(50));
    try {
      const apiTester = new APIRouteTester({ baseUrl: this.baseUrl, timeout: 10000 });
      await apiTester.testAllRoutes();
      this.results['API directs'] = true;
    } catch (error) {
      console.error('❌ Erreur dans les tests API:', error);
      this.results['API directs'] = false;
    }

    // Test Swagger basiques
    console.log('\n🧪 Tests Swagger basiques');
    console.log('='.repeat(50));
    try {
      const swaggerTester = new BasicSwaggerTester(this.baseUrl);
      await swaggerTester.runBasicTests();
      this.results['Swagger basiques'] = true;
    } catch (error) {
      console.error('❌ Erreur dans les tests Swagger:', error);
      this.results['Swagger basiques'] = false;
    }

    // Résultats finaux
    this.printFinalResults();
  }

  private printFinalResults(): void {
    console.log('\n🏆 RÉSULTATS FINAUX');
    console.log('===================\n');

    const testNames = Object.keys(this.results);
    const successCount = Object.values(this.results).filter(Boolean).length;
    const totalTests = testNames.length;

    testNames.forEach(testName => {
      const status = this.results[testName] ? '✅' : '❌';
      console.log(`${status} ${testName}`);
    });

    console.log(`\n📈 Score global: ${successCount}/${totalTests} suites de tests réussies`);
    
    const successRate = (successCount / totalTests) * 100;
    console.log(`📊 Taux de réussite: ${successRate.toFixed(1)}%`);

    if (successRate === 100) {
      console.log('\n🎉 FÉLICITATIONS !');
      console.log('Tous les tests sont passés avec succès !');
      console.log('Ton API Grammachat est parfaitement fonctionnelle.');
    } else if (successRate >= 75) {
      console.log('\n✅ EXCELLENT !');
      console.log('La plupart des tests sont passés.');
      console.log('Ton API fonctionne bien avec quelques ajustements mineurs.');
    } else if (successRate >= 50) {
      console.log('\n⚠️ ATTENTION');
      console.log('Plusieurs tests ont échoué.');
      console.log('Vérifie la configuration et les erreurs signalées.');
    } else {
      console.log('\n❌ PROBLÈMES DÉTECTÉS');
      console.log('La majorité des tests ont échoué.');
      console.log('Vérifie que l\'API est correctement démarrée et configurée.');
    }

    // Recommandations spécifiques
    console.log('\n💡 RECOMMANDATIONS:');
    
    if (!this.results['API directs']) {
      console.log('   - Vérifie que l\'API est démarrée: docker-compose up -d');
      console.log('   - Contrôle les logs: docker-compose logs api');
      console.log('   - Teste manuellement: curl http://localhost:3000/api/health');
    }
    
    if (!this.results['Swagger basiques']) {
      console.log('   - Vérifie l\'accès à Swagger: http://localhost:3000/api-docs');
      console.log('   - Contrôle la spec JSON: http://localhost:3000/api-docs.json');
      console.log('   - Vérifie la configuration Swagger dans le code');
    }

    if (successRate === 100) {
      console.log('   - 🚀 Ton API est prête pour la production !');
      console.log('   - 📚 La documentation Swagger est complète');
      console.log('   - 🧪 Les tests automatisés fonctionnent parfaitement');
    }

    // Liens utiles
    console.log('\n🔗 LIENS UTILES:');
    console.log(`   - Swagger UI: ${this.baseUrl}/api-docs`);
    console.log(`   - Spec JSON: ${this.baseUrl}/api-docs.json`);
    console.log(`   - Health Check: ${this.baseUrl}/api/health`);
    console.log(`   - Logs Docker: docker-compose logs api`);
  }
}

// Fonction principale
async function main(): Promise<void> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  const runner = new AllTestsRunner(baseUrl);
  
  try {
    await runner.runAllTests();
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
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

export default AllTestsRunner;
