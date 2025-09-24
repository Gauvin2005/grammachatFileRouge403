#!/usr/bin/env node

/**
 * Serveur Webhook pour déploiement automatique Grammachat
 * ======================================================
 * 
 * Ce serveur écoute les webhooks GitHub et déclenche le déploiement automatique
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret-change-this';
const DEPLOY_SCRIPT = '/opt/grammachat/grammachatFileRouge403/deploy-scripts/deploy.sh';

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour logger les requêtes
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Fonction pour vérifier la signature GitHub
function verifySignature(payload, signature) {
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Fonction pour exécuter le script de déploiement
function runDeployScript(branch, environment) {
    return new Promise((resolve, reject) => {
        console.log(`Démarrage du déploiement pour ${branch} (${environment})`);
        
        exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Erreur lors du déploiement:', error);
                reject(error);
                return;
            }
            
            console.log('Déploiement terminé avec succès');
            console.log('STDOUT:', stdout);
            if (stderr) {
                console.log('STDERR:', stderr);
            }
            
            resolve({ stdout, stderr });
        });
    });
}

// Route principale pour les webhooks GitHub
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    // Vérifier la signature
    if (!verifySignature(payload, signature)) {
        console.error('Signature invalide');
        return res.status(401).json({ error: 'Signature invalide' });
    }
    
    const event = req.headers['x-github-event'];
    const { ref, commits, repository } = req.body;
    
    console.log(`Webhook reçu: ${event} sur ${ref}`);
    
    // Traiter seulement les push sur main ou develop
    if (event === 'push' && (ref === 'refs/heads/main' || ref === 'refs/heads/develop')) {
        const branch = ref.split('/').pop();
        const environment = branch === 'main' ? 'production' : 'development';
        
        console.log(`Déploiement déclenché pour ${branch} → ${environment}`);
        
        // Exécuter le déploiement de manière asynchrone
        runDeployScript(branch, environment)
            .then(() => {
                console.log(`Déploiement ${environment} terminé avec succès`);
            })
            .catch((error) => {
                console.error(`Erreur lors du déploiement ${environment}:`, error);
            });
        
        res.status(200).json({ 
            message: `Déploiement ${environment} déclenché`,
            branch,
            environment,
            timestamp: new Date().toISOString()
        });
    } else {
        console.log(`Événement ignoré: ${event} sur ${ref}`);
        res.status(200).json({ 
            message: 'Événement ignoré',
            event,
            ref
        });
    }
});

// Route de santé
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Route de statut
app.get('/status', (req, res) => {
    const deployScriptExists = fs.existsSync(DEPLOY_SCRIPT);
    
    res.status(200).json({
        status: 'running',
        deployScript: DEPLOY_SCRIPT,
        deployScriptExists,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Route pour déclencher un déploiement manuel
app.post('/deploy', (req, res) => {
    const { branch = 'main', environment = 'production' } = req.body;
    
    console.log(`Déploiement manuel déclenché: ${branch} → ${environment}`);
    
    runDeployScript(branch, environment)
        .then((result) => {
            res.status(200).json({
                message: 'Déploiement manuel terminé avec succès',
                branch,
                environment,
                stdout: result.stdout,
                timestamp: new Date().toISOString()
            });
        })
        .catch((error) => {
            res.status(500).json({
                error: 'Erreur lors du déploiement manuel',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: error.message
    });
});

// Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur webhook démarré sur le port ${PORT}`);
    console.log(`URL webhook: http://localhost:${PORT}/webhook`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Status: http://localhost:${PORT}/status`);
    console.log(`Déploiement manuel: POST http://localhost:${PORT}/deploy`);
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
    console.log('Signal SIGTERM reçu, arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Signal SIGINT reçu, arrêt du serveur...');
    process.exit(0);
});
