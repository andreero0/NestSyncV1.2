/**
 * NestSync Environment Configuration System
 * Provides automatic environment detection and type-safe configuration exports
 * Supports Docker, production-connected, and production build modes
 */

import Constants from 'expo-constants';

// Environment mode detection
export type EnvironmentMode = 'docker' | 'production' | 'production-build' | 'unknown';

// Environment configuration interface
export interface EnvironmentConfig {
  mode: EnvironmentMode;
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiUrl: string;
  graphqlUrl: string;
  backendUrl: string;
  devMode: boolean;
  hostIp: string;
  isProductionConnected: boolean;
  displayName: string;
  description: string;
  warningLevel: 'safe' | 'caution' | 'danger';
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Try Expo public environment variables first (prefixed with EXPO_PUBLIC_)
  const expoPublicValue = Constants.expoConfig?.extra?.[key.replace('EXPO_PUBLIC_', '')] ||
                         process.env[key];

  if (expoPublicValue) {
    return expoPublicValue;
  }

  // Fallback to non-prefixed version for backward compatibility
  const unprefixedKey = key.replace('EXPO_PUBLIC_', '');
  return process.env[unprefixedKey] || fallback;
};

// Detect current environment mode
export const detectEnvironmentMode = (): EnvironmentMode => {
  // Check if we're in a production build
  if (!__DEV__) {
    return 'production-build';
  }

  // Check development mode identifier
  const developmentMode = getEnvVar('EXPO_PUBLIC_DEVELOPMENT_MODE') ||
                         process.env.DEVELOPMENT_MODE;

  switch (developmentMode?.toLowerCase()) {
    case 'docker':
      return 'docker';
    case 'production':
      return 'production';
    default:
      // Auto-detect based on URLs
      const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
      if (supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1')) {
        return 'docker';
      } else if (supabaseUrl?.includes('supabase.co')) {
        return 'production';
      }
      return 'unknown';
  }
};

// Get configuration for detected environment
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const mode = detectEnvironmentMode();

  const baseConfig = {
    supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'http://localhost:8000'),
    supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    apiUrl: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:8001'),
    graphqlUrl: getEnvVar('EXPO_PUBLIC_GRAPHQL_URL', 'http://localhost:8001/graphql'),
    backendUrl: getEnvVar('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001'),
    devMode: getEnvVar('EXPO_PUBLIC_DEV_MODE', 'true') === 'true',
    hostIp: getEnvVar('EXPO_PUBLIC_HOST_IP', 'localhost'),
  };

  switch (mode) {
    case 'docker':
      return {
        ...baseConfig,
        mode,
        isProductionConnected: false,
        displayName: '🐳 Docker Development',
        description: 'Local containerized services - safe for development',
        warningLevel: 'safe',
      };

    case 'production':
      return {
        ...baseConfig,
        mode,
        isProductionConnected: true,
        displayName: '🌐 Production-Connected',
        description: 'Connected to real production services - use with caution!',
        warningLevel: 'danger',
      };

    case 'production-build':
      return {
        ...baseConfig,
        mode,
        isProductionConnected: true,
        displayName: '🚀 Production Build',
        description: 'Production app build',
        warningLevel: 'danger',
        devMode: false,
      };

    default:
      return {
        ...baseConfig,
        mode,
        isProductionConnected: false,
        displayName: '❓ Unknown Environment',
        description: 'Environment mode could not be determined',
        warningLevel: 'caution',
      };
  }
};

// Export current environment configuration
export const ENV = getEnvironmentConfig();

// Environment validation
export const validateEnvironmentConfig = (): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} => {
  const config = getEnvironmentConfig();
  const issues: string[] = [];
  const warnings: string[] = [];

  // Required configuration checks
  if (!config.supabaseUrl) {
    issues.push('Missing Supabase URL');
  }

  if (!config.supabaseAnonKey) {
    issues.push('Missing Supabase Anonymous Key');
  }

  if (!config.apiUrl) {
    issues.push('Missing API URL');
  }

  if (!config.graphqlUrl) {
    issues.push('Missing GraphQL URL');
  }

  // Environment-specific warnings
  if (config.mode === 'production' && config.devMode) {
    warnings.push('Development mode enabled while connected to production services');
  }

  if (config.mode === 'unknown') {
    warnings.push('Could not detect environment mode - check your .env configuration');
  }

  if (config.isProductionConnected && __DEV__) {
    warnings.push('Development build connected to production services - be careful!');
  }

  // URL consistency checks
  if (config.mode === 'docker') {
    if (!config.supabaseUrl.includes('localhost') && !config.supabaseUrl.includes('127.0.0.1')) {
      warnings.push('Docker mode but Supabase URL is not localhost');
    }
  }

  if (config.mode === 'production') {
    if (config.supabaseUrl.includes('localhost') || config.supabaseUrl.includes('127.0.0.1')) {
      warnings.push('Production mode but Supabase URL is localhost');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
};

// Helper functions for common environment checks
export const isDockerMode = (): boolean => ENV.mode === 'docker';
export const isProductionConnected = (): boolean => ENV.isProductionConnected;
export const isProductionBuild = (): boolean => ENV.mode === 'production-build';
export const isDevelopmentMode = (): boolean => ENV.devMode;

// Environment display helpers
export const getEnvironmentDisplayInfo = () => ({
  mode: ENV.mode,
  displayName: ENV.displayName,
  description: ENV.description,
  warningLevel: ENV.warningLevel,
  statusColor: {
    safe: '#22c55e',      // green
    caution: '#f59e0b',   // amber
    danger: '#ef4444',    // red
  }[ENV.warningLevel],
});

// Debug information for troubleshooting
export const getEnvironmentDebugInfo = () => ({
  detectedMode: detectEnvironmentMode(),
  environmentVariables: {
    EXPO_PUBLIC_SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    EXPO_PUBLIC_API_URL: getEnvVar('EXPO_PUBLIC_API_URL'),
    EXPO_PUBLIC_DEV_MODE: getEnvVar('EXPO_PUBLIC_DEV_MODE'),
    EXPO_PUBLIC_DEVELOPMENT_MODE: getEnvVar('EXPO_PUBLIC_DEVELOPMENT_MODE'),
  },
  constants: {
    __DEV__,
    platform: Constants.platform,
    expoVersion: Constants.expoVersion,
  },
  validation: validateEnvironmentConfig(),
});

// Log environment information on import (development only)
if (__DEV__ && getEnvVar('EXPO_PUBLIC_ENABLE_DEBUG_LOGGING', 'false') === 'true') {
  console.log('🌍 NestSync Environment Configuration:', {
    mode: ENV.mode,
    displayName: ENV.displayName,
    isProductionConnected: ENV.isProductionConnected,
    urls: {
      supabase: ENV.supabaseUrl,
      api: ENV.apiUrl,
      graphql: ENV.graphqlUrl,
    },
  });

  const validation = validateEnvironmentConfig();
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment Warnings:', validation.warnings);
  }
  if (!validation.isValid) {
    console.error('❌ Environment Issues:', validation.issues);
  }
}