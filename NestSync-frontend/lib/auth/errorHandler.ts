/**
 * Authentication Error Handler
 * Provides user-friendly error messages and prevents technical errors from reaching users
 * Critical for preventing user churn due to confusing error messages
 */

import { Alert } from 'react-native';
import { secureLog } from '../utils/secureLogger';

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  showTechnicalDetails: boolean;
  supportRequired: boolean;
}

/**
 * Maps technical authentication errors to user-friendly messages
 */
export const AUTH_ERROR_MAP: Record<string, AuthError> = {
  // Pydantic validation errors (the current crisis)
  'validation_error': {
    code: 'validation_error',
    message: 'Pydantic validation error',
    userMessage: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
    severity: 'critical',
    showTechnicalDetails: false,
    supportRequired: true
  },

  'identity_id_field_required': {
    code: 'identity_id_field_required',
    message: 'user.identities.0.identity_id Field required',
    userMessage: 'We\'re updating our security systems. Please try again in a few minutes.',
    severity: 'critical',
    showTechnicalDetails: false,
    supportRequired: true
  },

  // Network and connection errors
  'network_error': {
    code: 'network_error',
    message: 'Network request failed',
    userMessage: 'Please check your internet connection and try again.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  },

  'connection_timeout': {
    code: 'connection_timeout',
    message: 'Connection timeout',
    userMessage: 'The connection is taking longer than usual. Please try again.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  },

  // Authentication specific errors
  'invalid_credentials': {
    code: 'invalid_credentials',
    message: 'Invalid credentials',
    userMessage: 'Your email or password is incorrect. Please double-check and try again.',
    severity: 'low',
    showTechnicalDetails: false,
    supportRequired: false
  },

  'email_not_confirmed': {
    code: 'email_not_confirmed',
    message: 'Email not confirmed',
    userMessage: 'Please check your email and click the verification link before signing in.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  },

  'account_locked': {
    code: 'account_locked',
    message: 'Account temporarily locked',
    userMessage: 'Your account has been temporarily locked for security. Please try again in 15 minutes.',
    severity: 'high',
    showTechnicalDetails: false,
    supportRequired: false
  },

  // Token/session errors
  'token_expired': {
    code: 'token_expired',
    message: 'JWT token expired',
    userMessage: 'Your session has expired. Please sign in again to continue.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  },

  'session_expired': {
    code: 'session_expired',
    message: 'Session expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  },

  // Server errors
  'server_error': {
    code: 'server_error',
    message: 'Internal server error',
    userMessage: 'We\'re experiencing technical difficulties. Our team has been notified.',
    severity: 'high',
    showTechnicalDetails: false,
    supportRequired: true
  },

  'gotrue_sdk_error': {
    code: 'gotrue_sdk_error',
    message: 'gotrue SDK error',
    userMessage: 'We\'re updating our security systems. Please try again shortly.',
    severity: 'critical',
    showTechnicalDetails: false,
    supportRequired: true
  },

  // Generic fallback
  'unknown_error': {
    code: 'unknown_error',
    message: 'Unknown error',
    userMessage: 'Something unexpected happened. Please try again.',
    severity: 'medium',
    showTechnicalDetails: false,
    supportRequired: false
  }
};

/**
 * Analyzes raw error message and returns appropriate user-friendly error
 */
export function parseAuthError(rawError: string): AuthError {
  const lowerError = rawError.toLowerCase();

  // Check for JWT token expiration errors (PRIORITY)
  if (lowerError.includes('signature has expired') ||
      lowerError.includes('jwt') && lowerError.includes('expired') ||
      lowerError.includes('token expired')) {
    return AUTH_ERROR_MAP.token_expired;
  }

  if (lowerError.includes('session') && lowerError.includes('expired')) {
    return AUTH_ERROR_MAP.session_expired;
  }

  // Check for Pydantic validation errors (current crisis)
  if (lowerError.includes('identity_id') && lowerError.includes('field required')) {
    return AUTH_ERROR_MAP.identity_id_field_required;
  }

  if (lowerError.includes('validation error') || lowerError.includes('pydantic')) {
    return AUTH_ERROR_MAP.validation_error;
  }

  // Check for network errors
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return AUTH_ERROR_MAP.network_error;
  }

  if (lowerError.includes('timeout')) {
    return AUTH_ERROR_MAP.connection_timeout;
  }

  // Check for authentication errors
  if (lowerError.includes('invalid') && (lowerError.includes('credential') || lowerError.includes('password') || lowerError.includes('email'))) {
    return AUTH_ERROR_MAP.invalid_credentials;
  }

  if (lowerError.includes('email') && lowerError.includes('confirm')) {
    return AUTH_ERROR_MAP.email_not_confirmed;
  }

  if (lowerError.includes('locked') || lowerError.includes('suspend')) {
    return AUTH_ERROR_MAP.account_locked;
  }

  // Check for server errors
  if (lowerError.includes('internal server error') || lowerError.includes('500')) {
    return AUTH_ERROR_MAP.server_error;
  }

  if (lowerError.includes('gotrue')) {
    return AUTH_ERROR_MAP.gotrue_sdk_error;
  }

  // Fallback to unknown error
  return AUTH_ERROR_MAP.unknown_error;
}

/**
 * Shows user-friendly authentication error alert
 */
export function showAuthError(rawError: string, onRetry?: () => void, onContactSupport?: () => void): void {
  const authError = parseAuthError(rawError);

  const buttons = [];

  // Always include "OK" button
  buttons.push({
    text: 'OK',
    style: 'default' as const
  });

  // Add retry button for non-critical errors
  if (authError.severity !== 'critical' && onRetry) {
    buttons.push({
      text: 'Try Again',
      style: 'default' as const,
      onPress: onRetry
    });
  }

  // Add support button for critical errors or when support is required
  if (authError.supportRequired && onContactSupport) {
    buttons.push({
      text: 'Get Help',
      style: 'default' as const,
      onPress: onContactSupport
    });
  }

  Alert.alert(
    'Sign In Issue',
    authError.userMessage,
    buttons
  );

  // Log technical details for debugging (never shown to user)
  secureLog.error(`Auth Error [${authError.code}]: ${rawError}`);

  // TODO: Send error telemetry for critical errors
  if (authError.severity === 'critical') {
    // sendErrorTelemetry(authError, rawError);
  }
}

/**
 * Gets user-friendly error message without showing alert
 */
export function getUserFriendlyErrorMessage(rawError: string): string {
  const authError = parseAuthError(rawError);
  return authError.userMessage;
}

/**
 * Checks if error requires immediate support intervention
 */
export function isErrorCritical(rawError: string): boolean {
  const authError = parseAuthError(rawError);
  return authError.severity === 'critical';
}

/**
 * Handles authentication errors with appropriate UX response
 */
export function handleAuthError(
  rawError: string,
  context: 'login' | 'signup' | 'refresh',
  options: {
    onRetry?: () => void;
    onContactSupport?: () => void;
    onNavigateToSupport?: () => void;
  } = {}
): void {
  const authError = parseAuthError(rawError);

  // Log context-specific information
  secureLog.error(`Auth Error in ${context} [${authError.code}]: ${rawError}`);

  // Show appropriate user interface
  showAuthError(rawError, options.onRetry, options.onContactSupport);

  // Handle critical errors with special flow
  if (authError.severity === 'critical') {
    // Could navigate to support page or show special recovery UI
    if (options.onNavigateToSupport) {
      setTimeout(() => {
        options.onNavigateToSupport!();
      }, 2000); // Give user time to read the error
    }
  }
}

/**
 * Contact support helper
 */
export function contactSupport(): void {
  Alert.alert(
    'Contact Support',
    'Our support team is here to help:\n\n• Email: support@nestsync.ca\n• Response time: Within 2 hours\n• We keep your data safe in Canada',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Email Support',
        onPress: () => {
          // TODO: Open email app with pre-filled support email
          secureLog.info('Opening email to support@nestsync.ca');
        }
      }
    ]
  );
}