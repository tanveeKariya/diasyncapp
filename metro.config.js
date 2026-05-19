const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.resolver.unstable_conditionNames = ['browser', 'require', 'default'];

module.exports = config;
