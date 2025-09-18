const puppeteer = require('puppeteer');

async function testFormValidation() {
  let browser;
  try {
    console.log('🚀 Test de validation du formulaire...');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Intercepter tous les logs de console
    page.on('console', msg => {
      console.log(`📱 Console [${msg.type()}]:`, msg.text());
    });
    
    // Intercepter les erreurs JavaScript
    page.on('pageerror', error => {
      console.log('❌ Erreur JavaScript:', error.message);
    });
    
    // Aller sur l'application
    console.log('📱 Ouverture de http://localhost:8082...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle0' });
    
    // Attendre que l'application se charge
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Vérifier l'état initial du formulaire
    console.log('🔍 Vérification de l\'état initial du formulaire...');
    const initialFormState = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        type: input.type,
        value: input.value,
        required: input.required,
        valid: input.validity.valid,
        validationMessage: input.validationMessage,
        name: input.name,
        id: input.id
      }));
    });
    console.log('📋 État initial des inputs:', initialFormState);
    
    // Remplir le formulaire avec des événements React appropriés
    console.log('🔐 Remplissage du formulaire...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (emailInput && passwordInput) {
      // Méthode 1: Utiliser les événements React
      await emailInput.click();
      await emailInput.focus();
      
      // Méthode React Hook Form: utiliser onChangeText
      const email = 'user1@grammachat.com';
      const password = 'password123';
      
      // Déclencher onChangeText pour l'email
      await emailInput.evaluate((el, value) => {
        el.value = value;
        // Déclencher l'événement onChangeText de React Native
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', { value: el, enumerable: true });
        el.dispatchEvent(event);
      }, email);
      
      await passwordInput.click();
      await passwordInput.focus();
      
      // Déclencher onChangeText pour le mot de passe
      await passwordInput.evaluate((el, value) => {
        el.value = value;
        // Déclencher l'événement onChangeText de React Native
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', { value: el, enumerable: true });
        el.dispatchEvent(event);
      }, password);
      
      console.log('✅ Formulaire rempli');
    }
    
    // Vérifier l'état après remplissage
    console.log('🔍 Vérification de l\'état après remplissage...');
    const filledFormState = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        type: input.type,
        value: input.value,
        required: input.required,
        valid: input.validity.valid,
        validationMessage: input.validationMessage
      }));
    });
    console.log('📋 État après remplissage:', filledFormState);
    
    // Vérifier les erreurs de validation
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
    
    // Vérifier l'état du bouton
    console.log('🔍 Vérification de l\'état du bouton...');
    const buttonState = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const loginButton = Array.from(buttons).find(btn => 
        btn.textContent && btn.textContent.includes('Se connecter')
      );
      
      if (loginButton) {
        return {
          text: loginButton.textContent.trim(),
          disabled: loginButton.disabled,
          className: loginButton.className,
          onclick: loginButton.onclick ? 'has onclick' : 'no onclick'
        };
      }
      return null;
    });
    
    console.log('🔘 État du bouton:', buttonState);
    
    // Essayer de déclencher la soumission du formulaire manuellement
    console.log('🖱️ Tentative de soumission manuelle du formulaire...');
    
    // Méthode 1: Cliquer sur le bouton
    if (buttonState && !buttonState.disabled) {
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const loginButton = Array.from(buttons).find(btn => 
          btn.textContent && btn.textContent.includes('Se connecter')
        );
        if (loginButton) {
          loginButton.click();
        }
      });
      console.log('🖱️ Bouton cliqué');
    }
    
    // Attendre un peu pour voir si quelque chose se passe
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Vérifier l'état final
    const finalFormState = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        type: input.type,
        value: input.value
      }));
    });
    console.log('📋 État final des inputs:', finalFormState);
    
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
testFormValidation();
