import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GET_INVENTORY_ITEMS_QUERY, MY_CHILDREN_QUERY } from '@/lib/graphql/queries';
import { NestSyncColors } from '@/constants/Colors';
import { formatDiaperSize } from '@/utils/formatters';
import { EditInventoryModal } from '@/components/modals/EditInventoryModal';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';

type PlannerView = 'planner' | 'inventory';
type FilterType = 'all' | 'critical' | 'low' | 'stocked' | 'pending';

interface PlannerItem {
  id: string;
  date: string;
  type: 'diaper-change' | 'inventory-reminder' | 'size-prediction';
  title: string;
  description?: string;
  status: 'completed' | 'upcoming' | 'overdue';
}

interface InventoryItem {
  id: string;
  childId: string;
  productType: string;
  brand: string;
  productName?: string;
  size: string;
  quantityTotal: number;
  quantityRemaining: number;
  quantityReserved: number;
  purchaseDate: string;
  costCad?: number;
  expiryDate?: string;
  storageLocation?: string;
  isOpened: boolean;
  openedDate?: string;
  notes?: string;
  qualityRating?: number;
  wouldRebuy?: boolean;
  createdAt: string;
  quantityAvailable: number;
  usagePercentage: number;
  isExpired: boolean;
  daysUntilExpiry?: number;
}

export default function PlannerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams<{ filter?: FilterType; childId?: string }>();
  
  const [currentView, setCurrentView] = useState<PlannerView>('planner');
  const [activeFilter, setActiveFilter] = useState<FilterType>(params.filter || 'all');
  
  // Modal state for editing inventory items
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Use childId from params or default to first child
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');
  
  // Fetch children data
  const { data: childrenData, loading: childrenLoading } = useQuery(MY_CHILDREN_QUERY, {
    variables: { first: 10 },
  });
  
  // Use the childId from params, stored value, or first available child
  const childId = params.childId || storedChildId || childrenData?.myChildren?.edges?.[0]?.node?.id || '';

  // Fetch inventory data
  const { 
    data: inventoryData, 
    loading: inventoryLoading, 
    error: inventoryError 
  } = useQuery(GET_INVENTORY_ITEMS_QUERY, {
    variables: { 
      childId,
      productType: 'DIAPER',
      limit: 500
    },
    skip: !childId,
    pollInterval: 30000,
  });
  
  // Auto-set stored child if we have a valid childId but no stored value
  useEffect(() => {
    if (childId && !storedChildId) {
      setStoredChildId(childId);
    }
  }, [childId, storedChildId, setStoredChildId]);

  // Set filter from URL params when component mounts or params change
  useEffect(() => {
    if (params.filter && params.filter !== activeFilter) {
      setActiveFilter(params.filter);
      // Switch to inventory view when navigating from traffic light cards
      if (params.filter !== 'all') {
        setCurrentView('inventory');
      }
    }
  }, [params.filter]);


  // Process inventory items into categories
  const inventoryItems: InventoryItem[] = useMemo(() => {
    if (!inventoryData?.getInventoryItems?.edges) return [];
    
    return inventoryData.getInventoryItems.edges
      .map((edge: any) => edge.node)
      .filter((item: InventoryItem) => item.quantityRemaining > 0);
  }, [inventoryData]);
  
  // Filter items by traffic light categories
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return inventoryItems;
    
    return inventoryItems.filter((item) => {
      switch (activeFilter) {
        case 'critical':
          return item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3);
        case 'low':
          return item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7;
        case 'stocked':
          return (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) || 
                 item.daysUntilExpiry === null || 
                 item.daysUntilExpiry === undefined;
        case 'pending':
          return false; // Future functionality for pending orders
        default:
          return true;
      }
    });
  }, [inventoryItems, activeFilter]);
  
  // Generate filter summary
  const filterSummary = useMemo(() => {
    const counts = {
      all: inventoryItems.length,
      critical: inventoryItems.filter(item => 
        item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3)
      ).length,
      low: inventoryItems.filter(item => 
        item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7
      ).length,
      stocked: inventoryItems.filter(item => 
        (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) ||
        item.daysUntilExpiry === null || 
        item.daysUntilExpiry === undefined
      ).length,
      pending: 0
    };
    
    return counts;
  }, [inventoryItems]);
  
  // Sample timeline data - keeping existing functionality
  const plannerItems: PlannerItem[] = [
    {
      id: '1',
      date: '2024-01-15',
      type: 'diaper-change',
      title: 'Next Diaper Change',
      description: 'Based on usual schedule',
      status: 'upcoming'
    },
    {
      id: '2', 
      date: '2024-01-16',
      type: 'inventory-reminder',
      title: 'Running Low on Size 2',
      description: '3 days remaining at current usage',
      status: 'upcoming'
    },
    {
      id: '3',
      date: '2024-01-20',
      type: 'size-prediction',
      title: 'Consider Size 3 Soon',
      description: 'Based on growth patterns',
      status: 'upcoming'
    }
  ];

  const getItemIcon = (type: PlannerItem['type']) => {
    switch (type) {
      case 'diaper-change':
        return 'clock.fill';
      case 'inventory-reminder':
        return 'exclamationmark.triangle.fill';
      case 'size-prediction':
        return 'chart.line.uptrend.xyaxis';
      default:
        return 'calendar';
    }
  };

  const getItemColor = (status: PlannerItem['status']) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'upcoming':
        return colors.info;
      case 'overdue':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };
  
  // Helper functions for inventory display
  const getFilterColor = (filter: FilterType) => {
    switch (filter) {
      case 'critical':
        return NestSyncColors.trafficLight.critical;
      case 'low':
        return NestSyncColors.trafficLight.low;
      case 'stocked':
        return NestSyncColors.trafficLight.stocked;
      case 'pending':
        return NestSyncColors.trafficLight.pending;
      default:
        return colors.tint;
    }
  };
  
  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'critical':
        return 'Critical Items';
      case 'low':
        return 'Low Stock';
      case 'stocked':
        return 'Well Stocked';
      case 'pending':
        return 'Pending Orders';
      default:
        return 'All Items';
    }
  };
  
  const getDaysLabel = (item: InventoryItem) => {
    if (item.isExpired) return 'EXPIRED';
    if (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined) return 'No expiry data';
    if (item.daysUntilExpiry <= 0) return 'Expires today';
    if (item.daysUntilExpiry === 1) return '1 day left';
    return `${item.daysUntilExpiry} days left`;
  };
  
  const getDaysColor = (item: InventoryItem) => {
    if (item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry <= 3)) {
      return NestSyncColors.trafficLight.critical;
    }
    if (item.daysUntilExpiry !== null && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
      return NestSyncColors.trafficLight.low;
    }
    return NestSyncColors.trafficLight.stocked;
  };

  // Handler functions for inventory item interaction
  const handleInventoryItemPress = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setSelectedInventoryItem(null);
  };

  const handleEditSuccess = (message: string) => {
    // Show success feedback (could add toast notification here)
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
          <ThemedText type="title" style={styles.headerTitle}>Planner</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentView === 'planner' ? 'Planning and inventory management' : 'Filtered inventory view'}
          </ThemedText>
        </ThemedView>

        {/* Filter Toggle - only show in inventory view */}
        {currentView === 'inventory' && (
          <ThemedView style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
              {['all', 'critical', 'low', 'stocked', 'pending'].map((filter) => {
                const filterType = filter as FilterType;
                const isActive = activeFilter === filterType;
                const count = filterSummary[filterType];
                
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: isActive ? getFilterColor(filterType) : colors.surface,
                        borderColor: isActive ? getFilterColor(filterType) : colors.border
                      }
                    ]}
                    onPress={() => setActiveFilter(filterType)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${getFilterLabel(filterType)}`}
                  >
                    <Text style={[
                      styles.filterText,
                      { color: isActive ? '#FFFFFF' : colors.text }
                    ]}>
                      {getFilterLabel(filterType)}
                    </Text>
                    {count > 0 && (
                      <Text style={[
                        styles.filterCount,
                        { color: isActive ? '#FFFFFF' : colors.textSecondary }
                      ]}>
                        ({count})
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ThemedView>
        )}
        
        {/* View Toggle */}
        <ThemedView style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'planner' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('planner')}
            accessibilityRole="button"
            accessibilityLabel="Switch to planner view"
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'planner' ? '#FFFFFF' : colors.text }
            ]}>
              Planner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'inventory' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => setCurrentView('inventory')}
            accessibilityRole="button"
            accessibilityLabel="Switch to inventory view"
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'inventory' ? '#FFFFFF' : colors.text }
            ]}>
              Inventory
            </Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Timeline Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentView === 'planner' ? (
            /* Planner View - Predictive Cards for Future Needs */
            <ThemedView style={styles.section}>
              {/* Planner Header */}
              <View style={styles.plannerHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Upcoming Tasks
                </ThemedText>
                <ThemedText style={[styles.plannerSubtitle, { color: colors.textSecondary }]}>
                  Based on your patterns and inventory
                </ThemedText>
              </View>

              {/* Planner Cards */}
              {plannerItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.plannerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.description}. Status: ${item.status}.`}
                >
                  <View style={styles.plannerCardHeader}>
                    <View style={[styles.plannerIconContainer, { backgroundColor: getItemColor(item.status) + '15' }]}>
                      <IconSymbol 
                        name={getItemIcon(item.type) as any} 
                        size={24} 
                        color={getItemColor(item.status)} 
                      />
                    </View>
                    
                    <View style={styles.plannerCardContent}>
                      <ThemedText type="defaultSemiBold" style={[styles.plannerCardTitle, { color: colors.text }]}>
                        {item.title}
                      </ThemedText>
                      {item.description && (
                        <ThemedText style={[styles.plannerCardDescription, { color: colors.textSecondary }]}>
                          {item.description}
                        </ThemedText>
                      )}
                      <ThemedText style={[styles.plannerCardDate, { color: colors.textSecondary }]}>
                        {new Date(item.date).toLocaleDateString('en-CA', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </ThemedText>
                    </View>

                    <View style={[styles.plannerStatusBadge, { backgroundColor: getItemColor(item.status) }]}>
                      <ThemedText style={[styles.plannerStatusText, { color: '#FFFFFF' }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ThemedView>
          ) : (
            /* Inventory View - Filtered Items */
            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {getFilterLabel(activeFilter)} {activeFilter !== 'all' && `(${filteredItems.length} items)`}
              </ThemedText>
              
              {/* Loading state */}
              {inventoryLoading && (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading inventory...
                  </ThemedText>
                </View>
              )}
              
              {/* Error state */}
              {inventoryError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                  <ThemedText style={[styles.errorText, { color: colors.error }]}>
                    Unable to load inventory. Please try again.
                  </ThemedText>
                </View>
              )}
              
              {/* Empty state */}
              {!inventoryLoading && !inventoryError && filteredItems.length === 0 && (
                <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol 
                    name={activeFilter === 'critical' ? 'checkmark.circle.fill' : 'cube.box.fill'} 
                    size={32} 
                    color={colors.textSecondary} 
                  />
                  <ThemedText type="defaultSemiBold" style={[styles.emptyTitle, { color: colors.text }]}>
                    {activeFilter === 'critical' ? 'Great job!' : 
                     activeFilter === 'low' ? 'No low stock items' :
                     activeFilter === 'pending' ? 'No pending orders' :
                     'No inventory found'}
                  </ThemedText>
                  <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {activeFilter === 'critical' ? 'No critical items need attention right now' :
                     activeFilter === 'low' ? 'All your items are well stocked' :
                     activeFilter === 'pending' ? 'You have no orders in transit' :
                     'Add some inventory to start tracking'}
                  </ThemedText>
                </View>
              )}
              
              {/* Inventory items */}
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.inventoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleInventoryItemPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.brand} ${formatDiaperSize(item.size)} diapers, ${item.quantityRemaining} remaining. Tap to edit or delete.`}
                  accessibilityHint="Double tap to open edit modal"
                >
                  <View style={styles.inventoryHeader}>
                    <View style={styles.inventoryInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.inventoryTitle}>
                        {item.brand} {formatDiaperSize(item.size)}
                      </ThemedText>
                      <ThemedText style={[styles.inventoryQuantity, { color: colors.textSecondary }]}>
                        {item.quantityRemaining} diapers remaining
                      </ThemedText>
                    </View>
                    <View style={styles.inventoryStatus}>
                      <ThemedText style={[styles.inventoryDays, { color: getDaysColor(item) }]}>
                        {getDaysLabel(item)}
                      </ThemedText>
                    </View>
                    <IconSymbol 
                      name="chevron.right" 
                      size={16} 
                      color={colors.textSecondary} 
                      style={styles.inventoryChevron}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </ThemedView>
          )}

          {/* Filter Summary - only show when in inventory view */}
          {currentView === 'inventory' && (
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
                  <View style={styles.summaryStatDivider} />
                  <View style={styles.summaryStatItem}>
                    <ThemedText type="title" style={[styles.summaryStatNumber, { color: NestSyncColors.trafficLight.low }]}>
                      {filterSummary.low}
                    </ThemedText>
                    <ThemedText style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>
                      Low Stock
                    </ThemedText>
                  </View>
                  <View style={styles.summaryStatDivider} />
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

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Data stored securely in Canada
            </ThemedText>
          </ThemedView>

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
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
    fontSize: 14,
    fontWeight: '600',
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  plannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemIconContainer: {
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  inventoryItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  inventoryQuantity: {
    fontSize: 14,
  },
  inventoryStatus: {
    alignItems: 'flex-end',
  },
  inventoryDays: {
    fontSize: 14,
    fontWeight: '600',
  },
  inventoryChevron: {
    marginLeft: 12,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Planner-specific styles
  plannerHeader: {
    marginBottom: 16,
  },
  plannerSubtitle: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  plannerCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plannerCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  plannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  plannerCardContent: {
    flex: 1,
    gap: 4,
  },
  plannerCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  plannerCardDescription: {
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.9,
  },
  plannerCardDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  plannerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  plannerStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});