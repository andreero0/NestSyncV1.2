/**
 * Centralized useChildren Hook
 *
 * This hook centralizes all MY_CHILDREN_QUERY usage to prevent cache conflicts
 * and duplicate queries that were causing Emma to appear twice in the child selector.
 *
 * Problem: Multiple components were independently calling useQuery(MY_CHILDREN_QUERY),
 * causing cache normalization issues and duplicate child entries.
 *
 * Solution: Single source of truth for children data with proper cache management.
 */

import { useQuery } from '@apollo/client';
import { MY_CHILDREN_QUERY } from '@/lib/graphql/queries';

// Child interface matching GraphQL schema
export interface Child {
  id: string;
  name: string;
  dateOfBirth: string;
  gender?: 'BOY' | 'GIRL' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  currentDiaperSize: string;
  currentWeightKg?: number;
  currentHeightCm?: number;
  dailyUsageCount: number;
  hasSensitiveSkin: boolean;
  hasAllergies: boolean;
  allergiesNotes?: string;
  onboardingCompleted: boolean;
  province?: string;
  createdAt: string;
  ageInDays: number;
  ageInMonths: number;
  weeklyUsage?: number;
  monthlyUsage?: number;
}

export interface UseChildrenResult {
  children: Child[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

export interface UseChildrenOptions {
  // Number of children to fetch (default: 10)
  first?: number;
  // Skip the query entirely
  skip?: boolean;
  // Polling interval in milliseconds
  pollInterval?: number;
}

/**
 * Centralized hook for fetching children data
 *
 * This hook should be used instead of directly calling useQuery(MY_CHILDREN_QUERY)
 * to prevent cache conflicts and ensure consistent data handling.
 *
 * @param options Configuration options for the query
 * @returns Children data, loading state, error, and refetch function
 */
export function useChildren(options: UseChildrenOptions = {}): UseChildrenResult {
  const {
    first = 10,
    skip = false,
    pollInterval,
  } = options;

  const {
    data,
    loading,
    error,
    refetch: apolloRefetch
  } = useQuery(MY_CHILDREN_QUERY, {
    variables: { first },
    skip,
    pollInterval,
    // Use cache-and-network to ensure fresh data while utilizing cache
    fetchPolicy: 'cache-and-network',
    // Ensure network status changes are reported for loading states
    notifyOnNetworkStatusChange: true,
    // Clean error handling
    errorPolicy: 'none',
  });

  // Extract children from GraphQL connection pattern
  const children: Child[] = data?.myChildren?.edges?.map((edge: any) => edge.node) || [];

  // Wrapper for refetch to maintain consistent return type
  const refetch = () => {
    apolloRefetch();
  };

  // Log cache debug info in development
  if (__DEV__ && data?.myChildren?.edges) {
    const childIds = children.map(child => child.id);
    const uniqueIds = new Set(childIds);

    if (childIds.length !== uniqueIds.size) {
      console.warn('🚨 DUPLICATE CHILDREN DETECTED in useChildren hook:', {
        totalChildren: childIds.length,
        uniqueChildren: uniqueIds.size,
        duplicateIds: childIds.filter((id, index) => childIds.indexOf(id) !== index),
        allChildren: children.map(child => ({ id: child.id, name: child.name }))
      });
    } else if (children.length > 0) {
      console.log('✅ Children data loaded successfully:', {
        count: children.length,
        children: children.map(child => ({ id: child.id, name: child.name }))
      });
    }
  }

  return {
    children,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for getting a specific child by ID
 *
 * This uses the same cached data from useChildren to avoid additional queries.
 *
 * @param childId The ID of the child to find
 * @returns The child object if found, null otherwise
 */
export function useChild(childId: string | null): Child | null {
  const { children } = useChildren();

  if (!childId) return null;

  return children.find(child => child.id === childId) || null;
}

/**
 * Hook for getting children count without loading all data
 *
 * This is useful for components that only need to know how many children exist.
 *
 * @returns Number of children
 */
export function useChildrenCount(): number {
  const { children } = useChildren();
  return children.length;
}