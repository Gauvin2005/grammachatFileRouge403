/**
 * Configuration PM2 pour Grammachat
 * ==================================
 * 
 * Ce fichier configure PM2 pour gérer les processus de l'application
 */

module.exports = {
  apps: [
    {
      // Configuration du serveur webhook
      name: 'grammachat-webhook',
      script: '/opt/grammachat/grammachatFileRouge403/deploy-scripts/webhook-server.js',
      cwd: '/opt/grammachat/grammachatFileRouge403',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 9000,
        GITHUB_WEBHOOK_SECRET: 'your-webhook-secret-change-this'
      },
      error_file: '/var/log/grammachat/webhook-error.log',
      out_file: '/var/log/grammachat/webhook-out.log',
      log_file: '/var/log/grammachat/webhook-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      // Configuration de l'API Backend
      name: 'grammachat-api',
      script: './backend/dist/server.js',
      cwd: '/opt/grammachat/grammachatFileRouge403',
      instances: 2, // 2 instances pour la haute disponibilité
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_HOST: '0.0.0.0'
      },
      error_file: '/var/log/grammachat/api-error.log',
      out_file: '/var/log/grammachat/api-out.log',
      log_file: '/var/log/grammachat/api-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      // Variables d'environnement spécifiques
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_HOST: '0.0.0.0'
      }
    },
    {
      // Configuration du Frontend (serveur statique)
      name: 'grammachat-frontend',
      script: 'npx',
      args: 'serve -s frontend/dist -l 8082 -n',
      cwd: '/opt/grammachat/grammachatFileRouge403',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8082
      },
      error_file: '/var/log/grammachat/frontend-error.log',
      out_file: '/var/log/grammachat/frontend-out.log',
      log_file: '/var/log/grammachat/frontend-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  // Configuration de déploiement (optionnel)
  deploy: {
    production: {
      user: 'grammachat',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/Gauvin2005/grammachatFileRouge403.git',
      path: '/opt/grammachat/grammachatFileRouge403',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    },
    development: {
      user: 'grammachat',
      host: 'localhost',
      ref: 'origin/develop',
      repo: 'https://github.com/Gauvin2005/grammachatFileRouge403.git',
      path: '/opt/grammachat/grammachatFileRouge403',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env development'
    }
  }
};
