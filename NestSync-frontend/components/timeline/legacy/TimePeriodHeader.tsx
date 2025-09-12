/**
 * Time Period Header Component
 * 
 * Sticky period separators for timeline sections (Today, Yesterday, This Week)
 * with smooth animations and accessibility optimizations.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, NestSyncColors } from '@/constants/Colors';
import type {
  TimePeriod,
  TimePeriodHeaderProps,
} from '@/types/timeline';

import { TIMELINE_CONSTANTS } from '@/utils/timelineHelpers';

export function TimePeriodHeader({
  period,
  style,
  sticky = true,
}: TimePeriodHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Animation values
  const opacity = useSharedValue(0);

  // Entry animation
  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
  }, [opacity]);

  // Get period icon based on type
  const getPeriodIcon = (type: TimePeriod['type']): string => {
    switch (type) {
      case 'TODAY':
        return '🌅'; // Use emoji until IconSymbol icons are confirmed
      case 'YESTERDAY':
        return '🌄';
      case 'THIS_WEEK':
        return '📅';
      case 'LAST_WEEK':
        return '📆';
      case 'EARLIER':
        return '🗓️';
      default:
        return '📝';
    }
  };

  // Get period description
  const getPeriodDescription = (period: TimePeriod): string => {
    const eventCount = period.events.length;
    const eventText = eventCount === 1 ? 'activity' : 'activities';
    
    switch (period.type) {
      case 'TODAY':
        return `${eventCount} ${eventText} today`;
      case 'YESTERDAY':
        return `${eventCount} ${eventText} yesterday`;
      case 'THIS_WEEK':
        return `${eventCount} ${eventText} this week`;
      case 'LAST_WEEK':
        return `${eventCount} ${eventText} last week`;
      case 'EARLIER':
        return `${eventCount} ${eventText} from earlier`;
      default:
        return `${eventCount} ${eventText}`;
    }
  };

  // Get period visual priority (for styling)
  const getPeriodPriority = (type: TimePeriod['type']): 'high' | 'medium' | 'low' => {
    switch (type) {
      case 'TODAY':
        return 'high';
      case 'YESTERDAY':
      case 'THIS_WEEK':
        return 'medium';
      default:
        return 'low';
    }
  };

  const priority = getPeriodPriority(period.type);

  // Style based on priority
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          titleColor: colors.text,
          titleWeight: '700' as const,
          backgroundColor: colors.tint + '15', // 8% opacity
          borderColor: colors.tint + '30',     // 19% opacity
        };
      case 'medium':
        return {
          titleColor: colors.text,
          titleWeight: '600' as const,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
      case 'low':
        return {
          titleColor: colors.textSecondary,
          titleWeight: '500' as const,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  const priorityStyles = getPriorityStyles();

  // Animated style for opacity
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: priorityStyles.backgroundColor,
          borderBottomColor: priorityStyles.borderColor,
        },
        style,
        animatedStyle,
      ]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`${period.label} section with ${period.events.length} activities`}
    >
      {/* Background blur effect for sticky headers */}
      {sticky && (
        <BlurView 
          intensity={20} 
          tint={colorScheme ?? 'light'}
          style={StyleSheet.absoluteFill} 
        />
      )}

      {/* Header Content */}
      <View style={styles.content}>
        {/* Period Icon and Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.periodIcon} accessible={false}>
            {getPeriodIcon(period.type)}
          </Text>
          
          <Text
            style={[
              styles.title,
              {
                color: priorityStyles.titleColor,
                fontWeight: priorityStyles.titleWeight,
              },
            ]}
          >
            {period.label}
          </Text>
        </View>

        {/* Period Statistics */}
        <View style={styles.statsContainer}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {getPeriodDescription(period)}
          </Text>
          
          {/* Event count badge for high priority periods */}
          {priority === 'high' && period.events.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.tint }]}>
              <Text style={[styles.countText, { color: colors.background }]}>
                {period.events.length}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Time Range Indicator */}
      {period.startDate && period.endDate && period.type !== 'TODAY' && (
        <View style={styles.timeRangeContainer}>
          <Text style={[styles.timeRange, { color: colors.textSecondary }]}>
            {period.startDate.toLocaleDateString('en-CA', {
              month: 'short',
              day: 'numeric',
            })}
            {period.startDate.getDate() !== period.endDate.getDate() && (
              <>
                {' - '}
                {period.endDate.toLocaleDateString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                })}
              </>
            )}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TIMELINE_CONSTANTS.PERIOD_HEADER_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  periodIcon: {
    fontSize: 18,
    marginRight: 8,
    textAlign: 'center',
    width: 24,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  timeRangeContainer: {
    position: 'absolute',
    right: 20,
    top: 4,
  },
  timeRange: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
});

export { TimePeriodHeader };