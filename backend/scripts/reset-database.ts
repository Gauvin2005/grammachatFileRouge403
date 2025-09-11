import mongoose from 'mongoose';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grammachat';

async function resetDatabase() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer toutes les collections
    const db = mongoose.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        await db.collection(collection.name).drop();
        console.log(`🗑️  Collection ${collection.name} supprimée`);
      }
    }

    console.log('🎉 Base de données réinitialisée avec succès !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter le script
resetDatabase();
