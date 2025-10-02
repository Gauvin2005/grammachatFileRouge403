#!/usr/bin/env ts-node

import dotenv from 'dotenv';
// Charger les variables d'environnement
dotenv.config({ path: '../.env' });

// Forcer l'URL Redis pour les tests
process.env.REDIS_URL = 'redis://localhost:6379';

// Créer une nouvelle instance de RedisService avec localhost
import { RedisService } from '../src/services/redisService';
const testRedisService = new RedisService();

async function testRedis() {
  console.log('Test de la configuration Redis...\n');

  try {
    // Connexion à Redis
    console.log('1. Connexion à Redis...');
    await testRedisService.connect();
    
    if (!testRedisService.isRedisConnected()) {
      throw new Error('Redis non connecté');
    }
    console.log('SUCCESS: Redis connecté avec succès\n');

    // Test du cache des sessions
    console.log('2. Test du cache des sessions...');
    const testSession = { userId: 'test123', role: 'user', timestamp: Date.now() };
    await testRedisService.setUserSession('test123', testSession);
    const retrievedSession = await testRedisService.getUserSession('test123');
    
    if (JSON.stringify(retrievedSession) === JSON.stringify(testSession)) {
      console.log('SUCCESS: Cache des sessions fonctionne\n');
    } else {
      throw new Error('Cache des sessions défaillant');
    }

    // Test du cache des messages
    console.log('3. Test du cache des messages...');
    const testMessages = {
      success: true,
      message: 'Test messages',
      data: { messages: [{ id: '1', content: 'Test' }] }
    };
    await testRedisService.setMessagesCache('test:key', testMessages);
    const retrievedMessages = await testRedisService.getMessagesCache('test:key');
    
    if (JSON.stringify(retrievedMessages) === JSON.stringify(testMessages)) {
      console.log('SUCCESS: Cache des messages fonctionne\n');
    } else {
      throw new Error('Cache des messages défaillant');
    }

    // Test du cache du leaderboard
    console.log('4. Test du cache du leaderboard...');
    const testLeaderboard = {
      success: true,
      message: 'Test leaderboard',
      data: { leaderboard: [{ rank: 1, username: 'test', xp: 100 }] }
    };
    await testRedisService.setLeaderboardCache(10, testLeaderboard);
    const retrievedLeaderboard = await testRedisService.getLeaderboardCache(10);
    
    if (JSON.stringify(retrievedLeaderboard) === JSON.stringify(testLeaderboard)) {
      console.log('SUCCESS: Cache du leaderboard fonctionne\n');
    } else {
      throw new Error('Cache du leaderboard défaillant');
    }

    // Test du rate limiting
    console.log('5. Test du rate limiting...');
    const testKey = 'test:rate:limit';
    const count1 = await testRedisService.incrementRateLimit(testKey, 60000);
    const count2 = await testRedisService.incrementRateLimit(testKey, 60000);
    
    if (count1 === 1 && count2 === 2) {
      console.log('SUCCESS: Rate limiting fonctionne\n');
    } else {
      throw new Error('Rate limiting défaillant');
    }

    // Test des statistiques
    console.log('6. Test des statistiques...');
    const stats = await testRedisService.getCacheStats();
    console.log('Statistiques Redis:', stats);
    
    if (stats.connected && stats.keys > 0) {
      console.log('SUCCESS: Statistiques fonctionnent\n');
    } else {
      throw new Error('Statistiques défaillantes');
    }

    // Nettoyage
    console.log('7. Nettoyage des tests...');
    await testRedisService.clearAllCache();
    console.log('SUCCESS: Cache nettoyé\n');

    console.log('SUCCESS: Tous les tests Redis sont passés avec succès !');
    console.log('\nRésumé de la configuration:');
    console.log(`- Sessions TTL: ${process.env.REDIS_SESSION_TTL || '604800'}s (7 jours)`);
    console.log(`- Messages TTL: ${process.env.REDIS_MESSAGES_TTL || '300'}s (5 minutes)`);
    console.log(`- Leaderboard TTL: ${process.env.REDIS_LEADERBOARD_TTL || '600'}s (10 minutes)`);
    console.log(`- Profils TTL: ${process.env.REDIS_PROFILE_TTL || '900'}s (15 minutes)`);
    console.log(`- Stats TTL: ${process.env.REDIS_STATS_TTL || '1800'}s (30 minutes)`);

  } catch (error) {
    console.error('ERROR: Erreur lors du test Redis:', error);
    process.exit(1);
  } finally {
    await testRedisService.disconnect();
    console.log('\nConnexion Redis fermée');
    process.exit(0);
  }
}

// Exécuter les tests
testRedis();
