// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNativePlugin = require('eslint-plugin-react-native');
const securityPlugin = require('eslint-plugin-security');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  {
    plugins: {
      'react-native': reactNativePlugin,
      'security': securityPlugin,
    },
    rules: {
      // =============================================================================
      // React Native Best Practices
      // =============================================================================
      
      // Enforce that text nodes must be wrapped in <Text> components
      // This prevents "Text strings must be rendered within a <Text> component" warnings
      'react-native/no-raw-text': ['error', {
        skip: ['Text'],
      }],
      
      // Additional React Native best practices
      'react-native/no-inline-styles': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      
      // =============================================================================
      // Security Rules
      // =============================================================================
      
      // Detect unsafe regular expressions that can lead to ReDoS attacks
      'security/detect-unsafe-regex': 'error',
      
      // Detect eval() usage which can lead to code injection
      'security/detect-eval-with-expression': 'error',
      
      // Detect non-literal require() which can be exploited
      'security/detect-non-literal-require': 'warn',
      
      // Detect non-literal fs filename which can lead to path traversal
      'security/detect-non-literal-fs-filename': 'warn',
      
      // Detect child_process usage which can be dangerous
      'security/detect-child-process': 'warn',
      
      // Detect buffer usage which can lead to buffer overflow
      'security/detect-buffer-noassert': 'error',
      
      // Detect pseudoRandomBytes usage (not cryptographically secure)
      'security/detect-pseudoRandomBytes': 'error',
      
      // Detect possible timing attacks
      'security/detect-possible-timing-attacks': 'warn',
      
      // Detect unsafe object access patterns
      'security/detect-object-injection': 'warn',
      
      // Detect disabled certificate validation
      'security/detect-disable-mustache-escape': 'error',
      
      // Detect SQL injection patterns
      'security/detect-no-csrf-before-method-override': 'warn',
      
      // Detect new Buffer() usage (deprecated and unsafe)
      'security/detect-new-buffer': 'error',
      
      // Detect bidi characters that can be used for trojan source attacks
      'security/detect-bidi-characters': 'error',
    },
  },
]);
