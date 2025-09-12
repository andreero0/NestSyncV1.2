/**
 * useSplashLogic Hook
 * Handles timing, animation states, and navigation logic for the NestSync splash screen
 * Designed for Canadian diaper planning app onboarding Phase 1
 */

import { useState, useEffect, useCallback } from 'react';
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
  onSplashComplete: () => void;
}

const useSplashLogic = (onComplete?: () => void): UseSplashLogicReturn => {
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

  // Splash completion callback
  const onSplashComplete = useCallback(() => {
    setSplashState(prev => ({
      ...prev,
      isComplete: true,
    }));
    announceToScreenReader('Loading complete');
    
    // Call the optional completion callback
    if (onComplete) {
      onComplete();
    }
  }, [onComplete, announceToScreenReader]);

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

    // Auto-completion after animation sequence (3.5s total)
    const completionTimer = setTimeout(() => {
      onSplashComplete();
    }, 3500);

    // Cleanup timers
    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(phase3Timer);
      clearTimeout(progressTimer);
      clearTimeout(completionTimer);
    };
  }, [announceToScreenReader, onSplashComplete]);

  return {
    splashState,
    progressValue,
    isReducedMotionEnabled,
    announceToScreenReader,
    onSplashComplete,
  };
};

export default useSplashLogic;