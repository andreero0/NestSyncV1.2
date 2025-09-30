/**
 * Apollo Client Cache Utilities
 * Provides functions for cache invalidation and optimistic updates
 * to improve loading state performance and user experience
 */

import { apolloClient } from './client';
import { GET_INVENTORY_ITEMS_QUERY, MY_CHILDREN_QUERY } from './queries';

// Cache invalidation utilities
export const cacheUtils = {
  /**
   * Invalidate inventory cache for a specific child
   * Call this after inventory mutations to force refresh
   */
  invalidateInventoryCache: async (childId: string) => {
    try {
      // Remove all inventory queries for this child from cache
      await apolloClient.cache.evict({
        fieldName: 'getInventoryItems',
        args: { childId }
      });

      // Refetch active inventory queries
      await apolloClient.refetchQueries({
        include: [GET_INVENTORY_ITEMS_QUERY]
      });

      if (__DEV__) {
        console.log(`Invalidated inventory cache for child: ${childId}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to invalidate inventory cache:', error);
      }
    }
  },

  /**
   * Invalidate subscription status cache
   * Call this after subscription mutations
   */
  invalidateSubscriptionCache: async () => {
    try {
      // Remove subscription status from cache
      await apolloClient.cache.evict({
        fieldName: 'getSubscriptionStatus'
      });

      // Clear any subscription-related cached data
      await apolloClient.cache.gc();

      if (__DEV__) {
        console.log('Invalidated subscription cache');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to invalidate subscription cache:', error);
      }
    }
  },

  /**
   * Invalidate children cache
   * Call this after child profile mutations
   */
  invalidateChildrenCache: async () => {
    try {
      // Remove children queries from cache
      await apolloClient.cache.evict({
        fieldName: 'myChildren'
      });

      // Refetch active children queries
      await apolloClient.refetchQueries({
        include: [MY_CHILDREN_QUERY]
      });

      if (__DEV__) {
        console.log('Invalidated children cache');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to invalidate children cache:', error);
      }
    }
  },

  /**
   * Apply optimistic inventory update
   * Updates cache immediately before mutation completes
   */
  applyOptimisticInventoryUpdate: (
    childId: string,
    itemId: string,
    quantityChange: number
  ) => {
    try {
      // Read current cache
      const existingData = apolloClient.cache.readQuery({
        query: GET_INVENTORY_ITEMS_QUERY,
        variables: { childId, productType: 'DIAPER', limit: 500 }
      });

      if (existingData?.getInventoryItems?.edges) {
        // Update the specific item in cache
        const updatedEdges = existingData.getInventoryItems.edges.map((edge: any) => {
          if (edge.node.id === itemId) {
            return {
              ...edge,
              node: {
                ...edge.node,
                quantityRemaining: Math.max(0, edge.node.quantityRemaining + quantityChange)
              }
            };
          }
          return edge;
        });

        // Write updated data back to cache
        apolloClient.cache.writeQuery({
          query: GET_INVENTORY_ITEMS_QUERY,
          variables: { childId, productType: 'DIAPER', limit: 500 },
          data: {
            getInventoryItems: {
              ...existingData.getInventoryItems,
              edges: updatedEdges
            }
          }
        });

        if (__DEV__) {
          console.log(`Applied optimistic update: item ${itemId}, change ${quantityChange}`);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to apply optimistic update:', error);
      }
    }
  },

  /**
   * Revert optimistic inventory update
   * Call this if mutation fails to restore original state
   */
  revertOptimisticInventoryUpdate: (childId: string) => {
    try {
      // Force refetch to get real data from server
      apolloClient.refetchQueries({
        include: [GET_INVENTORY_ITEMS_QUERY]
      });

      if (__DEV__) {
        console.log(`Reverted optimistic updates for child: ${childId}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to revert optimistic update:', error);
      }
    }
  },

  /**
   * Force refresh all data
   * Nuclear option for when everything needs to be refreshed
   */
  forceRefreshAll: async () => {
    try {
      // Clear entire cache
      await apolloClient.clearStore();

      if (__DEV__) {
        console.log('Forced refresh of all cached data');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to force refresh all data:', error);
      }
    }
  },

  /**
   * Smart cache refresh based on operation type
   * Automatically determines what to invalidate based on mutation
   */
  smartCacheRefresh: async (operationType: string, variables?: any) => {
    try {
      switch (operationType) {
        case 'LOG_DIAPER_CHANGE':
        case 'LOG_FEEDING':
        case 'UPDATE_INVENTORY':
          if (variables?.childId) {
            await cacheUtils.invalidateInventoryCache(variables.childId);
          }
          break;

        case 'UPDATE_SUBSCRIPTION':
        case 'UPGRADE_SUBSCRIPTION':
          await cacheUtils.invalidateSubscriptionCache();
          break;

        case 'CREATE_CHILD':
        case 'UPDATE_CHILD':
        case 'DELETE_CHILD':
          await cacheUtils.invalidateChildrenCache();
          break;

        default:
          if (__DEV__) {
            console.log(`No specific cache invalidation for operation: ${operationType}`);
          }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Smart cache refresh failed:', error);
      }
    }
  }
};

/**
 * Higher-order function to wrap mutations with automatic cache invalidation
 */
export const withCacheInvalidation = (
  mutationFn: (...args: any[]) => Promise<any>,
  operationType: string
) => {
  return async (...args: any[]) => {
    try {
      const result = await mutationFn(...args);

      // Automatically invalidate relevant cache after successful mutation
      if (result?.data && !result?.errors) {
        await cacheUtils.smartCacheRefresh(operationType, args[0]);
      }

      return result;
    } catch (error) {
      // Don't throw cache errors, but log them
      if (__DEV__) {
        console.error('Cache invalidation error in mutation wrapper:', error);
      }
      throw error; // Re-throw original mutation error
    }
  };
};

export default cacheUtils;