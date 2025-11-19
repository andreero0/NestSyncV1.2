/**
 * Universal Storage Hook
 * Handles cross-platform storage using React hooks pattern
 * Native platforms use SecureStore, web uses localStorage
 * Resolves SecureStore web compatibility issues
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureLog } from '../lib/utils/secureLogger';

interface StorageOptions {
  secure?: boolean;
  keychainService?: string;
}

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'nestsync-keychain',
  ...(Platform.OS === 'android' && {
    encrypt: true,
    authenticatePrompt: 'Authenticate to access NestSync',
  }),
};

export function useUniversalStorage(
  key: string, 
  options: StorageOptions = { secure: true }
) {
  const { secure = true } = options;
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        let value: string | null = null;
        
        if (Platform.OS === 'web') {
          value = localStorage.getItem(key);
        } else if (secure) {
          value = await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
        } else {
          value = await AsyncStorage.getItem(key);
        }
        
        setData(value);
      } catch (error) {
        // Critical storage error - should be logged in production
        secureLog.error(`Failed to load ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, secure]);

  const setValue = async (value: string | null) => {
    try {
      if (value === null) {
        // Remove item
        if (Platform.OS === 'web') {
          localStorage.removeItem(key);
        } else if (secure) {
          await SecureStore.deleteItemAsync(key);
        } else {
          await AsyncStorage.removeItem(key);
        }
      } else {
        // Set item
        if (Platform.OS === 'web') {
          localStorage.setItem(key, value);
        } else if (secure) {
          await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
        } else {
          await AsyncStorage.setItem(key, value);
        }
      }
      
      setData(value);
    } catch (error) {
      // Critical storage error - should be logged in production
      secureLog.error(`Failed to set ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
      throw error;
    }
  };

  return [data, setValue, loading] as const;
}

export function useSecureStorage(key: string) {
  return useUniversalStorage(key, { secure: true });
}

export function useAsyncStorage(key: string) {
  return useUniversalStorage(key, { secure: false });
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nestsync_access_token',
  REFRESH_TOKEN: 'nestsync_refresh_token',
  USER_SESSION: 'nestsync_user_session',
  BIOMETRIC_SETTINGS: 'nestsync_biometric_settings',
  CONSENT_VERSION: 'nestsync_consent_version',
  ONBOARDING_STATE: 'nestsync_onboarding_state',
  USER_PREFERENCES: 'nestsync_user_preferences',
} as const;

export function useAccessToken() {
  return useSecureStorage(STORAGE_KEYS.ACCESS_TOKEN);
}

export function useRefreshToken() {
  return useSecureStorage(STORAGE_KEYS.REFRESH_TOKEN);
}

export function useUserSession() {
  return useSecureStorage(STORAGE_KEYS.USER_SESSION);
}

export function useBiometricSettings() {
  return useAsyncStorage(STORAGE_KEYS.BIOMETRIC_SETTINGS);
}

export function useConsentVersion() {
  return useAsyncStorage(STORAGE_KEYS.CONSENT_VERSION);
}

export function useOnboardingState() {
  return useAsyncStorage(STORAGE_KEYS.ONBOARDING_STATE);
}

export function useUserPreferences() {
  return useAsyncStorage(STORAGE_KEYS.USER_PREFERENCES);
}

/**
 * Checks if a JWT token is expired or expiring soon
 * @param token - JWT token string
 * @param bufferMinutes - Minutes before expiration to consider token expired (default: 5)
 * @returns true if token is expired or expiring soon
 */
function isJWTExpired(token: string, bufferMinutes: number = 5): boolean {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      secureLog.warn('[StorageHelpers] Invalid JWT format (expected 3 parts), treating as expired');
      return true;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if expiration claim exists
    if (!payload.exp) {
      secureLog.warn('[StorageHelpers] JWT missing expiration claim (exp), treating as expired');
      return true;
    }

    // Convert Unix timestamp to milliseconds and check expiration with buffer
    const expiryTime = payload.exp * 1000;
    const bufferTime = bufferMinutes * 60 * 1000;
    const isExpired = Date.now() > (expiryTime - bufferTime);

    if (isExpired && __DEV__) {
      const expiryDate = new Date(expiryTime);
      secureLog.info('[StorageHelpers] Token expired or expiring soon', {
        expiryTime: expiryDate.toISOString(),
        bufferMinutes,
        now: new Date().toISOString(),
      });
    }

    return isExpired;
  } catch (error) {
    // If we can't parse the token, treat it as expired for safety
    secureLog.warn('[StorageHelpers] Failed to parse JWT token, treating as expired:', error);
    return true;
  }
}

// Helper functions for non-reactive storage access (for use outside React components)
export const StorageHelpers = {
  async setItem(key: string, value: string, secure: boolean = true): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else if (secure) {
        await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      // Critical storage error - should be logged in production
      secureLog.error(`Failed to set ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
      throw error;
    }
  },

  async getItem(key: string, secure: boolean = true): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else if (secure) {
        return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      // Critical storage error - should be logged in production
      secureLog.error(`Failed to get ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string, secure: boolean = true): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else if (secure) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      // Critical storage error - should be logged in production
      secureLog.error(`Failed to remove ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
    }
  },

  // Convenience methods for specific data types
  async setAccessToken(token: string): Promise<void> {
    if (__DEV__) {
      const parts = token.split('.');
      secureLog.info(`[StorageHelpers] Storing access token: ${parts.length} parts, length: ${token.length}`);
    }
    await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, true);
  },

  async getAccessToken(): Promise<string | null> {
    try {
      // Try getting direct access token
      let token = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN, true);

      if (token) {
        // Log token format for debugging
        if (__DEV__) {
          const parts = token.split('.');
          secureLog.info(`[StorageHelpers] Access token format: ${parts.length} parts, returning to authStore for validation`);
        }
        // Return token regardless of expiration - let authStore handle validation and refresh
        return token;
      }

      // Fallback: Try extracting from session data
      const sessionData = await this.getItem(STORAGE_KEYS.USER_SESSION, true);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const sessionToken = session.accessToken || null;

        if (sessionToken) {
          // Log token format for debugging
          if (__DEV__) {
            const parts = sessionToken.split('.');
            secureLog.info(`[StorageHelpers] Session access token format: ${parts.length} parts, returning to authStore for validation`);
          }
          // Return token regardless of expiration - let authStore handle validation and refresh
          return sessionToken;
        }
      }

      return null;
    } catch (error) {
      secureLog.error('[StorageHelpers] Error getting access token:', error);
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    if (__DEV__) {
      const parts = token.split('.');
      secureLog.info(`[StorageHelpers] Storing refresh token: ${parts.length} parts, length: ${token.length}`);
    }
    await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token, true);
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      // Try getting direct refresh token
      let token = await this.getItem(STORAGE_KEYS.REFRESH_TOKEN, true);

      if (token) {
        // Log token format for debugging
        const parts = token.split('.');
        if (__DEV__) {
          secureLog.info(`[StorageHelpers] Refresh token format: ${parts.length} parts`);
        }

        // Basic validation but DON'T clear on failure
        if (parts.length !== 3) {
          secureLog.warn(`[StorageHelpers] Refresh token has unexpected format (${parts.length} parts), but returning anyway`);
          // Let backend decide if it's valid - DON'T clear here!
        }

        return token;  // Always return token if it exists
      }

      // Fallback: Try extracting from session data
      const sessionData = await this.getItem(STORAGE_KEYS.USER_SESSION, true);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const sessionToken = session.refreshToken || null;

        if (sessionToken) {
          if (__DEV__) {
            const parts = sessionToken.split('.');
            secureLog.info(`[StorageHelpers] Session refresh token format: ${parts.length} parts`);
          }
          return sessionToken;  // Return even if format questionable
        }
      }

      return null;
    } catch (error) {
      secureLog.error('[StorageHelpers] Error getting refresh token:', error);
      return null;
    }
  },

  async setUserSession(session: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session), true);
  },

  async getUserSession(): Promise<any | null> {
    try {
      const sessionData = await this.getItem(STORAGE_KEYS.USER_SESSION, true);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Check if session has expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        await this.clearUserSession();
        return null;
      }
      
      return session;
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to parse user session:', error);
      }
      return null;
    }
  },

  async clearUserSession(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN, true),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN, true),
      this.removeItem(STORAGE_KEYS.USER_SESSION, true),
    ]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN, true),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN, true),
    ]);
  },

  async setBiometricSettings(settings: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.BIOMETRIC_SETTINGS, JSON.stringify(settings), false);
  },

  async getBiometricSettings(): Promise<any | null> {
    try {
      const settingsData = await this.getItem(STORAGE_KEYS.BIOMETRIC_SETTINGS, false);
      if (!settingsData) return null;
      return JSON.parse(settingsData);
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to parse biometric settings:', error);
      }
      return null;
    }
  },

  async setConsentVersion(version: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.CONSENT_VERSION, version, false);
  },

  async getConsentVersion(): Promise<string | null> {
    return await this.getItem(STORAGE_KEYS.CONSENT_VERSION, false);
  },

  async setOnboardingState(state: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.ONBOARDING_STATE, JSON.stringify(state), false);
  },

  async getOnboardingState(): Promise<any | null> {
    try {
      const stateData = await this.getItem(STORAGE_KEYS.ONBOARDING_STATE, false);
      if (!stateData) return null;
      return JSON.parse(stateData);
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to parse onboarding state:', error);
      }
      return null;
    }
  },

  async clearOnboardingState(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.ONBOARDING_STATE, false);
  },

  async setUserPreferences(preferences: any): Promise<void> {
    await this.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences), false);
  },

  async getUserPreferences(): Promise<any | null> {
    try {
      const preferencesData = await this.getItem(STORAGE_KEYS.USER_PREFERENCES, false);
      if (!preferencesData) return null;
      return JSON.parse(preferencesData);
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to parse user preferences:', error);
      }
      return null;
    }
  },

  async clearAllData(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.ACCESS_TOKEN, true),
      this.removeItem(STORAGE_KEYS.REFRESH_TOKEN, true),
      this.removeItem(STORAGE_KEYS.USER_SESSION, true),
      this.removeItem(STORAGE_KEYS.BIOMETRIC_SETTINGS, false),
      this.removeItem(STORAGE_KEYS.CONSENT_VERSION, false),
      this.removeItem(STORAGE_KEYS.ONBOARDING_STATE, false),
      this.removeItem(STORAGE_KEYS.USER_PREFERENCES, false),
    ]);
  },

  async getStorageInfo(): Promise<{
    hasSecureData: boolean;
    hasPreferences: boolean;
    hasOnboardingData: boolean;
    consentVersion: string | null;
  }> {
    try {
      const [
        hasAccessToken,
        hasPreferences,
        hasOnboardingData,
        consentVersion,
      ] = await Promise.all([
        this.getItem(STORAGE_KEYS.ACCESS_TOKEN, true),
        this.getItem(STORAGE_KEYS.USER_PREFERENCES, false),
        this.getItem(STORAGE_KEYS.ONBOARDING_STATE, false),
        this.getItem(STORAGE_KEYS.CONSENT_VERSION, false),
      ]);

      return {
        hasSecureData: !!hasAccessToken,
        hasPreferences: !!hasPreferences,
        hasOnboardingData: !!hasOnboardingData,
        consentVersion,
      };
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to get storage info:', error);
      }
      return {
        hasSecureData: false,
        hasPreferences: false,
        hasOnboardingData: false,
        consentVersion: null,
      };
    }
  },
};

// Biometric functionality - only works on native platforms, gracefully fails on web
export const BiometricHelpers = {
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false; // Biometrics not available on web
    }
    
    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Failed to check biometric availability:', error);
      }
      return false;
    }
  },

  async authenticateWithBiometrics(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (__DEV__) {
        secureLog.info('Biometric authentication not available on web');
      }
      return false;
    }

    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock NestSync',
        cancelLabel: 'Use PIN instead',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Update last used timestamp
        const settings = await StorageHelpers.getBiometricSettings();
        if (settings && settings.enabled) {
          await StorageHelpers.setBiometricSettings({
            ...settings,
            lastUsed: Date.now(),
          });
        }
      }

      return result.success;
    } catch (error) {
      if (__DEV__) {
        secureLog.error('Biometric authentication failed:', error);
      }
      return false;
    }
  },
};