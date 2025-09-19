#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('🤖 Test de Puppeteer...\n');

  let browser;
  try {
    // Démarrer le navigateur
    browser = await puppeteer.launch({ 
      headless: false, // Garder visible pour debug
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Aller sur une page simple
    console.log('📱 Navigation vers Google...');
    await page.goto('https://www.google.com', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Prendre une capture d'écran
    await page.screenshot({ path: 'google-test.png' });
    console.log('📸 Capture d\'écran sauvegardée: google-test.png');

    // Tester la recherche
    const searchInput = await page.$('input[name="q"]');
    if (searchInput) {
      await searchInput.type('Grammachat test');
      console.log('✅ Recherche tapée');
      
      // Prendre une capture après la recherche
      await page.screenshot({ path: 'google-search.png' });
      console.log('📸 Capture après recherche: google-search.png');
    }

    console.log('✅ Test Puppeteer réussi !');

  } catch (error) {
    console.error('❌ Erreur Puppeteer:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testPuppeteer();
