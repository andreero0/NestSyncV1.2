/**
 * Secure Logger - Prevents sensitive data exposure
 * Use this instead of console.log throughout the application
 *
 * SECURITY: Automatically redacts tokens, passwords, JWTs, and other sensitive data
 * from console output to prevent credential theft via browser DevTools.
 */

const SENSITIVE_KEYWORDS = [
  'token', 'password', 'secret', 'jwt', 'authorization',
  'bearer', 'api_key', 'apikey', 'auth', 'credential',
  'session', 'cookie', 'key', 'private', 'refresh',
  'access', 'biometric', 'pin', 'otp', 'code'
];

/**
 * Check if a string contains sensitive data patterns
 */
function containsSensitiveData(str: string): boolean {
  if (typeof str !== 'string') return false;
  const lowerStr = str.toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => lowerStr.includes(keyword));
}

/**
 * Recursively sanitize object by redacting sensitive fields
 */
function sanitizeData(data: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 5) return '[MAX_DEPTH]';

  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item, depth + 1));
  }

  // Handle objects
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive keys
    if (containsSensitiveData(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Redact sensitive string values (JWT patterns, etc.)
    if (typeof value === 'string') {
      // JWT pattern: xxx.yyy.zzz
      if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(value)) {
        sanitized[key] = '[REDACTED_JWT]';
        continue;
      }
      // Long base64/hex strings (likely tokens)
      if (value.length > 50 && /^[A-Za-z0-9+/=\-_]+$/.test(value)) {
        sanitized[key] = '[REDACTED_TOKEN]';
        continue;
      }
      // Email addresses (PIPEDA - personal information)
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        const [localPart, domain] = value.split('@');
        sanitized[key] = `${localPart.substring(0, 2)}***@${domain}`;
        continue;
      }
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeData(value, depth + 1);
  }

  return sanitized;
}

/**
 * Secure logger - Only logs in development, always sanitizes data
 * PIPEDA COMPLIANT: Prevents personal information exposure
 */
export const secureLog = {
  /**
   * Debug-level logging (development only)
   */
  debug: (message: string, data?: any) => {
    if (__DEV__) {
      console.debug(`[DEBUG] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  /**
   * Info-level logging (development only)
   */
  info: (message: string, data?: any) => {
    if (__DEV__) {
      console.info(`[INFO] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  /**
   * Warning-level logging (development only)
   */
  warn: (message: string, data?: any) => {
    if (__DEV__) {
      console.warn(`[WARN] ${message}`, data ? sanitizeData(data) : '');
    }
  },

  /**
   * Error-level logging (always logged for monitoring, sanitized)
   * Errors should be logged in production for monitoring but still sanitized
   */
  error: (message: string, error?: any) => {
    const sanitizedError = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: __DEV__ ? error.stack : '[REDACTED]'
        }
      : sanitizeData(error);

    console.error(`[ERROR] ${message}`, sanitizedError);
  },

  /**
   * UNSAFE logging - NEVER use in production code
   * Only for temporary debugging when explicitly enabled
   * Requires EXPO_PUBLIC_UNSAFE_LOGGING=true in environment
   */
  unsafeLog: (message: string, data?: any) => {
    if (__DEV__ && process.env.EXPO_PUBLIC_UNSAFE_LOGGING === 'true') {
      console.log(`[UNSAFE] ⚠️  ${message}`, data);
      console.warn('⚠️  UNSAFE LOGGING ENABLED - Sensitive data may be exposed');
    }
  }
};

/**
 * Sanitize function for external use
 * Use this when you need to sanitize data before passing to third-party libraries
 */
export function sanitize(data: any): any {
  return sanitizeData(data);
}

/**
 * Check if data contains sensitive information
 * Use this to validate data before logging or storing
 */
export function isSensitive(data: any): boolean {
  if (typeof data === 'string') {
    return containsSensitiveData(data);
  }
  if (typeof data === 'object' && data !== null) {
    return Object.keys(data).some(key => containsSensitiveData(key));
  }
  return false;
}

/**
 * Create a safe metadata object from auth-related data
 * This is a common pattern for logging authentication states
 */
export function createAuthMetadata(data: {
  hasToken?: boolean;
  hasRefreshToken?: boolean;
  tokenLength?: number;
  refreshTokenLength?: number;
  userId?: string;
  email?: string;
  [key: string]: any;
}): any {
  return {
    hasToken: !!data.hasToken,
    hasRefreshToken: !!data.hasRefreshToken,
    tokenLength: data.tokenLength || 0,
    refreshTokenLength: data.refreshTokenLength || 0,
    userId: data.userId ? `${data.userId.substring(0, 8)}...` : undefined,
    email: data.email ? sanitize({ email: data.email }).email : undefined,
    timestamp: new Date().toISOString()
  };
}

export default secureLog;
