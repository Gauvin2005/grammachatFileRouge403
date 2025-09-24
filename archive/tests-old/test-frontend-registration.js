#!/usr/bin/env node

const puppeteer = require('puppeteer');
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const FRONTEND_URL = 'http://localhost:19006'; // URL Expo web

async function testFrontendRegistration() {
  console.log('Test de l\'inscription frontend avec Puppeteer...\n');

  let browser;
  try {
    // Démarrer le navigateur
    browser = await puppeteer.launch({ 
      headless: false, // Garder visible pour debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Aller sur la page d'inscription
    console.log('Navigation vers la page d\'inscription...');
    await page.goto(`${FRONTEND_URL}/register`, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Attendre que la page se charge
    await page.waitForTimeout(2000);

    // Prendre une capture d'écran
    await page.screenshot({ path: 'registration-page.png' });
    console.log('Capture d\'écran sauvegardée: registration-page.png');

    // Chercher les éléments du formulaire
    console.log('Recherche des éléments du formulaire...');
    
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const usernameInput = await page.$('input[name="username"], input[placeholder*="username" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitButton = await page.$('button[type="submit"], button:contains("Inscription"), button:contains("Register")');

    if (!emailInput || !usernameInput || !passwordInput || !submitButton) {
      console.log('Éléments du formulaire non trouvés');
      console.log('   Email input:', !!emailInput);
      console.log('   Username input:', !!usernameInput);
      console.log('   Password input:', !!passwordInput);
      console.log('   Submit button:', !!submitButton);
      
      // Lister tous les inputs disponibles
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id
        }))
      );
      console.log('Inputs disponibles:', allInputs);
      
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(button => ({
          text: button.textContent,
          type: button.type,
          className: button.className
        }))
      );
      console.log('Boutons disponibles:', allButtons);
      
      return;
    }

    console.log('Éléments du formulaire trouvés');

    // Remplir le formulaire
    const testUser = {
      email: `test-frontend-${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: 'password123'
    };

    console.log(`Remplissage du formulaire avec: ${testUser.username} (${testUser.email})`);

    await emailInput.type(testUser.email);
    await usernameInput.type(testUser.username);
    await passwordInput.type(testUser.password);

    // Prendre une capture avant soumission
    await page.screenshot({ path: 'form-filled.png' });
    console.log('Formulaire rempli sauvegardé: form-filled.png');

    // Soumettre le formulaire
    console.log('Soumission du formulaire...');
    await submitButton.click();

    // Attendre la réponse
    await page.waitForTimeout(3000);

    // Prendre une capture après soumission
    await page.screenshot({ path: 'after-submit.png' });
    console.log('Après soumission sauvegardé: after-submit.png');

    // Vérifier si l'inscription a réussi
    const currentUrl = page.url();
    console.log(`📍 URL actuelle: ${currentUrl}`);

    // Chercher des messages de succès ou d'erreur
    const successMessage = await page.$('text/succès, text/success, text/inscription réussie');
    const errorMessage = await page.$('text/erreur, text/error, text/échec');

    if (successMessage) {
      console.log('Message de succès détecté');
    } else if (errorMessage) {
      console.log('Message d\'erreur détecté');
    } else {
      console.log('Aucun message de succès/erreur détecté');
    }

    // Vérifier via l'API si l'utilisateur a été créé
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('Utilisateur créé avec succès (vérifié via API)');
      console.log(`   Token: ${response.data.token ? 'Généré' : 'Non généré'}`);
    } catch (error) {
      console.log('Utilisateur non créé (vérifié via API)');
      console.log(`   Erreur: ${error.response?.data?.message || error.message}`);
    }

  } catch (error) {
    console.error('Erreur lors du test frontend:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test de validation frontend
async function testFrontendValidation() {
  console.log('\nTest de validation frontend...\n');

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Test avec email invalide
    console.log('Test avec email invalide...');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const usernameInput = await page.$('input[name="username"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (emailInput && usernameInput && passwordInput && submitButton) {
      await emailInput.type('email-invalide');
      await usernameInput.type('testuser');
      await passwordInput.type('password123');
      
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Vérifier si une erreur de validation apparaît
      const validationError = await page.$('text/email invalide, text/invalid email');
      if (validationError) {
        console.log('Validation email détectée');
      } else {
        console.log('Validation email non détectée');
      }
      
      await page.screenshot({ path: 'validation-test.png' });
    }

  } catch (error) {
    console.error('Erreur validation frontend:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function runFrontendTests() {
  await testFrontendRegistration();
  await testFrontendValidation();
  console.log('\nTests frontend terminés !');
}

runFrontendTests().catch(console.error);
