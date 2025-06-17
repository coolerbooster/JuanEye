const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .tflite and .bin to asset extensions
config.resolver.assetExts.push('tflite', 'bin', 'txt');

module.exports = config;
