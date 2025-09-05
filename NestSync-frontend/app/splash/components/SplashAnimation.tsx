/**
 * SplashAnimation Component
 * 3-state animation sequence for NestSync splash screen
 * Phase 1: App name "NestSync" (0-1s)
 * Phase 2: Caring Mother Lottie animation + tagline (1-2s)
 * Phase 3: Trust indicators (2-3s)
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
import LottieView from 'lottie-react-native';
import { NestSyncColors } from '../../../constants/Colors';
import { SplashState } from '../hooks/useSplashLogic';

interface SplashAnimationProps {
  splashState: SplashState;
  isReducedMotion?: boolean;
}


const SplashAnimation: React.FC<SplashAnimationProps> = ({
  splashState,
  isReducedMotion = false,
}) => {
  // Animation values for Phase 1 - App Name
  const phase1Opacity = useSharedValue(0);
  const phase1Scale = useSharedValue(0.8);

  // Animation values for Phase 2 - Lottie Animation + Tagline
  const phase2Opacity = useSharedValue(0);
  const phase2TranslateY = useSharedValue(20);

  // Phase 1 Animation - App Name "NestSync"
  React.useEffect(() => {
    if (splashState.shouldShowPhase1) {
      if (isReducedMotion) {
        phase1Opacity.value = 1;
        phase1Scale.value = 1;
      } else {
        phase1Opacity.value = withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.ease),
        });
        phase1Scale.value = withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.back(1.1)),
        });
      }
    }
  }, [splashState.shouldShowPhase1, isReducedMotion]);

  // Phase 2 Animation - Lottie Animation + Tagline
  React.useEffect(() => {
    if (splashState.shouldShowPhase2) {
      if (isReducedMotion) {
        phase2Opacity.value = 1;
        phase2TranslateY.value = 0;
      } else {
        phase2Opacity.value = withDelay(
          100,
          withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.ease),
          })
        );
        phase2TranslateY.value = withDelay(
          100,
          withTiming(0, {
            duration: 500,
            easing: Easing.out(Easing.ease),
          })
        );
      }
    }
  }, [splashState.shouldShowPhase2, isReducedMotion]);

  // Animated styles
  const phase1Style = useAnimatedStyle(() => ({
    opacity: phase1Opacity.value,
    transform: [{ scale: phase1Scale.value }],
  }));

  const phase2Style = useAnimatedStyle(() => ({
    opacity: phase2Opacity.value,
    transform: [{ translateY: phase2TranslateY.value }],
  }));


  return (
    <View style={styles.container}>
      {/* Phase 1: App Name */}
      <Animated.View 
        style={[styles.phase1Container, phase1Style]}
        accessible={true}
        accessibilityLabel="NestSync"
        accessibilityRole="text"
      >
        <Text style={styles.appName}>NestSync</Text>
      </Animated.View>

      {/* Phase 2: Caring Mother Animation + Tagline */}
      {splashState.shouldShowPhase2 && (
        <Animated.View 
          style={[styles.phase2Container, phase2Style]}
          accessible={true}
          accessibilityLabel="Caring mother with child. Never run out again."
          accessibilityRole="text"
        >
          <LottieView
            source={require('../../../assets/animations/caring-mother.json')}
            autoPlay={true}
            loop={false}
            style={styles.lottieAnimation}
            speed={isReducedMotion ? 0 : 1}
            renderMode="AUTOMATIC"
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Never run out again.</Text>
        </Animated.View>
      )}
    </View>
  );
};

export default SplashAnimation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  phase1Container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: NestSyncColors.primary.blue,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  phase2Container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: NestSyncColors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});