/**
 * Privacy Isolation Utilities
 * Critical PIPEDA compliance functions for ensuring data isolation between users
 * Prevents cross-user data leaks through Apollo Client caching
 */

import { apolloClient, clearApolloCache, resetApolloCache } from '../graphql/client';
import { StorageHelpers } from '../../hooks/useUniversalStorage';

interface UserSessionInfo {
  userId?: string;
  email?: string;
  lastLogin?: number;
  cacheCleared?: boolean;
}

const CACHE_ISOLATION_KEY = 'nestsync_cache_isolation';

export class PrivacyIsolationManager {
  private static instance: PrivacyIsolationManager;
  private currentUser: UserSessionInfo | null = null;

  static getInstance(): PrivacyIsolationManager {
    if (!PrivacyIsolationManager.instance) {
      PrivacyIsolationManager.instance = new PrivacyIsolationManager();
    }
    return PrivacyIsolationManager.instance;
  }

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get current cache isolation info
   */
  private async getCacheIsolationInfo(): Promise<UserSessionInfo | null> {
    try {
      const info = await StorageHelpers.getItem(CACHE_ISOLATION_KEY, false);
      if (!info) return null;
      return JSON.parse(info);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get cache isolation info:', error);
      }
      return null;
    }
  }

  /**
   * Set cache isolation info
   */
  private async setCacheIsolationInfo(info: UserSessionInfo): Promise<void> {
    try {
      await StorageHelpers.setItem(CACHE_ISOLATION_KEY, JSON.stringify(info), false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to set cache isolation info:', error);
      }
    }
  }

  /**
   * Clear cache isolation info
   */
  private async clearCacheIsolationInfo(): Promise<void> {
    try {
      await StorageHelpers.removeItem(CACHE_ISOLATION_KEY, false);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to clear cache isolation info:', error);
      }
    }
  }

  /**
   * CRITICAL: Ensure cache isolation when user signs in
   * This prevents accessing cached data from previous user sessions
   */
  async ensureCacheIsolationOnSignIn(userInfo: { userId: string; email: string }): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔒 PRIVACY: Ensuring cache isolation for user sign-in');
      }

      // Get previous user info
      const previousUser = await this.getCacheIsolationInfo();
      
      // Check if this is a different user than the last cached session
      const isDifferentUser = !previousUser || 
        previousUser.userId !== userInfo.userId ||
        previousUser.email !== userInfo.email;

      if (isDifferentUser) {
        if (__DEV__) {
          console.log('🔒 PRIVACY: Different user detected, clearing Apollo cache');
          if (previousUser) {
            console.log(`Previous user: ${previousUser.email} (${previousUser.userId})`);
          }
          console.log(`New user: ${userInfo.email} (${userInfo.userId})`);
        }

        // CRITICAL: Reset Apollo cache to prevent cross-user data leaks
        await resetApolloCache();
        
        if (__DEV__) {
          console.log('✅ PRIVACY: Apollo cache reset completed');
        }
      } else {
        if (__DEV__) {
          console.log('🔒 PRIVACY: Same user, cache isolation already maintained');
        }
      }

      // Update current user info
      const newUserInfo: UserSessionInfo = {
        userId: userInfo.userId,
        email: userInfo.email,
        lastLogin: Date.now(),
        cacheCleared: isDifferentUser
      };

      await this.setCacheIsolationInfo(newUserInfo);
      this.currentUser = newUserInfo;

      if (__DEV__) {
        console.log('🔒 PRIVACY: Cache isolation ensured for', userInfo.email);
      }

    } catch (error) {
      if (__DEV__) {
        console.error('🚨 PRIVACY ERROR: Failed to ensure cache isolation:', error);
      }
      // On error, clear cache as safety measure
      await this.forceCacheClear('Error during cache isolation');
    }
  }

  /**
   * CRITICAL: Clear all cached data on sign out
   * Ensures no residual user data remains in cache
   */
  async ensureCacheIsolationOnSignOut(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🔒 PRIVACY: Clearing cache on user sign-out');
      }

      // Clear Apollo cache completely
      await clearApolloCache();

      // Clear cache isolation info
      await this.clearCacheIsolationInfo();
      this.currentUser = null;

      if (__DEV__) {
        console.log('✅ PRIVACY: Complete cache clear on sign-out completed');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('🚨 PRIVACY ERROR: Failed to clear cache on sign-out:', error);
      }
      // Force clear as safety measure
      await this.forceCacheClear('Error during sign-out cache clear');
    }
  }

  /**
   * Force clear all caches - emergency privacy protection
   */
  async forceCacheClear(reason: string): Promise<void> {
    try {
      if (__DEV__) {
        console.log('🚨 PRIVACY: Force clearing all caches -', reason);
      }

      // Clear Apollo cache
      await clearApolloCache();
      
      // Reset Apollo cache
      await resetApolloCache();
      
      // Clear isolation info
      await this.clearCacheIsolationInfo();
      this.currentUser = null;

      if (__DEV__) {
        console.log('✅ PRIVACY: Force cache clear completed');
      }

    } catch (error) {
      if (__DEV__) {
        console.error('🚨 PRIVACY CRITICAL ERROR: Failed to force clear cache:', error);
      }
      // This is a critical privacy failure - we should log this in production
      console.error('CRITICAL PRIVACY ERROR: Failed to clear user cache');
    }
  }

  /**
   * Verify cache isolation integrity
   * Checks that current cache matches current user
   */
  async verifyCacheIntegrity(): Promise<boolean> {
    try {
      const cacheInfo = await this.getCacheIsolationInfo();
      const session = await StorageHelpers.getUserSession();

      if (!cacheInfo && !session) {
        // No cache info and no session - this is fine
        return true;
      }

      if (!cacheInfo || !session) {
        // Mismatch between cache info and session
        if (__DEV__) {
          console.warn('🔒 PRIVACY: Cache integrity issue - info/session mismatch');
        }
        return false;
      }

      const sessionUserId = session.user?.id;
      const sessionUserEmail = session.user?.email;

      const integrityOk = 
        cacheInfo.userId === sessionUserId &&
        cacheInfo.email === sessionUserEmail;

      if (!integrityOk && __DEV__) {
        console.error('🚨 PRIVACY: Cache integrity violation detected');
        console.error('Cache info:', cacheInfo);
        console.error('Session info:', { userId: sessionUserId, email: sessionUserEmail });
      }

      return integrityOk;

    } catch (error) {
      if (__DEV__) {
        console.error('🚨 PRIVACY ERROR: Failed to verify cache integrity:', error);
      }
      return false;
    }
  }

  /**
   * Get current user from cache isolation info
   */
  getCurrentUser(): UserSessionInfo | null {
    return this.currentUser;
  }

  /**
   * Check if cache was cleared for current session
   */
  async wasCacheCleared(): Promise<boolean> {
    const info = await this.getCacheIsolationInfo();
    return info?.cacheCleared === true;
  }
}

// Export singleton instance
export const privacyIsolationManager = PrivacyIsolationManager.getInstance();

/**
 * Hook function to ensure privacy isolation in authentication flows
 */
export const usePrivacyIsolation = () => {
  const manager = privacyIsolationManager;

  const ensureSignInIsolation = async (userInfo: { userId: string; email: string }) => {
    await manager.ensureCacheIsolationOnSignIn(userInfo);
  };

  const ensureSignOutIsolation = async () => {
    await manager.ensureCacheIsolationOnSignOut();
  };

  const forceClearCache = async (reason: string) => {
    await manager.forceCacheClear(reason);
  };

  const verifyCacheIntegrity = async () => {
    return await manager.verifyCacheIntegrity();
  };

  return {
    ensureSignInIsolation,
    ensureSignOutIsolation,
    forceClearCache,
    verifyCacheIntegrity,
    getCurrentUser: () => manager.getCurrentUser(),
  };
};

/**
 * EMERGENCY: Clear all user data and cache
 * Use only in critical privacy violation scenarios
 */
export const emergencyPrivacyClear = async (reason: string): Promise<void> => {
  try {
    if (__DEV__) {
      console.log('🚨 EMERGENCY PRIVACY CLEAR:', reason);
    }

    // Clear all storage
    await StorageHelpers.clearAllData();
    
    // Force clear all caches
    await privacyIsolationManager.forceCacheClear(`Emergency clear: ${reason}`);
    
    if (__DEV__) {
      console.log('✅ EMERGENCY PRIVACY CLEAR: Completed');
    }

  } catch (error) {
    if (__DEV__) {
      console.error('🚨 EMERGENCY PRIVACY CLEAR FAILED:', error);
    }
    // This is critical - log to production monitoring if available
    console.error('CRITICAL: Emergency privacy clear failed');
  }
};