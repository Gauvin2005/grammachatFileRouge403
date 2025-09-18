const puppeteer = require('puppeteer');

async function testReduxState() {
  let browser;
  try {
    console.log('🚀 Test de l\'état Redux...');
    
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
    
    // Remplir le formulaire
    console.log('🔐 Remplissage du formulaire...');
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
      
      console.log('✅ Formulaire rempli');
    }
    
    // Cliquer sur le bouton de connexion
    console.log('🖱️ Clic sur le bouton de connexion...');
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(btn => ({
        text: btn.textContent.trim(),
        type: btn.type,
        className: btn.className
      }));
    });
    
    console.log('🔍 Boutons trouvés:', buttons);
    
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
      console.log('✅ Bouton de connexion trouvé:', loginButton.text);
      await page.evaluate((btnText) => {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.trim() === btnText) {
            btn.click();
            return;
          }
        }
      }, loginButton.text);
      
      console.log('🖱️ Bouton cliqué');
      
      // Attendre et vérifier l'état Redux
      console.log('⏳ Attente de la réponse...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Vérifier l'état Redux directement
      const reduxState = await page.evaluate(() => {
        // Chercher le store Redux dans React
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber) {
          let fiber = reactRoot._reactInternalFiber;
          while (fiber) {
            if (fiber.memoizedState && fiber.memoizedState.auth) {
              return {
                isAuthenticated: fiber.memoizedState.auth.isAuthenticated,
                user: fiber.memoizedState.auth.user,
                error: fiber.memoizedState.auth.error,
                isLoading: fiber.memoizedState.auth.isLoading
              };
            }
            fiber = fiber.child || fiber.sibling;
          }
        }
        
        // Essayer d'accéder au store via les objets globaux
        for (let key in window) {
          if (key.includes('store') || key.includes('redux')) {
            try {
              const store = window[key];
              if (store && store.getState) {
                const state = store.getState();
                return {
                  isAuthenticated: state.auth?.isAuthenticated,
                  user: state.auth?.user,
                  error: state.auth?.error,
                  isLoading: state.auth?.isLoading
                };
              }
            } catch (e) {
              // Ignorer les erreurs
            }
          }
        }
        
        return 'Aucun état Redux accessible';
      });
      
      console.log('🔍 État Redux:', reduxState);
      
      // Vérifier l'URL et le contenu de la page
      const currentUrl = await page.url();
      const pageTitle = await page.title();
      const hasLoginForm = await page.$('input[type="email"]') !== null;
      
      console.log('🔍 État de la page:');
      console.log('  URL:', currentUrl);
      console.log('  Titre:', pageTitle);
      console.log('  Formulaire de connexion présent:', hasLoginForm);
      
    } else {
      console.log('❌ Bouton de connexion non trouvé');
    }
    
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
testReduxState();
