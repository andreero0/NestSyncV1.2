/**
 * Unit Toggle Switch Component
 * Radio transistor-style toggle switch for weight unit selection
 * Provides smooth sliding animation and clear visual feedback
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

export interface UnitSegmentedControlProps {
  /** Current selected unit */
  selectedUnit: 'metric' | 'imperial';
  /** Callback when unit changes */
  onUnitChange: (unit: 'metric' | 'imperial') => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Custom container styling */
  containerStyle?: ViewStyle;
}

/**
 * UnitToggleSwitch provides an intuitive radio transistor-style toggle for users
 * to select between metric (kg) and imperial (lbs) units. The sliding thumb
 * indicator provides clear visual feedback and smooth animation transitions.
 * 
 * Features:
 * - Radio transistor switch aesthetic with sliding thumb
 * - Smooth spring animations for natural feel
 * - Clear visual indication of current selection
 * - Accessibility support with proper ARIA labels
 * - Design system color integration
 * - 44px touch targets for accessibility compliance
 * - Discoverability through obvious toggle interaction pattern
 */
export function UnitSegmentedControl({
  selectedUnit,
  onUnitChange,
  disabled = false,
  containerStyle,
}: UnitSegmentedControlProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const slideAnimation = useRef(new Animated.Value(selectedUnit === 'metric' ? 0 : 1)).current;

  // Track width and thumb width for positioning calculations
  const TRACK_WIDTH = 88;
  const THUMB_WIDTH = 40;
  const THUMB_TRAVEL = TRACK_WIDTH - THUMB_WIDTH - 4; // 4px padding

  useEffect(() => {
    const targetValue = selectedUnit === 'metric' ? 0 : 1;
    
    Animated.spring(slideAnimation, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [selectedUnit, slideAnimation]);

  const handleTogglePress = () => {
    if (disabled) return;
    const newUnit = selectedUnit === 'metric' ? 'imperial' : 'metric';
    onUnitChange(newUnit);
  };

  const thumbTranslateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [2, THUMB_TRAVEL + 2],
    extrapolate: 'clamp',
  });

  const thumbElevation = slideAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [2, 4, 2],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.toggleTrack,
          { backgroundColor: colors.surface, borderColor: colors.border },
          disabled && styles.disabled
        ]}
        onPress={handleTogglePress}
        disabled={disabled}
        activeOpacity={0.8}
        accessibilityRole="switch"
        accessibilityLabel="Toggle between metric and imperial units"
        accessibilityState={{ 
          checked: selectedUnit === 'imperial',
          disabled: disabled 
        }}
        accessibilityValue={{ 
          text: selectedUnit === 'metric' ? 'Metric (kg)' : 'Imperial (lbs)' 
        }}
      >
        {/* Track Labels */}
        <View style={styles.labelsContainer}>
          <Text
            style={[
              styles.labelText,
              { color: selectedUnit === 'metric' ? '#FFFFFF' : colors.text },
              disabled && { color: colors.placeholder }
            ]}
          >
            kg
          </Text>
          <Text
            style={[
              styles.labelText,
              { color: selectedUnit === 'imperial' ? '#FFFFFF' : colors.text },
              disabled && { color: colors.placeholder }
            ]}
          >
            lbs
          </Text>
        </View>

        {/* Sliding Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            { 
              backgroundColor: colors.tint,
              transform: [{ translateX: thumbTranslateX }],
              elevation: thumbElevation,
            }
          ]}
        >
          <View style={[styles.thumbIndicator, { backgroundColor: '#FFFFFF' }]} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },

  toggleTrack: {
    width: 88,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
    // Professional transistor switch aesthetic
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },

  disabled: {
    opacity: 0.5,
  },

  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: '100%',
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },

  labelText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    // Ensure text is always readable
    // Note: textShadow is deprecated in React Native Web, but kept for visual consistency
    // Consider removing if causing deprecation warnings
  },

  thumb: {
    width: 40,
    height: 36,
    borderRadius: 18,
    position: 'absolute',
    top: 2,
    left: 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Radio transistor aesthetic with subtle shadow
    boxShadow: '0 2px 3px rgba(0, 0, 0, 0.25)',
    elevation: 4,
    zIndex: 2,
  },

  thumbIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    // Small indicator dot like radio transistors
    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.2)',
    elevation: 1,
  },
});

export default UnitSegmentedControl;