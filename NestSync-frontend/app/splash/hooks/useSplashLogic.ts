/**
 * useSplashLogic Hook
 * Handles timing, animation states, and navigation logic for the NestSync splash screen
 * Designed for Canadian diaper planning app onboarding Phase 1
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { AccessibilityInfo } from 'react-native';

export interface SplashState {
  currentPhase: 1 | 2 | 3;
  isComplete: boolean;
  shouldShowPhase1: boolean;  // App name "NestSync" 
  shouldShowPhase2: boolean;  // Caring Mother animation + tagline
  shouldShowPhase3: boolean;  // Trust indicators + loading bar
}

interface UseSplashLogicReturn {
  splashState: SplashState;
  progressValue: number;
  isReducedMotionEnabled: boolean;
  announceToScreenReader: (text: string) => void;
}

const useSplashLogic = (): UseSplashLogicReturn => {
  const router = useRouter();
  const [splashState, setSplashState] = useState<SplashState>({
    currentPhase: 1,
    isComplete: false,
    shouldShowPhase1: false,
    shouldShowPhase2: false,
    shouldShowPhase3: false,
  });
  const [progressValue, setProgressValue] = useState(0);
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setIsReducedMotionEnabled(isReducedMotion);
      } catch (error) {
        console.warn('Could not check reduced motion preference:', error);
        setIsReducedMotionEnabled(false);
      }
    };
    
    checkReducedMotion();
  }, []);

  // Screen reader announcement function
  const announceToScreenReader = useCallback((text: string) => {
    AccessibilityInfo.announceForAccessibility(text);
  }, []);

  // Main splash sequence logic
  useEffect(() => {
    // Phase 1: App name "NestSync" (0-1s)
    const phase1Timer = setTimeout(() => {
      setSplashState(prev => ({
        ...prev,
        shouldShowPhase1: true,
      }));
      announceToScreenReader('NestSync - Never run out again');
    }, 100); // Small delay to ensure smooth start

    // Phase 2: Caring Mother animation + tagline (1-2s)
    const phase2Timer = setTimeout(() => {
      setSplashState(prev => ({
        ...prev,
        currentPhase: 2,
        shouldShowPhase2: true,
      }));
      announceToScreenReader('Canadian diaper planning app');
    }, 1000);

    // Phase 3: Trust indicators + loading bar (2-3s)
    const phase3Timer = setTimeout(() => {
      setSplashState(prev => ({
        ...prev,
        currentPhase: 3,
        shouldShowPhase3: true,
      }));
      announceToScreenReader('Made in Canada, PIPEDA-ready');
    }, 2000);

    // Progress bar animation during phase 3
    const progressTimer = setTimeout(() => {
      // Animate progress from 0 to 100% over 1 second
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setProgressValue(progress);
        
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 100); // 10 steps over 1 second = 100ms intervals
    }, 2000);

    // Navigation to next screen (3-3.5s)
    const navigationTimer = setTimeout(() => {
      setSplashState(prev => ({
        ...prev,
        isComplete: true,
      }));
      announceToScreenReader('Loading complete');
      
      // Navigate to login (consent handled just-in-time)
      router.replace('/(auth)/login');
    }, 3500);

    // Cleanup timers
    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      clearTimeout(progressTimer);
      clearTimeout(navigationTimer);
    };
  }, [router, announceToScreenReader]);

  return {
    splashState,
    progressValue,
    isReducedMotionEnabled,
    announceToScreenReader,
  };
};

export default useSplashLogic;