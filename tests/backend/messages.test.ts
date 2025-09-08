import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../backend/src/server';
import User from '../../backend/src/models/User';
import Message from '../../backend/src/models/Message';

describe('Messages API', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});

    // Créer un utilisateur de test
    const user = await new User({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    }).save();

    userId = user._id.toString();
    authToken = 'valid-jwt-token'; // En production, utiliser la vraie génération
  });

  describe('POST /api/messages', () => {
    it('should send a message successfully', async () => {
      const messageData = {
        content: 'Bonjour, ceci est un test de message.',
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(messageData.content);
      expect(response.body.data.message.xpEarned).toBeDefined();
      expect(response.body.data.xpCalculation).toBeDefined();
    });

    it('should reject empty message', async () => {
      const messageData = {
        content: '',
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject message without authentication', async () => {
      const messageData = {
        content: 'Test message',
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject message that is too long', async () => {
      const messageData = {
        content: 'a'.repeat(1001), // Plus de 1000 caractères
      };

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages', () => {
    beforeEach(async () => {
      // Créer quelques messages de test
      const messages = [
        {
          senderId: userId,
          content: 'Premier message',
          xpEarned: 10,
          timestamp: new Date(),
        },
        {
          senderId: userId,
          content: 'Deuxième message',
          xpEarned: 15,
          timestamp: new Date(),
        },
        {
          senderId: userId,
          content: 'Troisième message',
          xpEarned: 8,
          timestamp: new Date(),
        },
      ];

      await Message.insertMany(messages);
    });

    it('should get messages with pagination', async () => {
      const response = await request(app)
        .get('/api/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should get messages with custom pagination', async () => {
      const response = await request(app)
        .get('/api/messages?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/messages')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/:id', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await new Message({
        senderId: userId,
        content: 'Message de test',
        xpEarned: 12,
      }).save();
      messageId = message._id.toString();
    });

    it('should get a specific message', async () => {
      const response = await request(app)
        .get(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message._id).toBe(messageId);
      expect(response.body.data.message.content).toBe('Message de test');
    });

    it('should reject request for non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/messages/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get(`/api/messages/${messageId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await new Message({
        senderId: userId,
        content: 'Message à supprimer',
        xpEarned: 5,
      }).save();
      messageId = message._id.toString();
    });

    it('should delete a message successfully', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Vérifier que le message a été supprimé
      const deletedMessage = await Message.findById(messageId);
      expect(deletedMessage).toBeNull();
    });

    it('should reject deletion of non-existent message', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .delete(`/api/messages/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
