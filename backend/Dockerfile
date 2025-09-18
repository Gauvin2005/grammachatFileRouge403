FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apk add --no-cache dumb-init

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris dev pour la compilation TypeScript)
RUN npm install --no-package-lock && npm cache clean --force

# Copier le code source
COPY . .

# Compiler TypeScript
RUN npm run build

# Supprimer les dépendances de développement après compilation
RUN npm prune --production && npm cache clean --force

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S grammachat -u 1001

# Changer la propriété des fichiers
RUN chown -R grammachat:nodejs /app
USER grammachat

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Commande de démarrage avec dumb-init pour une meilleure gestion des signaux
CMD ["dumb-init", "npm", "start"]