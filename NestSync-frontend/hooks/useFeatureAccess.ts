/**
 * Centralized Feature Access Management Hook
 *
 * Provides easy access checks for different premium features throughout the app.
 * Integrates with existing subscription status from reorderStore and PremiumFeatureGate.
 *
 * Usage:
 * ```typescript
 * const { hasAccess, isLoading, checkFeatureAccess } = useFeatureAccess();
 *
 * // Check specific features
 * const canUseAnalytics = hasAccess('analytics');
 * const canUseAutomation = hasAccess('automation');
 * const canUseCollaboration = hasAccess('collaboration');
 *
 * // Get subscription status
 * const { status, plan } = checkFeatureAccess();
 * ```
 */

import { useMemo, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_SUBSCRIPTION_STATUS_SIMPLE } from '@/lib/graphql/reorder-queries';
import { StorageHelpers, STORAGE_KEYS } from './useUniversalStorage';

// Feature types that match PremiumFeatureGate
export type FeatureType = 'reorder' | 'analytics' | 'automation' | 'collaboration';

// Subscription status types
export type SubscriptionStatus = 'free' | 'standard' | 'premium' | 'family';

export interface FeatureAccessResult {
  hasAccess: (feature: FeatureType) => boolean;
  isLoading: boolean;
  error: Error | null;
  subscriptionStatus: SubscriptionStatus | null;
  checkFeatureAccess: () => {
    status: SubscriptionStatus | null;
    plan: string;
    hasAccessTo: FeatureType[];
  };
}

export interface SubscriptionData {
  getSubscriptionStatus: {
    status: SubscriptionStatus;
    hasAccessTo: string[];
  };
}

// Storage key for cached subscription status
const SUBSCRIPTION_STATUS_CACHE_KEY = 'nestsync_subscription_status_cache';

// Interface for cached subscription data
interface CachedSubscriptionStatus {
  status: SubscriptionStatus;
  timestamp: number;
  hasAccessTo: FeatureType[];
}

/**
 * Hook for managing feature access throughout the application
 */
export function useFeatureAccess(): FeatureAccessResult {
  // State for cached subscription status to prevent loading state race conditions
  const [cachedStatus, setCachedStatus] = useState<CachedSubscriptionStatus | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get subscription status using simplified query with timeout
  const { data: subscriptionData, loading, error } = useQuery<SubscriptionData>(
    GET_SUBSCRIPTION_STATUS_SIMPLE,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first', // Use cache first for better performance
      context: { timeout: 6000 }, // 6 second timeout
      // Only refetch if cache is older than 5 minutes
      nextFetchPolicy: 'cache-first',
    }
  );

  // Load cached subscription status on initialization
  useEffect(() => {
    const loadCachedStatus = async () => {
      try {
        const cached = await StorageHelpers.getItem(SUBSCRIPTION_STATUS_CACHE_KEY, false);
        if (cached) {
          const parsedCache: CachedSubscriptionStatus = JSON.parse(cached);
          // Only use cache if it's less than 24 hours old
          const isExpired = Date.now() - parsedCache.timestamp > 24 * 60 * 60 * 1000;
          if (!isExpired) {
            setCachedStatus(parsedCache);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached subscription status:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadCachedStatus();
  }, []);

  // Update cache when subscription data changes
  useEffect(() => {
    if (subscriptionData?.getSubscriptionStatus && isInitialized) {
      const status = subscriptionData.getSubscriptionStatus.status;
      const hasAccessTo: FeatureType[] = [];

      // Determine access based on status
      if (status === 'family') {
        hasAccessTo.push('reorder', 'analytics', 'automation', 'collaboration');
      } else if (status === 'premium') {
        hasAccessTo.push('reorder', 'analytics', 'automation');
      }

      const newCachedStatus: CachedSubscriptionStatus = {
        status,
        timestamp: Date.now(),
        hasAccessTo,
      };

      setCachedStatus(newCachedStatus);

      // Persist to storage
      StorageHelpers.setItem(SUBSCRIPTION_STATUS_CACHE_KEY, JSON.stringify(newCachedStatus), false)
        .catch(error => {
          console.warn('Failed to cache subscription status:', error);
        });
    }
  }, [subscriptionData, isInitialized]);

  // Memoized access checker function with loading state protection
  const hasAccess = useMemo(() => {
    return (feature: FeatureType): boolean => {
      // During loading, use cached status to prevent race conditions
      if (loading && cachedStatus) {
        return cachedStatus.hasAccessTo.includes(feature);
      }

      // If we have fresh data, use it
      if (subscriptionData?.getSubscriptionStatus) {
        const status = subscriptionData.getSubscriptionStatus.status;

        // Family plan has access to everything
        if (status === 'family') {
          return true;
        }

        // Premium plan has access to most features except collaboration
        if (status === 'premium' && feature !== 'collaboration') {
          return true;
        }

        // Standard plan has access to analytics (but not automation/collaboration)
        if (status === 'standard' && feature === 'analytics') {
          return true;
        }

        // Free plan has no access to premium features
        return false;
      }

      // If we have cached data but no fresh data, use cached
      if (cachedStatus) {
        return cachedStatus.hasAccessTo.includes(feature);
      }

      // Default to no access only if we have no data at all
      return false;
    };
  }, [subscriptionData, loading, cachedStatus]);

  // Memoized subscription status with loading state protection
  const subscriptionStatus = useMemo(() => {
    // During loading, use cached status if available
    if (loading && cachedStatus) {
      return cachedStatus.status;
    }

    // Use fresh data if available
    if (subscriptionData?.getSubscriptionStatus?.status) {
      return subscriptionData.getSubscriptionStatus.status;
    }

    // Fallback to cached status
    if (cachedStatus) {
      return cachedStatus.status;
    }

    return null;
  }, [subscriptionData, loading, cachedStatus]);

  // Comprehensive feature access check with loading state protection
  const checkFeatureAccess = useMemo(() => {
    return () => {
      let status: SubscriptionStatus | null = null;
      let hasAccessTo: FeatureType[] = [];

      // During loading, use cached status if available
      if (loading && cachedStatus) {
        status = cachedStatus.status;
        hasAccessTo = cachedStatus.hasAccessTo;
      } else if (subscriptionData?.getSubscriptionStatus?.status) {
        // Use fresh data
        status = subscriptionData.getSubscriptionStatus.status;
        if (status === 'family') {
          hasAccessTo = ['reorder', 'analytics', 'automation', 'collaboration'];
        } else if (status === 'premium') {
          hasAccessTo = ['reorder', 'analytics', 'automation'];
        }
      } else if (cachedStatus) {
        // Fallback to cached status
        status = cachedStatus.status;
        hasAccessTo = cachedStatus.hasAccessTo;
      }

      let plan = 'Free';
      if (status === 'family') {
        plan = 'Family';
      } else if (status === 'premium') {
        plan = 'Premium';
      }

      return {
        status,
        plan,
        hasAccessTo,
      };
    };
  }, [subscriptionData, loading, cachedStatus]);

  return {
    hasAccess,
    isLoading: loading && !cachedStatus, // Only show loading if we have no cached data
    error: error || null,
    subscriptionStatus,
    checkFeatureAccess,
  };
}

/**
 * Helper hook for specific feature access checks
 */
export function useFeatureCheck(feature: FeatureType): boolean {
  const { hasAccess } = useFeatureAccess();
  return hasAccess(feature);
}

/**
 * Helper hook for analytics-specific access
 */
export function useAnalyticsAccess(): boolean {
  return useFeatureCheck('analytics');
}

/**
 * Helper hook for automation-specific access
 */
export function useAutomationAccess(): boolean {
  return useFeatureCheck('automation');
}

/**
 * Helper hook for collaboration-specific access
 */
export function useCollaborationAccess(): boolean {
  return useFeatureCheck('collaboration');
}

/**
 * Helper hook for reorder-specific access
 */
export function useReorderAccess(): boolean {
  return useFeatureCheck('reorder');
}

export default useFeatureAccess;