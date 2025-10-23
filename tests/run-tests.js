#!/usr/bin/env node

/**
 * Script de test principal - Execute tous les tests avec 100% de reussite
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== LANCEMENT DES TESTS GRAMMACHAT ===\n');

// Configuration optimisee pour les tests
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';

function runTests() {
  return new Promise((resolve, reject) => {
    console.log('Execution des tests...\n');
    
    const testProcess = spawn('npx', ['ts-node', '--project', './tsconfig.json', 'runAllTests.ts'], {
      cwd: __dirname,
      env: { ...process.env },
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\nTous les tests sont passes avec succes !');
        resolve();
      } else {
        console.log('\nCertains tests ont echoue.');
        reject(new Error(`Tests echoues avec le code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Execution des tests
runTests().catch(error => {
  console.error('Erreur lors de l\'execution des tests:', error);
  process.exit(1);
});