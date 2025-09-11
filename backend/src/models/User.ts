import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as IUser } from '../types';

export interface UserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  calculateLevel(): number;
  addXP(amount: number): Promise<UserDocument>;
}

const UserSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  username: {
    type: String,
    required: [true, 'Nom d\'utilisateur requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'],
    match: [/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores']
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  xp: {
    type: Number,
    default: 0,
    min: [0, 'XP ne peut pas être négatif']
  },
  level: {
    type: Number,
    default: 1,
    min: [1, 'Le niveau doit être au moins 1']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).password;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Middleware pour hasher le mot de passe avant sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour calculer le niveau basé sur l'XP
UserSchema.methods.calculateLevel = function(): number {
  const xpPerLevel = parseInt(process.env.LEVEL_UP_THRESHOLD || '100');
  return Math.floor(this.xp / xpPerLevel) + 1;
};

// Méthode pour ajouter de l'XP et mettre à jour le niveau
UserSchema.methods.addXP = async function(amount: number): Promise<UserDocument> {
  this.xp += amount;
  this.level = this.calculateLevel();
  return this.save();
};

// Index pour optimiser les requêtes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ xp: -1 });
UserSchema.index({ level: -1 });

export default mongoose.model<UserDocument>('User', UserSchema);
