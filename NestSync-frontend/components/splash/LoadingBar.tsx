/**
 * LoadingBar Component
 * Progress indicator for NestSync splash screen Phase 3
 * 4px height, smooth animation, accessible implementation
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { NestSyncColors } from '../../constants/Colors';

interface LoadingBarProps {
  progress: number; // 0-100
  isVisible: boolean;
  isReducedMotion?: boolean;
}

const LoadingBar: React.FC<LoadingBarProps> = ({
  progress,
  isVisible,
  isReducedMotion = false,
}) => {
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    if (isReducedMotion) {
      // Instant progress for reduced motion
      progressValue.value = progress / 100;
    } else {
      // Smooth animation for normal motion
      progressValue.value = withTiming(progress / 100, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [progress, isReducedMotion]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const containerOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isReducedMotion) {
      containerOpacity.value = isVisible ? 1 : 0;
    } else {
      containerOpacity.value = withTiming(isVisible ? 1 : 0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [isVisible, isReducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View 
      style={[styles.container, containerStyle]}
      accessible={true}
      accessibilityLabel={`Loading progress: ${progress} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: progress,
      }}
    >
      <View style={styles.track}>
        <Animated.View 
          style={[styles.progress, progressBarStyle]}
        />
      </View>
    </Animated.View>
  );
};

export default LoadingBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  track: {
    height: 4,
    backgroundColor: NestSyncColors.primary.blueLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: NestSyncColors.primary.blue,
    borderRadius: 2,
  },
});