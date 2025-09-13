import { useMemo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'expo-router';
import { GET_INVENTORY_ITEMS_QUERY } from '@/lib/graphql/queries';
import { NestSyncColors } from '@/constants/Colors';
import { StatusOverviewCardProps } from '@/components/cards/StatusOverviewCard';

// Interface for processed traffic light data
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
}

/**
 * Custom hook to process inventory data into traffic light categories
 * Transforms raw inventory data into 4-card status system following psychology-driven design
 */
export function useInventoryTrafficLight(childId: string): UseInventoryTrafficLightResult {
  const router = useRouter();

  // Fetch inventory data from GraphQL
  const {
    data: inventoryData,
    loading,
    error,
    startPolling,
    stopPolling
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: {
      childId,
      productType: 'DIAPER', // Focus on diaper inventory for traffic light system
      limit: 500 // Increased from 100 to 500 for development
    },
    skip: !childId,
    pollInterval: 60000, // Poll every 60 seconds by default
    errorPolicy: 'none', // Fail fast on network errors to prevent infinite loops
    notifyOnNetworkStatusChange: true, // Update loading state on network changes
    fetchPolicy: 'cache-first', // Use cache when network is unavailable
  });

  // Handle polling behavior based on error state
  useEffect(() => {
    if (error) {
      // Stop polling when there's an error to prevent infinite retry loops
      stopPolling();
    } else if (!loading && childId) {
      // Resume polling when error is resolved and we have a valid childId
      startPolling(60000);
    }
  }, [error, loading, childId, startPolling, stopPolling]);

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

  // Process inventory data into traffic light categories
  const trafficLightData = useMemo((): TrafficLightData => {
    if (!inventoryData?.getInventoryItems?.edges) {
      return { critical: 0, low: 0, wellStocked: 0, pending: 0 };
    }

    const items: InventoryItem[] = inventoryData.getInventoryItems.edges.map((edge: any) => edge.node);
    
    // Filter out items with no remaining quantity (empty items)
    const activeItems = items.filter(item => item.quantityRemaining > 0);
    
    const processed = activeItems.reduce(
      (acc, item) => {
        // Critical items: ≤3 days remaining OR expired
        if (item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)) {
          acc.critical += 1;
        }
        // Low stock items: 4-7 days remaining
        else if (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
          acc.low += 1;
        }
        // Well stocked items: >7 days remaining
        else if (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) {
          acc.wellStocked += 1;
        }
        // Items without expiry data are considered well stocked if they have quantity
        else if (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined) {
          acc.wellStocked += 1;
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
        description: 'Items need attention soon',
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
        accessibilityLabel: `Critical items: ${trafficLightData.critical} items need attention soon`,
        accessibilityHint: 'Tap to view items that expire within 3 days',
        testID: 'critical-items-card',
      },
      {
        statusType: 'low',
        title: 'Low Stock',
        count: trafficLightData.low,
        description: 'Plan to restock these items',
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
        accessibilityLabel: `Low stock: ${trafficLightData.low} items need restocking`,
        accessibilityHint: 'Tap to view items that expire in 4 to 7 days',
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
        accessibilityLabel: `Well stocked: ${trafficLightData.wellStocked} items are well prepared`,
        accessibilityHint: 'Tap to view items with more than 7 days remaining',
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
        accessibilityLabel: `Pending orders: ${trafficLightData.pending} items on the way`,
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
  };
}

/**
 * Helper function to get human-readable description of traffic light status
 * Useful for debugging and logging
 */
export function getTrafficLightSummary(data: TrafficLightData): string {
  const total = data.critical + data.low + data.wellStocked + data.pending;
  
  if (total === 0) {
    return 'No inventory items found';
  }
  
  const parts = [];
  if (data.critical > 0) parts.push(`${data.critical} critical`);
  if (data.low > 0) parts.push(`${data.low} low stock`);
  if (data.wellStocked > 0) parts.push(`${data.wellStocked} well stocked`);
  if (data.pending > 0) parts.push(`${data.pending} pending`);
  
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