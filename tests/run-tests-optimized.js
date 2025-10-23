#!/usr/bin/env node

/**
 * Script de test optimisé pour Grammachat
 * Évite les timeouts MongoDB et optimise les performances
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage des tests optimisés Grammachat...\n');

// Configuration optimisée pour les tests
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.MONGODB_URI = 'mongodb://localhost:27017/grammachat_test';

// Fonction pour exécuter les tests avec timeout
function runTestWithTimeout(testFile, timeout = 30000) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Exécution: ${testFile}`);
    
    const testProcess = spawn('node', [testFile], {
      cwd: __dirname,
      env: { ...process.env },
      stdio: 'inherit'
    });

    const timeoutId = setTimeout(() => {
      testProcess.kill('SIGTERM');
      reject(new Error(`Test timeout après ${timeout}ms`));
    }, timeout);

    testProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log(`✅ ${testFile} terminé avec succès`);
        resolve();
      } else {
        reject(new Error(`Test échoué avec le code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Tests à exécuter dans l'ordre optimisé
async function runAllTests() {
  const tests = [
    'database/databaseTester.ts',
    'services/serviceTester.ts',
    'features/featureTester.ts'
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTestWithTimeout(test, 45000); // 45s timeout
      passed++;
    } catch (error) {
      console.error(`❌ ${test} échoué:`, error.message);
      failed++;
      
      // Continuer avec les autres tests même si un échoue
      console.log('⏭️  Passage au test suivant...\n');
    }
  }

  console.log('\n📊 RÉSULTATS FINAUX:');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.');
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Démarrer les tests
runAllTests().catch(error => {
  console.error('❌ Erreur lors de l\'exécution des tests:', error);
  process.exit(1);
});
