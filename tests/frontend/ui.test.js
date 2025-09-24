#!/usr/bin/env node

/**
 * Tests Frontend - Interface utilisateur avec Puppeteer
 * Teste l'interface utilisateur et les interactions frontend
 */

const puppeteer = require('puppeteer');
const { TestUtils } = require('../utils/testUtils');

class FrontendTests {
  constructor() {
    this.utils = new TestUtils();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.browser = null;
    this.page = null;
    this.testUser = null;
  }

  async runAllTests() {
    console.log('Démarrage des tests Frontend\n');
    
    try {
      await this.utils.connectDB();
      await this.setupBrowser();
      
      const tests = [
        { name: 'Test chargement page de connexion', fn: this.testLoginPageLoad.bind(this) },
        { name: 'Test formulaire de connexion', fn: this.testLoginForm.bind(this) },
        { name: 'Test page d\'inscription', fn: this.testRegistrationPage.bind(this) },
        { name: 'Test navigation après connexion', fn: this.testPostLoginNavigation.bind(this) },
        { name: 'Test interface de chat', fn: this.testChatInterface.bind(this) },
        { name: 'Test communication API', fn: this.testApiCommunication.bind(this) },
        { name: 'Test responsive design', fn: this.testResponsiveDesign.bind(this) }
      ];

      for (const test of tests) {
        await this.runTest(test.name, test.fn);
      }

      this.printResults();
      
    } catch (error) {
      console.error('[ERROR] Erreur lors des tests:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async setupBrowser() {
    this.browser = await puppeteer.launch({
      headless: false, // Mode visible pour debug
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Intercepter les requêtes réseau pour debug
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`Requête Requête API: ${request.method()} ${request.url()}`);
      }
    });

    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`Réponse Réponse API: ${response.status()} ${response.url()}`);
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.testUser) {
      await this.utils.deleteTestUser(this.testUser.email);
    }
    await this.utils.disconnectDB();
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    console.log(`\nTest: ${testName}...`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      console.log(`[SUCCESS] ${testName} - RÉUSSI`);
    } catch (error) {
      this.testResults.failed++;
      console.log(`[ERROR] ${testName} - ÉCHOUÉ: ${error.message}`);
    }
  }

  async testLoginPageLoad() {
    // Aller sur la page de connexion
    await this.page.goto(`${this.utils.config.API_BASE_URL}/login`);
    
    // Attendre que la page se charge
    await this.page.waitForSelector('form', { timeout: 10000 });
    
    // Vérifier la présence des éléments essentiels
    const emailInput = await this.page.$('input[type="email"]');
    const passwordInput = await this.page.$('input[type="password"]');
    const submitButton = await this.page.$('button[type="submit"]');
    
    if (!emailInput) {
      throw new Error('Champ email non trouvé');
    }
    
    if (!passwordInput) {
      throw new Error('Champ mot de passe non trouvé');
    }
    
    if (!submitButton) {
      throw new Error('Bouton de soumission non trouvé');
    }
  }

  async testLoginForm() {
    // Créer un utilisateur de test
    this.testUser = await this.utils.createTestUser();
    
    // Aller sur la page de connexion
    await this.page.goto(`${this.utils.config.API_BASE_URL}/login`);
    
    // Remplir le formulaire
    await this.page.type('input[type="email"]', this.testUser.email);
    await this.page.type('input[type="password"]', 'TestPassword123!');
    
    // Soumettre le formulaire
    await this.page.click('button[type="submit"]');
    
    // Attendre la redirection ou un message de succès
    await this.page.waitForNavigation({ timeout: 10000 });
    
    // Vérifier qu'on est connecté (URL changée ou élément spécifique)
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Redirection après connexion échouée');
    }
  }

  async testRegistrationPage() {
    // Aller sur la page d'inscription
    await this.page.goto(`${this.utils.config.API_BASE_URL}/register`);
    
    // Attendre que la page se charge
    await this.page.waitForSelector('form', { timeout: 10000 });
    
    // Vérifier la présence des champs d'inscription
    const emailInput = await this.page.$('input[type="email"]');
    const usernameInput = await this.page.$('input[name="username"]');
    const passwordInput = await this.page.$('input[type="password"]');
    const confirmPasswordInput = await this.page.$('input[name="confirmPassword"]');
    
    if (!emailInput) {
      throw new Error('Champ email d\'inscription non trouvé');
    }
    
    if (!usernameInput) {
      throw new Error('Champ username non trouvé');
    }
    
    if (!passwordInput) {
      throw new Error('Champ mot de passe d\'inscription non trouvé');
    }
    
    if (!confirmPasswordInput) {
      throw new Error('Champ confirmation mot de passe non trouvé');
    }
  }

  async testPostLoginNavigation() {
    // S'assurer qu'on est connecté
    if (!this.testUser) {
      this.testUser = await this.utils.createTestUser();
      await this.page.goto(`${this.utils.config.API_BASE_URL}/login`);
      await this.page.type('input[type="email"]', this.testUser.email);
      await this.page.type('input[type="password"]', 'TestPassword123!');
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ timeout: 10000 });
    }
    
    // Vérifier la présence des éléments de navigation
    const navigation = await this.page.$('nav');
    if (!navigation) {
      throw new Error('Navigation principale non trouvée');
    }
    
    // Vérifier les liens de navigation
    const chatLink = await this.page.$('a[href*="chat"]');
    const profileLink = await this.page.$('a[href*="profile"]');
    const leaderboardLink = await this.page.$('a[href*="leaderboard"]');
    
    if (!chatLink) {
      throw new Error('Lien vers le chat non trouvé');
    }
    
    if (!profileLink) {
      throw new Error('Lien vers le profil non trouvé');
    }
    
    if (!leaderboardLink) {
      throw new Error('Lien vers le classement non trouvé');
    }
  }

  async testChatInterface() {
    // Aller sur la page de chat
    await this.page.goto(`${this.utils.config.API_BASE_URL}/chat`);
    
    // Attendre que l'interface de chat se charge
    await this.page.waitForSelector('[data-testid="chat-interface"]', { timeout: 10000 });
    
    // Vérifier la présence des éléments de chat
    const messageInput = await this.page.$('input[placeholder*="message"]');
    const sendButton = await this.page.$('button[type="submit"]');
    const messagesContainer = await this.page.$('[data-testid="messages-container"]');
    
    if (!messageInput) {
      throw new Error('Champ de saisie de message non trouvé');
    }
    
    if (!sendButton) {
      throw new Error('Bouton d\'envoi de message non trouvé');
    }
    
    if (!messagesContainer) {
      throw new Error('Conteneur des messages non trouvé');
    }
  }

  async testApiCommunication() {
    // Intercepter les requêtes API
    const apiRequests = [];
    this.page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Effectuer une action qui déclenche une requête API
    await this.page.goto(`${this.utils.config.API_BASE_URL}/chat`);
    
    // Attendre qu'une requête API soit faite
    await this.page.waitForFunction(() => {
      return window.fetch && window.fetch.toString().includes('api');
    }, { timeout: 10000 });
    
    // Vérifier qu'au moins une requête API a été faite
    if (apiRequests.length === 0) {
      throw new Error('Aucune requête API détectée');
    }
    
    console.log(`Réponse ${apiRequests.length} requête(s) API détectée(s)`);
  }

  async testResponsiveDesign() {
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1280, height: 720, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewport(viewport);
      await this.page.goto(`${this.utils.config.API_BASE_URL}/login`);
      
      // Vérifier que les éléments sont visibles
      const emailInput = await this.page.$('input[type="email"]');
      const passwordInput = await this.page.$('input[type="password"]');
      
      if (!emailInput || !passwordInput) {
        throw new Error(`Éléments non visibles sur ${viewport.name} (${viewport.width}x${viewport.height})`);
      }
      
      // Vérifier que les éléments ne débordent pas
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      
      if (emailBox.x < 0 || emailBox.x + emailBox.width > viewport.width) {
        throw new Error(`Champ email déborde sur ${viewport.name}`);
      }
      
      if (passwordBox.x < 0 || passwordBox.x + passwordBox.width > viewport.width) {
        throw new Error(`Champ mot de passe déborde sur ${viewport.name}`);
      }
    }
  }

  printResults() {
    console.log('\nRésultats des tests Frontend:');
    console.log(`[SUCCESS] Réussis: ${this.testResults.passed}`);
    console.log(`[ERROR] Échoués: ${this.testResults.failed}`);
    console.log(`[INFO] Total: ${this.testResults.total}`);
    console.log(`[INFO] Taux de réussite: ${Math.round((this.testResults.passed / this.testResults.total) * 100)}%`);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  const tests = new FrontendTests();
  tests.runAllTests().catch(console.error);
}

module.exports = FrontendTests;
