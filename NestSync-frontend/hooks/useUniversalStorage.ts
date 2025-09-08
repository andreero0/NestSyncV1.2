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
        console.error(`Failed to load ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
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
      console.error(`Failed to set ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
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
      console.error(`Failed to set ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
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
      console.error(`Failed to get ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
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
      console.error(`Failed to remove ${secure ? 'secure' : 'async'} storage item ${key}:`, error);
    }
  },

  // Convenience methods for specific data types
  async setAccessToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token, true);
  },

  async getAccessToken(): Promise<string | null> {
    // First try individual token storage
    let token = await this.getItem(STORAGE_KEYS.ACCESS_TOKEN, true);
    if (token) return token;
    
    // Fallback to extracting from user session
    try {
      const sessionData = await this.getItem(STORAGE_KEYS.USER_SESSION, true);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session.accessToken || null;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to extract access token from session:', error);
      }
    }
    
    return null;
  },

  async setRefreshToken(token: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token, true);
  },

  async getRefreshToken(): Promise<string | null> {
    // First try individual token storage
    let token = await this.getItem(STORAGE_KEYS.REFRESH_TOKEN, true);
    if (token) return token;
    
    // Fallback to extracting from user session
    try {
      const sessionData = await this.getItem(STORAGE_KEYS.USER_SESSION, true);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        return session.refreshToken || null;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to extract refresh token from session:', error);
      }
    }
    
    return null;
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
        console.error('Failed to parse user session:', error);
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
        console.error('Failed to parse biometric settings:', error);
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
        console.error('Failed to parse onboarding state:', error);
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
        console.error('Failed to parse user preferences:', error);
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
        console.error('Failed to get storage info:', error);
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
        console.error('Failed to check biometric availability:', error);
      }
      return false;
    }
  },

  async authenticateWithBiometrics(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('Biometric authentication not available on web');
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
        console.error('Biometric authentication failed:', error);
      }
      return false;
    }
  },
};