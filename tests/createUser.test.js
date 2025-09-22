/**
 * Test automatisé pour la création d'utilisateur
 * 
 * Ce test :
 * 1. Lance le serveur backend avec Docker (simule docker-compose up)
 * 2. Utilise curl pour envoyer une requête POST vers /api/users
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
    username: `test${Date.now().toString().slice(-8)}` // Max 12 caractères
  },
  
  // Timeouts
  DOCKER_STARTUP_TIMEOUT: 30000, // 30 secondes
  API_REQUEST_TIMEOUT: 10000,   // 10 secondes
  MONGODB_TIMEOUT: 5000         // 5 secondes
};

// Variables globales pour le test
let dockerProcess = null;
let mongoClient = null;

/**
 * Étape 1 : Vérifier que les services Docker sont disponibles
 * Utilise les services existants au lieu de les redémarrer
 */
async function startDockerServices() {
  console.log('Vérification des services Docker existants...');
  
  // Vérifier que les containers sont en cours d'exécution
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const { stdout } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}"');
    console.log('Containers en cours d\'exécution:');
    console.log(stdout);
    
    // Vérifier que les containers nécessaires sont présents
    if (stdout.includes('grammachat-api') && stdout.includes('grammachat-mongodb')) {
      console.log('Services Docker déjà en cours d\'exécution');
      return Promise.resolve();
    } else {
      throw new Error('Services Docker requis non trouvés');
    }
  } catch (error) {
    console.log('Erreur lors de la vérification des services:', error.message);
    throw error;
  }
}

/**
 * Étape 2 : Attendre que l'API soit accessible
 */
async function waitForApiAvailability() {
  console.log('Attente de la disponibilité de l\'API...');
  
  const maxRetries = 30;
  const retryDelay = 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/api/health`);
      if (response.ok) {
        console.log('API accessible');
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
 * Étape 3 : Envoyer une requête POST vers /api/users avec curl
 */
async function createUserWithCurl() {
  console.log('Envoi de la requête POST vers /api/users...');
  console.log('Données utilisateur:', {
    email: TEST_CONFIG.TEST_USER.email,
    username: TEST_CONFIG.TEST_USER.username,
    password: '[HIDDEN]'
  });
  
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Préparer les données JSON
    const userData = JSON.stringify(TEST_CONFIG.TEST_USER);
    
    // Envoyer la requête POST avec curl
    const curlCommand = `curl -s -X POST "${TEST_CONFIG.API_BASE_URL}/api/users" -H "Content-Type: application/json" -d '${userData}'`;
    console.log('Commande curl:', curlCommand.replace(TEST_CONFIG.TEST_USER.password, '[HIDDEN]'));
    
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      console.log('Curl stderr:', stderr);
    }
    
    console.log('Réponse brute:', stdout);
    
    // Parser la réponse JSON
    const response = JSON.parse(stdout);
    console.log('Réponse parsée:', response);
    
    if (response.success) {
      console.log('Requête POST réussie');
      return response;
    } else {
      throw new Error(`Échec de la requête POST: ${JSON.stringify(response)}`);
    }
    
  } catch (error) {
    console.error('Erreur lors de la requête POST:', error);
    throw error;
  }
}

/**
 * Étape 4 : Vérifier directement en base via le driver officiel MongoDB
 */
async function verifyUserInDatabase() {
  console.log('Connexion à MongoDB...');
  
  try {
    mongoClient = new MongoClient(TEST_CONFIG.MONGODB_URI);
    await mongoClient.connect();
    
    const db = mongoClient.db('grammachat');
    const usersCollection = db.collection('users');
    
    console.log('Recherche de l\'utilisateur en base...');
    const user = await usersCollection.findOne({ 
      email: TEST_CONFIG.TEST_USER.email 
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé en base de données');
    }
    
    console.log('Utilisateur trouvé en base:', {
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
    
    console.log('Rôle vérifié: role="user"');
    
    return user;
    
  } catch (error) {
    console.error('Erreur lors de la vérification en base:', error);
    throw error;
  }
}

/**
 * Nettoyage des ressources
 */
async function cleanup() {
  console.log('Nettoyage des ressources...');
  
  // Pas de browser à fermer avec curl
  
  if (mongoClient) {
    await mongoClient.close();
    console.log('Connexion MongoDB fermée');
  }
  
  if (dockerProcess) {
    console.log('Arrêt du processus Docker de test...');
    dockerProcess.kill('SIGTERM');
    
    // Attendre un peu puis forcer l'arrêt si nécessaire
    setTimeout(() => {
      if (dockerProcess && !dockerProcess.killed) {
        dockerProcess.kill('SIGKILL');
      }
    }, 5000);
    
    console.log('Processus Docker de test arrêté');
  } else {
    console.log('Aucun processus Docker de test à arrêter (services externes utilisés)');
  }
}

/**
 * Test principal
 */
async function runTest() {
  console.log('Début du test automatisé de création d\'utilisateur');
  console.log('Configuration:', TEST_CONFIG);
  
  try {
    // Étape 1 : Lancer le serveur backend avec Docker
    await startDockerServices();
    
    // Attendre un peu pour que les services soient complètement prêts
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Étape 2 : Attendre que l'API soit accessible
    await waitForApiAvailability();
    
    // Étape 3 : Envoyer une requête POST avec curl
    const apiResponse = await createUserWithCurl();
    
    // Étape 4 : Vérifier directement en base via MongoDB
    const dbUser = await verifyUserInDatabase();
    
    // Étape 5 : Logguer le succès
    console.log('COMPTE CRÉÉ ET VÉRIFIÉ');
    console.log('Résumé du test:');
    console.log('  - API Response:', apiResponse.success ? 'Succès' : 'Échec');
    console.log('  - Database Check:', dbUser ? 'Utilisateur trouvé' : 'Non trouvé');
    console.log('  - Role Check:', dbUser.role === 'user' ? 'Rôle correct' : 'Rôle incorrect');
    console.log('  - User ID:', dbUser._id);
    console.log('  - Email:', dbUser.email);
    console.log('  - Username:', dbUser.username);
    console.log('  - Role:', dbUser.role);
    console.log('  - XP:', dbUser.xp);
    console.log('  - Level:', dbUser.level);
    
    return true;
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error('Détails:', error);
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
        console.log('Test terminé avec succès');
        process.exit(0);
      } else {
        console.log('Test échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runTest, TEST_CONFIG };

