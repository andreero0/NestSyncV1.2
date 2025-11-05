/**
 * NestSync Splash Screen - Phase 1 of 4-Phase Onboarding
 * Canadian diaper planning app - Designed for stressed Canadian parents
 * 
 * 3-State Animation Sequence:
 * 1. State 1 (0-1s): App name "NestSync" fade-in
 * 2. State 2 (1-2s): Maple leaf icon + tagline "Never run out again"
 * 3. State 3 (2-3s): Trust indicators "Made in Canada • PIPEDA-ready" + loading bar
 */

import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSplashLogic from '../../hooks/useSplashLogic';
import SplashAnimation from './SplashAnimation';
import TrustIndicators from './TrustIndicators';
import LoadingBar from './LoadingBar';
import { NestSyncColors } from '../../constants/Colors';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const { 
    splashState, 
    progressValue, 
    isReducedMotionEnabled 
  } = useSplashLogic(onComplete);

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          <View style={styles.content}>
            {/* Main Animation Container */}
            <View style={styles.animationContainer}>
              <SplashAnimation
                splashState={splashState}
                isReducedMotion={isReducedMotionEnabled}
              />
            </View>

            {/* Bottom Section - Trust Indicators + Loading Bar */}
            <View style={styles.bottomSection}>
              {/* Phase 3: Trust Indicators */}
              {splashState.shouldShowPhase3 && (
                <TrustIndicators
                  isVisible={splashState.shouldShowPhase3}
                  isReducedMotion={isReducedMotionEnabled}
                />
              )}

              {/* Phase 3: Loading Bar */}
              {splashState.shouldShowPhase3 && (
                <LoadingBar
                  progress={progressValue}
                  isVisible={splashState.shouldShowPhase3}
                  isReducedMotion={isReducedMotionEnabled}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF', // Light blue gradient start color
  },
  background: {
    flex: 1,
    backgroundColor: '#F0F9FF', // Light blue background as per design specs
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60, // Safe area padding
    paddingBottom: 40,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 80, // Ensure enough space for trust indicators + loading bar
  },
});