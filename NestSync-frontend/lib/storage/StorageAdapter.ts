import { Platform } from 'react-native';
import { AsyncStorageMMKVAdapter } from './AsyncStorageMMKVAdapter';

/**
 * SSR detection utilities
 */
const isSSR = () => {
  return typeof window === 'undefined' || typeof navigator === 'undefined';
};

const isClient = () => !isSSR();

// Storage interface that both MMKV and AsyncStorage adapter implement
export interface IStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string | number | boolean): void;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  getBuffer(key: string): ArrayBuffer | undefined;
  contains(key: string): boolean;
  delete(key: string): void;
  remove(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
  size: number;
  trim(): void;
  recrypt(newEncryptionKey?: string): void;
}

class StorageAdapter {
  private static instance: StorageAdapter;
  private storageImplementation: IStorage | null = null;
  private isMMKVAvailable: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): StorageAdapter {
    if (!StorageAdapter.instance) {
      StorageAdapter.instance = new StorageAdapter();
    }
    return StorageAdapter.instance;
  }

  /**
   * Initialize storage with the appropriate implementation
   * Tries MMKV first, falls back to AsyncStorage if not available
   */
  public async initialize(config?: { id?: string; encryptionKey?: string }): Promise<IStorage> {
    if (this.storageImplementation) {
      return this.storageImplementation;
    }

    if (this.initPromise) {
      await this.initPromise;
      return this.storageImplementation!;
    }

    this.initPromise = this.initializeStorage(config);
    await this.initPromise;
    return this.storageImplementation!;
  }

  private async initializeStorage(config?: { id?: string; encryptionKey?: string }): Promise<void> {
    // Check for SSR environment first
    if (isSSR()) {
      if (__DEV__) {
        console.log('StorageAdapter: SSR environment detected, deferring initialization');
      }
      this.storageImplementation = new AsyncStorageMMKVAdapter(config);
      this.isMMKVAvailable = false;
      return;
    }

    // For web platform, always use AsyncStorage (which internally uses localStorage)
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('StorageAdapter: Using AsyncStorage for web platform');
      }
      this.storageImplementation = new AsyncStorageMMKVAdapter(config);
      this.isMMKVAvailable = false;
      return;
    }

    // Try to load MMKV for native platforms
    try {
      // Dynamic import to avoid errors when MMKV is not available
      const mmkvModule = await this.tryLoadMMKV();

      // MMKV loaded successfully - use it
      // Support both MMKV v3+ (createMMKV) and v2 (new MMKV) APIs
      if (mmkvModule.createMMKV) {
        this.storageImplementation = mmkvModule.createMMKV({
          id: config?.id || 'mmkv.default',
          encryptionKey: config?.encryptionKey,
        });
      } else if (mmkvModule.MMKV) {
        this.storageImplementation = new mmkvModule.MMKV({
          id: config?.id || 'mmkv.default',
          encryptionKey: config?.encryptionKey,
        });
      } else {
        throw new Error('No MMKV constructor found');
      }

      this.isMMKVAvailable = true;

      if (__DEV__) {
        console.log('StorageAdapter: Successfully loaded MMKV for native storage');
      }
    } catch (error) {
      // MMKV not available (Expo Go) - fall back to AsyncStorage
      if (__DEV__) {
        console.log('StorageAdapter: MMKV not available, using AsyncStorage fallback');
        console.log('Note: MMKV requires Development Builds. In Expo Go, AsyncStorage is used.');
      }

      this.storageImplementation = new AsyncStorageMMKVAdapter(config);
      this.isMMKVAvailable = false;
    }
  }

  /**
   * Try to load MMKV module
   * Throws if not available (e.g., in Expo Go)
   */
  private async tryLoadMMKV(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Use require to check if module exists
        // This will throw in Expo Go where MMKV is not available
        const mmkv = require('react-native-mmkv');

        if (mmkv && (mmkv.MMKV || mmkv.createMMKV)) {
          resolve(mmkv);
        } else {
          reject(new Error('MMKV module not properly loaded - missing MMKV or createMMKV'));
        }
      } catch (error) {
        // Enhanced error logging for debugging
        if (__DEV__) {
          console.log('MMKV loading failed:', error.message);
        }
        reject(error);
      }
    });
  }

  /**
   * Get the current storage implementation
   * Returns null if not initialized
   */
  public getStorage(): IStorage | null {
    return this.storageImplementation;
  }

  /**
   * Check if MMKV is being used
   */
  public isUsingMMKV(): boolean {
    return this.isMMKVAvailable;
  }

  /**
   * Get storage type for debugging
   */
  public getStorageType(): string {
    if (isSSR()) {
      return 'SSR (deferred)';
    }
    if (Platform.OS === 'web') {
      return 'localStorage (web)';
    }
    return this.isMMKVAvailable ? 'MMKV' : 'AsyncStorage';
  }

  /**
   * Create a new storage instance with specific configuration
   * Useful for creating isolated storage instances
   */
  public async createStorage(config: { id: string; encryptionKey?: string }): Promise<IStorage> {
    // Handle SSR environment
    if (isSSR() || Platform.OS === 'web') {
      return new AsyncStorageMMKVAdapter(config);
    }

    try {
      const mmkvModule = await this.tryLoadMMKV();

      // Support both MMKV v3+ (createMMKV) and v2 (new MMKV) APIs
      if (mmkvModule.createMMKV) {
        return mmkvModule.createMMKV(config);
      } else if (mmkvModule.MMKV) {
        return new mmkvModule.MMKV(config);
      } else {
        throw new Error('No MMKV constructor found');
      }
    } catch {
      return new AsyncStorageMMKVAdapter(config);
    }
  }
}

// Export singleton instance
export const storageAdapter = StorageAdapter.getInstance();

// Export convenience function
export async function createMMKVStorage(config?: { id?: string; encryptionKey?: string }): Promise<IStorage> {
  return storageAdapter.initialize(config);
}