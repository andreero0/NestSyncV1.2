import { MMKV } from 'react-native-mmkv';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { StorageHelpers } from '../../hooks/useUniversalStorage';

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
  private storage: MMKV | null = null;
  private encryptionKey: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Skip initialization on web for compatibility
    if (Platform.OS !== 'web') {
      // Initialize storage asynchronously
      this.initPromise = this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    // Initialize encryption key
    this.encryptionKey = await this.getOrCreateEncryptionKey();

    // Only initialize MMKV on native platforms
    if (Platform.OS !== 'web') {
      this.storage = new MMKV({
        id: 'emergency-storage',
        encryptionKey: this.encryptionKey,
      });
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Get or create encryption key for emergency storage
   * Uses platform-appropriate storage and Expo Crypto for secure key generation
   */
  private async getOrCreateEncryptionKey(): Promise<string> {
    const keyStorageId = 'emergency-encryption-key';

    if (Platform.OS === 'web') {
      // Use localStorage on web with fallback generation
      let key = localStorage.getItem(keyStorageId);
      if (!key) {
        // Generate new 256-bit encryption key
        key = Crypto.randomUUID() + Crypto.randomUUID();
        localStorage.setItem(keyStorageId, key);
      }
      return key;
    } else {
      // Use MMKV on native platforms
      const keyStorage = new MMKV({ id: 'emergency-keys' });
      let key = keyStorage.getString(keyStorageId);

      if (!key) {
        // Generate new 256-bit encryption key
        key = Crypto.randomUUID() + Crypto.randomUUID();
        keyStorage.set(keyStorageId, key);
      }
      return key;
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

      if (Platform.OS === 'web') {
        localStorage.setItem(profileKey, JSON.stringify(profileData));
      } else if (this.storage) {
        this.storage.set(profileKey, JSON.stringify(profileData));
      }

      // Update index of emergency profiles
      await this.updateEmergencyProfileIndex(profile.childId);

      console.log(`Emergency profile stored for child: ${profile.childName}`);
    } catch (error) {
      console.error('Failed to store emergency profile:', error);
      throw new Error('Failed to store emergency profile');
    }
  }

  /**
   * Retrieve emergency profile for a child
   * Optimized for emergency situations with instant access
   */
  async getEmergencyProfile(childId: string): Promise<EmergencyProfile | null> {
    try {
      await this.ensureInitialized();

      const profileKey = `emergency-profile-${childId}`;
      let profileData: string | null = null;

      if (Platform.OS === 'web') {
        profileData = localStorage.getItem(profileKey);
      } else if (this.storage) {
        profileData = this.storage.getString(profileKey);
      }

      if (!profileData) {
        return null;
      }

      return JSON.parse(profileData) as EmergencyProfile;
    } catch (error) {
      console.error('Failed to retrieve emergency profile:', error);
      return null;
    }
  }

  /**
   * Get all emergency profiles
   * Returns all stored emergency profiles for family
   */
  getAllEmergencyProfiles(): EmergencyProfile[] {
    try {
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
      console.error('Failed to retrieve emergency profiles:', error);
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

      this.storage.set(usageKey, timestamp);

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
      console.error('Failed to record emergency contact usage:', error);
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
      const allKeys = this.storage.getAllKeys();
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
          const timestamp = this.storage.getString(key);
          if (timestamp && timestamp > mostRecentCall) {
            mostRecentCall = timestamp;
          }
        }
        stats.lastEmergencyCall = mostRecentCall;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get emergency usage stats:', error);
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
      const allKeys = this.storage.getAllKeys();
      const emergencyKeys = allKeys.filter(key =>
        key.startsWith('emergency-profile-') ||
        key.startsWith('emergency-usage-') ||
        key === 'emergency-profile-index'
      );

      for (const key of emergencyKeys) {
        this.storage.delete(key);
      }

      console.log('All emergency data cleared');
    } catch (error) {
      console.error('Failed to clear emergency data:', error);
    }
  }

  /**
   * Check storage health and performance
   * Ensures MMKV is performing optimally for emergency access
   */
  getStorageHealth(): {
    isHealthy: boolean;
    totalProfiles: number;
    lastAccessTime: number;
    storageSize: number;
  } {
    const startTime = Date.now();

    try {
      const profiles = this.getAllEmergencyProfiles();
      const accessTime = Date.now() - startTime;
      const allKeys = this.storage.getAllKeys();

      return {
        isHealthy: accessTime < 100, // Should be under 100ms for emergency access
        totalProfiles: profiles.length,
        lastAccessTime: accessTime,
        storageSize: allKeys.length,
      };
    } catch (error) {
      console.error('Storage health check failed:', error);
      return {
        isHealthy: false,
        totalProfiles: 0,
        lastAccessTime: Date.now() - startTime,
        storageSize: 0,
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
      this.storage.set(indexKey, JSON.stringify(updatedIndex));
    }
  }

  private getEmergencyProfileIndex(): string[] {
    const indexKey = 'emergency-profile-index';
    const indexData = this.storage.getString(indexKey);

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
    this.storage.set('emergency-mode-active', isActive);
  }

  isEmergencyModeActive(): boolean {
    return this.storage.getBoolean('emergency-mode-active') ?? false;
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