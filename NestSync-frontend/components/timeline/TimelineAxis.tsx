/**
 * Timeline Axis Component
 * 
 * Central vertical timeline axis with time markers, current time indicator,
 * and animated visual feedback. Designed for airline-style navigation
 * with accessibility optimizations for stressed parents.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  withRepeat,
  withTiming,
  useSharedValue,
  useAnimatedReaction,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, NestSyncColors } from '@/constants/Colors';
import type {
  TimelineRange,
  TimelineAxisProps,
  TimeMarker,
} from '@/types/timeline';

import { 
  generateTimeMarkers, 
  calculateTimePosition,
  formatTimeMarker,
  TIMELINE_CONSTANTS,
} from '@/utils/timelineHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TimelineAxis({
  timeRange,
  currentTime,
  scrollY,
  isScrolling,
  totalHeight,
  markers,
}: TimelineAxisProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const axisOpacity = useSharedValue(0.9);

  // Generate time markers if not provided
  const timeMarkers = useMemo(() => {
    return markers || generateTimeMarkers(timeRange, totalHeight);
  }, [markers, timeRange, totalHeight]);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    return calculateTimePosition(currentTime, timeRange, totalHeight);
  }, [currentTime, timeRange, totalHeight]);

  // Pulse animation for current time indicator
  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1.0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  // Axis opacity animation based on scrolling
  useAnimatedReaction(
    () => isScrolling.value,
    (scrolling) => {
      axisOpacity.value = withTiming(scrolling ? 1.0 : 0.9, { duration: 200 });
    }
  );

  // Main axis animated style
  const axisStyle = useAnimatedStyle(() => ({
    opacity: axisOpacity.value,
    transform: [
      {
        scaleY: interpolate(
          isScrolling.value ? 1 : 0,
          [0, 1],
          [1.0, 1.02]
        ),
      },
    ],
  }));

  // Current time indicator animation
  const currentTimeStyle = useAnimatedStyle(() => {
    const scale = pulseScale.value;
    const shadowOpacity = interpolate(scale, [1.0, 1.1], [0.2, 0.4]);
    
    return {
      transform: [{ scale }],
      top: currentTimePosition,
      shadowOpacity,
    };
  });

  // Time marker animation based on scroll proximity
  const getTimeMarkerStyle = (marker: TimeMarker, index: number) => {
    return useAnimatedStyle(() => {
      const distanceFromCenter = Math.abs(scrollY.value + (SCREEN_WIDTH / 2) - marker.y);
      const maxDistance = 200;
      const opacity = interpolate(
        distanceFromCenter,
        [0, maxDistance],
        [1.0, 0.6],
        'clamp'
      );
      
      const scale = interpolate(
        distanceFromCenter,
        [0, maxDistance],
        [1.1, 1.0],
        'clamp'
      );

      return {
        opacity,
        transform: [{ scale }],
      };
    });
  };

  return (
    <View style={styles.container} >
      {/* Main Timeline Axis with Gradient */}
      <Animated.View style={[styles.axisContainer, axisStyle]}>
        <LinearGradient
          colors={[
            `${colors.tint}40`, // 25% opacity at top
            colors.tint,        // Full opacity in middle
            `${colors.tint}40`, // 25% opacity at bottom
          ]}
          style={styles.axisGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Time Markers */}
      {timeMarkers.map((marker, index) => {
        const markerStyle = getTimeMarkerStyle(marker, index);
        
        return (
          <Animated.View
            key={marker.id}
            style={[
              styles.timeMarker,
              {
                top: marker.y,
                borderColor: colors.tint,
              },
              markerStyle,
            ]}
          >
            {/* Marker Line */}
            <View
              style={[
                styles.markerLine,
                { backgroundColor: colors.tint }
              ]}
            />
            
            {/* Marker Label */}
            <View style={[styles.markerLabelContainer, { backgroundColor: colors.background }]}>
              <Text 
                style={[
                  styles.markerLabel, 
                  { color: colors.textSecondary }
                ]}
                accessibilityLabel={`Time marker: ${marker.label}`}
              >
                {marker.label}
              </Text>
            </View>
          </Animated.View>
        );
      })}

      {/* Current Time Indicator */}
      <Animated.View
        style={[
          styles.currentTimeIndicator,
          {
            backgroundColor: colors.tint,
            borderColor: colors.background,
            shadowColor: colors.tint,
          },
          currentTimeStyle,
        ]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Current time: ${currentTime.toLocaleTimeString('en-CA', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`}
        accessibilityHint="Double tap to scroll to current time"
      >
        {/* Inner indicator dot */}
        <View 
          style={[
            styles.currentTimeInner,
            { backgroundColor: colors.background }
          ]} 
        />
      </Animated.View>

      {/* Axis Connection Lines to Events */}
      <View style={styles.connectionLinesContainer}>
        {/* These will be dynamically generated based on event positions */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - (TIMELINE_CONSTANTS.AXIS_WIDTH / 2),
    top: 0,
    bottom: 0,
    width: TIMELINE_CONSTANTS.AXIS_WIDTH,
    zIndex: 10,
  },
  axisContainer: {
    flex: 1,
    width: TIMELINE_CONSTANTS.AXIS_WIDTH,
    borderRadius: TIMELINE_CONSTANTS.AXIS_WIDTH / 2,
    overflow: 'hidden',
  },
  axisGradient: {
    flex: 1,
    width: TIMELINE_CONSTANTS.AXIS_WIDTH,
  },
  timeMarker: {
    position: 'absolute',
    left: -12, // Extend beyond axis width
    right: -12,
    height: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.6,
  },
  markerLabelContainer: {
    position: 'absolute',
    right: 20,
    top: -12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    boxShadow: '0px 1px 2px rgba(0, 0, NaN, 0.1)',
    elevation: 2,
  },
  markerLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  currentTimeIndicator: {
    position: 'absolute',
    width: TIMELINE_CONSTANTS.CURRENT_TIME_INDICATOR_SIZE,
    height: TIMELINE_CONSTANTS.CURRENT_TIME_INDICATOR_SIZE,
    borderRadius: TIMELINE_CONSTANTS.CURRENT_TIME_INDICATOR_SIZE / 2,
    borderWidth: 3,
    left: -(TIMELINE_CONSTANTS.CURRENT_TIME_INDICATOR_SIZE - TIMELINE_CONSTANTS.AXIS_WIDTH) / 2,
    zIndex: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  currentTimeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 5,
  },
});

export { TimelineAxis };