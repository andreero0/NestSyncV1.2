const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal configuration to fix Apollo Client compatibility
// Apollo Client 3.14.0 should work better with default settings
// but we'll add minimal essential fixes

// Add additional source extensions for better module resolution
config.resolver.sourceExts.push('cjs', 'mjs');

// Disable unstable package exports for ES module compatibility
config.resolver.unstable_enablePackageExports = false;

// Platform-specific resolver for handling native-only modules on web
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Resolve native-only modules differently for web platform
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Block native-only modules from being bundled on web
config.resolver.blockList = [
  // Block all Stripe React Native modules for web builds
  /node_modules\/@stripe\/stripe-react-native\/.*/,
];

module.exports = config;