const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const frontendRoot = path.join(projectRoot, 'frontend');

const config = getDefaultConfig(projectRoot);

// Inclure explicitement le dossier frontend pour le watchman
config.watchFolders = [projectRoot, frontendRoot];

// Forcer Metro à toujours résoudre les dépendances depuis la racine du projet
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  react: path.join(projectRoot, 'node_modules/react'),
  'react-dom': path.join(projectRoot, 'node_modules/react-dom'),
  'react-native': path.join(projectRoot, 'node_modules/react-native'),
};

// Résolution des plateformes supportées
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ignorer les duplications potentielles dans frontend/node_modules
const escapePath = (p) => p.replace(/[/\\]/g, '[/\\\\]');
config.resolver.blockList = [
  new RegExp(`${escapePath(path.join(frontendRoot, 'node_modules/react-native'))}.*`),
  new RegExp(`${escapePath(path.join(frontendRoot, 'node_modules/react'))}.*`),
  /react-native-worklets\/.*\.js$/,
];

module.exports = config;
