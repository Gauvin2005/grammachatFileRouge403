const puppeteer = require('puppeteer');

async function testWebLogin() {
  let browser;
  try {
    console.log('🚀 Démarrage des tests web...');
    
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: false, // Afficher la fenêtre pour voir ce qui se passe
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Aller sur l'application
    console.log('📱 Ouverture de http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
    
    // Attendre que l'application se charge
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Prendre une capture d'écran de la page d'accueil
    await page.screenshot({ path: 'test-homepage.png' });
    console.log('📸 Capture d\'écran de la page d\'accueil sauvegardée');
    
    // Chercher le formulaire de connexion
    console.log('🔍 Recherche du formulaire de connexion...');
    
    // Attendre que les éléments de connexion apparaissent
    try {
      await page.waitForSelector('input[type="email"], input[name="email"], [data-testid="email-input"]', { timeout: 10000 });
      console.log('✅ Formulaire de connexion trouvé');
    } catch (error) {
      console.log('❌ Formulaire de connexion non trouvé');
      console.log('📄 Contenu de la page:', await page.content());
      return;
    }
    
    // Tester la connexion avec user1
    console.log('🔐 Test de connexion avec user1@grammachat.com...');
    
    // Remplir le formulaire
    await page.type('input[type="email"], input[name="email"], [data-testid="email-input"]', 'user1@grammachat.com');
    await page.type('input[type="password"], input[name="password"], [data-testid="password-input"]', 'password123');
    
    // Prendre une capture avant la soumission
    await page.screenshot({ path: 'test-login-form.png' });
    console.log('📸 Formulaire rempli, capture d\'écran sauvegardée');
    
    // Inspecter les boutons disponibles
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type,
        className: btn.className,
        id: btn.id,
        'data-testid': btn.getAttribute('data-testid')
      }));
    });
    console.log('🔍 Boutons trouvés:', buttons);
    
    // Essayer de trouver le bon bouton
    let loginButton = null;
    for (const btn of buttons) {
      if (btn.text.toLowerCase().includes('connexion') || 
          btn.text.toLowerCase().includes('connecter') ||
          btn.text.toLowerCase().includes('login') ||
          btn.type === 'submit' ||
          btn['data-testid'] === 'login-button') {
        loginButton = btn;
        break;
      }
    }
    
    if (loginButton) {
      console.log('✅ Bouton de connexion trouvé:', loginButton);
      // Cliquer sur le bouton trouvé
      await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.trim() === btnText) {
            btn.click();
            return;
          }
        }
      }, loginButton.text);
    } else {
      console.log('❌ Aucun bouton de connexion trouvé');
      return;
    }
    
    // Attendre la réponse
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Prendre une capture après la tentative de connexion
    await page.screenshot({ path: 'test-after-login.png' });
    console.log('📸 Capture d\'écran après connexion sauvegardée');
    
    // Vérifier si la connexion a réussi
    const currentUrl = page.url();
    console.log('🌐 URL actuelle:', currentUrl);
    
    // Chercher des messages d'erreur
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      // Chercher différents types de messages d'erreur
      const errorSelectors = [
        '.error', '.alert-danger', '[data-testid="error"]',
        '.text-red-500', '.text-error', '.error-message'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.textContent.trim()) {
            errors.push(el.textContent.trim());
          }
        });
      });
      
      return errors;
    });
    
    if (errorMessages.length > 0) {
      console.log('❌ Erreurs détectées:', errorMessages);
    } else {
      console.log('✅ Aucune erreur visible détectée');
    }
    
    // Vérifier si on est connecté (chercher des éléments qui n'apparaissent que quand connecté)
    const isLoggedIn = await page.evaluate(() => {
      // Chercher des éléments qui indiquent une connexion réussie
      const successSelectors = [
        '[data-testid="logout"]',
        '.user-menu',
        '.profile-button',
        'button[data-testid="logout"]',
        '[data-testid="profile"]',
        '[data-testid="chat"]'
      ];
      
      // Chercher par texte pour les éléments qui ne peuvent pas être sélectionnés par CSS
      const textIndicators = ['Déconnexion', 'Logout', 'Profil', 'Chat', 'Dashboard', 'Accueil'];
      
      const hasSelectorMatch = successSelectors.some(selector => {
        try {
          return document.querySelector(selector) !== null;
        } catch {
          return false;
        }
      });
      
      const hasTextMatch = textIndicators.some(text => {
        const elements = document.querySelectorAll('*');
        for (let el of elements) {
          if (el.textContent && el.textContent.includes(text)) {
            return true;
          }
        }
        return false;
      });
      
      // Vérifier si l'URL a changé (redirection après connexion)
      const currentUrl = window.location.href;
      const hasUrlChanged = !currentUrl.includes('login') && !currentUrl.includes('auth');
      
      // Vérifier si des éléments de connexion ont disparu
      const loginElements = document.querySelectorAll('input[type="email"], input[type="password"]');
      const loginButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent && btn.textContent.includes('Se connecter')
      );
      const loginElementsGone = loginElements.length === 0 && loginButtons.length === 0;
      
      return hasSelectorMatch || hasTextMatch || (hasUrlChanged && loginElementsGone);
    });
    
    // Debug détaillé
    const debugInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const allTexts = Array.from(elements).map(el => el.textContent).filter(text => text && text.trim());
      const uniqueTexts = [...new Set(allTexts)].slice(0, 20); // Limiter à 20 pour éviter le spam
      
      return {
        url: window.location.href,
        title: document.title,
        hasLoginForm: document.querySelectorAll('input[type="email"], input[type="password"]').length > 0,
        hasLoginButton: Array.from(document.querySelectorAll('button')).some(btn => 
          btn.textContent && btn.textContent.includes('Se connecter')
        ),
        sampleTexts: uniqueTexts,
        bodyClasses: document.body.className,
        bodyId: document.body.id
      };
    });
    
    console.log('🔍 Debug après connexion:');
    console.log('  URL:', debugInfo.url);
    console.log('  Titre:', debugInfo.title);
    console.log('  Formulaire de connexion présent:', debugInfo.hasLoginForm);
    console.log('  Bouton de connexion présent:', debugInfo.hasLoginButton);
    console.log('  Classes du body:', debugInfo.bodyClasses);
    console.log('  ID du body:', debugInfo.bodyId);
    console.log('  Échantillon de textes:', debugInfo.sampleTexts.slice(0, 10));
    
    if (isLoggedIn) {
      console.log('🎉 Connexion réussie !');
    } else {
      console.log('❌ Connexion échouée ou page non chargée');
    }
    
    // Tester avec un autre compte
    console.log('🔐 Test avec admin@grammachat.com...');
    
    // Effacer et remplir avec admin
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = document.querySelector('input[type="password"], input[name="password"], [data-testid="password-input"]');
      
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('input[type="email"], input[name="email"], [data-testid="email-input"]', 'admin@grammachat.com');
    await page.type('input[type="password"], input[name="password"], [data-testid="password-input"]', 'admin123');
    
    // Trouver et cliquer sur le bouton de connexion pour admin
    const adminButtons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type,
        className: btn.className,
        id: btn.id,
        'data-testid': btn.getAttribute('data-testid')
      }));
    });
    
    let adminLoginButton = null;
    for (const btn of adminButtons) {
      if (btn.text.toLowerCase().includes('connexion') || 
          btn.text.toLowerCase().includes('connecter') ||
          btn.text.toLowerCase().includes('login') ||
          btn.type === 'submit' ||
          btn['data-testid'] === 'login-button') {
        adminLoginButton = btn;
        break;
      }
    }
    
    if (adminLoginButton) {
      await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.trim() === btnText) {
            btn.click();
            return;
          }
        }
      }, adminLoginButton.text);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.screenshot({ path: 'test-admin-login.png' });
    console.log('📸 Test admin terminé, capture d\'écran sauvegardée');
    
    console.log('✅ Tests terminés !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    
    // Nettoyer les captures d'écran
    console.log('🧹 Nettoyage des captures d\'écran...');
    const fs = require('fs');
    const screenshots = [
      'test-homepage.png',
      'test-login-form.png', 
      'test-after-login.png',
      'test-admin-login.png'
    ];
    
    screenshots.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`🗑️ Supprimé: ${file}`);
        }
      } catch (error) {
        console.log(`⚠️ Impossible de supprimer ${file}:`, error.message);
      }
    });
  }
}

// Exécuter les tests
testWebLogin();
