import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, NetworkStatus } from '@apollo/client';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import { GET_USAGE_LOGS_QUERY } from '@/lib/graphql/queries';
import { formatFieldWithFallback } from '@/lib/utils/enumDisplayFormatters';

const { width } = Dimensions.get('window');

interface ActivityItem {
  id: string;
  time: string;
  date: string;
  type: 'diaper-change' | 'inventory-update' | 'size-change';
  description: string;
  details: {
    wasWet?: boolean;
    wasSoiled?: boolean;
    notes?: string;
    loggedAt: string;
  };
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function ActivityHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State management
  const [selectedChildId] = useAsyncStorage('nestsync_selected_child_id');
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // GraphQL query with enhanced pagination
  const { 
    data: usageLogsData, 
    loading: isLoading,
    error,
    refetch,
    networkStatus
  } = useQuery(GET_USAGE_LOGS_QUERY, {
    variables: { 
      childId: selectedChildId,
      usageType: 'DIAPER_CHANGE',
      daysBack: getFilterDays(activeFilter),
      limit: 100 // Load more items for comprehensive history
    },
    skip: !selectedChildId,
    pollInterval: 60000, // Refresh every minute when screen is active
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all', // Show partial data when available
  });

  // Helper function to determine days back based on filter
  function getFilterDays(filter: FilterPeriod): number {
    switch (filter) {
      case 'today': return 1;
      case 'week': return 7;
      case 'month': return 30;
      case 'all': return 365; // One year of history
      default: return 30;
    }
  }

  // Process activity data with comprehensive details
  const allActivity: ActivityItem[] = usageLogsData?.getUsageLogs?.edges?.map((edge: any, index: number) => ({
    id: edge.node.id || `activity-${index}`,
    time: formatActivityTime(edge.node.loggedAt),
    date: formatActivityDate(edge.node.loggedAt),
    type: 'diaper-change' as const,
    description: getEnhancedChangeDescription(edge.node.wasWet, edge.node.wasSoiled, edge.node.notes),
    details: {
      wasWet: edge.node.wasWet,
      wasSoiled: edge.node.wasSoiled,
      notes: edge.node.notes,
      loggedAt: edge.node.loggedAt
    }
  })) || [];

  // Apply search filter
  const filteredActivity = searchQuery.trim() 
    ? allActivity.filter(item => 
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.details.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allActivity;

  // Group activities by date for better organization
  const groupedActivity = groupActivitiesByDate(filteredActivity);

  // Enhanced timestamp formatting for Canadian timezone
  function formatActivityTime(dateString: string): string {
    const logDate = new Date(dateString);
    const timeZone = 'America/Toronto';
    
    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone
    });
    
    return timeFormatter.format(logDate);
  }

  function formatActivityDate(dateString: string): string {
    const logDate = new Date(dateString);
    const now = new Date();
    const timeZone = 'America/Toronto';
    
    // Check if today
    const isToday = logDate.toDateString() === now.toDateString();
    if (isToday) return 'Today';
    
    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = logDate.toDateString() === yesterday.toDateString();
    if (isYesterday) return 'Yesterday';
    
    // Check if this week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const isThisWeek = logDate > oneWeekAgo;
    
    if (isThisWeek) {
      return logDate.toLocaleDateString('en-CA', { 
        weekday: 'long',
        timeZone 
      });
    }
    
    // Older dates
    return logDate.toLocaleDateString('en-CA', { 
      month: 'short',
      day: 'numeric',
      year: logDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      timeZone
    });
  }

  function getEnhancedChangeDescription(wasWet?: boolean, wasSoiled?: boolean, notes?: string): string {
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
    
    if (notes && notes.trim()) {
      description += ` - ${notes.trim()}`;
    }
    
    return description;
  }

  function groupActivitiesByDate(activities: ActivityItem[]): { [date: string]: ActivityItem[] } {
    return activities.reduce((groups, activity) => {
      const date = activity.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {} as { [date: string]: ActivityItem[] });
  }

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing activity:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Filter tabs configuration
  const filterTabs: { key: FilterPeriod; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: allActivity.length },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
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

  const getActivityColor = (type: ActivityItem['type']) => {
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

  // Handle activity item press for future detailed view
  const handleActivityPress = (activity: ActivityItem) => {
    // Future enhancement: Navigate to detailed activity view
    Alert.alert(
      'Activity Details',
      `Time: ${activity.time}\nDescription: ${activity.description}${
        activity.details.notes ? `\nNotes: ${activity.details.notes}` : ''
      }`,
      [{ text: 'OK' }]
    );
  };

  // Loading state
  const showLoadingState = isLoading || networkStatus === NetworkStatus.refetch;

  // Empty state
  const showEmptyState = !isLoading && filteredActivity.length === 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header with back navigation */}
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back to dashboard"
            >
              <IconSymbol name="chevron.left" size={24} color={colors.tint} />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={styles.headerTitle}>
                Activity History
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                Your complete diaper change timeline
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Search Bar */}
        <ThemedView style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search activity notes..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search activity history"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </ThemedView>

        {/* Filter Tabs */}
        <ThemedView style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  { 
                    backgroundColor: activeFilter === tab.key ? colors.tint : colors.surface,
                    borderColor: activeFilter === tab.key ? colors.tint : colors.border,
                  }
                ]}
                onPress={() => setActiveFilter(tab.key)}
                accessibilityRole="tab"
                accessibilityLabel={`Filter by ${tab.label}`}
                accessibilityState={{ selected: activeFilter === tab.key }}
              >
                <ThemedText 
                  style={[
                    styles.filterTabText,
                    { color: activeFilter === tab.key ? '#FFFFFF' : colors.text }
                  ]}
                >
                  {tab.label}
                </ThemedText>
                {tab.count !== undefined && (
                  <View style={[
                    styles.filterTabBadge,
                    { backgroundColor: activeFilter === tab.key ? 'rgba(255,255,255,0.2)' : colors.tint }
                  ]}>
                    <ThemedText 
                      style={[
                        styles.filterTabBadgeText,
                        { color: activeFilter === tab.key ? '#FFFFFF' : '#FFFFFF' }
                      ]}
                    >
                      {tab.count}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Activity Content */}
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
              title="Refreshing activity..."
              titleColor={colors.textSecondary}
            />
          }
        >
          {/* Loading State */}
          {showLoadingState && (
            <View style={[styles.loadingContainer, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
              <ActivityIndicator size="small" color="#1565C0" />
              <ThemedText style={[styles.loadingText, { color: '#1565C0' }]}>
                Loading your activity history...
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={[styles.errorContainer, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
              <IconSymbol name="heart.circle.fill" size={24} color="#1565C0" />
              <View style={styles.errorContent}>
                <ThemedText type="defaultSemiBold" style={[styles.errorTitle, { color: '#1565C0' }]}>
                  Having trouble loading activity
                </ThemedText>
                <ThemedText style={[styles.errorMessage, { color: '#1565C0' }]}>
                  We're having trouble getting your activity history. Your data is safe, and we'll keep trying.
                </ThemedText>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: '#1565C0' }]}
                  onPress={onRefresh}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading activity"
                >
                  <IconSymbol name="arrow.clockwise" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Empty State */}
          {showEmptyState && (
            <View style={[styles.emptyContainer, { backgroundColor: '#E3F2FD', borderColor: '#4FC3F7' }]}>
              <IconSymbol name="heart.fill" size={48} color="#1565C0" />
              <ThemedText type="title" style={[styles.emptyTitle, { color: '#1565C0' }]}>
                {searchQuery ? 'No matching activity found' : 'No activity yet'}
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: '#1565C0' }]}>
                {searchQuery 
                  ? `We couldn't find any activity matching "${searchQuery}". Try a different search term or clear the search to see all activity.`
                  : activeFilter === 'today'
                    ? "No diaper changes logged today yet. When you log your first change, it will appear here!"
                    : "Your activity history will appear here as you log diaper changes. Every parent starts somewhere - you've got this!"
                }
              </ThemedText>
              {!searchQuery && (
                <TouchableOpacity 
                  style={[styles.emptyActionButton, { backgroundColor: '#1565C0' }]}
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Go back to log first change"
                >
                  <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.emptyActionButtonText}>Log First Change</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Activity List - Grouped by Date */}
          {Object.entries(groupedActivity).map(([date, activities]) => (
            <View key={date} style={styles.dateGroup}>
              {/* Date Header */}
              <View style={[styles.dateHeader, { backgroundColor: colors.surface }]}>
                <ThemedText type="defaultSemiBold" style={[styles.dateHeaderText, { color: colors.textEmphasis }]}>
                  {date}
                </ThemedText>
                <ThemedText style={[styles.dateHeaderCount, { color: colors.textSecondary }]}>
                  {activities.length} {activities.length === 1 ? 'change' : 'changes'}
                </ThemedText>
              </View>

              {/* Activity Items for this date */}
              {activities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleActivityPress(activity)}
                  accessibilityRole="button"
                  accessibilityLabel={`Activity at ${activity.time}: ${activity.description}`}
                >
                  <View style={styles.activityIcon}>
                    <IconSymbol 
                      name={getActivityIcon(activity.type)} 
                      size={24} 
                      color={getActivityColor(activity.type)} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.activityDescription}>
                        {activity.description}
                      </ThemedText>
                      <ThemedText style={[styles.activityTime, { color: colors.textSecondary }]}>
                        {activity.time}
                      </ThemedText>
                    </View>
                    {activity.details.notes && (
                      <ThemedText style={[styles.activityNotes, { color: colors.textSecondary }]}>
                        {activity.details.notes}
                      </ThemedText>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Canadian Trust Indicator */}
          <ThemedView style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="checkmark.shield.fill" size={20} color={colors.info} />
            <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
              Your activity data is securely stored in Canada
            </ThemedText>
          </ThemedView>

          {/* Bottom spacing for navigation */}
          <View style={{ height: 60 }} />
        </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    outlineStyle: 'none',
  } as any,
  filterContainer: {
    paddingBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    minHeight: 40,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
  },
  filterTabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateHeaderCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  activityIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityNotes: {
    fontSize: 14,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
  },
});