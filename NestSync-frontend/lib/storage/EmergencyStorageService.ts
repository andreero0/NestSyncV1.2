import { Platform } from 'react-native';
import { secureLog } from '../utils/secureLogger';
import { StorageHelpers } from '../../hooks/useUniversalStorage';
import { createMMKVStorage, storageAdapter, type IStorage } from './StorageAdapter';

// Emergency contact interface
export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
  lastContacted?: string;
}

// Medical information interface
export interface MedicalInfo {
  id: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
  bloodType?: string;
  emergencyMedicalInfo: string;
  healthCardNumber?: string;
  province?: string;
  lastUpdated: string;
}

// Emergency profile interface
export interface EmergencyProfile {
  childId: string;
  childName: string;
  dateOfBirth: string;
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
  lastSyncedAt?: string;
}

class EmergencyStorageService {
  private storage: IStorage | null = null;
  private encryptionKey: string | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized: boolean = false;
  private initializationFailed: boolean = false;

  constructor() {
    // Initialize storage on all platforms
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();

      // Use StorageAdapter to get appropriate storage (MMKV or AsyncStorage)
      this.storage = await createMMKVStorage({
        id: 'emergency-storage',
        encryptionKey: this.encryptionKey,
      });

      this.isInitialized = true;
      this.initializationFailed = false;

      if (__DEV__) {
        const storageType = storageAdapter.getStorageType();
        secureLog.info(`EmergencyStorageService initialized successfully using ${storageType}`);
      }
    } catch (error) {
      // Use console.warn instead of console.warn to avoid red screen in development
      if (__DEV__) {
        secureLog.warn('Failed to initialize EmergencyStorageService:', error);
        secureLog.warn('Emergency storage will fall back to web localStorage where available');
      }
      this.initializationFailed = true;
      this.isInitialized = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise && !this.isInitialized) {
      await this.initPromise;
    }
  }

  /**
   * Check if storage is available and ready for use
   * Returns true for web (localStorage) or when MMKV is initialized
   */
  private isStorageAvailable(): boolean {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined';
    }
    return this.isInitialized && this.storage !== null && !this.initializationFailed;
  }

  /**
   * Safe storage access with null checking
   * Returns null if storage is not available
   */
  private safeGetString(key: string): string | null {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else if (this.isStorageAvailable() && this.storage) {
        return this.storage.getString(key) || null;
      }
      return null;
    } catch (error) {
      secureLog.warn('Failed to get string for key:', key, error);
      return null;
    }
  }

  /**
   * Safe storage set with null checking
   */
  private safeSetString(key: string, value: string): boolean {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return true;
      } else if (this.isStorageAvailable() && this.storage) {
        this.storage.set(key, value);
        return true;
      }
      return false;
    } catch (error) {
      secureLog.warn('Failed to set string for key:', key, error);
      return false;
    }
  }

  /**
   * Safe storage delete with null checking
   */
  private safeDelete(key: string): boolean {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return true;
      } else if (this.isStorageAvailable() && this.storage) {
        this.storage.delete(key);
        return true;
      }
      return false;
    } catch (error) {
      secureLog.warn('Failed to delete key:', key, error);
      return false;
    }
  }

  /**
   * Safe get all keys with null checking
   */
  private safeGetAllKeys(): string[] {
    try {
      if (Platform.OS === 'web') {
        return Object.keys(localStorage);
      } else if (this.isStorageAvailable() && this.storage) {
        return this.storage.getAllKeys();
      }
      return [];
    } catch (error) {
      secureLog.warn('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * SSR-safe random string generator for encryption keys
   * Falls back to Math.random() when crypto APIs are not available
   */
  private generateRandomKey(): string {
    // Check if we're in SSR environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      // Fallback for SSR - use Math.random
      return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) +
             Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }

    // Check if crypto APIs are available (browser environment)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      // Use browser crypto API
      return window.crypto.randomUUID() + window.crypto.randomUUID();
    }

    // Try expo-crypto as fallback (but wrapped in try-catch)
    try {
      return require('expo-crypto').randomUUID() + require('expo-crypto').randomUUID();
    } catch (error) {
      // Final fallback to Math.random for complete compatibility
      return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) +
             Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }
  }

  /**
   * Get or create encryption key for emergency storage
   * Uses StorageAdapter for cross-platform compatibility
   * SSR-safe implementation
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    const keyStorageId = 'emergency-encryption-key';

    try {
      // Use StorageAdapter for cross-platform storage
      const keyStorage = await createMMKVStorage({ id: 'emergency-keys' });
      let key = keyStorage.getString(keyStorageId);

      if (!key) {
        // Generate new 256-bit encryption key using SSR-safe method
        key = this.generateRandomKey();
        keyStorage.set(keyStorageId, key);
      }
      return key;
    } catch (error) {
      // Fallback to generating a random key without persistent storage
      if (__DEV__) {
        secureLog.warn('Failed to access key storage, using session-only encryption key:', error);
      }
      return this.generateRandomKey();
    }
  }

  /**
   * Store emergency profile for a child
   * Provides instant access (<100ms) for emergency situations
   */
  async storeEmergencyProfile(profile: EmergencyProfile): Promise<void> {
    try {
      await this.ensureInitialized();

      const profileKey = `emergency-profile-${profile.childId}`;
      const profileData = {
        ...profile,
        lastSyncedAt: new Date().toISOString(),
      };

      const success = this.safeSetString(profileKey, JSON.stringify(profileData));
      if (!success) {
        throw new Error('Storage not available for storing emergency profile');
      }

      // Update index of emergency profiles
      await this.updateEmergencyProfileIndex(profile.childId);

      secureLog.info(`Emergency profile stored for child: ${profile.childName}`);
    } catch (error) {
      secureLog.warn('Failed to store emergency profile:', error);
      throw new Error('Failed to store emergency profile');
    }
  }

  /**
   * Retrieve emergency profile for a child
   * Optimized for emergency situations with instant access
   * Safe: Returns null if storage is not available
   */
  getEmergencyProfile(childId: string): EmergencyProfile | null {
    try {
      const profileKey = `emergency-profile-${childId}`;
      const profileData = this.safeGetString(profileKey);

      if (!profileData) {
        return null;
      }

      return JSON.parse(profileData) as EmergencyProfile;
    } catch (error) {
      secureLog.warn('Failed to retrieve emergency profile:', error);
      return null;
    }
  }

  /**
   * Get all emergency profiles
   * Returns all stored emergency profiles for family
   * Safe: Returns empty array if storage is not available
   */
  getAllEmergencyProfiles(): EmergencyProfile[] {
    try {
      // Return empty array if storage is not available
      if (!this.isStorageAvailable()) {
        if (__DEV__) {
          secureLog.warn('Storage not available for getAllEmergencyProfiles, returning empty array');
        }
        return [];
      }

      const profileIds = this.getEmergencyProfileIndex();
      const profiles: EmergencyProfile[] = [];

      for (const childId of profileIds) {
        const profile = this.getEmergencyProfile(childId);
        if (profile) {
          profiles.push(profile);
        }
      }

      return profiles;
    } catch (error) {
      secureLog.warn('Failed to retrieve emergency profiles:', error);
      return [];
    }
  }

  /**
   * Update emergency contacts for a child
   */
  async updateEmergencyContacts(
    childId: string,
    contacts: EmergencyContact[]
  ): Promise<void> {
    const profile = this.getEmergencyProfile(childId);
    if (profile) {
      profile.emergencyContacts = contacts;
      await this.storeEmergencyProfile(profile);
    }
  }

  /**
   * Update medical information for a child
   */
  async updateMedicalInfo(
    childId: string,
    medicalInfo: MedicalInfo
  ): Promise<void> {
    const profile = this.getEmergencyProfile(childId);
    if (profile) {
      profile.medicalInfo = {
        ...medicalInfo,
        lastUpdated: new Date().toISOString(),
      };
      await this.storeEmergencyProfile(profile);
    }
  }

  /**
   * Record emergency contact usage
   * Tracks when emergency contacts are called for analytics
   */
  recordEmergencyContactUsage(childId: string, contactId: string): void {
    try {
      const usageKey = `emergency-usage-${childId}-${contactId}`;
      const timestamp = new Date().toISOString();

      this.safeSetString(usageKey, timestamp);

      // Update contact's last contacted time
      const profile = this.getEmergencyProfile(childId);
      if (profile) {
        const contact = profile.emergencyContacts.find(c => c.id === contactId);
        if (contact) {
          contact.lastContacted = timestamp;
          this.storeEmergencyProfile(profile);
        }
      }
    } catch (error) {
      secureLog.warn('Failed to record emergency contact usage:', error);
    }
  }

  /**
   * Get emergency usage analytics
   * Provides insights into emergency feature usage
   */
  getEmergencyUsageStats(): {
    totalEmergencyCalls: number;
    lastEmergencyCall?: string;
    mostUsedContact?: EmergencyContact;
  } {
    try {
      const allKeys = this.safeGetAllKeys();
      const usageKeys = allKeys.filter(key => key.startsWith('emergency-usage-'));

      const stats = {
        totalEmergencyCalls: usageKeys.length,
        lastEmergencyCall: undefined as string | undefined,
        mostUsedContact: undefined as EmergencyContact | undefined,
      };

      if (usageKeys.length > 0) {
        // Find most recent emergency call
        let mostRecentCall = '';
        for (const key of usageKeys) {
          const timestamp = this.safeGetString(key);
          if (timestamp && timestamp > mostRecentCall) {
            mostRecentCall = timestamp;
          }
        }
        stats.lastEmergencyCall = mostRecentCall;
      }

      return stats;
    } catch (error) {
      secureLog.warn('Failed to get emergency usage stats:', error);
      return { totalEmergencyCalls: 0 };
    }
  }

  /**
   * Generate emergency QR code data
   * Creates shareable emergency information for first responders
   */
  generateEmergencyQRData(childId: string): string | null {
    const profile = this.getEmergencyProfile(childId);
    if (!profile) {
      return null;
    }

    // Create compact emergency data for QR code
    const emergencyData = {
      name: profile.childName,
      dob: profile.dateOfBirth,
      bloodType: profile.medicalInfo.bloodType,
      allergies: profile.medicalInfo.allergies,
      medications: profile.medicalInfo.medications,
      conditions: profile.medicalInfo.medicalConditions,
      emergencyContact: profile.emergencyContacts.find(c => c.isPrimary),
      emergencyInfo: profile.medicalInfo.emergencyMedicalInfo,
      healthCard: profile.medicalInfo.healthCardNumber,
      province: profile.medicalInfo.province,
    };

    return JSON.stringify(emergencyData);
  }

  /**
   * Clear all emergency data
   * For privacy compliance and data cleanup
   */
  clearAllEmergencyData(): void {
    try {
      const allKeys = this.safeGetAllKeys();
      const emergencyKeys = allKeys.filter(key =>
        key.startsWith('emergency-profile-') ||
        key.startsWith('emergency-usage-') ||
        key === 'emergency-profile-index'
      );

      let deletedCount = 0;
      for (const key of emergencyKeys) {
        if (this.safeDelete(key)) {
          deletedCount++;
        }
      }

      secureLog.info(`Cleared ${deletedCount} emergency data entries`);
    } catch (error) {
      secureLog.warn('Failed to clear emergency data:', error);
    }
  }

  /**
   * Check storage health and performance
   * Ensures storage is performing optimally for emergency access
   * Safe: Returns health info even if storage is not available
   */
  getStorageHealth(): {
    isHealthy: boolean;
    totalProfiles: number;
    lastAccessTime: number;
    storageSize: number;
    initializationStatus: string;
  } {
    const startTime = Date.now();

    try {
      // Check storage availability first
      if (!this.isStorageAvailable()) {
        return {
          isHealthy: false,
          totalProfiles: 0,
          lastAccessTime: Date.now() - startTime,
          storageSize: 0,
          initializationStatus: this.initializationFailed ? 'failed' : 'initializing'
        };
      }

      const profiles = this.getAllEmergencyProfiles();
      const accessTime = Date.now() - startTime;
      const allKeys = this.safeGetAllKeys();

      return {
        isHealthy: accessTime < 100 && this.isStorageAvailable(), // Should be under 100ms for emergency access
        totalProfiles: profiles.length,
        lastAccessTime: accessTime,
        storageSize: allKeys.length,
        initializationStatus: 'ready'
      };
    } catch (error) {
      secureLog.warn('Storage health check failed:', error);
      return {
        isHealthy: false,
        totalProfiles: 0,
        lastAccessTime: Date.now() - startTime,
        storageSize: 0,
        initializationStatus: 'error'
      };
    }
  }

  /**
   * Manage emergency profile index
   * Maintains list of child IDs with emergency profiles
   */
  private updateEmergencyProfileIndex(childId: string): void {
    const indexKey = 'emergency-profile-index';
    const currentIndex = this.getEmergencyProfileIndex();

    if (!currentIndex.includes(childId)) {
      const updatedIndex = [...currentIndex, childId];
      this.safeSetString(indexKey, JSON.stringify(updatedIndex));
    }
  }

  private getEmergencyProfileIndex(): string[] {
    const indexKey = 'emergency-profile-index';
    const indexData = this.safeGetString(indexKey);

    if (!indexData) {
      return [];
    }

    try {
      return JSON.parse(indexData) as string[];
    } catch {
      return [];
    }
  }

  /**
   * Emergency mode toggle state
   * Tracks whether emergency mode is currently active
   */
  setEmergencyMode(isActive: boolean): void {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('emergency-mode-active', isActive.toString());
      } else if (this.isStorageAvailable() && this.storage) {
        this.storage.set('emergency-mode-active', isActive);
      }
    } catch (error) {
      secureLog.warn('Failed to set emergency mode:', error);
    }
  }

  isEmergencyModeActive(): boolean {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('emergency-mode-active') === 'true';
      }
      return this.isStorageAvailable() && this.storage ?
        this.storage.getBoolean('emergency-mode-active') ?? false : false;
    } catch (error) {
      secureLog.warn('Failed to get emergency mode status:', error);
      return false;
    }
  }
}

// Export factory function for lazy initialization on web
let _emergencyStorage: EmergencyStorageService | null = null;

export function getEmergencyStorage(): EmergencyStorageService {
  if (!_emergencyStorage) {
    _emergencyStorage = new EmergencyStorageService();
  }
  return _emergencyStorage;
}

// Backward compatibility export with web safety
export const emergencyStorage = new EmergencyStorageService();
export default EmergencyStorageService;