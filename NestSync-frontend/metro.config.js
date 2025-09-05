const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal configuration to fix Apollo Client compatibility
// Apollo Client 3.14.0 should work better with default settings
// but we'll add minimal essential fixes

// Add additional source extensions for better module resolution
config.resolver.sourceExts.push('cjs', 'mjs');

// Disable unstable package exports for ES module compatibility
config.resolver.unstable_enablePackageExports = false;

module.exports = config;