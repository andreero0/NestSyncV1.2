import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import { GET_INVENTORY_ITEMS_QUERY } from '@/lib/graphql/queries';
import { NestSyncColors } from '@/constants/Colors';
import { StatusOverviewCardProps } from '@/components/cards/StatusOverviewCard';
import { apolloClient } from '@/lib/graphql/client';

// Interface for processed traffic light data
// Numbers represent total quantities (diapers) not item counts
export interface TrafficLightData {
  critical: number;
  low: number;
  wellStocked: number;
  pending: number;
}

// Interface for inventory item from GraphQL
interface InventoryItem {
  id: string;
  daysUntilExpiry?: number;
  quantityRemaining: number;
  isExpired: boolean;
  productType: string;
  brand: string;
  size: string;
}

// Interface for the hook return value
export interface UseInventoryTrafficLightResult {
  cardData: StatusOverviewCardProps[];
  trafficLightData: TrafficLightData;
  loading: boolean;
  error: any;
  applyOptimisticUpdate: (itemId: string, quantityChange: number) => void;
  forceRefresh: () => void;
}

/**
 * Custom hook to process inventory data into traffic light categories
 * Transforms raw inventory data into 4-card status system following psychology-driven design
 * Counts actual diaper quantities, not inventory records
 */
export function useInventoryTrafficLight(childId: string): UseInventoryTrafficLightResult {
  const router = useRouter();

  // Optimistic update ref to track pending changes
  const optimisticUpdatesRef = useRef<Map<string, number>>(new Map());

  // Fetch inventory data from GraphQL with optimized settings
  const {
    data: inventoryData,
    loading,
    error,
    startPolling,
    stopPolling,
    refetch
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: {
      childId,
      productType: 'DIAPER', // Focus on diaper inventory for traffic light system
      limit: 500 // Increased from 100 to 500 for development
    },
    skip: !childId,
    pollInterval: 15000, // Poll every 15 seconds for faster updates
    errorPolicy: 'all', // Allow partial data to prevent blank states
    notifyOnNetworkStatusChange: true, // Update loading state on network changes
    fetchPolicy: 'cache-and-network', // Get fresh data while showing cache
    context: { timeout: 6000 }, // 6 second timeout for inventory queries
  });

  // Optimistic update function for immediate inventory changes
  const applyOptimisticUpdate = useCallback((itemId: string, quantityChange: number) => {
    optimisticUpdatesRef.current.set(itemId, quantityChange);

    // Trigger a refetch after a short delay to get real data
    setTimeout(() => {
      refetch();
      optimisticUpdatesRef.current.delete(itemId);
    }, 2000);
  }, [refetch]);

  // Handle polling behavior based on error state with smarter retry logic
  useEffect(() => {
    if (error && error.networkError) {
      // For network errors, use exponential backoff
      const retryDelay = Math.min(15000 * Math.pow(2, 0), 60000); // Start with 15s, max 60s
      const timeoutId = setTimeout(() => {
        if (childId) {
          startPolling(15000);
        }
      }, retryDelay);

      return () => clearTimeout(timeoutId);
    } else if (!loading && childId && !error) {
      // Resume normal polling when error is resolved
      startPolling(15000);
    }
  }, [error, loading, childId, startPolling, stopPolling]);

  // Force refresh function for manual updates
  const forceRefresh = useCallback(() => {
    optimisticUpdatesRef.current.clear();
    refetch();
  }, [refetch]);

  // Debug logging for development
  useEffect(() => {
    if (__DEV__) {
      console.log('[useInventoryTrafficLight] Debug info:', {
        childId,
        loading,
        hasError: !!error,
        errorMessage: error?.message,
        hasData: !!inventoryData,
        dataStructure: inventoryData ? {
          hasInventoryItems: !!inventoryData.getInventoryItems,
          hasEdges: !!inventoryData.getInventoryItems?.edges,
          edgesLength: inventoryData.getInventoryItems?.edges?.length || 0,
        } : null,
      });
      
      if (error) {
        console.error('[useInventoryTrafficLight] GraphQL Error:', error);
      }
    }
  }, [childId, loading, error, inventoryData]);

  // Process inventory data into traffic light categories with optimistic updates
  const trafficLightData = useMemo((): TrafficLightData => {
    if (!inventoryData?.getInventoryItems?.edges) {
      return { critical: 0, low: 0, wellStocked: 0, pending: 0 };
    }

    const items: InventoryItem[] = inventoryData.getInventoryItems.edges.map((edge: any) => edge.node);

    const processed = items.reduce(
      (acc, item) => {
        // Apply optimistic updates if available
        const optimisticChange = optimisticUpdatesRef.current.get(item.id) || 0;
        const quantity = Math.max(0, (item.quantityRemaining || 0) + optimisticChange);

        // Critical items: 0 quantity OR ≤3 days remaining OR expired
        if (quantity === 0 || item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)) {
          acc.critical += quantity;
        }
        // Low stock items: 4-7 days remaining (only if quantity > 0)
        else if (quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
          acc.low += quantity;
        }
        // Well stocked items: >7 days remaining (only if quantity > 0)
        else if (quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) {
          acc.wellStocked += quantity;
        }
        // Items without expiry data are considered well stocked if they have quantity > 0
        else if (quantity > 0 && (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined)) {
          acc.wellStocked += quantity;
        }

        return acc;
      },
      { critical: 0, low: 0, wellStocked: 0, pending: 0 }
    );

    // TODO: Implement pending orders tracking when backend supports it
    // For now, pending is always 0
    processed.pending = 0;

    return processed;
  }, [inventoryData]);

  // Generate card data following traffic light psychology specifications
  const cardData = useMemo((): StatusOverviewCardProps[] => {
    return [
      {
        statusType: 'critical',
        title: 'Critical Items',
        count: trafficLightData.critical,
        description: 'Diapers need attention soon',
        iconName: 'exclamationmark.triangle.fill', // SF Symbol name
        borderColor: NestSyncColors.trafficLight.critical, // Critical Red from traffic light system
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: {
              filter: 'critical',
              childId: childId
            }
          });
        },
        accessibilityLabel: `Critical items: ${trafficLightData.critical} diapers need attention soon`,
        accessibilityHint: 'Tap to view diapers that expire within 3 days',
        testID: 'critical-items-card',
      },
      {
        statusType: 'low',
        title: 'Low Stock',
        count: trafficLightData.low,
        description: 'Plan to restock these diapers',
        iconName: 'clock.fill', // SF Symbol name
        borderColor: NestSyncColors.trafficLight.low, // Low Stock Amber from traffic light system
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: {
              filter: 'low',
              childId: childId
            }
          });
        },
        accessibilityLabel: `Low stock: ${trafficLightData.low} diapers need restocking`,
        accessibilityHint: 'Tap to view diapers that expire in 4 to 7 days',
        testID: 'low-stock-card',
      },
      {
        statusType: 'stocked',
        title: 'Well Stocked',
        count: trafficLightData.wellStocked,
        description: "You're prepared!",
        iconName: 'checkmark.circle.fill', // SF Symbol name
        borderColor: NestSyncColors.trafficLight.stocked, // Well Stocked Green from traffic light system
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: {
              filter: 'stocked',
              childId: childId
            }
          });
        },
        accessibilityLabel: `Well stocked: ${trafficLightData.wellStocked} diapers are well prepared`,
        accessibilityHint: 'Tap to view diapers with more than 7 days remaining',
        testID: 'well-stocked-card',
      },
      {
        statusType: 'pending',
        title: 'Pending Orders',
        count: trafficLightData.pending,
        description: 'Help is on the way',
        iconName: 'shippingbox.fill', // SF Symbol name
        borderColor: NestSyncColors.trafficLight.pending, // Pending Orders Blue from traffic light system
        onPress: () => {
          router.push({
            pathname: '/(tabs)/planner',
            params: {
              filter: 'pending',
              childId: childId
            }
          });
        },
        accessibilityLabel: `Pending orders: ${trafficLightData.pending} diapers on the way`,
        accessibilityHint: 'Tap to view incoming inventory orders',
        testID: 'pending-orders-card',
      },
    ];
  }, [trafficLightData]);

  // Don't treat network errors as fatal errors for the card display
  // Show cards even if there's an error, but with appropriate disabled states
  const shouldShowCards = !loading && (!error || inventoryData?.getInventoryItems);
  
  return {
    cardData: cardData.map(card => ({
      ...card,
      loading,
      disabled: loading || (!!error && !inventoryData?.getInventoryItems),
    })),
    trafficLightData,
    loading,
    // Only report error if we have no data at all
    error: error && !inventoryData?.getInventoryItems ? error : null,
    // Expose optimistic update functions for components to use
    applyOptimisticUpdate,
    forceRefresh,
  };
}

/**
 * Helper function to get human-readable description of traffic light status
 * Useful for debugging and logging
 */
export function getTrafficLightSummary(data: TrafficLightData): string {
  const total = data.critical + data.low + data.wellStocked + data.pending;
  
  if (total === 0) {
    return 'No diapers in inventory';
  }
  
  const parts = [];
  if (data.critical > 0) parts.push(`${data.critical} critical diapers`);
  if (data.low > 0) parts.push(`${data.low} low stock diapers`);
  if (data.wellStocked > 0) parts.push(`${data.wellStocked} well stocked diapers`);
  if (data.pending > 0) parts.push(`${data.pending} pending diapers`);
  
  return parts.join(', ');
}

/**
 * Helper function to determine overall status priority
 * Returns the highest priority status for overall health indication
 */
export function getOverallStatus(data: TrafficLightData): 'critical' | 'low' | 'stocked' | 'empty' {
  if (data.critical > 0) return 'critical';
  if (data.low > 0) return 'low';
  if (data.wellStocked > 0) return 'stocked';
  return 'empty';
}