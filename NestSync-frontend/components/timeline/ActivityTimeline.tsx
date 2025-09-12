/**
 * Activity Timeline Component
 * 
 * Simple FlatList-based timeline container replacing over-engineered
 * TimelineContainer. Optimized for smooth scrolling with 1000+ items
 * and 60fps performance for stressed parent usage.
 */

import React, { useCallback, useMemo, memo } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ListRenderItem,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimelineItem } from './TimelineItem';
import { TimelinePeriodHeader } from './TimelinePeriodHeader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { TimelineEvent, TimePeriod } from '@/types/timeline';

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  periods: TimePeriod[];
  onEventPress?: (event: TimelineEvent) => void;
  onEventLongPress?: (event: TimelineEvent) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  testID?: string;
}

// Flattened item type for FlatList rendering
interface TimelineListItem {
  id: string;
  type: 'period' | 'event';
  data: TimePeriod | TimelineEvent;
}

// Memoized TimelineItem for performance
const MemoizedTimelineItem = memo(TimelineItem);
const MemoizedTimelinePeriodHeader = memo(TimelinePeriodHeader);

export function ActivityTimeline({
  events,
  periods,
  onEventPress,
  onEventLongPress,
  onRefresh,
  refreshing = false,
  onEndReached,
  onEndReachedThreshold = 0.1,
  testID,
}: ActivityTimelineProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Flatten periods and events into a single list for FlatList
  const flattenedData = useMemo((): TimelineListItem[] => {
    const items: TimelineListItem[] = [];
    
    periods.forEach((period) => {
      // Add period header
      items.push({
        id: `period-${period.id}`,
        type: 'period',
        data: period,
      });
      
      // Add period events
      period.events.forEach((event) => {
        items.push({
          id: `event-${event.id}`,
          type: 'event',
          data: event,
        });
      });
    });
    
    return items;
  }, [periods]);

  // Optimized render item function
  const renderItem: ListRenderItem<TimelineListItem> = useCallback(({ item }) => {
    if (item.type === 'period') {
      return (
        <MemoizedTimelinePeriodHeader
          period={item.data as TimePeriod}
          testID={`period-header-${item.id}`}
        />
      );
    }
    
    return (
      <MemoizedTimelineItem
        item={item.data as TimelineEvent}
        onPress={onEventPress}
        onLongPress={onEventLongPress}
        testID={`timeline-item-${item.id}`}
      />
    );
  }, [onEventPress, onEventLongPress]);

  // Optimized key extractor
  const keyExtractor = useCallback((item: TimelineListItem) => item.id, []);

  // Item separator component
  const ItemSeparator = useCallback(() => (
    <View style={[styles.separator, { backgroundColor: colors.border }]} />
  ), [colors.border]);

  // Empty state component
  const EmptyListComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <IconSymbol name="clock.fill" size={32} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No activities yet
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Start logging diaper changes to see your activity timeline
      </Text>
    </View>
  ), [colors]);

  // List header component
  const ListHeaderComponent = useCallback(() => (
    <View style={styles.listHeader}>
      <Text style={[styles.statsText, { color: colors.textSecondary }]}>
        {events.length} activities in the last 30 days
      </Text>
    </View>
  ), [events.length, colors.textSecondary]);

  // List footer component for spacing
  const ListFooterComponent = useCallback(() => (
    <View style={{ height: insets.bottom + 100 }} />
  ), [insets.bottom]);

  // Refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.tint}
      colors={[colors.tint]}
      progressBackgroundColor={colors.surface}
    />
  ), [refreshing, onRefresh, colors]);

  // Get item layout for optimization (all items are 48px + separator)
  const getItemLayout = useCallback((data: TimelineListItem[] | null | undefined, index: number) => {
    const ITEM_HEIGHT = 48;
    const SEPARATOR_HEIGHT = 1;
    const itemHeight = ITEM_HEIGHT + SEPARATOR_HEIGHT;
    
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, []);

  return (
    <FlatList
      data={flattenedData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={EmptyListComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      refreshControl={refreshControl}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      initialNumToRender={15}
      windowSize={10}
      updateCellsBatchingPeriod={50}
      disableVirtualization={false}
      keyboardShouldPersistTaps="handled"
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      testID={testID}
      accessible={true}
      accessibilityRole="list"
      accessibilityLabel="Baby activities timeline"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  separator: {
    height: 1,
    marginLeft: 56, // Align with content after icon
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
});