import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GET_INVENTORY_ITEMS_QUERY } from '@/lib/graphql/queries';
import { useChildren } from '@/hooks/useChildren';
import { formatDiaperSize } from '@/utils/formatters';
import { EditInventoryModal } from '@/components/modals/EditInventoryModal';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

type FilterType = 'all' | 'critical' | 'low' | 'stocked' | 'pending';

interface InventoryItem {
  id: string;
  brandName: string;
  size: string;
  quantityRemaining: number;
  quantityPurchased: number;
  isPendingDelivery: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  expiresAt: string | null;
  childId: string;
  createdAt: string;
}

export default function InventoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];
  const params = useLocalSearchParams<{ childId?: string; filter?: string }>();

  // Filter state with persistence
  const [storedFilter, setStoredFilter] = useAsyncStorage('nestsync_inventory_filter');
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    params.filter || (storedFilter as FilterType) || 'all'
  );

  // Modal state for editing inventory items
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Use childId from params or default to first child
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');

  // Fetch children data using centralized hook
  const { children, loading: childrenLoading } = useChildren({ first: 10 });

  // Use the childId from params, stored value, or first available child
  const childId = params.childId || storedChildId || children?.[0]?.id || '';

  // Update selected child when available
  useEffect(() => {
    if (childId && childId !== selectedChildId) {
      setSelectedChildId(childId);
    }
  }, [childId, selectedChildId]);

  // Persist filter selection
  useEffect(() => {
    if (activeFilter !== storedFilter) {
      setStoredFilter(activeFilter);
    }
  }, [activeFilter, storedFilter, setStoredFilter]);

  // Fetch inventory items for the selected child
  const {
    data: inventoryData,
    loading: inventoryLoading,
    error: inventoryError,
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: { childId: selectedChildId },
    skip: !selectedChildId,
    fetchPolicy: 'cache-and-network',
  });

  // Process inventory items into categories
  const inventoryItems: InventoryItem[] = useMemo(() => {
    if (!inventoryData?.getInventoryItems?.edges) return [];

    return inventoryData.getInventoryItems.edges
      .map((edge: any) => edge.node);
      // Note: Don't filter by quantityRemaining > 0 here, as critical items can have 0 quantity
  }, [inventoryData]);

  // Filter items by traffic light categories - must match useInventoryTrafficLight.ts logic exactly
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return inventoryItems;

    return inventoryItems.filter((item) => {
      const quantity = item.quantityRemaining || 0;

      switch (activeFilter) {
        case 'critical':
          // Critical items: 0 quantity OR ≤3 days remaining OR expired
          return quantity === 0 || item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3);
        case 'low':
          // Low stock items: 4-7 days remaining (only if quantity > 0)
          return quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7;
        case 'stocked':
          // Well-stocked items: >7 days remaining (only if quantity > 0)
          return quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7;
        case 'pending':
          // Pending delivery items
          return item.isPendingDelivery === true;
        default:
          return true;
      }
    });
  }, [inventoryItems, activeFilter]);

  // Calculate filter counts for badge display
  const filterSummary = useMemo(() => {
    const summary = {
      all: inventoryItems.length,
      critical: 0,
      low: 0,
      stocked: 0,
      pending: 0,
    };

    inventoryItems.forEach((item) => {
      const quantity = item.quantityRemaining || 0;

      // Critical: 0 quantity OR ≤3 days OR expired
      if (quantity === 0 || item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)) {
        summary.critical++;
      }
      // Low stock: 4-7 days (only if quantity > 0)
      else if (quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
        summary.low++;
      }
      // Well-stocked: >7 days (only if quantity > 0)
      else if (quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) {
        summary.stocked++;
      }

      // Pending delivery (independent category)
      if (item.isPendingDelivery === true) {
        summary.pending++;
      }
    });

    return summary;
  }, [inventoryItems]);

  // Get traffic light color for item
  const getItemColor = (item: InventoryItem) => {
    const quantity = item.quantityRemaining || 0;

    // Critical: 0 quantity OR ≤3 days OR expired
    if (quantity === 0 || item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)) {
      return NestSyncColors.trafficLight.critical;
    }
    // Low stock: 4-7 days
    if (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
      return NestSyncColors.trafficLight.low;
    }
    // Well-stocked: >7 days
    return NestSyncColors.trafficLight.stocked;
  };

  // Get status text for item
  const getStatusText = (item: InventoryItem) => {
    const quantity = item.quantityRemaining || 0;

    if (item.isPendingDelivery) {
      return 'Pending Delivery';
    }

    if (quantity === 0) {
      return 'Out of Stock';
    }

    if (item.isExpired) {
      return 'Expired';
    }

    if (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined) {
      if (item.daysUntilExpiry <= 3) {
        return `${item.daysUntilExpiry} days left`;
      }
      if (item.daysUntilExpiry <= 7) {
        return `${item.daysUntilExpiry} days left`;
      }
      return `${item.daysUntilExpiry} days left`;
    }

    return 'In Stock';
  };

  // Handle filter button press
  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Handle inventory item press
  const handleInventoryItemPress = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setEditModalVisible(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setSelectedInventoryItem(null);
  };

  // Handle edit success
  const handleEditSuccess = (message: string) => {
    console.log('Edit success:', message);
    setEditModalVisible(false);
    setSelectedInventoryItem(null);
    // The inventory query will automatically refetch due to the mutations' refetchQueries
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Inventory</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            Complete inventory management
          </ThemedText>
          <ThemedText style={[styles.supportiveText, { color: colors.textSecondary }]}>
            Track your supply with peace of mind
          </ThemedText>
        </ThemedView>

        {/* Filter Section */}
        <ThemedView style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            {['all', 'critical', 'low', 'stocked', 'pending'].map((filter) => {
              const filterType = filter as FilterType;
              const isActive = activeFilter === filterType;
              const count = filterSummary[filterType];

              return (
                <TouchableOpacity
                  key={filterType}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: isActive ? colors.tint : colors.surface,
                      borderColor: isActive ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => handleFilterPress(filterType)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filterType}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      { color: isActive ? colors.background : colors.text },
                    ]}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </ThemedText>
                  {count > 0 && (
                    <View style={[styles.filterBadge, { backgroundColor: isActive ? colors.background : colors.tint }]}>
                      <Text style={[styles.filterCount, { color: isActive ? colors.tint : colors.background }]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>

        {/* Inventory List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Loading State */}
          {inventoryLoading && (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading inventory...
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {inventoryError && (
            <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.error} />
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                Failed to load inventory. Please try again.
              </ThemedText>
            </View>
          )}

          {/* Empty State */}
          {!inventoryLoading && !inventoryError && filteredItems.length === 0 && (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="cube.box" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                {activeFilter === 'all' ? 'No Inventory Items' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Items`}
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeFilter === 'all'
                  ? 'Start tracking your diaper inventory by adding items from the home screen.'
                  : `You don't have any ${activeFilter} inventory items right now.`}
              </ThemedText>
            </View>
          )}

          {/* Inventory Items */}
          {!inventoryLoading && filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.inventoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleInventoryItemPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.brandName} ${formatDiaperSize(item.size)}, ${item.quantityRemaining} remaining`}
            >
              <View style={styles.inventoryCardHeader}>
                <View style={styles.inventoryCardTitleRow}>
                  <ThemedText type="defaultSemiBold" style={styles.inventoryCardTitle}>
                    {item.brandName}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getItemColor(item) }]}>
                    <ThemedText style={[styles.statusText, { color: colors.background }]}>
                      {getStatusText(item)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.inventoryCardSubtitle, { color: colors.textSecondary }]}>
                  {formatDiaperSize(item.size)}
                </ThemedText>
              </View>

              <View style={styles.inventoryCardStats}>
                <View style={styles.inventoryCardStat}>
                  <IconSymbol name="cube.box.fill" size={16} color={colors.textSecondary} />
                  <ThemedText style={[styles.inventoryCardStatText, { color: colors.textSecondary }]}>
                    {item.quantityRemaining} / {item.quantityPurchased} diapers
                  </ThemedText>
                </View>

                {item.isPendingDelivery && (
                  <View style={styles.inventoryCardStat}>
                    <IconSymbol name="shippingbox.fill" size={16} color={colors.accent} />
                    <ThemedText style={[styles.inventoryCardStatText, { color: colors.accent }]}>
                      Pending Delivery
                    </ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Inventory Summary */}
          {!inventoryLoading && filteredItems.length > 0 && (
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Inventory Summary
              </ThemedText>

              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.summaryHeader}>
                  <IconSymbol name="cube.box.fill" size={28} color={colors.accent} />
                  <ThemedText type="defaultSemiBold">Inventory Status</ThemedText>
                </View>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <ThemedText type="title" style={[styles.summaryStatNumber, { color: NestSyncColors.trafficLight.critical }]}>
                      {filterSummary.critical}
                    </ThemedText>
                    <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                      Critical
                    </ThemedText>
                  </View>
                  <View style={[styles.summaryStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryStatItem}>
                    <ThemedText type="title" style={[styles.summaryStatNumber, { color: NestSyncColors.trafficLight.low }]}>
                      {filterSummary.low}
                    </ThemedText>
                    <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                      Low Stock
                    </ThemedText>
                  </View>
                  <View style={[styles.summaryStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.summaryStatItem}>
                    <ThemedText type="title" style={[styles.summaryStatNumber, { color: NestSyncColors.trafficLight.stocked }]}>
                      {filterSummary.stocked}
                    </ThemedText>
                    <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                      Well Stocked
                    </ThemedText>
                  </View>
                </View>
              </View>
            </ThemedView>
          )}

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Edit Inventory Modal */}
        {selectedInventoryItem && (
          <EditInventoryModal
            visible={editModalVisible}
            onClose={handleEditModalClose}
            onSuccess={handleEditSuccess}
            inventoryItem={selectedInventoryItem}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 4,
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.85,
  },
  supportiveText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '400',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  inventoryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  inventoryCardHeader: {
    gap: 4,
  },
  inventoryCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  inventoryCardTitle: {
    fontSize: 18,
    flex: 1,
  },
  inventoryCardSubtitle: {
    fontSize: 14,
  },
  inventoryCardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  inventoryCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inventoryCardStatText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryStatItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  summaryStatNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
  },
});
