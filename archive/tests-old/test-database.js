#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Connexion MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/grammachat';

async function testDatabase() {
  try {
    console.log('Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connexion MongoDB réussie');

    // Vérifier les collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\nCollections existantes:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Compter les documents
    const userCount = await db.collection('users').countDocuments();
    const messageCount = await db.collection('messages').countDocuments();
    
    console.log('\nNombre de documents:');
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Messages: ${messageCount}`);

    // Lister les utilisateurs
    if (userCount > 0) {
      console.log('\nUtilisateurs existants:');
      const users = await db.collection('users').find({}, { 
        projection: { email: 1, username: 1, role: 1, xp: 1, level: 1, createdAt: 1 } 
      }).toArray();
      
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - Role: ${user.role} - XP: ${user.xp} - Niveau: ${user.level}`);
      });
    }

    // Vérifier les index
    console.log('\n Index sur la collection users:');
    const indexes = await db.collection('users').indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}`);
    });

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDéconnexion MongoDB');
  }
}

testDatabase();
