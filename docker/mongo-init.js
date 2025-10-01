// Script d'initialisation MongoDB pour Grammachat
// Ce script s'exécute automatiquement au premier démarrage de MongoDB

// Créer la base de données grammachat
db = db.getSiblingDB('grammachat');

// Créer les collections avec des index
db.createCollection('users');
db.createCollection('messages');

// Créer des index pour optimiser les performances
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "xp": -1 });

db.messages.createIndex({ "timestamp": -1 });
db.messages.createIndex({ "sender": 1 });
db.messages.createIndex({ "content": "text" });

print('Base de données Grammachat initialisée avec succès');
print('Collections et index créés');
