import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ChildSelector } from '@/components/ui/ChildSelector';
import { StatusOverviewGrid } from '@/components/cards/StatusOverviewGrid';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import { useInventoryTrafficLight } from '@/hooks/useInventoryTrafficLight';
import { useCurrentFamily, useFamilyPresence } from '@/lib/graphql/collaboration-hooks';
import DevOnboardingReset from '@/components/dev/DevOnboardingReset';
import { GET_USAGE_LOGS_QUERY, GET_DASHBOARD_STATS_QUERY } from '@/lib/graphql/queries';
import { useChildren } from '@/hooks/useChildren';
import { formatTimeAgo, safeFormatTimeAgo, formatDiaperSize, formatFieldName, getTimeBasedGreeting } from '@/utils/formatters';
import { QuickLogModal } from '@/components/modals/QuickLogModal';
import { AddInventoryModal } from '@/components/modals/AddInventoryModal';
import { AddChildModal } from '@/components/modals/AddChildModal';
import PresenceIndicators from '@/components/collaboration/PresenceIndicators';

const { width } = Dimensions.get('window');

interface DashboardStats {
  daysRemaining: number;
  diapersLeft: number;
  lastChange: string;
  todayChanges: number;
  currentSize: string;
}

interface RecentActivity {
  id: string;
  time: string;
  type: 'diaper-change' | 'inventory-update' | 'size-change';
  description: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State for selected child with persistence
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');
  
  // Modal state
  const [quickLogModalVisible, setQuickLogModalVisible] = useState(false);
  const [addInventoryModalVisible, setAddInventoryModalVisible] = useState(false);
  const [addChildModalVisible, setAddChildModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // GraphQL queries - using centralized useChildren hook
  const { children, loading: childrenLoading } = useChildren({
    first: 10,
    pollInterval: 30000 // Poll every 30 seconds for real-time updates
  });

  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError 
  } = useQuery(GET_DASHBOARD_STATS_QUERY, {
    variables: { childId: selectedChildId },
    skip: !selectedChildId,
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  const { 
    data: usageLogsData, 
    loading: usageLogsLoading 
  } = useQuery(GET_USAGE_LOGS_QUERY, {
    variables: { 
      childId: selectedChildId,
      usageType: 'DIAPER_CHANGE',
      daysBack: 7,
      limit: 10 
    },
    skip: !selectedChildId,
    pollInterval: 30000, // Poll every 30 seconds
  });

  // Traffic Light Dashboard Data
  const {
    cardData: trafficLightCards,
    trafficLightData,
    loading: trafficLightLoading,
    error: trafficLightError
  } = useInventoryTrafficLight(selectedChildId);

  // Collaboration data
  const { currentFamily, currentFamilyId } = useCurrentFamily();
  const familyPresence = useFamilyPresence(currentFamilyId);

  // Initialize selected child from storage or default to first child
  useEffect(() => {
    if (children.length > 0) {
      // Try to use stored child ID first
      if (storedChildId && children.find(child => child.id === storedChildId)) {
        if (selectedChildId !== storedChildId) {
          setSelectedChildId(storedChildId);
        }
      } else if (!selectedChildId && children.length > 0) {
        // Default to first child if no stored selection
        const firstChildId = children[0].id;
        setSelectedChildId(firstChildId);
        setStoredChildId(firstChildId);
      }
    }
  }, [children, selectedChildId, storedChildId, setStoredChildId]);

  // Handle child selection with persistence
  const handleChildSelect = async (childId: string) => {
    setSelectedChildId(childId);
    await setStoredChildId(childId);
  };

  // Process dashboard stats with fallback
  const dashboardStats: DashboardStats = dashboardData?.getDashboardStats ? {
    daysRemaining: dashboardData.getDashboardStats.daysRemaining || 0,
    diapersLeft: dashboardData.getDashboardStats.diapersLeft || 0,
    lastChange: dashboardData.getDashboardStats.lastChange || 'No data',
    todayChanges: dashboardData.getDashboardStats.todayChanges || 0,
    currentSize: dashboardData.getDashboardStats.currentSize || 'Unknown'
  } : {
    // Fallback data when loading or no child selected
    daysRemaining: dashboardLoading ? 0 : 12,
    diapersLeft: dashboardLoading ? 0 : 24,
    lastChange: dashboardLoading ? 'Loading...' : new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    todayChanges: dashboardLoading ? 0 : 5,
    currentSize: dashboardLoading ? 'Loading...' : 'Size 2'
  };

  // Process recent activity from usage logs with limit
  const recentActivity: RecentActivity[] = useMemo(() => {
    const activities = usageLogsData?.getUsageLogs?.edges?.map((edge, index) => {
      const log = edge.node;
      // Generate safe ID with better fallback
      const safeId = log.id || `activity-${Date.now()}-${index}`;

      return {
        id: safeId,
        time: safeFormatTimeAgo(log.loggedAt, 'recent-activity'),
        type: 'diaper-change' as const,
        description: getChangeDescription(log.wasWet, log.wasSoiled, log.notes, log.caregiverName)
      };
    }) || [];

    // Limit to first 5 activities for performance
    return activities.slice(0, 5);
  }, [usageLogsData]);

  // Show loading message when no data is available
  // Enhanced state management
  const showEmptyState = !usageLogsLoading && recentActivity.length === 0;
  const showLoadingState = usageLogsLoading && selectedChildId;
  const noChildrenState = !childrenLoading && children.length === 0;
  const hasMultipleChildren = children.length > 1;

  // Check if there are more activities to show
  const hasMoreActivities = usageLogsData?.getUsageLogs?.edges?.length > 5;

  // Helper function to get change description with caregiver attribution
  function getChangeDescription(wasWet?: boolean, wasSoiled?: boolean, notes?: string, caregiverName?: string): string {
    const caregiver = caregiverName || 'Someone';
    let description = `${caregiver} changed diaper`;

    if (wasWet && wasSoiled) {
      description += ' - wet + soiled';
    } else if (wasWet) {
      description += ' - wet';
    } else if (wasSoiled) {
      description += ' - soiled';
    }

    if (notes) {
      description += ` (${notes})`;
    }

    return description;
  }

  // Handle success messages from modals
  const handleModalSuccess = (message: string) => {
    setSuccessMessage(message);
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Determine if actions should be disabled
  const actionsDisabled = !selectedChildId || childrenLoading || dashboardLoading;

  // Quick Actions with better state handling
  const quickActions: QuickAction[] = [
    {
      id: 'log-change',
      title: 'Log Change',
      icon: 'plus.circle.fill',
      color: actionsDisabled ? colors.textSecondary : colors.tint,
      onPress: () => {
        if (actionsDisabled) {
          Alert.alert(
            'Please Wait',
            selectedChildId ? 'Loading child data...' : 'Please select a child first',
            [{ text: 'OK' }]
          );
          return;
        }
        setQuickLogModalVisible(true);
      }
    },
    {
      id: 'add-inventory',
      title: 'Add Stock',
      icon: 'cube.box.fill',
      color: actionsDisabled ? colors.textSecondary : colors.success,
      onPress: () => {
        if (actionsDisabled) {
          Alert.alert(
            'Please Wait',
            selectedChildId ? 'Loading child data...' : 'Please select a child first',
            [{ text: 'OK' }]
          );
          return;
        }
        setAddInventoryModalVisible(true);
      }
    },
    {
      id: 'view-timeline',
      title: 'Timeline',
      icon: 'clock.fill',
      color: actionsDisabled ? colors.textSecondary : colors.accent,
      onPress: () => {
        if (actionsDisabled) return;
        Alert.alert('Coming Soon', 'Timeline view will be available in a future update!');
      }
    },
    {
      id: 'size-check',
      title: 'Size Guide',
      icon: 'ruler.fill',
      color: actionsDisabled ? colors.textSecondary : colors.premium,
      onPress: () => {
        if (actionsDisabled) return;
        Alert.alert('Coming Soon', 'Diaper size guide will be available in a future update!');
      }
    }
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diaper-change':
        return 'checkmark.circle.fill';
      case 'inventory-update':
        return 'cube.box.fill';
      case 'size-change':
        return 'arrow.up.circle.fill';
      default:
        return 'circle.fill';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'diaper-change':
        return colors.success;
      case 'inventory-update':
        return colors.tint;
      case 'size-change':
        return colors.accent;
      default:
        return colors.textSecondary;
    }
  };

  // Optimized Activity Item Component with React.memo
  const ActivityItem = React.memo<{ item: RecentActivity; colors: any }>(
    function ActivityItemComponent({ item, colors }) {
      return (
      <View
        style={[styles.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.activityIcon}>
          <IconSymbol 
            name={getActivityIcon(item.type)} 
            size={20} 
            color={getActivityColor(item.type)} 
          />
        </View>
        <View style={styles.activityContent}>
          <ThemedText type="defaultSemiBold" style={styles.activityDescription}>
            {item.description}
          </ThemedText>
          <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
            {item.time}
          </ThemedText>
        </View>
      </View>
      );
    },
    (prevProps, nextProps) => {
      return prevProps.item.id === nextProps.item.id && 
             prevProps.item.time === nextProps.item.time &&
             prevProps.item.description === nextProps.item.description;
    }
  );


  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Message */}
          {successMessage && (
            <View style={[styles.successMessage, { backgroundColor: colors.success }]}>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.successMessageText}>
                {successMessage}
              </ThemedText>
            </View>
          )}

          {/* Header */}
          <ThemedView style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextContainer}>
                <ThemedText type="title" style={styles.headerTitle}>
                  {getTimeBasedGreeting()}
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {childrenLoading ? 'Loading child information...' :
                   selectedChildId && children.length > 0 ?
                   (() => {
                     const selectedChild = children.find(child => child.id === selectedChildId);
                     return selectedChild ? `Here's how ${selectedChild.name} is doing` : "Here's how your little one is doing";
                   })() :
                   "Here's how your little one is doing"}
                </ThemedText>
              </View>
              
              {/* Child Selector - only show if multiple children */}
              {hasMultipleChildren && (
                <View style={styles.childSelectorContainer}>
                  <ChildSelector
                    children={children}
                    selectedChildId={selectedChildId}
                    onChildSelect={handleChildSelect}
                    loading={childrenLoading}
                    disabled={childrenLoading}
                  />
                </View>
              )}
            </View>
          </ThemedView>

          {/* No Children State */}
          {noChildrenState && (
            <ThemedView style={[styles.noChildrenContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="figure.2.and.child.holdinghands" size={48} color={colors.textSecondary} />
              <ThemedText type="title" style={[styles.noChildrenTitle, { color: colors.text }]}>
                No Children Added
              </ThemedText>
              <ThemedText style={[styles.noChildrenText, { color: colors.textSecondary }]}>
                You haven't added any children to your account yet. Complete the onboarding process to add your first child and start tracking diaper usage.
              </ThemedText>
              <TouchableOpacity
                style={[styles.noChildrenButton, { backgroundColor: colors.tint }]}
                onPress={() => setAddChildModalVisible(true)}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.noChildrenButtonText}>
                  Add Child
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}

          {/* Presence Indicators - show active caregivers when collaboration is enabled */}
          {!noChildrenState && currentFamily && (
            <PresenceIndicators
              childId={selectedChildId}
              compact={false}
              showDetails={true}
            />
          )}

          {/* Traffic Light Dashboard - only show when children exist */}
          {!noChildrenState && (
            <ThemedView style={styles.trafficLightSection}>
              {/* Section Header */}
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Inventory Status
              </ThemedText>
              
              {/* Loading state for traffic light data */}
              {(childrenLoading || trafficLightLoading) && (
                <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.tint} />
                  <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading inventory status...
                  </ThemedText>
                </View>
              )}
              
              {/* Error state for traffic light data */}
              {trafficLightError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
                  <ThemedText style={[styles.errorText, { color: colors.error }]}>
                    Unable to load inventory data. Please try again.
                  </ThemedText>
                </View>
              )}
              
              {/* 4-Card Traffic Light System */}
              {!trafficLightLoading && !trafficLightError && (
                <StatusOverviewGrid cards={trafficLightCards} />
              )}
              
              {/* Legacy Dashboard Stats - Keep for additional metrics */}
              {dashboardData?.getDashboardStats && (
                <View style={styles.legacyStatsRow}>
                  <View style={styles.legacyStatItem}>
                    <ThemedText style={[styles.legacyStatLabel, { color: colors.textSecondary }]}>
                      Days Remaining
                    </ThemedText>
                    <ThemedText style={[styles.legacyStatValue, { color: colors.text }]}>
                      {dashboardStats.daysRemaining}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.legacyStatItem}>
                    <ThemedText style={[styles.legacyStatLabel, { color: colors.textSecondary }]}>
                      Today's Changes
                    </ThemedText>
                    <ThemedText style={[styles.legacyStatValue, { color: colors.text }]}>
                      {dashboardStats.todayChanges}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.legacyStatItem}>
                    <ThemedText style={[styles.legacyStatLabel, { color: colors.textSecondary }]}>
                      Current Size
                    </ThemedText>
                    <ThemedText style={[styles.legacyStatValue, { color: colors.text }]}>
                      {formatDiaperSize(dashboardStats.currentSize)}
                    </ThemedText>
                  </View>
                </View>
              )}
            </ThemedView>
          )}

          <ThemedView style={styles.section}>
            {/* Quick Actions Section */}
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.quickActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={action.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <IconSymbol name={action.icon} size={24} color={action.color} />
                  <ThemedText style={[styles.quickActionText, { color: colors.text }]}>
                    {action.title}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>

          {/* Recent Activity */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Activity
            </ThemedText>
            
            {/* Loading state for recent activity */}
            {showLoadingState && (
              <View style={[styles.activityLoadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.tint} />
                <ThemedText style={[styles.activityLoadingText, { color: colors.textSecondary }]}>
                  Loading recent activity...
                </ThemedText>
              </View>
            )}
            
            {/* Empty state */}
            {showEmptyState && (
              <View style={[styles.emptyActivityContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name="clock.fill" size={24} color={colors.textSecondary} />
                <ThemedText type="defaultSemiBold" style={[styles.emptyActivityTitle, { color: colors.text }]}>
                  No recent activity
                </ThemedText>
                <ThemedText style={[styles.emptyActivityText, { color: colors.textSecondary }]}>
                  Start logging diaper changes to see activity here
                </ThemedText>
              </View>
            )}
            
            {/* Activity items - Optimized rendering with map */}
            {recentActivity.map((activity) => (
              <ActivityItem key={activity.id} item={activity} colors={colors} />
            ))}

            {/* View All Button - Show only if there are more activities */}
            {hasMoreActivities && (
              <TouchableOpacity
                style={[styles.viewAllButton, { borderColor: colors.border }]}
                onPress={() => Alert.alert('Coming Soon', 'Full activity timeline will be available in a future update!')}
                accessibilityRole="button"
                accessibilityLabel="View all activity"
              >
                <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
                  View All Activity ({usageLogsData?.getUsageLogs?.edges?.length || 0} total)
                </ThemedText>
                <IconSymbol name="chevron.right" size={16} color={colors.tint} />
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Current Status */}
          <ThemedView style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
              <ThemedText type="defaultSemiBold" style={styles.statusTitle}>
                Current Status
              </ThemedText>
            </View>
            <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
              Using {formatDiaperSize(dashboardStats.currentSize)} • Last change {safeFormatTimeAgo(dashboardStats.lastChange, 'status-card')} • On track with schedule
            </ThemedText>
          </ThemedView>

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Your data is securely stored in Canada
            </ThemedText>
          </ThemedView>

          {/* Development-only onboarding reset tool */}
          <DevOnboardingReset />

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Modals */}
        <QuickLogModal
          visible={quickLogModalVisible}
          onClose={() => setQuickLogModalVisible(false)}
          onSuccess={handleModalSuccess}
          childId={selectedChildId}
        />
        
        <AddInventoryModal
          visible={addInventoryModalVisible}
          onClose={() => setAddInventoryModalVisible(false)}
          onSuccess={handleModalSuccess}
          childId={selectedChildId}
        />
        
        <AddChildModal
          visible={addChildModalVisible}
          onClose={() => setAddChildModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
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
  childSelectorContainer: {
    paddingTop: 4,
    minWidth: 120,
  },
  statsContainer: {
    marginBottom: 24,
  },
  trafficLightSection: {
    marginBottom: 24,
  },
  legacyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legacyStatItem: {
    alignItems: 'center',
  },
  legacyStatLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  legacyStatValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statCardLarge: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statCardSmall: {
    width: (width - 52) / 2, // Responsive width for small stat cards
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statLabel: {
    fontSize: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 14,
  },
  statText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 52) / 2, // Responsive width accounting for padding and gap
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIcon: {
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 16,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  statusTitle: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
    justifyContent: 'center',
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
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  activityLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  activityLoadingText: {
    fontSize: 14,
  },
  emptyActivityContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActivityText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // No children state
  noChildrenContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
    gap: 16,
  },
  noChildrenTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  noChildrenText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  noChildrenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  noChildrenButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
