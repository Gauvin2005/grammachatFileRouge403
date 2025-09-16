const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration minimale pour éviter les erreurs de runtime
config.transformer.minifierConfig = {
  keep_fnames: true,
};

module.exports = config;
