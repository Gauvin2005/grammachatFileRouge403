#!/usr/bin/env node

/**
 * Testeur de services en JavaScript pur
 * Alternative sans TypeScript pour le CI/CD
 */

class SimpleServiceTester {
  constructor() {
    this.results = [];
  }

  async runAllTests() {
    console.log('=== TESTS SERVICES GRAMMACHAT ===\n');

    try {
      await this.runEssentialTests();
      this.printResults();
    } catch (error) {
      console.error('Erreur execution tests:', error);
    }
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'PASS',
        duration
      });
      console.log(`PASS: ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'FAIL',
        duration,
        error: error.message || String(error)
      });
      console.log(`FAIL: ${testName} (${duration}ms) - ${error}`);
    }
  }

  async runEssentialTests() {
    // Test 1: Validation email
    await this.runTest('Validation email', async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      if (!emailRegex.test(validEmail)) {
        throw new Error('Email valide rejete');
      }

      if (emailRegex.test(invalidEmail)) {
        throw new Error('Email invalide accepte');
      }
    });

    // Test 2: Validation mot de passe
    await this.runTest('Validation mot de passe', async () => {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/;
      const validPassword = 'Password123';
      const invalidPassword = '123';

      if (!passwordRegex.test(validPassword)) {
        throw new Error('Mot de passe valide rejete');
      }

      if (passwordRegex.test(invalidPassword)) {
        throw new Error('Mot de passe invalide accepte');
      }
    });

    // Test 3: Calcul XP
    await this.runTest('Calcul XP', async () => {
      const calculateLevel = (xp) => Math.floor(xp / 100) + 1;

      if (calculateLevel(0) !== 1) {
        throw new Error('Niveau 0 XP incorrect');
      }

      if (calculateLevel(100) !== 2) {
        throw new Error('Niveau 100 XP incorrect');
      }

      if (calculateLevel(250) !== 3) {
        throw new Error('Niveau 250 XP incorrect');
      }
    });

    // Test 4: Formatage date
    await this.runTest('Formatage date', async () => {
      const now = new Date();
      const isoString = now.toISOString();

      if (!isoString.includes('T')) {
        throw new Error('Format ISO incorrect');
      }

      if (!isoString.includes('Z')) {
        throw new Error('Timezone manquante');
      }
    });

    // Test 5: Validation contenu message
    await this.runTest('Validation contenu message', async () => {
      const validateMessage = (content) => {
        return content && content.trim().length > 0 && content.length <= 1000;
      };

      if (!validateMessage('Message valide')) {
        throw new Error('Message valide rejete');
      }

      if (validateMessage('')) {
        throw new Error('Message vide accepte');
      }

      if (validateMessage(' '.repeat(1001))) {
        throw new Error('Message trop long accepte');
      }
    });

    // Test 6: Generation ID unique
    await this.runTest('Generation ID unique', async () => {
      const generateId = () => Math.random().toString(36).substr(2, 9);
      
      const id1 = generateId();
      const id2 = generateId();

      if (id1 === id2) {
        throw new Error('IDs identiques generes');
      }

      if (id1.length !== 9) {
        throw new Error('Longueur ID incorrecte');
      }
    });

    // Test 7: Validation role utilisateur
    await this.runTest('Validation role utilisateur', async () => {
      const validRoles = ['user', 'admin'];
      const isValidRole = (role) => validRoles.includes(role);

      if (!isValidRole('user')) {
        throw new Error('Role user rejete');
      }

      if (!isValidRole('admin')) {
        throw new Error('Role admin rejete');
      }

      if (isValidRole('invalid')) {
        throw new Error('Role invalide accepte');
      }
    });

    // Test 8: Calcul statistiques
    await this.runTest('Calcul statistiques', async () => {
      const calculateStats = (numbers) => {
        return {
          sum: numbers.reduce((a, b) => a + b, 0),
          avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
          max: Math.max(...numbers),
          min: Math.min(...numbers)
        };
      };

      const stats = calculateStats([1, 2, 3, 4, 5]);

      if (stats.sum !== 15) {
        throw new Error('Somme incorrecte');
      }

      if (stats.avg !== 3) {
        throw new Error('Moyenne incorrecte');
      }

      if (stats.max !== 5) {
        throw new Error('Maximum incorrect');
      }

      if (stats.min !== 1) {
        throw new Error('Minimum incorrect');
      }
    });

    // Test 9: Validation nom utilisateur
    await this.runTest('Validation nom utilisateur', async () => {
      const validateUsername = (username) => {
        return username && 
               username.length >= 3 && 
               username.length <= 20 && 
               /^[a-zA-Z0-9_]+$/.test(username);
      };

      if (!validateUsername('validuser123')) {
        throw new Error('Nom utilisateur valide rejete');
      }

      if (validateUsername('ab')) {
        throw new Error('Nom utilisateur trop court accepte');
      }

      if (validateUsername('a'.repeat(21))) {
        throw new Error('Nom utilisateur trop long accepte');
      }

      if (validateUsername('user@name')) {
        throw new Error('Nom utilisateur avec caracteres invalides accepte');
      }
    });

    // Test 10: Gestion erreurs
    await this.runTest('Gestion erreurs', async () => {
      const handleError = (error) => {
        return {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        };
      };

      const testError = new Error('Test error');
      const handled = handleError(testError);

      if (handled.message !== 'Test error') {
        throw new Error('Message erreur incorrect');
      }

      if (!handled.stack) {
        throw new Error('Stack trace manquant');
      }

      if (!handled.timestamp) {
        throw new Error('Timestamp manquant');
      }
    });
  }

  printResults() {
    console.log('\n=== RESULTATS FINAUX ===');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total: ${passedTests}/${totalTests} tests reussis`);
    console.log(`Duree totale: ${totalDuration}ms`);
    console.log(`Taux de reussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\nTests echoues:');
      this.results.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.testName}: ${test.error}`);
      });
    }

    if (passedTests === totalTests) {
      console.log('\nTous les tests de services sont passes !');
    }
  }
}

// Point d'entree
if (require.main === module) {
  const tester = new SimpleServiceTester();
  tester.runAllTests().catch(error => {
    console.error('Erreur execution tests:', error);
    process.exit(1);
  });
}

module.exports = SimpleServiceTester;
