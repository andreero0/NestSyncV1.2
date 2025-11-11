/**
 * Stripe Configuration for Development and Production
 * 
 * This module provides environment-aware Stripe configuration:
 * - Development: Test mode with suppressed warnings
 * - Production: Live mode with full validation
 * 
 * Requirements: 10.1, 10.2
 */

/**
 * Stripe configuration interface
 */
export interface StripeConfigOptions {
  publishableKey: string;
  merchantIdentifier: string;
  urlScheme: string;
  setUrlSchemeOnAndroid: boolean;
  // Development-specific settings
  suppressWarnings?: boolean;
  testMode?: boolean;
}

/**
 * Get Stripe configuration based on environment
 * 
 * @returns Stripe configuration object
 */
export const getStripeConfig = (): StripeConfigOptions => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.EXPO_PUBLIC_DEV_MODE === 'true';

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined. ' +
      'Please add it to your .env.local file.'
    );
  }

  // Base configuration
  const config: StripeConfigOptions = {
    publishableKey,
    merchantIdentifier: 'merchant.ca.nestsync',
    urlScheme: 'nestsync',
    setUrlSchemeOnAndroid: true,
  };

  // Add development-specific settings
  if (isDevelopment) {
    config.suppressWarnings = true;
    config.testMode = true;
  }

  return config;
};

/**
 * Validate Stripe configuration
 * 
 * @throws Error if configuration is invalid
 */
export const validateStripeConfig = (): void => {
  const config = getStripeConfig();

  // Validate publishable key format
  if (!config.publishableKey.startsWith('pk_')) {
    throw new Error('Invalid Stripe publishable key format');
  }

  // Warn if using test key in production
  if (process.env.NODE_ENV === 'production' && config.publishableKey.startsWith('pk_test_')) {
    console.error(
      'WARNING: Using Stripe test key in production environment. ' +
      'Please update EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to use a live key.'
    );
  }

  // Warn if using live key in development
  if (process.env.NODE_ENV === 'development' && config.publishableKey.startsWith('pk_live_')) {
    console.warn(
      'WARNING: Using Stripe live key in development environment. ' +
      'Consider using a test key for development.'
    );
  }
};

/**
 * Export default configuration
 */
export const stripeConfig = getStripeConfig();

/**
 * Export all configuration utilities
 */
export default {
  getStripeConfig,
  validateStripeConfig,
  stripeConfig,
};
