/**
 * Trial Onboarding Hook
 *
 * Provides easy integration of trial onboarding tooltips throughout the app.
 * Manages tooltip state, timing, and context-aware display logic.
 *
 * Usage:
 * ```typescript
 * const { showTooltip, TooltipComponent } = useTrialOnboarding();
 *
 * // In component render
 * return (
 *   <View>
 *     <TouchableOpacity
 *       ref={ref => showTooltip('analytics-first-visit', ref)}
 *       onPress={handleAnalyticsPress}
 *     >
 *       <Text>View Analytics</Text>
 *     </TouchableOpacity>
 *     {TooltipComponent}
 *   </View>
 * );
 * ```
 */

import React, { useState, useCallback, useEffect } from 'react';
import { findNodeHandle, UIManager, Platform } from 'react-native';
import { TrialOnboardingTooltips, TooltipContext, TooltipConfig } from '../components/reorder/TrialOnboardingTooltips';
import { useAnalyticsAccess, useFeatureAccess } from './useFeatureAccess';
import { StorageHelpers } from './useUniversalStorage';

interface TooltipState {
  context: TooltipContext | null;
  position: { x: number; y: number; width: number; height: number } | null;
  config: Partial<TooltipConfig> | null;
  isVisible: boolean;
}

// Storage key for tracking shown tooltips to prevent repeated displays
const SHOWN_TOOLTIPS_KEY = 'nestsync_shown_tooltips';

/**
 * Cross-platform element positioning utility
 * Web: Uses getBoundingClientRect() for element positioning
 * Native: Uses UIManager.measure with findNodeHandle
 */
const measureElement = (
  targetRef: any,
  callback: (x: number, y: number, width: number, height: number) => void,
  onError?: () => void
) => {
  if (Platform.OS === 'web') {
    // Web platform: Use getBoundingClientRect
    try {
      if (targetRef && targetRef.getBoundingClientRect) {
        const rect = targetRef.getBoundingClientRect();
        callback(rect.x, rect.y, rect.width, rect.height);
      } else if (targetRef && targetRef._nativeTag) {
        // Handle React Native Web ref objects
        const element = document.querySelector(`[data-react-native-web="${targetRef._nativeTag}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          callback(rect.x, rect.y, rect.width, rect.height);
        } else {
          onError?.();
        }
      } else {
        onError?.();
      }
    } catch (error) {
      console.warn('Web element positioning failed:', error);
      onError?.();
    }
  } else {
    // Native platform: Use UIManager.measure with findNodeHandle
    try {
      const nodeHandle = findNodeHandle(targetRef);
      if (nodeHandle) {
        UIManager.measure(nodeHandle, (x, y, width, height, pageX, pageY) => {
          callback(pageX, pageY, width, height);
        });
      } else {
        onError?.();
      }
    } catch (error) {
      console.warn('Native element positioning failed:', error);
      onError?.();
    }
  }
};

/**
 * Hook for managing trial onboarding tooltips across the app
 */
export function useTrialOnboarding() {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    context: null,
    position: null,
    config: null,
    isVisible: false,
  });

  const [shownTooltips, setShownTooltips] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const hasAnalyticsAccess = useAnalyticsAccess();
  const { isLoading: isFeatureAccessLoading } = useFeatureAccess();

  // Don't show tooltips if user already has access or if still loading access status
  const canShowTooltips = !hasAnalyticsAccess && !isFeatureAccessLoading && isInitialized;

  // Load previously shown tooltips on initialization
  useEffect(() => {
    const loadShownTooltips = async () => {
      try {
        const stored = await StorageHelpers.getItem(SHOWN_TOOLTIPS_KEY, false);
        if (stored) {
          const parsedTooltips: string[] = JSON.parse(stored);
          setShownTooltips(new Set(parsedTooltips));
        }
      } catch (error) {
        console.warn('Failed to load shown tooltips:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadShownTooltips();
  }, []);

  // Save shown tooltips to storage
  const saveShownTooltips = useCallback(async (tooltips: Set<string>) => {
    try {
      await StorageHelpers.setItem(SHOWN_TOOLTIPS_KEY, JSON.stringify(Array.from(tooltips)), false);
    } catch (error) {
      console.warn('Failed to save shown tooltips:', error);
    }
  }, []);

  /**
   * Show tooltip for a specific context, optionally positioned relative to a component
   */
  const showTooltip = useCallback((
    context: TooltipContext,
    targetRef?: any,
    customConfig?: Partial<TooltipConfig>
  ) => {
    if (!canShowTooltips) {
      return;
    }

    // Don't show tooltip if it has already been shown (unless forced)
    if (shownTooltips.has(context) && !customConfig?.forceShow) {
      return;
    }

    // Mark tooltip as shown
    const newShownTooltips = new Set(shownTooltips);
    newShownTooltips.add(context);
    setShownTooltips(newShownTooltips);
    saveShownTooltips(newShownTooltips);

    if (targetRef) {
      // Use cross-platform element positioning
      measureElement(
        targetRef,
        (x, y, width, height) => {
          setTooltipState({
            context,
            position: { x, y, width, height },
            config: customConfig || null,
            isVisible: true,
          });
        },
        () => {
          // Fallback to centered tooltip if positioning fails
          console.warn('Element positioning failed, showing centered tooltip');
          setTooltipState({
            context,
            position: null,
            config: customConfig || null,
            isVisible: true,
          });
        }
      );
    } else {
      // Show centered tooltip
      setTooltipState({
        context,
        position: null,
        config: customConfig || null,
        isVisible: true,
      });
    }
  }, [canShowTooltips, shownTooltips, saveShownTooltips]);

  /**
   * Show tooltip after a delay (useful for timed reveals)
   */
  const showTooltipDelayed = useCallback((
    context: TooltipContext,
    delayMs: number,
    targetRef?: any,
    customConfig?: Partial<TooltipConfig>
  ) => {
    if (!canShowTooltips) {
      return;
    }

    const timer = setTimeout(() => {
      showTooltip(context, targetRef, customConfig);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [showTooltip, canShowTooltips]);

  /**
   * Hide the current tooltip
   */
  const hideTooltip = useCallback(() => {
    setTooltipState(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  /**
   * Reset shown tooltips (useful for development/testing)
   */
  const resetShownTooltips = useCallback(async () => {
    setShownTooltips(new Set());
    try {
      await StorageHelpers.removeItem(SHOWN_TOOLTIPS_KEY, false);
    } catch (error) {
      console.warn('Failed to reset shown tooltips:', error);
    }
  }, []);

  /**
   * Context-specific tooltip triggers
   */
  const showWelcomeTooltip = useCallback(() => {
    showTooltip('dashboard-welcome');
  }, [showTooltip]);

  const showAnalyticsTooltip = useCallback((targetRef?: any) => {
    showTooltip('analytics-first-visit', targetRef);
  }, [showTooltip]);

  const showTimelineTooltip = useCallback((targetRef?: any) => {
    showTooltip('timeline-discovery', targetRef);
  }, [showTooltip]);

  const showReorderTooltip = useCallback((targetRef?: any) => {
    showTooltip('reorder-notification', targetRef);
  }, [showTooltip]);

  const showCollaborationTooltip = useCallback((targetRef?: any) => {
    showTooltip('collaboration-feature', targetRef);
  }, [showTooltip]);

  const showProgressTooltip = useCallback((targetRef?: any) => {
    showTooltip('trial-progress', targetRef);
  }, [showTooltip]);

  const showFeatureUnlockTooltip = useCallback((featureName?: string) => {
    const customConfig: Partial<TooltipConfig> = featureName ? {
      title: `${featureName} Unlocked!`,
      message: `Your trial progress has unlocked ${featureName}. Give it a try!`,
    } : {};

    showTooltip('feature-unlock', undefined, customConfig);
  }, [showTooltip]);

  const showCanadianDataTooltip = useCallback((targetRef?: any) => {
    showTooltip('canadian-data', targetRef);
  }, [showTooltip]);

  const showSubscriptionBenefitsTooltip = useCallback((daysRemaining?: number) => {
    const customConfig: Partial<TooltipConfig> = daysRemaining !== undefined ? {
      message: daysRemaining <= 1
        ? 'Your trial ends soon. Keep all the features that have been helping your family stay organized.'
        : `${daysRemaining} days left in your trial. Continue enjoying all the premium features that help your family.`,
    } : {};

    showTooltip('subscription-benefits', undefined, customConfig);
  }, [showTooltip]);

  /**
   * Automatic tooltip scheduling based on trial progress
   */
  const scheduleProgressTooltips = useCallback((
    daysRemaining: number,
    totalTrialDays: number = 14
  ) => {
    if (!canShowTooltips) {
      return;
    }

    const progressPercentage = ((totalTrialDays - daysRemaining) / totalTrialDays) * 100;

    // Schedule tooltips based on trial progress
    if (progressPercentage >= 25 && progressPercentage < 30) {
      // Show timeline tooltip after 25% progress
      setTimeout(() => showTimelineTooltip(), 2000);
    }

    if (progressPercentage >= 50 && progressPercentage < 55) {
      // Show reorder tooltip after 50% progress
      setTimeout(() => showReorderTooltip(), 3000);
    }

    if (progressPercentage >= 75 && progressPercentage < 80) {
      // Show collaboration tooltip after 75% progress
      setTimeout(() => showCollaborationTooltip(), 2000);
    }

    if (daysRemaining <= 3) {
      // Show subscription benefits tooltip near trial end
      setTimeout(() => showSubscriptionBenefitsTooltip(daysRemaining), 5000);
    }
  }, [
    canShowTooltips,
    showTimelineTooltip,
    showReorderTooltip,
    showCollaborationTooltip,
    showSubscriptionBenefitsTooltip
  ]);

  /**
   * JSX component for the current tooltip
   */
  const TooltipComponent = tooltipState.isVisible && tooltipState.context ? (
    <TrialOnboardingTooltips
      context={tooltipState.context}
      targetPosition={tooltipState.position || undefined}
      customConfig={tooltipState.config || undefined}
      isVisible={tooltipState.isVisible}
      onDismiss={hideTooltip}
    />
  ) : null;

  return {
    // State
    isTooltipVisible: tooltipState.isVisible,
    currentTooltipContext: tooltipState.context,
    canShowTooltips,
    isInitialized,
    shownTooltips,

    // General functions
    showTooltip,
    showTooltipDelayed,
    hideTooltip,
    resetShownTooltips,

    // Context-specific functions
    showWelcomeTooltip,
    showAnalyticsTooltip,
    showTimelineTooltip,
    showReorderTooltip,
    showCollaborationTooltip,
    showProgressTooltip,
    showFeatureUnlockTooltip,
    showCanadianDataTooltip,
    showSubscriptionBenefitsTooltip,

    // Automation
    scheduleProgressTooltips,

    // Component
    TooltipComponent,
  };
}

/**
 * Hook for feature-specific onboarding
 */
export function useFeatureOnboarding(featureName: string) {
  const { showTooltip, TooltipComponent } = useTrialOnboarding();

  const showFeatureTooltip = useCallback((targetRef?: any) => {
    const customConfig: Partial<TooltipConfig> = {
      title: `Discover ${featureName}`,
      message: `This premium feature helps Canadian families stay organized. Try it during your trial!`,
      icon: 'sparkles-outline',
      iconLibrary: 'Ionicons' as const,
    };

    showTooltip('feature-unlock', targetRef, customConfig);
  }, [showTooltip, featureName]);

  return {
    showFeatureTooltip,
    TooltipComponent,
  };
}

/**
 * Hook for screen-specific onboarding sequences
 */
export function useScreenOnboarding(screenName: string) {
  const {
    showAnalyticsTooltip,
    showTimelineTooltip,
    showReorderTooltip,
    showCollaborationTooltip,
    showCanadianDataTooltip,
    TooltipComponent
  } = useTrialOnboarding();

  const [hasShownOnboarding, setHasShownOnboarding] = useState(false);

  // Screen-specific onboarding sequences
  const startOnboardingSequence = useCallback(() => {
    if (hasShownOnboarding) {
      return;
    }

    switch (screenName) {
      case 'analytics':
        setTimeout(() => showAnalyticsTooltip(), 1000);
        break;
      case 'timeline':
        setTimeout(() => showTimelineTooltip(), 1500);
        break;
      case 'reorder':
        setTimeout(() => showReorderTooltip(), 1000);
        break;
      case 'collaboration':
        setTimeout(() => showCollaborationTooltip(), 2000);
        break;
      case 'settings':
        setTimeout(() => showCanadianDataTooltip(), 1000);
        break;
    }

    setHasShownOnboarding(true);
  }, [
    hasShownOnboarding,
    screenName,
    showAnalyticsTooltip,
    showTimelineTooltip,
    showReorderTooltip,
    showCollaborationTooltip,
    showCanadianDataTooltip
  ]);

  // Reset onboarding state when screen changes
  useEffect(() => {
    setHasShownOnboarding(false);
  }, [screenName]);

  return {
    startOnboardingSequence,
    hasShownOnboarding,
    TooltipComponent,
  };
}

export default useTrialOnboarding;