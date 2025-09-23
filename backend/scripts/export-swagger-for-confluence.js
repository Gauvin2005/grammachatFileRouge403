#!/usr/bin/env node
/**
 * Script d'export de la spec Swagger pour Confluence
 * Usage: node export-swagger-for-confluence.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour exécuter le script TypeScript et récupérer la spec
function getSwaggerSpec() {
    try {
        // Compiler et exécuter le script TypeScript
        const scriptPath = path.join(__dirname, 'get-swagger-spec.ts');
        const result = execSync(`npx ts-node -r tsconfig-paths/register ${scriptPath}`, {
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
        return JSON.parse(result);
    } catch (error) {
        throw new Error(`Erreur lors de la récupération de la spec: ${error.message}`);
    }
}

async function exportSwaggerSpec() {
    try {
        console.log('Export de la spec Swagger pour Confluence...');
        
        // Obtenir la spec Swagger
        const specs = getSwaggerSpec();
        
        // Vérifier que la spec est valide
        if (!specs || !specs.openapi) {
            throw new Error('Spec Swagger invalide');
        }
        
        // Chemin de sortie
        const outputPath = path.join(__dirname, '..', '..', 'grammachat-api-spec.json');
        
        // Écrire le fichier JSON
        fs.writeFileSync(outputPath, JSON.stringify(specs, null, 2));
        
        // Vérifier le fichier créé
        const fileStats = fs.statSync(outputPath);
        const fileSize = fileStats.size;
        
        console.log('Spec exportée avec succès');
        console.log(`Fichier: ${outputPath}`);
        console.log(`Taille: ${fileSize} octets`);
        
        // Valider le JSON
        try {
            JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            console.log('Fichier JSON valide');
        } catch (jsonError) {
            console.error('Erreur: Fichier JSON invalide');
            throw jsonError;
        }
        
        console.log('\nProchaines étapes:');
        console.log('1. Uploadez grammachat-api-spec.json dans Confluence');
        console.log('2. Insérez le macro Swagger/OpenAPI');
        console.log('3. Configurez la source comme "Attachment"');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error.message);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    exportSwaggerSpec();
}

module.exports = { exportSwaggerSpec };
