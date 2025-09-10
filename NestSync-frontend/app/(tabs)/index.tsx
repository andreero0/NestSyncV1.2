import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, NetworkStatus } from '@apollo/client';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ChildSelector } from '@/components/ui/ChildSelector';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import DevOnboardingReset from '@/components/dev/DevOnboardingReset';
import { MY_CHILDREN_QUERY, GET_USAGE_LOGS_QUERY } from '@/lib/graphql/queries';
import { GET_DASHBOARD_STATS_QUERY, LOG_DIAPER_CHANGE_MUTATION } from '@/lib/graphql/mutations';
import { QuickLogModal } from '@/components/modals/QuickLogModal';
import { AddInventoryModal } from '@/components/modals/AddInventoryModal';
import { InventoryDetailModal } from '@/components/modals/InventoryDetailModal';
import { AddChildModal } from '@/components/modals/AddChildModal';
import { ChangingReadinessCard } from '@/components/ui/ChangingReadinessCard';
import { DiapersCard, WipesCard } from '@/components/ui/SupplyBreakdownCard';
import { formatDiaperSize, formatFieldWithFallback } from '@/lib/utils/enumDisplayFormatters';
import { UnifiedErrorHandler } from '@/components/common/UnifiedErrorHandler';
import { 
  useErrorStore, 
  createNetworkError, 
  createDataError, 
  ErrorSeverity, 
  ErrorSource 
} from '@/stores/errorStore';

const { width } = Dimensions.get('window');

interface DashboardStats {
  daysRemaining: number;
  diapersLeft: number;
  wipesLeft: number;
  lastChange: string;
  todayChanges: number;
  currentSize: string;
  changesReady: number;
}

interface RecentActivity {
  id: string;
  time: string;
  type: 'diaper-change' | 'inventory-update' | 'size-change';
  description: string;
  rawTimestamp?: string; // For smart timing analysis
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
  const [inventoryDetailModalVisible, setInventoryDetailModalVisible] = useState(false);
  const [addChildModalVisible, setAddChildModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Recent Activity state for progressive disclosure
  const [showAllActivity, setShowAllActivity] = useState(false);
  const ACTIVITY_INITIAL_LIMIT = 5;
  
  // Supply breakdown progressive disclosure
  const [showSupplyBreakdown, setShowSupplyBreakdown] = useState(false);
  
  // RefreshControl state
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Unified error store
  const { addError, clearAllErrors } = useErrorStore();
  
  // GraphQL queries
  const { data: childrenData, loading: childrenLoading } = useQuery(MY_CHILDREN_QUERY, {
    variables: { first: 10 },
  });

  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard,
    networkStatus: dashboardNetworkStatus
  } = useQuery(GET_DASHBOARD_STATS_QUERY, {
    variables: { childId: selectedChildId },
    skip: !selectedChildId,
    fetchPolicy: 'cache-and-network', // Ensure fresh data while serving cache
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // Show partial data when available
  });

  const { 
    data: usageLogsData, 
    loading: usageLogsLoading,
    error: usageLogsError,
    refetch: refetchUsageLogs,
    networkStatus: usageLogsNetworkStatus
  } = useQuery(GET_USAGE_LOGS_QUERY, {
    variables: { 
      childId: selectedChildId,
      usageType: 'DIAPER_CHANGE',
      daysBack: 7,
      limit: 50 // Fetch more items for client-side filtering
    },
    skip: !selectedChildId,
    fetchPolicy: 'cache-and-network', // Ensure fresh data while serving cache
    pollInterval: 30000, // Poll every 30 seconds
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // Show partial data when available
  });

  // Handle GraphQL errors that might not be caught by Apollo's ErrorLink
  useEffect(() => {
    if (dashboardError) {
      addError({
        ...createDataError(
          dashboardError.message,
          ErrorSeverity.MEDIUM,
          ErrorSource.DASHBOARD
        ),
        supportiveMessage: "We're having trouble loading your dashboard. Your data is safe and we're working on it.",
        context: { query: 'GET_DASHBOARD_STATS_QUERY' },
      });
    }
  }, [dashboardError, addError]);

  useEffect(() => {
    if (usageLogsError) {
      addError({
        ...createDataError(
          usageLogsError.message,
          ErrorSeverity.MEDIUM,
          ErrorSource.DASHBOARD
        ),
        supportiveMessage: "We're having trouble loading your recent activity. Your logs are safe and we're working on it.",
        context: { query: 'GET_USAGE_LOGS_QUERY' },
      });
    }
  }, [usageLogsError, addError]);

  // Initialize selected child from storage or default to first child
  useEffect(() => {
    if (childrenData?.myChildren?.edges?.length > 0) {
      const children = childrenData.myChildren.edges;
      
      // Try to use stored child ID first
      if (storedChildId && children.find(edge => edge.node.id === storedChildId)) {
        if (selectedChildId !== storedChildId) {
          setSelectedChildId(storedChildId);
        }
      } else if (!selectedChildId && children.length > 0) {
        // Default to first child if no stored selection
        const firstChildId = children[0].node.id;
        setSelectedChildId(firstChildId);
        setStoredChildId(firstChildId);
      }
    }
  }, [childrenData, selectedChildId, storedChildId, setStoredChildId]);

  // Handle child selection with persistence
  const handleChildSelect = async (childId: string) => {
    setSelectedChildId(childId);
    await setStoredChildId(childId);
  };

  // Process dashboard stats with fallback and user-friendly formatting
  const dashboardStats: DashboardStats = dashboardData?.getDashboardStats ? {
    daysRemaining: dashboardData.getDashboardStats.daysRemaining || 0,
    diapersLeft: dashboardData.getDashboardStats.diapersLeft || 0,
    wipesLeft: dashboardData.getDashboardStats.wipesLeft || 0,
    lastChange: formatFieldWithFallback(dashboardData.getDashboardStats.lastChange, 'time'),
    todayChanges: dashboardData.getDashboardStats.todayChanges || 0,
    currentSize: formatDiaperSize(dashboardData.getDashboardStats.currentSize),
    changesReady: dashboardData.getDashboardStats.changesReady || 0,
  } : {
    // Fallback data when loading or no child selected
    daysRemaining: dashboardLoading ? 0 : 12,
    diapersLeft: dashboardLoading ? 0 : 24,
    wipesLeft: dashboardLoading ? 0 : 50,
    lastChange: dashboardLoading ? 'Loading...' : '2 hours ago',
    todayChanges: dashboardLoading ? 0 : 5,
    currentSize: dashboardLoading ? 'Loading...' : formatDiaperSize('SIZE_2'),
    changesReady: dashboardLoading ? 0 : 65,
  };

  // Process recent activity from usage logs with enhanced timestamp tracking
  const allRecentActivity: RecentActivity[] = usageLogsData?.getUsageLogs?.edges?.map((edge: any, index: number) => ({
    id: edge.node.id || `activity-${index}`,
    time: formatActivityTimestamp(edge.node.loggedAt),
    type: 'diaper-change' as const,
    description: getChangeDescription(edge.node.wasWet, edge.node.wasSoiled, edge.node.notes),
    rawTimestamp: edge.node.loggedAt // Keep raw timestamp for smart analysis
  })) || [];
  
  // Apply progressive disclosure limit
  const recentActivity = showAllActivity 
    ? allRecentActivity 
    : allRecentActivity.slice(0, ACTIVITY_INITIAL_LIMIT);
  
  const hasMoreActivity = allRecentActivity.length > ACTIVITY_INITIAL_LIMIT;
  const additionalActivityCount = allRecentActivity.length - ACTIVITY_INITIAL_LIMIT;

  // Enhanced state management 
  const showEmptyState = !usageLogsLoading && allRecentActivity.length === 0 && !usageLogsError;

  const showLoadingState = (usageLogsLoading || usageLogsNetworkStatus === NetworkStatus.refetch) && selectedChildId;
  const noChildrenState = !childrenLoading && (!childrenData?.myChildren?.edges || childrenData.myChildren.edges.length === 0);
  const hasMultipleChildren = childrenData?.myChildren?.edges && childrenData.myChildren.edges.length > 1;
  
  // Loading states with network awareness
  const isDashboardLoading = dashboardLoading || dashboardNetworkStatus === NetworkStatus.refetch;
  const isActivityLoading = usageLogsLoading || usageLogsNetworkStatus === NetworkStatus.refetch;

  // Helper function for smart activity counter with psychology-driven messaging
  function getSmartActivityMessage(additionalCount: number, allActivities: RecentActivity[]): { message: string; accessibilityLabel: string } {
    if (additionalCount <= 0) {
      return { message: '', accessibilityLabel: '' };
    }

    // Get the additional activities to analyze timing context
    const additionalActivities = allActivities.slice(ACTIVITY_INITIAL_LIMIT);

    // Analyze time context of additional activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    let todayCount = 0;
    let thisWeekCount = 0;

    additionalActivities.forEach(activity => {
      // Use raw timestamp for proper date analysis
      if (activity.rawTimestamp) {
        const activityDate = new Date(activity.rawTimestamp);
        
        if (activityDate >= today) {
          todayCount++;
        } else if (activityDate >= weekAgo) {
          thisWeekCount++;
        }
      }
    });

    // Psychology-driven smart messaging based on count and context
    let message: string;
    let accessibilityLabel: string;

    if (additionalCount <= 3) {
      // Small counts: Be specific and encouraging
      if (additionalCount === 1) {
        message = "View 1 more change";
        accessibilityLabel = "View 1 more activity";
      } else {
        message = `View ${additionalCount} more changes`;
        accessibilityLabel = `View ${additionalCount} more activities`;
      }
    } else if (additionalCount <= 10) {
      // Medium counts: Context-aware with time reference
      if (todayCount >= additionalCount * 0.7) {
        message = `+${additionalCount} more today`;
        accessibilityLabel = `View ${additionalCount} more activities from today`;
      } else if (thisWeekCount >= additionalCount * 0.8) {
        message = `+${additionalCount} more this week`;
        accessibilityLabel = `View ${additionalCount} more activities from this week`;
      } else {
        message = `+${additionalCount} more recent`;
        accessibilityLabel = `View ${additionalCount} more recent activities`;
      }
    } else if (additionalCount <= 20) {
      // Large counts: Simplified with encouraging tone
      message = `+${additionalCount} more this week`;
      accessibilityLabel = `View ${additionalCount} more activities from recent days`;
    } else {
      // Very large counts: Fallback to supportive messaging
      message = "View complete history";
      accessibilityLabel = `View complete activity history with ${additionalCount} more items`;
    }

    return { message, accessibilityLabel };
  }

  // Helper function for hybrid timestamp display with Canadian timezone
  function formatActivityTimestamp(dateString: string): string {
    const logDate = new Date(dateString);
    const now = new Date();
    
    // Get Canadian timezone (defaults to America/Toronto - Eastern Time)
    const timeZone = 'America/Toronto';
    const timeZoneName = now.toLocaleDateString('en-CA', { 
      timeZone, 
      timeZoneName: 'short' 
    }).split(',').pop()?.trim() || 'EDT';
    
    // Format time in 12-hour format
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone
    });
    const timeStr = timeFormatter.format(logDate);
    
    // Check if same day
    const isToday = logDate.toDateString() === now.toDateString();
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = logDate.toDateString() === yesterday.toDateString();
    
    // Check if within this week (last 7 days)
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const isThisWeek = logDate > oneWeekAgo;
    
    if (isToday) {
      // Today: just show time with timezone
      return `${timeStr} ${timeZoneName}`;
    } else if (isYesterday) {
      // Yesterday: "Yesterday, 3:26 PM EDT"
      return `Yesterday, ${timeStr} ${timeZoneName}`;
    } else if (isThisWeek) {
      // This week: "Monday, 3:26 PM EDT"
      const dayName = logDate.toLocaleDateString('en-CA', { 
        weekday: 'long',
        timeZone 
      });
      return `${dayName}, ${timeStr} ${timeZoneName}`;
    } else {
      // Older: "Dec 5, 3:26 PM EDT"
      const dateStr = logDate.toLocaleDateString('en-CA', { 
        month: 'short',
        day: 'numeric',
        timeZone
      });
      return `${dateStr}, ${timeStr} ${timeZoneName}`;
    }
  }

  // Helper function to get change description - clearer, parent-friendly format
  function getChangeDescription(wasWet?: boolean, wasSoiled?: boolean, notes?: string): string {
    let description = '';
    
    if (wasWet && wasSoiled) {
      description = 'Wet and soiled diaper';
    } else if (wasWet) {
      description = 'Wet diaper';
    } else if (wasSoiled) {
      description = 'Soiled diaper';
    } else {
      description = 'Dry diaper';
    }
    
    if (notes) {
      description += ` (${notes})`;
    }
    
    return description;
  }

  
  // Handle manual retry operations with unified error system
  const handleManualRetry = useCallback(async (retryFn: () => Promise<any>, context: string) => {
    try {
      // Clear any existing manual retry errors
      clearAllErrors();
      await retryFn();
    } catch (error) {
      // Add error to unified system instead of local state
      addError({
        ...createNetworkError(
          `${context} failed`,
          ErrorSeverity.MEDIUM,
          ErrorSource.MANUAL_RETRY
        ),
        supportiveMessage: "We've tried a few times but couldn't connect. When you're ready, tap Try Again to continue.",
        context: { operation: context, error: error?.toString() },
      });
    }
  }, [addError, clearAllErrors]);
  
  // Handle pull-to-refresh with psychology-driven UX
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Clear any existing errors before refreshing
      clearAllErrors();
      
      // Refresh all data sources
      const promises = [];
      
      if (selectedChildId && refetchDashboard) {
        promises.push(refetchDashboard());
      }
      
      if (selectedChildId && refetchUsageLogs) {
        promises.push(refetchUsageLogs());
      }
      
      await Promise.all(promises);
      
      // Show brief success feedback
      setSuccessMessage("Updated! Everything's looking good.");
      setTimeout(() => setSuccessMessage(''), 2000);
      
    } catch (error) {
      // Use unified error system instead of manual retry logic
      await handleManualRetry(async () => {
        const promises = [];
        if (selectedChildId && refetchDashboard) promises.push(refetchDashboard());
        if (selectedChildId && refetchUsageLogs) promises.push(refetchUsageLogs());
        await Promise.all(promises);
      }, 'Data refresh');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedChildId, refetchDashboard, refetchUsageLogs, handleManualRetry, clearAllErrors]);
  
  // Handle success messages from modals
  const handleModalSuccess = (message: string) => {
    setSuccessMessage(message);
    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Determine if actions should be disabled
  const actionsDisabled = !selectedChildId || childrenLoading || dashboardLoading;

  // Time-aware greeting function
  const getTimeBasedGreeting = (): string => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Good morning!";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon!";
    } else if (hour >= 17 && hour < 22) {
      return "Good evening!";
    } else {
      return "Hello there!";
    }
  };

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint, colors.success]}
              progressBackgroundColor={colors.surface}
              title="Refreshing your data..."
              titleColor={colors.textSecondary}
            />
          }
        >
          {/* Success Message */}
          {successMessage && (
            <View 
              style={[styles.successMessage, { backgroundColor: '#E3F2FD', borderColor: '#1565C0' }]}
              accessibilityRole="alert"
              accessibilityLabel={`Success: ${successMessage}`}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color="#1565C0" />
              <ThemedText style={[styles.successMessageText, { color: '#1565C0' }]}>
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
                   selectedChildId && childrenData?.myChildren?.edges?.length > 0 ? 
                   (() => {
                     const selectedChild = childrenData.myChildren.edges.find(edge => edge.node.id === selectedChildId);
                     return selectedChild ? `Here's how ${selectedChild.node.name} is doing` : "Here's how your little one is doing";
                   })() :
                   "Here's how your little one is doing"}
                </ThemedText>
              </View>
              
              {/* Child Selector - only show if multiple children */}
              {hasMultipleChildren && (
                <View style={styles.childSelectorContainer}>
                  <ChildSelector
                    children={(() => {
                      // Client-side deduplication safeguard for child entries
                      const childrenMap = new Map();
                      childrenData.myChildren.edges.forEach((edge: any) => {
                        if (!childrenMap.has(edge.node.id)) {
                          childrenMap.set(edge.node.id, edge.node);
                        }
                      });
                      return Array.from(childrenMap.values());
                    })()}
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
                You haven't added any children to your account yet. Complete the onboarding process to add your first child and start your diaper planning journey.
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

          {/* Stats Overview - only show when children exist */}
          {!noChildrenState && (
          <ThemedView style={styles.statsContainer}>
            {/* Loading state with skeleton */}
            {(childrenLoading || isDashboardLoading) && (
              <View style={styles.skeletonContainer}>
                <View style={[styles.skeletonCard, styles.skeletonCardLarge, { backgroundColor: '#E3F2FD' }]}>
                  <View style={styles.skeletonHeader}>
                    <View style={[styles.skeletonIcon, { backgroundColor: '#B3E5FC' }]} />
                    <View style={[styles.skeletonText, styles.skeletonTextMedium, { backgroundColor: '#B3E5FC' }]} />
                  </View>
                  <View style={[styles.skeletonText, styles.skeletonTextLarge, { backgroundColor: '#B3E5FC' }]} />
                  <View style={[styles.skeletonText, styles.skeletonTextSmall, { backgroundColor: '#B3E5FC' }]} />
                </View>
                <View style={styles.skeletonGrid}>
                  <View style={[styles.skeletonCard, styles.skeletonCardSmall, { backgroundColor: '#E3F2FD' }]}>
                    <View style={[styles.skeletonIcon, styles.skeletonIconSmall, { backgroundColor: '#B3E5FC' }]} />
                    <View style={[styles.skeletonText, styles.skeletonTextLarge, { backgroundColor: '#B3E5FC' }]} />
                    <View style={[styles.skeletonText, styles.skeletonTextSmall, { backgroundColor: '#B3E5FC' }]} />
                  </View>
                  <View style={[styles.skeletonCard, styles.skeletonCardSmall, { backgroundColor: '#E3F2FD' }]}>
                    <View style={[styles.skeletonIcon, styles.skeletonIconSmall, { backgroundColor: '#B3E5FC' }]} />
                    <View style={[styles.skeletonText, styles.skeletonTextLarge, { backgroundColor: '#B3E5FC' }]} />
                    <View style={[styles.skeletonText, styles.skeletonTextSmall, { backgroundColor: '#B3E5FC' }]} />
                  </View>
                </View>
                <View style={[styles.loadingIndicator, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
                  <ActivityIndicator size="small" color="#1565C0" />
                  <ThemedText style={[styles.loadingText, { color: '#1565C0' }]}>
                    Getting your latest data ready...
                  </ThemedText>
                </View>
              </View>
            )}
            
            {/* Primary Readiness Card - New UX Focus */}
            <ChangingReadinessCard
              changesReady={dashboardStats.changesReady}
              onPress={() => setShowSupplyBreakdown(!showSupplyBreakdown)}
              loading={isDashboardLoading}
            />
            
            {/* Progressive Disclosure: Supply Breakdown */}
            {showSupplyBreakdown && (
              <View style={styles.supplyBreakdownContainer}>
                <ThemedText type="defaultSemiBold" style={[styles.breakdownTitle, { color: colors.text }]}>
                  Supply Overview
                </ThemedText>
                <View style={styles.supplyGrid}>
                  <DiapersCard
                    quantity={dashboardStats.diapersLeft}
                    loading={isDashboardLoading}
                    onPress={() => setInventoryDetailModalVisible(true)}
                  />
                  <WipesCard
                    quantity={dashboardStats.wipesLeft}
                    loading={isDashboardLoading}
                    onPress={() => setInventoryDetailModalVisible(true)}
                  />
                </View>
                
                {/* Compact stats for secondary information */}
                <View style={styles.secondaryStatsContainer}>
                  <View style={styles.secondaryStatItem}>
                    <IconSymbol name="calendar.circle.fill" size={16} color={colors.success} />
                    <ThemedText style={[styles.secondaryStatText, { color: colors.textSecondary }]}>
                      {dashboardStats.daysRemaining} days coverage
                    </ThemedText>
                  </View>
                  <View style={styles.secondaryStatItem}>
                    <IconSymbol name="checkmark.circle" size={16} color={colors.accent} />
                    <ThemedText style={[styles.secondaryStatText, { color: colors.textSecondary }]}>
                      {dashboardStats.todayChanges} changes today
                    </ThemedText>
                  </View>
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
            
            {/* Loading state for recent activity with skeleton */}
            {(showLoadingState || isActivityLoading) && (
              <View style={styles.activitySkeletonContainer}>
                {[...Array(3)].map((_, index) => (
                  <View 
                    key={index} 
                    style={[styles.activitySkeletonItem, { backgroundColor: '#E3F2FD', borderColor: '#B3E5FC' }]}
                  >
                    <View style={[styles.skeletonIcon, styles.skeletonIconSmall, { backgroundColor: '#B3E5FC' }]} />
                    <View style={styles.activitySkeletonContent}>
                      <View style={[styles.skeletonText, styles.skeletonTextMedium, { backgroundColor: '#B3E5FC', width: '70%' }]} />
                      <View style={[styles.skeletonText, styles.skeletonTextSmall, { backgroundColor: '#B3E5FC', width: '50%', marginTop: 4 }]} />
                    </View>
                  </View>
                ))}
                <View style={[styles.loadingIndicator, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
                  <ActivityIndicator size="small" color="#1565C0" />
                  <ThemedText style={[styles.loadingText, { color: '#1565C0' }]}>
                    Loading your recent activity...
                  </ThemedText>
                </View>
              </View>
            )}
            
            {/* Empty state with supportive messaging */}
            {showEmptyState && (
              <View style={[styles.supportiveEmptyContainer, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
                <IconSymbol name="heart.fill" size={32} color="#1565C0" />
                <ThemedText type="defaultSemiBold" style={[styles.supportiveEmptyTitle, { color: '#1565C0' }]}>
                  Ready for your first log
                </ThemedText>
                <ThemedText style={[styles.supportiveEmptyText, { color: '#1565C0' }]}>
                  When you log your first diaper change, we'll show your activity timeline here. You've got this - every parent starts somewhere!
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.supportiveEmptyButton, { backgroundColor: '#1565C0' }]}
                  onPress={() => setQuickLogModalVisible(true)}
                  disabled={!selectedChildId}
                  accessibilityRole="button"
                  accessibilityLabel="Log your first diaper change"
                >
                  <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.supportiveEmptyButtonText}>Log First Change</ThemedText>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Activity items - Now Interactive */}
            {recentActivity.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push('/activity-history')}
                accessibilityRole="button"
                accessibilityLabel={`View activity details: ${activity.description} at ${activity.time}`}
                accessibilityHint="Navigate to full activity history"
              >
                <View style={styles.activityIcon}>
                  <IconSymbol 
                    name={getActivityIcon(activity.type)} 
                    size={20} 
                    color={getActivityColor(activity.type)} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText type="defaultSemiBold" style={styles.activityDescription}>
                    {activity.description}
                  </ThemedText>
                  <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                    {activity.time}
                  </ThemedText>
                </View>
                <View style={styles.activityChevron}>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Progressive Disclosure Controls - Smart Activity Counter */}
            {hasMoreActivity && !showAllActivity && (() => {
              const smartMessage = getSmartActivityMessage(additionalActivityCount, allRecentActivity);
              return (
                <TouchableOpacity
                  style={[styles.viewAllButton, { borderColor: colors.border }]}
                  onPress={() => router.push('/activity-history')}
                  accessibilityRole="button"
                  accessibilityLabel={smartMessage.accessibilityLabel}
                >
                  <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
                    {smartMessage.message}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={colors.tint} />
                </TouchableOpacity>
              );
            })()}
            
            {showAllActivity && hasMoreActivity && (
              <TouchableOpacity
                style={[styles.showLessButton, { borderColor: colors.border }]}
                onPress={() => setShowAllActivity(false)}
                accessibilityRole="button"
                accessibilityLabel="Show less activity"
              >
                <ThemedText style={[styles.showLessText, { color: colors.textSecondary }]}>
                  Show Less
                </ThemedText>
                <IconSymbol name="chevron.up" size={16} color={colors.textSecondary} />
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
              Using {dashboardStats.currentSize} diapers • Last change {dashboardStats.lastChange} • You're on track
            </ThemedText>
          </ThemedView>

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Your diaper planning data is securely stored in Canada
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
        
        <InventoryDetailModal
          visible={inventoryDetailModalVisible}
          onClose={() => setInventoryDetailModalVisible(false)}
          onSuccess={handleModalSuccess}
          onAddMore={() => {
            setInventoryDetailModalVisible(false);
            setAddInventoryModalVisible(true);
          }}
          childId={selectedChildId}
        />
        
        <AddChildModal
          visible={addChildModalVisible}
          onClose={() => setAddChildModalVisible(false)}
          onSuccess={handleModalSuccess}
        />
        
        {/* Unified Error Handler - Single source of truth for all error displays */}
        <UnifiedErrorHandler
          position="top"
          showComplianceIndicator={true}
          onRetry={onRefresh}
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
    padding: 18, // Increased padding for better visual separation
    marginBottom: 12, // Increased margin for better spacing
    borderRadius: 12,
    borderWidth: 1,
  },
  activityIcon: {
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityChevron: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '600', // Stronger weight for primary information
    marginBottom: 4, // Slightly more separation
  },
  activityTime: {
    fontSize: 13, // Slightly larger for better readability
    lineHeight: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Increased touch target
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
    minHeight: 48, // Ensure minimum touch target size
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  showLessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
    minHeight: 44,
  },
  showLessText: {
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
  // RefreshControl and Enhanced Error Handling Styles
  supportiveErrorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  errorMessageContent: {
    flex: 1,
  },
  supportiveErrorText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  retryText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Skeleton Loading Styles
  skeletonContainer: {
    marginBottom: 16,
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  skeletonCardLarge: {
    width: '100%',
  },
  skeletonCardSmall: {
    width: (width - 52) / 2,
  },
  skeletonGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  skeletonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  skeletonIconSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  skeletonText: {
    height: 16,
    borderRadius: 8,
  },
  skeletonTextLarge: {
    height: 32,
    width: '60%',
    marginBottom: 8,
  },
  skeletonTextMedium: {
    height: 20,
    width: '80%',
  },
  skeletonTextSmall: {
    height: 14,
    width: '50%',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 12,
  },
  // Supportive Error Container Styles
  supportiveErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
  },
  errorContentContainer: {
    flex: 1,
  },
  supportiveErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  supportiveErrorMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  supportiveRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  supportiveRetryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Activity Skeleton Styles
  activitySkeletonContainer: {
    marginBottom: 16,
  },
  activitySkeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  activitySkeletonContent: {
    flex: 1,
  },
  // Supportive Empty State Styles
  supportiveEmptyContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
  },
  supportiveEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  supportiveEmptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  supportiveEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  supportiveEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  
  // Supply breakdown progressive disclosure styles
  supplyBreakdownContainer: {
    marginTop: 16,
    marginBottom: 16,
    gap: 16,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  supplyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  secondaryStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(8, 145, 178, 0.05)', // Primary blue with 5% opacity
    borderRadius: 12,
    gap: 16,
  },
  secondaryStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  secondaryStatText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Diaper-focused card styling for anxiety reduction
  diaperFocusCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  diaperFocusContent: {
    alignItems: 'center',
    gap: 8,
  },
  diaperFocusText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
});
