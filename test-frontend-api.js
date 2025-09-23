const puppeteer = require('puppeteer');

async function testFrontendApi() {
  let browser;
  try {
    console.log('Test de communication frontend-API...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Intercepter les requêtes réseau
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('📤 Requête API:', request.method(), request.url());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('📥 Réponse API:', response.status(), response.url());
        if (response.url().includes('/auth/login')) {
          response.text().then(text => {
            console.log('📄 Contenu de la réponse:', text);
          }).catch(err => {
            console.log('❌ Erreur lecture réponse:', err.message);
          });
        }
      }
    });
    
    // Intercepter les erreurs JavaScript
    page.on('pageerror', error => {
      console.log('❌ Erreur JavaScript:', error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Aller sur l'application
    console.log('Ouverture de http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
    
    // Attendre que l'application se charge
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Remplir le formulaire avec des événements React
    console.log('🔐 Remplissage du formulaire...');
    
    // Trouver les inputs
    const emailInput = await page.$('input[type="email"], input[name="email"], [data-testid="email-input"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"], [data-testid="password-input"]');
    
    if (emailInput && passwordInput) {
      // Méthode React : utiliser focus, puis taper caractère par caractère
      await emailInput.click();
      await emailInput.focus();
      await emailInput.evaluate(el => el.value = '');
      
      // Taper caractère par caractère pour déclencher les événements React
      const email = 'user1@grammachat.com';
      for (let char of email) {
        await emailInput.type(char);
        await new Promise(resolve => setTimeout(resolve, 50)); // Petite pause
      }
      
      await passwordInput.click();
      await passwordInput.focus();
      await passwordInput.evaluate(el => el.value = '');
      
      const password = 'password123';
      for (let char of password) {
        await passwordInput.type(char);
        await new Promise(resolve => setTimeout(resolve, 50)); // Petite pause
      }
      
      // Déclencher les événements de fin
      await emailInput.evaluate(el => {
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      });
      
      await passwordInput.evaluate(el => {
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      });
      
      console.log('✅ Formulaire rempli caractère par caractère');
      
      // Vérifier les valeurs après remplissage
      const valuesAfter = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).map(input => ({
          type: input.type,
          value: input.value
        }));
      });
      console.log('🔍 Valeurs après remplissage:', valuesAfter);
      
    } else {
      console.log('❌ Inputs non trouvés');
    }
    
    // Essayer de soumettre le formulaire directement
    console.log('Tentative de soumission du formulaire...');
    
    // Méthode 1: Soumettre le formulaire directement
    try {
      await page.evaluate(() => {
        const forms = document.querySelectorAll('form');
        console.log('Formulaires trouvés:', forms.length);
        if (forms.length > 0) {
          forms[0].submit();
        }
      });
      console.log('✅ Formulaire soumis directement');
    } catch (error) {
      console.log('❌ Erreur soumission directe:', error.message);
    }
    
    // Méthode 2: Cliquer sur le bouton
    console.log('Clic sur le bouton de connexion...');
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
      console.log('✅ Bouton de connexion trouvé:', loginButton.text);
      
      // Vérifier l'état du bouton
      const buttonState = await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.trim() === btnText) {
            return {
              disabled: btn.disabled,
              className: btn.className,
              innerHTML: btn.innerHTML,
              onclick: btn.onclick ? 'has onclick' : 'no onclick'
            };
          }
        }
        return null;
      }, loginButton.text);
      
      console.log('🔍 État du bouton:', buttonState);
      
      if (buttonState && !buttonState.disabled) {
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
        
        // Attendre un peu et vérifier les valeurs juste après le clic
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const valuesAfterClick = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input');
          return Array.from(inputs).map(input => ({
            type: input.type,
            value: input.value
          }));
        });
        console.log('🔍 Valeurs juste après le clic:', valuesAfterClick);
        
      } else {
        console.log('❌ Bouton désactivé ou problème d\'état');
      }
    } else {
      console.log('❌ Aucun bouton de connexion trouvé');
    }
    
    // Vérifier les erreurs de validation
    console.log('🔍 Vérification des erreurs de validation...');
    const validationErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error"], .error, .text-red, .text-error');
      const errors = [];
      errorElements.forEach(el => {
        if (el.textContent && el.textContent.trim()) {
          errors.push(el.textContent.trim());
        }
      });
      return errors;
    });
    
    if (validationErrors.length > 0) {
      console.log('❌ Erreurs de validation trouvées:', validationErrors);
    } else {
      console.log('✅ Aucune erreur de validation visible');
    }
    
    // Vérifier l'état des inputs
    const inputStates = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        type: input.type,
        value: input.value,
        required: input.required,
        valid: input.validity.valid,
        validationMessage: input.validationMessage
      }));
    });
    
    console.log('🔍 État des inputs:', inputStates);
    
    // Tester l'API directement depuis le navigateur
    console.log('Test de l\'API depuis le navigateur...');
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'user1@grammachat.com',
            password: 'password123'
          })
        });
        
        const data = await response.json();
        return {
          success: true,
          status: response.status,
          data: data
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('🔍 Test API navigateur:', apiTest);
    
    // Attendre les requêtes réseau
    console.log('⏳ Attente des requêtes réseau...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Exécuter le test
testFrontendApi();
