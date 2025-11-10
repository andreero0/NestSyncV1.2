import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors , NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GET_INVENTORY_ITEMS_QUERY } from '@/lib/graphql/queries';
import { useChildren } from '@/hooks/useChildren';
import { formatDiaperSize } from '@/utils/formatters';
import { EditInventoryModal } from '@/components/modals/EditInventoryModal';
import { ReorderSuggestionsContainer } from '@/components/reorder/ReorderSuggestionsContainer';
import { TrialProgressCard } from '@/components/reorder/TrialProgressCard';
import { useTrialDaysRemaining } from '@/components/reorder/TrialCountdownBanner';
import { PremiumUpgradeModal } from '@/components/reorder/PremiumUpgradeModal';
import { useAnalyticsAccess } from '@/hooks/useFeatureAccess';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import { useTrialOnboarding } from '@/hooks/useTrialOnboarding';
// Analytics imports temporarily disabled - preserved for future enhancement
// import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
// import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
// import {
//   ParentFriendlyProgressCard,
//   SimpleUsageIndicator,
//   ConsistencyCircle,
//   // Legacy complex components (commented out for parent-friendly experience)
//   // AnalyticsBarChart,
//   // AnalyticsLineChart,
//   // AnalyticsPieChart,
//   // AnalyticsProgressCard,
// } from '@/components/charts';
// import {
//   YourBabysPatternsCard,
//   SmartPredictionsCard,
//   SmartInsightsCard,
//   QuickActionsCard,
// } from '@/components/analytics';

type PlannerView = 'planner' | 'analytics' | 'inventory';
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
  const colors = Colors[colorScheme as keyof typeof Colors ?? 'light'];
  const params = useLocalSearchParams<{ filter?: FilterType; childId?: string; view?: PlannerView }>();
  
  // Persist planner state across navigation
  const [storedView, setStoredView] = useAsyncStorage('nestsync_planner_view');
  const [storedFilter, setStoredFilter] = useAsyncStorage('nestsync_planner_filter');
  
  // Initialize state from params OR stored values (params take precedence)
  const [currentView, setCurrentView] = useState<PlannerView>(
    params.view || (storedView as PlannerView) || 'planner'
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    params.filter || (storedFilter as FilterType) || 'all'
  );
  
  // Modal state for editing inventory items
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Premium upgrade modal state
  const [premiumUpgradeModalVisible, setPremiumUpgradeModalVisible] = useState(false);
  
  // Use childId from params or default to first child
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');

  // Analytics access and trial management
  const hasAnalyticsAccess = useAnalyticsAccess();
  const trialDaysRemaining = useTrialDaysRemaining();

  // Trial onboarding tooltips for analytics discovery
  const {
    showAnalyticsTooltip,
    canShowTooltips,
    TooltipComponent
  } = useTrialOnboarding();

  // Refs for tooltip positioning
  const analyticsButtonRef = useRef(null);
  const trialProgressCardRef = useRef(null);
  
  // Fetch children data using centralized hook
  const { children, loading: childrenLoading } = useChildren({ first: 10 });
  
  // Use the childId from params, stored value, or first available child
  const childId = params.childId || storedChildId || children?.[0]?.id || '';

  // Analytics hooks temporarily disabled - preserved for future enhancement
  // const {
  //   overview,
  //   usage,
  //   trends,
  //   inventory: inventoryInsights,
  //   loading: analyticsLoading,
  //   error: analyticsError,
  //   refetch: refetchAnalytics,
  // } = useAnalyticsDashboard(childId);

  // const {
  //   enhancedData,
  //   insights: enhancedInsights,
  //   loading: enhancedLoading,
  //   error: enhancedError,
  //   refetch: refetchEnhanced,
  // } = useEnhancedAnalytics({ childId });

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
    fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
  });
  
  // Auto-set stored child if we have a valid childId but no stored value
  useEffect(() => {
    if (childId && !storedChildId) {
      setStoredChildId(childId);
    }
  }, [childId, storedChildId, setStoredChildId]);

  // Persist view state when it changes
  useEffect(() => {
    setStoredView(currentView);
  }, [currentView, setStoredView]);

  // Persist filter state when it changes
  useEffect(() => {
    setStoredFilter(activeFilter);
  }, [activeFilter, setStoredFilter]);

  // Set filter from URL params when component mounts or params change
  useEffect(() => {
    // Always sync activeFilter with URL params when params change
    // This fixes the "Critical Items only works on second click" bug
    if (params.filter) {
      setActiveFilter(params.filter);
      // Switch to inventory view when navigating from traffic light cards
      if (params.filter !== 'all') {
        setCurrentView('inventory');
      }
    }
  }, [params.filter]);

  // Set view from URL params when component mounts or params change
  useEffect(() => {
    if (params.view) {
      setCurrentView(params.view);
    }
  }, [params.view]);

  // Show analytics discovery tooltip for trial users when they switch to analytics view
  useEffect(() => {
    if (canShowTooltips && currentView === 'analytics' && !hasAnalyticsAccess && trialProgressCardRef.current) {
      const timer = setTimeout(() => {
        showAnalyticsTooltip(trialProgressCardRef.current);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [canShowTooltips, currentView, hasAnalyticsAccess, showAnalyticsTooltip]);

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
          // Well stocked items: >7 days remaining (only if quantity > 0) OR no expiry data with quantity > 0
          return quantity > 0 && (
            (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) ||
            (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined)
          );
        case 'pending':
          return false; // Future functionality for pending orders
        default:
          return true;
      }
    });
  }, [inventoryItems, activeFilter]);
  
  // Generate filter summary - must match useInventoryTrafficLight.ts logic exactly
  const filterSummary = useMemo(() => {
    const counts = {
      all: inventoryItems.length,
      critical: inventoryItems.filter(item => {
        const quantity = item.quantityRemaining || 0;
        return quantity === 0 || item.isExpired || (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3);
      }).length,
      low: inventoryItems.filter(item => {
        const quantity = item.quantityRemaining || 0;
        return quantity > 0 && item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7;
      }).length,
      stocked: inventoryItems.filter(item => {
        const quantity = item.quantityRemaining || 0;
        return quantity > 0 && (
          (item.daysUntilExpiry !== null && item.daysUntilExpiry !== undefined && item.daysUntilExpiry > 7) ||
          (item.daysUntilExpiry === null || item.daysUntilExpiry === undefined)
        );
      }).length,
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
    if (item.isExpired || (item.daysUntilExpiry != null && item.daysUntilExpiry <= 3)) {
      return NestSyncColors.trafficLight.critical;
    }
    if (item.daysUntilExpiry != null && item.daysUntilExpiry >= 4 && item.daysUntilExpiry <= 7) {
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

  // Handle premium upgrade requirement from reorder component
  const handleUpgradeRequired = () => {
    setPremiumUpgradeModalVisible(true);
  };

  // Handle analytics navigation from trial progress card
  const handleAnalyticsNavigate = () => {
    setCurrentView('analytics');
    router.setParams({ view: 'analytics' });
  };

  // Handle learn more navigation from trial progress card
  const handleLearnMore = () => {
    router.push('/(subscription)/subscription-management');
  };

  // Handle premium upgrade modal close
  const handleUpgradeModalClose = () => {
    setPremiumUpgradeModalVisible(false);
  };

  // Handle successful premium upgrade
  const handleUpgradeSuccess = () => {
    setPremiumUpgradeModalVisible(false);
    // TODO: Refresh subscription status or refetch data
  };



  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Dashboard</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentView === 'planner' ? 'Upcoming tasks and insights' :
             currentView === 'analytics' ? 'Usage patterns and predictions' :
             'Inventory management'}
          </ThemedText>
        </ThemedView>

        {/* Canadian Trust Indicator - temporarily hidden with analytics */}

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
                    onPress={() => {
                      setActiveFilter(filterType);
                      router.setParams({ filter: filterType });
                    }}
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
        
        {/* View Toggle - Analytics temporarily hidden */}
        <ThemedView style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'planner' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => {
              setCurrentView('planner');
              router.setParams({ view: 'planner' });
            }}
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
            ref={analyticsButtonRef}
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'analytics' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => {
              setCurrentView('analytics');
              router.setParams({ view: 'analytics' });
            }}
            accessibilityRole="button"
            accessibilityLabel="Switch to analytics view"
          >
            <Text style={[
              styles.toggleText,
              { color: currentView === 'analytics' ? '#FFFFFF' : colors.text }
            ]}>
              Analytics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: currentView === 'inventory' ? colors.tint : colors.surface },
              { borderColor: colors.border }
            ]}
            onPress={() => {
              setCurrentView('inventory');
              router.setParams({ view: 'inventory' });
            }}
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
          {currentView === 'analytics' ? (
            /* Analytics View - Trial Progress or Premium Content */
            <ThemedView style={styles.section}>
              {!hasAnalyticsAccess ? (
                <View ref={trialProgressCardRef}>
                  <TrialProgressCard
                    daysRemaining={trialDaysRemaining}
                    totalTrialDays={14}
                    onUpgradePress={handleUpgradeRequired}
                    onAnalyticsNavigate={handleAnalyticsNavigate}
                    onLearnMorePress={handleLearnMore}
                    style={{ marginHorizontal: 0 }}
                  />
                </View>
              ) : (
                /* Premium Analytics Dashboard */
                <View style={[styles.comingSoonContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <IconSymbol
                    name="chart.line.uptrend.xyaxis"
                    size={48}
                    color={colors.tint}
                    style={styles.comingSoonIcon}
                  />
                  <ThemedText type="title" style={[styles.comingSoonTitle, { color: colors.text }]}>
                    Premium Analytics Dashboard
                  </ThemedText>
                  <ThemedText style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                    Your premium analytics experience is being finalized.
                  </ThemedText>
                  <ThemedText style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}>
                    Advanced pattern tracking, predictive insights, and optimization recommendations coming soon.
                  </ThemedText>
                  <View style={[styles.comingSoonBadge, { backgroundColor: colors.success }]}>
                    <ThemedText style={[styles.comingSoonBadgeText, { color: '#FFFFFF' }]}>
                      Premium Active
                    </ThemedText>
                  </View>
                </View>
              )}
            </ThemedView>
          ) : currentView === 'planner' ? (
            /* Planner View - Predictive Cards for Future Needs */
            <>
              {/* Smart Reorder Suggestions Section */}
              {childId && (
                <ThemedView style={styles.section}>
                  <View style={styles.plannerHeader}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                      Smart Reorder Suggestions
                    </ThemedText>
                    <ThemedText style={[styles.plannerSubtitle, { color: colors.textSecondary }]}>
                      AI-powered recommendations based on your usage patterns
                    </ThemedText>
                  </View>

                  {/* Compact Reorder Container */}
                  <View style={styles.reorderPreviewContainer}>
                    <ReorderSuggestionsContainer
                      childId={childId}
                      initialFilter="all"
                      context="planner"
                      onUpgradeRequired={handleUpgradeRequired}
                      compact={true}
                      limit={3}
                      showPagination={false}
                      footer={
                        <TouchableOpacity
                          onPress={() => router.push('/reorder-suggestions')}
                          style={[styles.viewAllButton, { backgroundColor: colors.tint }]}
                          accessibilityRole="button"
                          accessibilityLabel="View all reorder suggestions"
                        >
                          <IconSymbol name="arrow.right.circle.fill" size={20} color="#FFFFFF" />
                          <Text style={[styles.viewAllText, { color: '#FFFFFF' }]}>
                            View All Suggestions
                          </Text>
                        </TouchableOpacity>
                      }
                    />
                  </View>
                </ThemedView>
              )}

              {/* Upcoming Tasks Section */}
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
            </>
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
                      <ThemedText style={[styles.inventoryQuantity, { color: colors.text }]}>
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

        {/* Premium Upgrade Modal */}
        <PremiumUpgradeModal
          visible={premiumUpgradeModalVisible}
          onClose={handleUpgradeModalClose}
          onSuccess={handleUpgradeSuccess}
          feature="analytics"
        />

        {/* Trial Onboarding Tooltips */}
        {TooltipComponent}
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
    marginBottom: 24,
    lineHeight: 24,
    fontWeight: '400',
    opacity: 0.85,
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
  filterCount: {
    fontSize: 14,
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: -0.01,
    lineHeight: 32,
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
    lineHeight: 24,
  },
  inventoryQuantity: {
    fontSize: 16,
    lineHeight: 24,
  },
  inventoryStatus: {
    alignItems: 'flex-end',
  },
  inventoryDays: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
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
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  predictionContent: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  predictionSubtitle: {
    fontSize: 12,
  },
  predictionDetails: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  predictionConfidence: {
    fontSize: 12,
    marginBottom: 16,
  },
  predictionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  predictionButtonSecondary: {
    borderWidth: 1,
  },
  predictionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Planner-specific styles
  plannerHeader: {
    marginBottom: 16,
  },
  plannerSubtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 24,
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
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  plannerCardDate: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 20,
  },
  plannerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  plannerStatusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Analytics-specific styles
  statsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  insightTitle: {
    flex: 1,
    fontSize: 16,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  insightMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  chartSpacing: {
    height: 20,
  },
  trendInsights: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  costCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  costTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  costStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  costItem: {
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Design-specified chart visualization styles
  peakHoursCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  peakHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  peakHoursInsight: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  peakHoursDescription: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  consistencyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  consistencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  consistencyInsight: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  trendsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  trendAnalysisContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  trendAnalysisText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  trendContextText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  costAnalysisCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  costAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  costMetricsContainer: {
    marginBottom: 16,
  },
  costMetricMain: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  costMetricSecondary: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  costEfficiency: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  savingsPlanButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  savingsPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced Canadian Trust Indicator Styles
  enhancedTrustIndicator: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#DC2626',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  enhancedCanadianFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  trustTextContainer: {
    flex: 1,
  },
  trustMainText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  trustSubText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.9,
  },
  trustShield: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  shieldText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  // Enhanced Card Design System
  enhancedPeakHoursCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedConsistencyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedTrendsCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  enhancedCostAnalysisCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
  },
  cleanIcon: {
    marginRight: 4,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardTitleContainer: {
    flex: 1,
  },
  enhancedCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  insightContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  enhancedInsightText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  confidenceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  successBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  costMetricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  efficiencyBadge: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  efficiencyText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  enhancedSavingsContainer: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  savingsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  savingsContent: {
    flex: 1,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  savingsDescription: {
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedSavingsPlanButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0891B2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  enhancedButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  // Coming Soon styles
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 40,
    marginBottom: 40,
  },
  comingSoonIcon: {
    marginBottom: 24,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoonSubtext: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  comingSoonBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  comingSoonBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Reorder Preview Styles
  reorderPreviewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    marginHorizontal: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});