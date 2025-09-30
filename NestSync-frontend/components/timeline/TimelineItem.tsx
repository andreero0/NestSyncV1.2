/**
 * Timeline Item Component
 * 
 * Compact 48px list item replacing massive 280×88px cards.
 * Optimized for tired parents with simple color-coded icons,
 * essential information only, and one-handed usability.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useActivityColors } from '@/hooks/useActivityColors';
import type { TimelineEvent } from '@/types/timeline';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface TimelineItemProps {
  item: TimelineEvent;
  onPress?: (item: TimelineEvent) => void;
  onLongPress?: (item: TimelineEvent) => void;
  testID?: string;
}

export function TimelineItem({
  item,
  onPress,
  onLongPress,
  testID,
}: TimelineItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const activityColors = useActivityColors(item.type);
  
  // Animation values
  const pressed = useSharedValue(false);
  const scale = useSharedValue(1);
  
  // Format timestamp for Canadian timezone (12-hour format)
  const formatTime = useCallback((timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-CA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Press handlers with haptic feedback
  const handlePressIn = useCallback(() => {
    pressed.value = true;
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 400,
    });
    
    // Light haptic feedback for touch acknowledgment
    if (Platform.OS === 'ios') {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePressOut = useCallback(() => {
    pressed.value = false;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  }, []);

  const handlePress = useCallback(() => {
    onPress?.(item);
    
    // Medium haptic feedback for action completion
    if (Platform.OS === 'ios') {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [item, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(item);
    
    // Strong haptic feedback for context menu
    if (Platform.OS === 'ios') {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [item, onLongPress]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: withTiming(
      pressed.value ? colors.surface : 'transparent',
      { duration: 150 }
    ),
  }));

  // Generate accessibility label
  const accessibilityLabel = `${activityColors.displayName} at ${formatTime(item.timestamp)}${
    item.details ? `, ${item.details}` : ''
  }`;

  return (
    <AnimatedPressable
      style={[styles.container, containerStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to edit this activity"
      testID={testID}
    >
      <View style={styles.content}>
        {/* Icon Area - 32×32px container with 16×16px icon */}
        <View 
          style={[
            styles.iconContainer,
            { backgroundColor: activityColors.primary }
          ]}
        >
          <IconSymbol
            name={activityColors.icon as any}
            size={16}
            color="#FFFFFF"
          />
        </View>

        {/* Content Area - Primary text and details */}
        <View style={styles.textContainer}>
          <Text
            style={[styles.primaryText, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {activityColors.displayName || 'Activity'}
          </Text>
          {item.details && typeof item.details === 'string' && item.details.trim().length > 0 && (
            <Text
              style={[styles.secondaryText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.details.trim().length > 50 ? `${item.details.trim().substring(0, 50)}...` : item.details.trim()}
            </Text>
          )}
        </View>

        {/* Time Area - Fixed 80px width */}
        <View style={styles.timeContainer}>
          <Text
            style={[styles.timeText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48, // Fixed 48px height as per specification
    paddingHorizontal: 16, // 16px horizontal padding
    justifyContent: 'center',
    borderRadius: 0, // No border radius for clean list appearance
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8, // 8px gap after icon
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8, // 8px gap before time
    minHeight: 32, // Ensure proper vertical alignment
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '500', // Medium weight
    lineHeight: 20,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '400', // Regular weight
    lineHeight: 16,
    ...Platform.select({
      ios: {
        fontFamily: '-apple-system',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  timeContainer: {
    width: 80, // Fixed 80px width for scanning consistency
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '400', // Regular weight
    lineHeight: 16,
    textAlign: 'right',
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