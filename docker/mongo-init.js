// Script d'initialisation MongoDB pour Grammachat
db = db.getSiblingDB('grammachat');

// Créer les collections avec validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'username', 'role'],
      properties: {
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        password: { bsonType: 'string', minLength: 6 },
        username: { bsonType: 'string', minLength: 3, maxLength: 20 },
        role: { enum: ['user', 'admin'] },
        xp: { bsonType: 'int', minimum: 0 },
        level: { bsonType: 'int', minimum: 1 }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['senderId', 'content', 'timestamp'],
      properties: {
        senderId: { bsonType: 'objectId' },
        content: { bsonType: 'string', minLength: 1, maxLength: 1000 },
        timestamp: { bsonType: 'date' },
        xpEarned: { bsonType: 'int', minimum: 0 },
        errorsFound: { bsonType: 'array' }
      }
    }
  }
});

// Créer les index pour optimiser les performances
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.messages.createIndex({ senderId: 1, timestamp: -1 });
db.messages.createIndex({ timestamp: -1 });

print('Base de données Grammachat initialisée avec succès!');
