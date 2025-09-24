const puppeteer = require('puppeteer');

async function testFrontendBackend() {
  let browser;
  try {
    console.log('Test de communication frontend-backend...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Intercepter les requêtes réseau
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers()
        });
        console.log('Requête API:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          status: response.status(),
          url: response.url(),
          headers: response.headers()
        });
        console.log('Réponse API:', response.status(), response.url());
        
        if (response.url().includes('/auth/login')) {
          response.text().then(text => {
            console.log('Contenu réponse login:', text);
          }).catch(err => {
            console.log('Erreur lecture réponse:', err.message);
          });
        }
      }
    });
    
    // Intercepter les erreurs JavaScript
    page.on('pageerror', error => {
      console.log('Erreur JavaScript:', error.message);
    });
    
    // Aller sur l'application
    console.log('Ouverture de http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
    
    // Attendre que l'application se charge
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Remplir le formulaire
    console.log('Remplissage du formulaire...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      await emailInput.click();
      await emailInput.focus();
      await emailInput.evaluate(el => el.value = '');
      
      const email = 'user1@grammachat.com';
      for (let char of email) {
        await emailInput.type(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      await passwordInput.click();
      await passwordInput.focus();
      await passwordInput.evaluate(el => el.value = '');
      
      const password = 'password123';
      for (let char of password) {
        await passwordInput.type(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('Formulaire rempli');
    }
    
    // Cliquer sur le bouton de connexion
    console.log('Clic sur le bouton de connexion...');
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type
      }));
    });
    
    let loginButton = null;
    for (const btn of buttons) {
      if (btn.text.toLowerCase().includes('connexion') || 
          btn.text.toLowerCase().includes('connecter') ||
          btn.text.toLowerCase().includes('login')) {
        loginButton = btn;
        break;
      }
    }
    
    if (loginButton) {
      console.log('Bouton de connexion trouvé:', loginButton.text);
      await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.trim() === btnText) {
            btn.click();
            return;
          }
        }
      }, loginButton.text);
      
      console.log('Bouton cliqué');
      
      // Attendre les requêtes réseau
      console.log('Attente des requêtes réseau...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Résumé des requêtes
      console.log('\nRÉSUMÉ DES REQUÊTES:');
      console.log('Requêtes API:', requests.length);
      console.log('Réponses API:', responses.length);
      
      if (requests.length === 0) {
        console.log('PROBLÈME: Aucune requête API envoyée !');
      } else {
        console.log('Des requêtes API ont été envoyées');
      }
      
    } else {
      console.log('Bouton de connexion non trouvé');
    }
    
    console.log('Test terminé !');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter le test
testFrontendBackend();
