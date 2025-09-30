/**
 * Timeline Screen Component
 *
 * Comprehensive timeline view showing child care activities chronologically.
 * Replaces the "Coming Soon" alert in Quick Actions with full Timeline functionality.
 *
 * Features:
 * - Time-based filtering (Today/Yesterday/Week/Month)
 * - Psychology-driven UX for stressed parents
 * - Caregiver attribution for family collaboration
 * - Canadian timezone compliance (America/Toronto)
 * - Cross-platform accessibility support
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { subDays, startOfDay, endOfDay, isToday, isYesterday, startOfWeek, endOfWeek } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ActivityTimeline } from '@/components/timeline/ActivityTimeline';
import { ChildSelector } from '@/components/ui/ChildSelector';
import { Colors , NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTimelineData } from '@/hooks/useTimelineData';
import { useChildren } from '@/hooks/useChildren';
import { useAsyncStorage } from '@/hooks/useUniversalStorage';
import { useTrialOnboarding } from '@/hooks/useTrialOnboarding';
import type { TimelineEvent } from '@/types/timeline';

// Time filter options for psychology-driven UX (simple, clear choices)
type TimeFilter = 'today' | 'yesterday' | 'week' | 'month';

interface TimeFilterOption {
  id: TimeFilter;
  label: string;
  daysBack: number;
  icon: string;
  description: string;
}

const TIME_FILTER_OPTIONS: TimeFilterOption[] = [
  {
    id: 'today',
    label: 'Today',
    daysBack: 1,
    icon: 'clock.fill',
    description: 'Activities from today'
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    daysBack: 2,
    icon: 'clock.arrow.circlepath',
    description: 'Activities from yesterday'
  },
  {
    id: 'week',
    label: 'This Week',
    daysBack: 7,
    icon: 'calendar',
    description: 'Activities from the past week'
  },
  {
    id: 'month',
    label: 'This Month',
    daysBack: 30,
    icon: 'calendar.badge.clock',
    description: 'Activities from the past month'
  }
];

export default function TimelineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string; filter?: TimeFilter }>();

  // State for child selection and time filtering
  const [selectedChildId, setSelectedChildId] = useState<string>(params.childId || '');
  const [activeFilter, setActiveFilter] = useState<TimeFilter>(params.filter || 'today');
  const [storedChildId, setStoredChildId] = useAsyncStorage('nestsync_selected_child_id');

  // Refs for tooltip positioning
  const filtersRef = useRef(null);
  const timelineRef = useRef(null);
  const privacyRef = useRef(null);

  // Trial onboarding tooltips
  const {
    showTimelineTooltip,
    showCanadianDataTooltip,
    canShowTooltips,
    TooltipComponent
  } = useTrialOnboarding();

  // Fetch children data using centralized hook
  const { children, loading: childrenLoading } = useChildren({ first: 10 });

  // Calculate filter configuration
  const filterConfig = useMemo(() => {
    const option = TIME_FILTER_OPTIONS.find(opt => opt.id === activeFilter);
    return option || TIME_FILTER_OPTIONS[0];
  }, [activeFilter]);

  // Use childId from params, stored value, or first available child
  const childId = params.childId || storedChildId || children?.[0]?.id || '';

  // Fetch timeline data with current filter
  const {
    events,
    periods,
    currentTime,
    loading: timelineLoading,
    error: timelineError,
    refetch,
    hasMore,
    loadMore
  } = useTimelineData({
    childId,
    daysBack: filterConfig.daysBack,
    refreshInterval: 60000, // 1 minute refresh for real-time updates
  });

  // Set child from params or storage on mount
  React.useEffect(() => {
    if (children.length > 0) {
      if (params.childId && children.find(child => child.id === params.childId)) {
        setSelectedChildId(params.childId);
        setStoredChildId(params.childId);
      } else if (storedChildId && children.find(child => child.id === storedChildId)) {
        setSelectedChildId(storedChildId);
      } else if (children.length > 0) {
        const firstChildId = children[0].id;
        setSelectedChildId(firstChildId);
        setStoredChildId(firstChildId);
      }
    }
  }, [children, params.childId, storedChildId, setStoredChildId]);

  // Show timeline discovery tooltip for trial users
  useEffect(() => {
    if (canShowTooltips && !isLoading && events.length > 0) {
      // Delay to ensure UI is rendered
      const timer = setTimeout(() => {
        showTimelineTooltip(filtersRef.current);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [canShowTooltips, isLoading, events.length, showTimelineTooltip]);

  // Handle child selection with URL param updates
  const handleChildSelect = useCallback(async (newChildId: string) => {
    setSelectedChildId(newChildId);
    await setStoredChildId(newChildId);

    // Update URL params to maintain state
    router.setParams({ childId: newChildId });
  }, [setStoredChildId, router]);

  // Handle filter changes with URL param updates
  const handleFilterChange = useCallback((filter: TimeFilter) => {
    setActiveFilter(filter);
    router.setParams({ filter });
  }, [router]);

  // Handle event press for detailed view
  const handleEventPress = useCallback((event: TimelineEvent) => {
    // For now, show an alert with event details
    // TODO: Navigate to detailed activity view when available
    Alert.alert(
      event.title,
      `${event.details || 'No additional details'}\n\nTime: ${event.timestamp.toLocaleString('en-CA', {
        timeZone: 'America/Toronto',
        dateStyle: 'medium',
        timeStyle: 'short'
      })}`,
      [
        { text: 'Edit', onPress: () => console.log('Edit event:', event.id) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  }, []);

  // Handle refresh with haptic feedback
  const handleRefresh = useCallback(() => {
    if (Platform.OS === 'ios') {
      // Light haptic feedback for refresh action
      require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Light);
    }
    refetch();
  }, [refetch]);

  // Get filter statistics for UI display
  const filterStats = useMemo(() => {
    const totalEvents = events.length;
    const todayEvents = events.filter(event => isToday(event.timestamp)).length;

    return {
      total: totalEvents,
      today: todayEvents,
      selected: totalEvents
    };
  }, [events]);

  // Selected child information
  const selectedChild = useMemo(() => {
    return children.find(child => child.id === selectedChildId);
  }, [children, selectedChildId]);

  // Loading states
  const isLoading = childrenLoading || timelineLoading;
  const hasNoChildren = !childrenLoading && children.length === 0;
  const hasNoData = !timelineLoading && events.length === 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header with child selector and back navigation */}
        <ThemedView style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous screen"
            >
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <ThemedText type="title" style={styles.headerTitle}>
                Activity Timeline
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {selectedChild ? `${selectedChild.name}'s activities` : 'Loading activities...'}
              </ThemedText>
            </View>

            {/* Child Selector - only show if multiple children */}
            {children.length > 1 && (
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

          {/* Filter statistics */}
          {!isLoading && !hasNoChildren && (
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="chart.bar.fill" size={20} color={colors.accent} />
              <ThemedText style={[styles.statsText, { color: colors.text }]}>
                {filterStats.total} activities {filterConfig.label.toLowerCase()}
              </ThemedText>
              {filterStats.today > 0 && activeFilter !== 'today' && (
                <ThemedText style={[styles.statsSubtext, { color: colors.textSecondary }]}>
                  • {filterStats.today} today
                </ThemedText>
              )}
            </View>
          )}
        </ThemedView>

        {/* Time Filters */}
        <ThemedView style={styles.filtersSection} ref={filtersRef}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScrollView}
            contentContainerStyle={styles.filtersContent}
          >
            {TIME_FILTER_OPTIONS.map((option) => {
              const isActive = activeFilter === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: isActive ? colors.tint : colors.surface,
                      borderColor: isActive ? colors.tint : colors.border
                    }
                  ]}
                  onPress={() => handleFilterChange(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter to show ${option.description}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <IconSymbol
                    name={option.icon as any}
                    size={16}
                    color={isActive ? '#FFFFFF' : colors.text}
                  />
                  <Text style={[
                    styles.filterText,
                    { color: isActive ? '#FFFFFF' : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </ThemedView>

        {/* Timeline Content */}
        <View style={styles.timelineContainer}>
          {/* No Children State */}
          {hasNoChildren && (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="figure.2.and.child.holdinghands" size={48} color={colors.textSecondary} />
              <ThemedText type="title" style={[styles.emptyTitle, { color: colors.text }]}>
                No Children Added
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add a child to your account to start tracking activities and view the timeline.
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/(tabs)')}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.emptyButtonText}>
                  Go to Dashboard
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {isLoading && !hasNoChildren && (
            <View style={[styles.loadingContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading timeline activities...
              </ThemedText>
            </View>
          )}

          {/* Error State */}
          {timelineError && !isLoading && (
            <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderColor: colors.error }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.error} />
              <ThemedText type="defaultSemiBold" style={[styles.errorTitle, { color: colors.error }]}>
                Unable to Load Timeline
              </ThemedText>
              <ThemedText style={[styles.errorText, { color: colors.textSecondary }]}>
                There was a problem loading the activity timeline. Please check your connection and try again.
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.tint }]}
                onPress={handleRefresh}
              >
                <IconSymbol name="arrow.clockwise" size={16} color="#FFFFFF" />
                <ThemedText style={styles.retryButtonText}>
                  Try Again
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* No Data State */}
          {hasNoData && !isLoading && !timelineError && !hasNoChildren && (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="clock.fill" size={48} color={colors.textSecondary} />
              <ThemedText type="title" style={[styles.emptyTitle, { color: colors.text }]}>
                No Activities Yet
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeFilter === 'today'
                  ? "No activities logged today. Start tracking diaper changes to see them here."
                  : `No activities found for ${filterConfig.label.toLowerCase()}. Try a different time period or log some activities.`
                }
              </ThemedText>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push('/(tabs)')}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <ThemedText style={styles.emptyButtonText}>
                  Log Activity
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Timeline Component */}
          {!isLoading && !timelineError && !hasNoChildren && events.length > 0 && (
            <ActivityTimeline
              events={events}
              periods={periods}
              onEventPress={handleEventPress}
              onRefresh={handleRefresh}
              refreshing={timelineLoading}
              onEndReached={hasMore ? loadMore : undefined}
              testID="activity-timeline"
            />
          )}
        </View>

        {/* Load More Indicator */}
        {hasMore && !isLoading && events.length > 0 && (
          <View style={[styles.loadMoreContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.tint }]}
              onPress={loadMore}
              accessibilityRole="button"
              accessibilityLabel="Load more activities"
            >
              <IconSymbol name="arrow.down.circle.fill" size={16} color="#FFFFFF" />
              <ThemedText style={styles.loadMoreText}>
                Load More Activities
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Canadian Privacy Indicator */}
        <TouchableOpacity
          style={[styles.trustIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}
          ref={privacyRef}
          onPress={() => {
            if (canShowTooltips) {
              showCanadianDataTooltip(privacyRef.current);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Learn about Canadian data privacy"
        >
          <IconSymbol name="checkmark.shield.fill" size={16} color={colors.info} />
          <ThemedText style={[styles.trustText, { color: colors.textSecondary }]}>
            Timeline data stored securely in Canada
          </ThemedText>
        </TouchableOpacity>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 20,
    opacity: 0.9,
  },
  childSelectorContainer: {
    minWidth: 120,
    paddingTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statsSubtext: {
    fontSize: 12,
    fontWeight: '500',
  },
  filtersSection: {
    paddingBottom: 16,
  },
  filtersScrollView: {
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 100,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineContainer: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 300,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreContainer: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
});