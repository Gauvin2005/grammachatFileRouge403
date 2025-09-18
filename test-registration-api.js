#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Tests de l'API d'inscription
async function testRegistrationAPI() {
  console.log('🧪 Test de l\'API d\'inscription...\n');

  const testUsers = [
    {
      email: 'test1@example.com',
      username: 'testuser1',
      password: 'password123'
    },
    {
      email: 'test2@example.com', 
      username: 'testuser2',
      password: 'password123'
    },
    {
      email: 'admin@grammachat.com',
      username: 'admin',
      password: 'admin123'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`📝 Test inscription: ${user.username} (${user.email})`);
      
      const response = await axios.post(`${API_BASE}/auth/register`, user, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`✅ Succès: ${response.status} - ${response.data.message}`);
      console.log(`   Token: ${response.data.token ? 'Généré' : 'Non généré'}`);
      console.log(`   User ID: ${response.data.user?._id || 'N/A'}\n`);

    } catch (error) {
      if (error.response) {
        console.log(`❌ Erreur ${error.response.status}: ${error.response.data.message || error.response.data.error}`);
        if (error.response.data.errors) {
          error.response.data.errors.forEach(err => {
            console.log(`   - ${err.msg}: ${err.param}`);
          });
        }
      } else {
        console.log(`❌ Erreur réseau: ${error.message}`);
      }
      console.log('');
    }
  }

  // Test de validation
  console.log('🔍 Tests de validation...\n');
  
  const invalidUsers = [
    {
      email: 'invalid-email',
      username: 'test',
      password: '123'
    },
    {
      email: 'test@example.com',
      username: 'a', // trop court
      password: 'password123'
    },
    {
      email: 'test@example.com',
      username: 'testuser1', // déjà utilisé
      password: 'password123'
    }
  ];

  for (const user of invalidUsers) {
    try {
      console.log(`🚫 Test validation: ${user.username} (${user.email})`);
      
      const response = await axios.post(`${API_BASE}/auth/register`, user);
      console.log(`❌ Devrait échouer mais a réussi: ${response.status}\n`);

    } catch (error) {
      if (error.response) {
        console.log(`✅ Validation OK: ${error.response.status} - ${error.response.data.message || error.response.data.error}`);
        if (error.response.data.errors) {
          error.response.data.errors.forEach(err => {
            console.log(`   - ${err.msg}: ${err.param}`);
          });
        }
      }
      console.log('');
    }
  }
}

// Test de connexion
async function testLoginAPI() {
  console.log('🔐 Test de l\'API de connexion...\n');

  const loginTests = [
    {
      email: 'test1@example.com',
      password: 'password123',
      expected: 'success'
    },
    {
      email: 'test1@example.com', 
      password: 'wrongpassword',
      expected: 'failure'
    },
    {
      email: 'nonexistent@example.com',
      password: 'password123',
      expected: 'failure'
    }
  ];

  for (const test of loginTests) {
    try {
      console.log(`🔑 Test connexion: ${test.email}`);
      
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: test.email,
        password: test.password
      });

      if (test.expected === 'success') {
        console.log(`✅ Connexion réussie: ${response.data.message}`);
        console.log(`   Token: ${response.data.token ? 'Généré' : 'Non généré'}`);
        console.log(`   User: ${response.data.user?.username}\n`);
      } else {
        console.log(`❌ Devrait échouer mais a réussi\n`);
      }

    } catch (error) {
      if (test.expected === 'failure') {
        console.log(`✅ Connexion échouée comme attendu: ${error.response?.data?.message || error.message}\n`);
      } else {
        console.log(`❌ Connexion échouée inattendue: ${error.response?.data?.message || error.message}\n`);
      }
    }
  }
}

// Test de l'API health
async function testHealthAPI() {
  try {
    console.log('🏥 Test de l\'API health...');
    const response = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Health OK: ${response.data.message}`);
    console.log(`   Version: ${response.data.version}`);
    console.log(`   Timestamp: ${response.data.timestamp}\n`);
  } catch (error) {
    console.log(`❌ Health échoué: ${error.message}\n`);
  }
}

async function runAllTests() {
  await testHealthAPI();
  await testRegistrationAPI();
  await testLoginAPI();
  
  console.log('🎉 Tests terminés !');
}

runAllTests().catch(console.error);
