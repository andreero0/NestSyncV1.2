import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureLog } from '../utils/secureLogger';
import { Platform } from 'react-native';

/**
 * SSR/Client detection utilities
 */
const isSSR = () => {
  // Check if we're in a server-side rendering environment
  return typeof window === 'undefined' || typeof navigator === 'undefined';
};

const isClient = () => !isSSR();

const isWebPlatform = () => Platform.OS === 'web';

/**
 * SSR-safe random string generator
 * Falls back to Math.random() when crypto APIs are not available
 */
const generateRandomKey = (): string => {
  if (isSSR()) {
    // Fallback for SSR - use Math.random
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  if (isWebPlatform() && typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    // Use browser crypto API
    return window.crypto.randomUUID() + window.crypto.randomUUID();
  }

  // Fallback to Math.random for compatibility
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
};

/**
 * AsyncStorage adapter that provides an MMKV-compatible API
 * SSR-safe implementation that gracefully handles server-side rendering
 * Used as a fallback when MMKV is not available (e.g., in Expo Go)
 */
export class AsyncStorageMMKVAdapter {
  private id: string;
  private encryptionKey?: string;
  private cache: Map<string, any> = new Map();
  private keysCache: string[] = [];
  private lastKeysUpdate = 0;
  private readonly KEYS_CACHE_TTL = 1000; // 1 second cache for keys
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;
  private initializationAttempted = false;

  constructor(config?: { id?: string; encryptionKey?: string }) {
    this.id = config?.id || 'mmkv.default';
    this.encryptionKey = config?.encryptionKey;

    // Handle different environments appropriately
    if (isSSR()) {
      // During SSR, mark as initialized but with empty cache
      // This prevents blocking and infinite loops
      this.isInitialized = true;
      this.initializationAttempted = true;
    } else if (isClient()) {
      // Client-side: lazy initialize on first access
      // Don't initialize immediately to prevent SSR hydration mismatches
      this.scheduleClientInitialization();
    }
  }

  /**
   * Schedule initialization after a brief delay to ensure client hydration
   */
  private scheduleClientInitialization(): void {
    // Use setTimeout to defer initialization until after initial render
    setTimeout(() => {
      if (!this.initializationAttempted) {
        this.initializationPromise = this.initializeCache();
      }
    }, 0);
  }

  /**
   * Safely initialize cache only on client-side
   */
  private async initializeCache(): Promise<void> {
    if (this.initializationAttempted || isSSR()) {
      return;
    }

    this.initializationAttempted = true;

    try {
      // Only proceed if we have AsyncStorage available
      if (typeof AsyncStorage === 'undefined') {
        this.isInitialized = true;
        return;
      }

      const keys = await AsyncStorage.getAllKeys();
      const relevantKeys = keys.filter(key => key.startsWith(`${this.id}:`));

      if (relevantKeys.length > 0) {
        const values = await AsyncStorage.multiGet(relevantKeys);

        values.forEach(([key, value]) => {
          if (value !== null) {
            const actualKey = key.replace(`${this.id}:`, '');
            this.cache.set(actualKey, this.decrypt(value));
          }
        });
      }

      this.keysCache = Array.from(this.cache.keys());
      this.lastKeysUpdate = Date.now();
      this.isInitialized = true;

      if (__DEV__) {
        secureLog.info(`AsyncStorageMMKVAdapter initialized for ${this.id} with ${this.keysCache.length} keys`);
      }
    } catch (error) {
      // Graceful failure - don't throw to prevent app crashes
      this.isInitialized = true;
      if (__DEV__) {
        secureLog.warn('Failed to initialize AsyncStorage cache:', error);
      }
    }
  }

  /**
   * Ensure initialization has completed before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (isSSR()) {
      // During SSR, don't attempt async operations
      this.isInitialized = true;
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeCache();
    }

    try {
      await this.initializationPromise;
    } catch (error) {
      // Ensure we don't get stuck in uninitialized state
      this.isInitialized = true;
      if (__DEV__) {
        secureLog.warn('AsyncStorage initialization failed, continuing with empty cache:', error);
      }
    }
  }

  private encrypt(value: string): string {
    if (!this.encryptionKey) return value;
    // Simple XOR encryption for compatibility
    // In production, you'd want stronger encryption
    return value; // Simplified for now
  }

  private decrypt(value: string): string {
    if (!this.encryptionKey) return value;
    return value; // Simplified for now
  }

  private getFullKey(key: string): string {
    return `${this.id}:${key}`;
  }

  getString(key: string): string | undefined {
    // Return cached value immediately for SSR compatibility
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return String(cached);
    }

    // For client-side, attempt background loading without blocking
    if (isClient() && !isSSR()) {
      this.backgroundLoad(key);
    }

    return undefined;
  }

  /**
   * Background load that doesn't block rendering
   */
  private backgroundLoad(key: string): void {
    if (isSSR()) return;

    // Use a Promise that doesn't block the main thread
    this.ensureInitialized()
      .then(() => this.asyncGet(key))
      .then(value => {
        if (value !== null) {
          this.cache.set(key, value);
        }
      })
      .catch(error => {
        if (__DEV__) {
          secureLog.warn(`Background load failed for key ${key}:`, error);
        }
      });
  }

  private async asyncGet(key: string): Promise<string | null> {
    if (isSSR()) return null;

    try {
      const value = await AsyncStorage.getItem(this.getFullKey(key));
      return value ? this.decrypt(value) : null;
    } catch (error) {
      if (__DEV__) {
        secureLog.warn(`Failed to get ${key} from AsyncStorage:`, error);
      }
      return null;
    }
  }

  set(key: string, value: string | number | boolean): void {
    const stringValue = String(value);
    this.cache.set(key, stringValue);

    // Update keys cache
    if (!this.keysCache.includes(key)) {
      this.keysCache.push(key);
      this.lastKeysUpdate = Date.now();
    }

    // Only persist to AsyncStorage on client-side
    if (isClient() && !isSSR()) {
      this.backgroundSave(key, stringValue);
    }
  }

  /**
   * Background save that doesn't block or cause re-renders
   */
  private backgroundSave(key: string, value: string): void {
    if (isSSR()) return;

    // Async save in background without blocking
    AsyncStorage.setItem(
      this.getFullKey(key),
      this.encrypt(value)
    ).catch(error => {
      if (__DEV__) {
        secureLog.warn(`Failed to save ${key} to AsyncStorage:`, error);
      }
    });
  }

  getNumber(key: string): number | undefined {
    const value = this.getString(key);
    return value !== undefined ? Number(value) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.getString(key);
    if (value === undefined) return undefined;
    return value === 'true';
  }

  getBuffer(key: string): ArrayBuffer | undefined {
    const value = this.getString(key);
    if (value === undefined) return undefined;

    try {
      // Only use browser APIs when available
      if (isSSR() || typeof atob === 'undefined') {
        return undefined;
      }

      // Convert base64 string back to ArrayBuffer
      const binaryString = atob(value);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch {
      return undefined;
    }
  }

  contains(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.remove(key);
  }

  remove(key: string): boolean {
    const existed = this.cache.has(key);
    this.cache.delete(key);

    // Update keys cache
    const index = this.keysCache.indexOf(key);
    if (index > -1) {
      this.keysCache.splice(index, 1);
      this.lastKeysUpdate = Date.now();
    }

    // Only remove from AsyncStorage on client-side
    if (isClient() && !isSSR()) {
      AsyncStorage.removeItem(this.getFullKey(key)).catch(error => {
        if (__DEV__) {
          secureLog.warn(`Failed to remove ${key} from AsyncStorage:`, error);
        }
      });
    }

    return existed;
  }

  getAllKeys(): string[] {
    // Return cached keys immediately to prevent blocking
    if (Date.now() - this.lastKeysUpdate < this.KEYS_CACHE_TTL) {
      return [...this.keysCache];
    }

    // Update cache in background on client-side only
    if (isClient() && !isSSR()) {
      this.updateKeysCache();
    }

    return [...this.keysCache];
  }

  private async updateKeysCache(): Promise<void> {
    if (isSSR()) return;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const relevantKeys = allKeys
        .filter(key => key.startsWith(`${this.id}:`))
        .map(key => key.replace(`${this.id}:`, ''));

      this.keysCache = relevantKeys;
      this.lastKeysUpdate = Date.now();
    } catch (error) {
      if (__DEV__) {
        secureLog.warn('Failed to update keys cache:', error);
      }
    }
  }

  clearAll(): void {
    // Clear memory cache immediately
    const keys = [...this.keysCache];
    this.cache.clear();
    this.keysCache = [];
    this.lastKeysUpdate = Date.now();

    // Clear AsyncStorage on client-side only
    if (isClient() && !isSSR()) {
      keys.forEach(key => {
        AsyncStorage.removeItem(this.getFullKey(key)).catch(error => {
          if (__DEV__) {
            secureLog.warn(`Failed to remove ${key} during clearAll:`, error);
          }
        });
      });
    }
  }

  get size(): number {
    // Estimate size based on cached values
    let totalSize = 0;
    this.cache.forEach(value => {
      totalSize += String(value).length;
    });
    return totalSize;
  }

  trim(): void {
    // No-op for AsyncStorage - no memory cache to trim
    // Could implement cleanup of old/unused keys if needed
  }

  recrypt(newEncryptionKey?: string): void {
    this.encryptionKey = newEncryptionKey;

    // Re-encrypt all values with new key on client-side only
    if (isClient() && !isSSR()) {
      this.cache.forEach((value, key) => {
        this.set(key, value);
      });
    }
  }
}