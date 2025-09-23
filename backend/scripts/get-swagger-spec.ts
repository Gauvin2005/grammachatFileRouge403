#!/usr/bin/env ts-node
/**
 * Script TypeScript pour récupérer la spec Swagger
 * Usage: ts-node get-swagger-spec.ts
 */

import swaggerConfig from '../src/config/swagger';

// Récupérer la spec Swagger
const specs = swaggerConfig as any;

// Vérifier que la spec est valide
if (!specs || !specs.openapi) {
    console.error('Erreur: Spec Swagger invalide');
    process.exit(1);
}

// Afficher la spec en JSON
console.log(JSON.stringify(specs, null, 2));
