/**
 * Secure Storage Service
 * Handles secure storage of authentication tokens and sensitive data
 * Implements Canadian PIPEDA compliance requirements
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { StoredSession, BiometricSettings } from '../types/auth';

// Storage Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nestsync_access_token',
  REFRESH_TOKEN: 'nestsync_refresh_token',
  USER_SESSION: 'nestsync_user_session',
  BIOMETRIC_SETTINGS: 'nestsync_biometric_settings',
  CONSENT_VERSION: 'nestsync_consent_version',
  ONBOARDING_STATE: 'nestsync_onboarding_state',
  USER_PREFERENCES: 'nestsync_user_preferences',
} as const;

// Secure Store Options
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'nestsync-keychain',
  ...(Platform.OS === 'android' && {
    encrypt: true,
    authenticatePrompt: 'Authenticate to access NestSync',
  }),
};

export class SecureStorage {
  /**
   * Store access token securely
   */
  static async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
        token,
        SECURE_STORE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to store access token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Retrieve access token securely
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
        SECURE_STORE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   */
  static async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        token,
        SECURE_STORE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Retrieve refresh token securely
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        SECURE_STORE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Store complete user session securely
   */
  static async setUserSession(session: StoredSession): Promise<void> {
    try {
      const sessionData = JSON.stringify(session);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER_SESSION,
        sessionData,
        SECURE_STORE_OPTIONS
      );
    } catch (error) {
      console.error('Failed to store user session:', error);
      throw new Error('Failed to store user session');
    }
  }

  /**
   * Retrieve complete user session securely
   */
  static async getUserSession(): Promise<StoredSession | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(
        STORAGE_KEYS.USER_SESSION,
        SECURE_STORE_OPTIONS
      );
      
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData) as StoredSession;
      
      // Check if session has expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        await this.clearUserSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      return null;
    }
  }

  /**
   * Clear user session and tokens
   */
  static async clearUserSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_SESSION),
      ]);
    } catch (error) {
      console.error('Failed to clear user session:', error);
      // Continue execution even if clearing fails
    }
  }

  /**
   * Check if biometric authentication is available
   */
  static async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Failed to check biometric availability:', error);
      return false;
    }
  }

  /**
   * Store biometric settings
   */
  static async setBiometricSettings(settings: BiometricSettings): Promise<void> {
    try {
      const settingsData = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_SETTINGS, settingsData);
    } catch (error) {
      console.error('Failed to store biometric settings:', error);
      throw new Error('Failed to store biometric settings');
    }
  }

  /**
   * Retrieve biometric settings
   */
  static async getBiometricSettings(): Promise<BiometricSettings | null> {
    try {
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_SETTINGS);
      if (!settingsData) return null;
      
      return JSON.parse(settingsData) as BiometricSettings;
    } catch (error) {
      console.error('Failed to retrieve biometric settings:', error);
      return null;
    }
  }

  /**
   * Authenticate with biometrics
   */
  static async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock NestSync',
        cancelLabel: 'Use PIN instead',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Update last used timestamp
        const settings = await this.getBiometricSettings();
        if (settings && settings.enabled) {
          await this.setBiometricSettings({
            ...settings,
            lastUsed: Date.now(),
          });
        }
      }

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  /**
   * Store consent version for PIPEDA compliance
   */
  static async setConsentVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONSENT_VERSION, version);
    } catch (error) {
      console.error('Failed to store consent version:', error);
    }
  }

  /**
   * Retrieve consent version for PIPEDA compliance
   */
  static async getConsentVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.CONSENT_VERSION);
    } catch (error) {
      console.error('Failed to retrieve consent version:', error);
      return null;
    }
  }

  /**
   * Store onboarding state
   */
  static async setOnboardingState(state: any): Promise<void> {
    try {
      const stateData = JSON.stringify(state);
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE, stateData);
    } catch (error) {
      console.error('Failed to store onboarding state:', error);
    }
  }

  /**
   * Retrieve onboarding state
   */
  static async getOnboardingState(): Promise<any | null> {
    try {
      const stateData = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE);
      if (!stateData) return null;
      
      return JSON.parse(stateData);
    } catch (error) {
      console.error('Failed to retrieve onboarding state:', error);
      return null;
    }
  }

  /**
   * Clear onboarding state
   */
  static async clearOnboardingState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_STATE);
    } catch (error) {
      console.error('Failed to clear onboarding state:', error);
    }
  }

  /**
   * Store user preferences
   */
  static async setUserPreferences(preferences: any): Promise<void> {
    try {
      const preferencesData = JSON.stringify(preferences);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferencesData);
    } catch (error) {
      console.error('Failed to store user preferences:', error);
    }
  }

  /**
   * Retrieve user preferences
   */
  static async getUserPreferences(): Promise<any | null> {
    try {
      const preferencesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!preferencesData) return null;
      
      return JSON.parse(preferencesData);
    } catch (error) {
      console.error('Failed to retrieve user preferences:', error);
      return null;
    }
  }

  /**
   * Clear all stored data (for account deletion/logout)
   * PIPEDA compliance: Right to erasure
   */
  static async clearAllData(): Promise<void> {
    try {
      // Clear secure storage
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_SESSION),
      ]);

      // Clear async storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_SETTINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.CONSENT_VERSION),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_STATE),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
      ]);

      console.log('All user data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  /**
   * Get storage usage information (for PIPEDA compliance)
   */
  static async getStorageInfo(): Promise<{
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
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE),
        AsyncStorage.getItem(STORAGE_KEYS.CONSENT_VERSION),
      ]);

      return {
        hasSecureData: !!hasAccessToken,
        hasPreferences: !!hasPreferences,
        hasOnboardingData: !!hasOnboardingData,
        consentVersion,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        hasSecureData: false,
        hasPreferences: false,
        hasOnboardingData: false,
        consentVersion: null,
      };
    }
  }
}

export default SecureStorage;