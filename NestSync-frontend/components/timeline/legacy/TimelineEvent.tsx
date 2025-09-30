/**
 * Timeline Event Component
 * 
 * Individual event cards with airline-style design, haptic feedback,
 * and smooth animations. Optimized for accessibility and stressed parent UX.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type {
  TimelineEventProps,
} from '@/types/timeline';

import { 
  getEventColors, 
  getEventIcon, 
  generateAccessibilityLabel,
  TIMELINE_CONSTANTS,
} from '@/utils/timelineHelpers';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TimelineEvent({
  event,
  position,
  onPress,
  style,
  animated = true,
}: TimelineEventProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);
  const pressed = useSharedValue(false);
  
  // Event visual configuration
  const eventColors = getEventColors(event.type, colors);
  const iconConfig = getEventIcon(event.type);

  // Entry animation
  React.useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, { 
        damping: 12, 
        stiffness: 300,
        mass: 0.8,
      });
    }
  }, [animated, opacity, translateY]);

  // Press animation handlers
  const handlePressIn = () => {
    pressed.value = true;
    scale.value = withSpring(0.96, { 
      damping: 15, 
      stiffness: 400,
    });
    
    // Haptic feedback for better interaction
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressed.value = false;
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 400,
    });
  };

  const handlePress = () => {
    onPress?.();
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Animated styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
    shadowOpacity: interpolate(scale.value, [0.96, 1], [0.05, 0.12]),
    elevation: interpolate(scale.value, [0.96, 1], [2, 4]),
  }));

  // Connection line to timeline axis
  const connectionLineStyle = {
    position: 'absolute' as const,
    top: TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT / 2 - 1,
    width: 24,
    height: 2,
    backgroundColor: eventColors.accentColor,
    opacity: 0.7,
    borderRadius: 1,
    [position.side === 'left' ? 'right' : 'left']: -24,
  };

  // Format event time for display
  const eventTime = event.timestamp.toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <View style={[styles.wrapper, style]}>
      {/* Connection line to timeline axis */}
      <View style={connectionLineStyle} />
      
      {/* Main event card */}
      <AnimatedPressable
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderLeftColor: eventColors.accentColor,
            shadowColor: colors.tint,
          },
          cardStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={generateAccessibilityLabel(event)}
        accessibilityHint="Double tap for more details about this activity"
      >
        {/* Event Icon */}
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: eventColors.accentColor }
          ]}
        >
          <IconSymbol 
            name={iconConfig.iconName as any} 
            size={18} 
            color={colors.background} 
          />
        </View>

        {/* Event Content */}
        <View style={styles.content}>
          {/* Event Title */}
          <Text 
            style={[styles.title, { color: colors.text }]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {event.title}
          </Text>
          
          {/* Event Details */}
          {event.details && (
            <Text 
              style={[styles.details, { color: colors.textSecondary }]} 
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {event.details}
            </Text>
          )}
          
          {/* Event Time */}
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {eventTime}
          </Text>

          {/* Child Name (if multiple children) */}
          {event.child.name && (
            <Text style={[styles.childName, { color: colors.textSecondary }]}>
              {event.child.name}
            </Text>
          )}
        </View>

        {/* Status Indicator */}
        {event.status && event.status !== 'COMPLETED' && (
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: eventColors.statusColor || eventColors.accentColor }
              ]} 
            />
          </View>
        )}

        {/* Event Type Badge (for important events) */}
        {(event.type === 'SIZE_CHANGE' || event.type === 'GROWTH_MILESTONE') && (
          <View style={[styles.badge, { backgroundColor: eventColors.accentColor }]}>
            <Text style={[styles.badgeText, { color: colors.background }]}>
              {event.type === 'SIZE_CHANGE' ? 'SIZE' : 'MILESTONE'}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    width: TIMELINE_CONSTANTS.EVENT_CARD_WIDTH,
    minHeight: TIMELINE_CONSTANTS.EVENT_CARD_HEIGHT,
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    // Enhanced accessibility
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 36,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
    opacity: 0.9,
  },
  timestamp: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  childName: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  statusContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

// Export already defined above