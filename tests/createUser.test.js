/**
 * Test automatisé pour la création d'utilisateur
 * 
 * Ce test :
 * 1. Lance le serveur backend avec Docker (simule docker-compose up)
 * 2. Utilise Puppeteer pour envoyer une requête POST vers /api/users
 * 3. Vérifie directement en base via le driver officiel MongoDB
 * 4. Contrôle que le document inséré a bien role="user"
 * 5. Loggue "Compte créé et vérifié" si succès, sinon l'erreur
 */

const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');
const path = require('path');

// Configuration des tests
const TEST_CONFIG = {
  // URLs et ports
  API_BASE_URL: 'http://localhost:3000',
  MONGODB_URI: 'mongodb://localhost:27017/grammachat',
  
  // Données de test
  TEST_USER: {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    username: `testuser${Date.now()}`
  },
  
  // Timeouts
  DOCKER_STARTUP_TIMEOUT: 30000, // 30 secondes
  API_REQUEST_TIMEOUT: 10000,   // 10 secondes
  MONGODB_TIMEOUT: 5000         // 5 secondes
};

// Variables globales pour le test
let dockerProcess = null;
let mongoClient = null;
let browser = null;

/**
 * Étape 1 : Lancer le serveur backend avec Docker
 * Simule docker-compose up dans le test
 */
async function startDockerServices() {
  console.log('🐳 Démarrage des services Docker...');
  
  return new Promise((resolve, reject) => {
    // Lancer docker-compose up en arrière-plan
    dockerProcess = spawn('docker-compose', ['up', '--build'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let startupComplete = false;
    const timeout = setTimeout(() => {
      if (!startupComplete) {
        reject(new Error('Timeout: Services Docker n\'ont pas démarré dans les temps'));
      }
    }, TEST_CONFIG.DOCKER_STARTUP_TIMEOUT);

    // Surveiller les logs pour détecter le démarrage
    dockerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📋 Docker stdout:', output.trim());
      
      // Détecter que l'API est prête
      if (output.includes('Server running on port 3000') || 
          output.includes('API server started') ||
          output.includes('Listening on port 3000')) {
        if (!startupComplete) {
          startupComplete = true;
          clearTimeout(timeout);
          console.log('✅ Services Docker démarrés avec succès');
          resolve();
        }
      }
    });

    dockerProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log('⚠️ Docker stderr:', error.trim());
    });

    dockerProcess.on('error', (error) => {
      console.error('❌ Erreur Docker:', error);
      if (!startupComplete) {
        startupComplete = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    dockerProcess.on('exit', (code) => {
      console.log(`🔄 Docker process exited with code ${code}`);
    });
  });
}

/**
 * Étape 2 : Attendre que l'API soit accessible
 */
async function waitForApiAvailability() {
  console.log('⏳ Attente de la disponibilité de l\'API...');
  
  const maxRetries = 30;
  const retryDelay = 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/health`);
      if (response.ok) {
        console.log('✅ API accessible');
        return;
      }
    } catch (error) {
      // API pas encore prête, continuer à attendre
    }
    
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }
  
  throw new Error('API non accessible après plusieurs tentatives');
}

/**
 * Étape 3 : Utiliser Puppeteer pour envoyer une requête POST vers /api/users
 */
async function createUserWithPuppeteer() {
  console.log('🤖 Lancement de Puppeteer...');
  
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  console.log('📤 Envoi de la requête POST vers /api/users...');
  console.log('📋 Données utilisateur:', {
    email: TEST_CONFIG.TEST_USER.email,
    username: TEST_CONFIG.TEST_USER.username,
    password: '[HIDDEN]'
  });
  
  try {
    // Envoyer la requête POST directement via Puppeteer
    const response = await page.evaluate(async (userData, apiUrl) => {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      return {
        status: response.status,
        data: data
      };
    }, TEST_CONFIG.TEST_USER, TEST_CONFIG.API_BASE_URL);
    
    console.log('📥 Réponse reçue:', response);
    
    if (response.status === 201 && response.data.success) {
      console.log('✅ Requête POST réussie');
      return response.data;
    } else {
      throw new Error(`Échec de la requête POST: ${response.status} - ${JSON.stringify(response.data)}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la requête POST:', error);
    throw error;
  }
}

/**
 * Étape 4 : Vérifier directement en base via le driver officiel MongoDB
 */
async function verifyUserInDatabase() {
  console.log('🔍 Connexion à MongoDB...');
  
  try {
    mongoClient = new MongoClient(TEST_CONFIG.MONGODB_URI);
    await mongoClient.connect();
    
    const db = mongoClient.db('grammachat');
    const usersCollection = db.collection('users');
    
    console.log('🔍 Recherche de l\'utilisateur en base...');
    const user = await usersCollection.findOne({ 
      email: TEST_CONFIG.TEST_USER.email 
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé en base de données');
    }
    
    console.log('✅ Utilisateur trouvé en base:', {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      xp: user.xp,
      level: user.level
    });
    
    // Étape 5 : Contrôler que le document inséré a bien role="user"
    if (user.role !== 'user') {
      throw new Error(`Rôle incorrect: attendu 'user', reçu '${user.role}'`);
    }
    
    console.log('✅ Rôle vérifié: role="user"');
    
    return user;
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification en base:', error);
    throw error;
  }
}

/**
 * Nettoyage des ressources
 */
async function cleanup() {
  console.log('🧹 Nettoyage des ressources...');
  
  if (browser) {
    await browser.close();
    console.log('✅ Browser fermé');
  }
  
  if (mongoClient) {
    await mongoClient.close();
    console.log('✅ Connexion MongoDB fermée');
  }
  
  if (dockerProcess) {
    console.log('🛑 Arrêt des services Docker...');
    dockerProcess.kill('SIGTERM');
    
    // Attendre un peu puis forcer l'arrêt si nécessaire
    setTimeout(() => {
      if (dockerProcess && !dockerProcess.killed) {
        dockerProcess.kill('SIGKILL');
      }
    }, 5000);
    
    console.log('✅ Services Docker arrêtés');
  }
}

/**
 * Test principal
 */
async function runTest() {
  console.log('🚀 Début du test automatisé de création d\'utilisateur');
  console.log('📋 Configuration:', TEST_CONFIG);
  
  try {
    // Étape 1 : Lancer le serveur backend avec Docker
    await startDockerServices();
    
    // Attendre un peu pour que les services soient complètement prêts
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Étape 2 : Attendre que l'API soit accessible
    await waitForApiAvailability();
    
    // Étape 3 : Utiliser Puppeteer pour envoyer une requête POST
    const apiResponse = await createUserWithPuppeteer();
    
    // Étape 4 : Vérifier directement en base via MongoDB
    const dbUser = await verifyUserInDatabase();
    
    // Étape 5 : Logguer le succès
    console.log('🎉 COMPTE CRÉÉ ET VÉRIFIÉ');
    console.log('📊 Résumé du test:');
    console.log('  - API Response:', apiResponse.success ? '✅ Succès' : '❌ Échec');
    console.log('  - Database Check:', dbUser ? '✅ Utilisateur trouvé' : '❌ Non trouvé');
    console.log('  - Role Check:', dbUser.role === 'user' ? '✅ Rôle correct' : '❌ Rôle incorrect');
    console.log('  - User ID:', dbUser._id);
    console.log('  - Email:', dbUser.email);
    console.log('  - Username:', dbUser.username);
    console.log('  - Role:', dbUser.role);
    console.log('  - XP:', dbUser.xp);
    console.log('  - Level:', dbUser.level);
    
    return true;
    
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('📋 Détails:', error);
    return false;
  } finally {
    await cleanup();
  }
}

// Exécuter le test si ce fichier est lancé directement
if (require.main === module) {
  runTest()
    .then(success => {
      if (success) {
        console.log('🎉 Test terminé avec succès');
        process.exit(0);
      } else {
        console.log('💥 Test échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runTest, TEST_CONFIG };
