/**
 * Timeline Container - Main Timeline Component
 * 
 * Airline-style vertical timeline with physics-based scrolling, providing
 * chronological navigation through child activity history with Canadian
 * timezone compliance and accessibility optimizations for tired parents.
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withDecay,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import type {
  TimelineEvent,
  TimePeriod,
  TimelineRange,
  TimelineContainerProps,
} from '@/types/timeline';

import { TimelineAxis } from './TimelineAxis';
import { TimelineEvent as TimelineEventComponent } from './TimelineEvent';
import { TimePeriodHeader } from './TimePeriodHeader';
import { 
  calculateTimelineLayout, 
  findNearestEventPosition, 
  calculateTimePosition,
  TIMELINE_CONSTANTS,
} from '@/utils/timelineHelpers';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export function TimelineContainer({
  events,
  currentTime,
  timeRange,
  onEventPress,
  onRefresh,
  refreshing = false,
  style,
}: TimelineContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  // Animation values for scroll physics
  const scrollY = useSharedValue(0);
  const isScrolling = useSharedValue(false);
  const velocity = useSharedValue(0);
  const snapTarget = useSharedValue(0);

  // Calculate timeline layout with proper positioning
  const timelineLayout = useMemo(() => {
    if (!events.length) {
      return {
        totalHeight: SCREEN_HEIGHT,
        periods: [],
        currentTimePosition: 100,
      };
    }

    // Group events by periods (simplified for now)
    const periods: TimePeriod[] = [];
    let currentY = 100; // Start position
    
    // Create a single period for now (will be expanded with proper grouping)
    if (events.length > 0) {
      const period: TimePeriod = {
        id: 'period-all',
        type: 'TODAY',
        label: 'Recent Activity',
        startDate: events[events.length - 1].timestamp,
        endDate: events[0].timestamp,
        events: events,
        startY: currentY,
        height: TIMELINE_CONSTANTS.PERIOD_HEADER_HEIGHT + 
                (events.length * (TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT + TIMELINE_CONSTANTS.EVENT_SPACING)),
      };
      periods.push(period);
      currentY += period.height;
    }

    const totalHeight = Math.max(SCREEN_HEIGHT * 2, currentY + 200);
    const currentTimePosition = calculateTimePosition(currentTime, timeRange, totalHeight);

    return {
      totalHeight,
      periods,
      currentTimePosition,
    };
  }, [events, timeRange, currentTime]);

  // Enhanced scroll handler with momentum and snap functionality
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      isScrolling.value = true;
    },
    onBeginDrag: () => {
      isScrolling.value = true;
    },
    onEndDrag: (event) => {
      velocity.value = event.velocity?.y || 0;
      isScrolling.value = false;
      
      // Implement snap-to-event logic
      const currentVelocity = Math.abs(velocity.value);
      
      if (currentVelocity < TIMELINE_CONSTANTS.SCROLL_SNAP_THRESHOLD) {
        // Low velocity - snap to nearest event
        const nearestEventY = findNearestEventPosition(scrollY.value, timelineLayout);
        
        scrollY.value = withSpring(nearestEventY, {
          damping: 15,
          stiffness: 300,
          velocity: velocity.value,
        });
      } else {
        // High velocity - use decay with clamping
        scrollY.value = withDecay({
          velocity: velocity.value,
          deceleration: 0.998,
          clamp: [0, timelineLayout.totalHeight - SCREEN_HEIGHT + insets.bottom],
        });
      }
    },
    onMomentumEnd: () => {
      isScrolling.value = false;
    },
  });

  // Handle event press with haptic feedback
  const handleEventPress = useCallback((event: TimelineEvent) => {
    onEventPress?.(event);
  }, [onEventPress]);

  // Handle refresh functionality
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Container animation style
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: colors.background,
  }));

  // Scroll indicator style
  const scrollIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      isScrolling.value ? 1 : 0,
      [0, 1],
      [0.3, 0.8]
    );
    
    const translateY = interpolate(
      scrollY.value,
      [0, timelineLayout.totalHeight - SCREEN_HEIGHT],
      [0, SCREEN_HEIGHT - 100]
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{
            height: timelineLayout.totalHeight,
            paddingHorizontal: 20,
            paddingTop: insets.top + 60, // Account for header
            paddingBottom: insets.bottom + 100,
          }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.98}
        >
          {/* Timeline Axis - Central vertical line */}
          <TimelineAxis
            timeRange={timeRange}
            currentTime={currentTime}
            scrollY={scrollY}
            isScrolling={isScrolling}
            totalHeight={timelineLayout.totalHeight}
          />

          {/* Timeline Content - Periods and Events */}
          {timelineLayout.periods.map((period, periodIndex) => (
            <View key={period.id} style={styles.periodContainer}>
              {/* Period Header */}
              <TimePeriodHeader
                period={period}
                style={{
                  position: 'absolute',
                  top: period.startY,
                  left: 0,
                  right: 0,
                  zIndex: 5,
                }}
              />

              {/* Period Events */}
              {period.events.map((event, eventIndex) => {
                const position = eventIndex % 2 === 0 ? 'left' : 'right';
                const yPosition = period.startY + 
                                  TIMELINE_CONSTANTS.PERIOD_HEADER_HEIGHT + 
                                  (eventIndex * (TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT + TIMELINE_CONSTANTS.EVENT_SPACING));

                return (
                  <TimelineEventComponent
                    key={event.id}
                    event={event}
                    position={{
                      x: position === 'left' ? 20 : SCREEN_WIDTH - 20 - TIMELINE_CONSTANTS.EVENT_CARD_WIDTH,
                      y: yPosition,
                      side: position,
                    }}
                    style={{
                      position: 'absolute',
                      top: yPosition,
                      [position]: 20,
                      width: TIMELINE_CONSTANTS.EVENT_CARD_WIDTH,
                    }}
                    onPress={() => handleEventPress(event)}
                    animated={true}
                  />
                );
              })}
            </View>
          ))}
        </Animated.ScrollView>

        {/* Scroll Progress Indicator */}
        <Animated.View 
          style={[
            styles.scrollIndicator, 
            { 
              backgroundColor: colors.tint,
              right: insets.right + 8,
            },
            scrollIndicatorStyle,
          ]}
        />
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  periodContainer: {
    position: 'relative',
  },
  scrollIndicator: {
    position: 'absolute',
    width: 4,
    height: 60,
    borderRadius: 2,
    top: 100,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export { TimelineContainer };