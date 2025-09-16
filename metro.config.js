const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurer le watchFolders pour inclure le dossier frontend
config.watchFolders = [__dirname, `${__dirname}/frontend`];

module.exports = config;
