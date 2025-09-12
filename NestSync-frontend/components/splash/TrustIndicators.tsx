/**
 * TrustIndicators Component
 * Canadian identity and PIPEDA trust messaging for NestSync splash screen Phase 3
 * Designed to build confidence for stressed Canadian parents
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { NestSyncColors } from '../../constants/Colors';

interface TrustIndicatorsProps {
  isVisible: boolean;
  isReducedMotion?: boolean;
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  isVisible,
  isReducedMotion = false,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  React.useEffect(() => {
    if (isReducedMotion) {
      // Instant appearance for reduced motion
      opacity.value = isVisible ? 1 : 0;
      translateY.value = isVisible ? 0 : 10;
    } else {
      // Smooth fade-in with subtle upward motion
      opacity.value = withDelay(
        200, // Small delay for staggered effect after Lottie animation
        withTiming(isVisible ? 1 : 0, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        })
      );
      
      translateY.value = withDelay(
        200,
        withTiming(isVisible ? 0 : 10, {
          duration: 400,
          easing: Easing.out(Easing.ease),
        })
      );
    }
  }, [isVisible, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      accessible={true}
      accessibilityLabel="Made in Canada, PIPEDA-ready data protection"
      accessibilityRole="text"
    >
      <View style={styles.indicatorContainer}>
        <Text style={styles.trustText}>
          Made in Canada • PIPEDA-ready
        </Text>
      </View>
    </Animated.View>
  );
};

export default TrustIndicators;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
    color: NestSyncColors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});