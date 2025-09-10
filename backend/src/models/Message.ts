import mongoose, { Document, Schema } from 'mongoose';
import { Message as IMessage, LanguageToolError } from '../types';

export interface MessageDocument extends Omit<IMessage, '_id'>, Document {}

const LanguageToolErrorSchema = new Schema({
  message: String,
  shortMessage: String,
  replacements: [String],
  offset: Number,
  length: Number,
  context: String,
  sentence: String,
  type: {
    typeName: String
  },
  rule: {
    id: String,
    description: String,
    issueType: String
  }
}, { _id: false });

const MessageSchema = new Schema<MessageDocument>({
  senderId: {
    type: String,
    ref: 'User',
    required: [true, 'ID de l\'expéditeur requis']
  },
  content: {
    type: String,
    required: [true, 'Contenu du message requis'],
    trim: true,
    minlength: [1, 'Le message ne peut pas être vide'],
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  xpEarned: {
    type: Number,
    default: 0,
    min: [0, 'XP gagné ne peut pas être négatif']
  },
  errorsFound: [LanguageToolErrorSchema]
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
MessageSchema.index({ senderId: 1, timestamp: -1 });
MessageSchema.index({ timestamp: -1 });
MessageSchema.index({ xpEarned: -1 });

// Middleware pour valider le contenu avant sauvegarde
MessageSchema.pre('save', function(next) {
  if (this.content.trim().length === 0) {
    return next(new Error('Le contenu du message ne peut pas être vide'));
  }
  next();
});

export default mongoose.model<MessageDocument>('Message', MessageSchema);
