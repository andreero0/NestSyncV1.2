/**
 * TrialOnboardingTooltips Component System
 *
 * Provides contextual guidance throughout the trial period with psychology-driven messaging
 * for stressed Canadian parents. Features non-intrusive tooltips that appear at appropriate
 * moments to help users discover premium features without creating pressure.
 *
 * Design Principles:
 * - Supportive guidance rather than sales pressure
 * - Context-aware messaging based on user journey
 * - Progressive disclosure of trial benefits
 * - Calming colors and accessible design
 * - Canadian context and PIPEDA compliance messaging
 * - Smart dismissal and re-appearance logic
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors, NestSyncColors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useAnalyticsAccess, useFeatureAccess } from '../../hooks/useFeatureAccess';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Tooltip context types for different screens and features
export type TooltipContext =
  | 'dashboard-welcome'
  | 'analytics-first-visit'
  | 'timeline-discovery'
  | 'reorder-notification'
  | 'collaboration-feature'
  | 'trial-progress'
  | 'feature-unlock'
  | 'canadian-data'
  | 'subscription-benefits';

// Tooltip positioning options
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

// Tooltip configuration interface
export interface TooltipConfig {
  id: string;
  context: TooltipContext;
  title: string;
  message: string;
  icon: string;
  iconLibrary: 'Ionicons' | 'MaterialIcons';
  position: TooltipPosition;
  maxShows: number;
  cooldownHours: number;
  canDismiss: boolean;
  autoHideSeconds?: number;
  targetElement?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

// Props for the main tooltip system
interface TrialOnboardingTooltipsProps {
  context: TooltipContext;
  targetPosition?: { x: number; y: number; width: number; height: number };
  position?: TooltipPosition;
  onDismiss?: () => void;
  customConfig?: Partial<TooltipConfig>;
  isVisible?: boolean;
}

// Storage key for tooltip state management
const TOOLTIP_STORAGE_KEY = '@NestSync:tooltipState';

// Default tooltip configurations for different contexts
const DEFAULT_TOOLTIP_CONFIGS: Record<TooltipContext, TooltipConfig> = {
  'dashboard-welcome': {
    id: 'dashboard-welcome',
    context: 'dashboard-welcome',
    title: 'Welcome to Your Premium Trial!',
    message: 'Explore smart analytics and automated features designed to help Canadian families stay organized.',
    icon: 'sparkles-outline',
    iconLibrary: 'Ionicons',
    position: 'center',
    maxShows: 1,
    cooldownHours: 0,
    canDismiss: true,
    autoHideSeconds: 8,
    primaryAction: {
      label: 'Start Exploring',
      onPress: () => {}
    }
  },
  'analytics-first-visit': {
    id: 'analytics-first-visit',
    context: 'analytics-first-visit',
    title: 'Smart Analytics Unlocked',
    message: 'Track diaper patterns, predict needs, and get insights tailored for your family\'s routine.',
    icon: 'analytics-outline',
    iconLibrary: 'Ionicons',
    position: 'top',
    maxShows: 2,
    cooldownHours: 24,
    canDismiss: true,
    autoHideSeconds: 10,
    primaryAction: {
      label: 'View Analytics',
      onPress: () => {}
    },
    secondaryAction: {
      label: 'Later',
      onPress: () => {}
    }
  },
  'timeline-discovery': {
    id: 'timeline-discovery',
    context: 'timeline-discovery',
    title: 'Advanced Timeline Available',
    message: 'View detailed weekly and monthly history to understand your baby\'s patterns better.',
    icon: 'timer-outline',
    iconLibrary: 'Ionicons',
    position: 'bottom',
    maxShows: 2,
    cooldownHours: 48,
    canDismiss: true,
    autoHideSeconds: 8,
    primaryAction: {
      label: 'Explore Timeline',
      onPress: () => {}
    }
  },
  'reorder-notification': {
    id: 'reorder-notification',
    context: 'reorder-notification',
    title: 'Smart Reorder Alerts',
    message: 'Never run out of diapers again. Get predictive notifications when it\'s time to reorder.',
    icon: 'notifications-outline',
    iconLibrary: 'Ionicons',
    position: 'top',
    maxShows: 3,
    cooldownHours: 72,
    canDismiss: true,
    autoHideSeconds: 10,
    primaryAction: {
      label: 'Set Up Alerts',
      onPress: () => {}
    },
    secondaryAction: {
      label: 'Maybe Later',
      onPress: () => {}
    }
  },
  'collaboration-feature': {
    id: 'collaboration-feature',
    context: 'collaboration-feature',
    title: 'Family Collaboration',
    message: 'Share insights with caregivers and keep everyone updated on your baby\'s needs.',
    icon: 'share-outline',
    iconLibrary: 'Ionicons',
    position: 'center',
    maxShows: 2,
    cooldownHours: 96,
    canDismiss: true,
    autoHideSeconds: 12,
    primaryAction: {
      label: 'Invite Family',
      onPress: () => {}
    }
  },
  'trial-progress': {
    id: 'trial-progress',
    context: 'trial-progress',
    title: 'You\'re Making Great Progress!',
    message: 'Continue exploring premium features to see how NestSync helps busy Canadian families.',
    icon: 'checkmark-circle-outline',
    iconLibrary: 'Ionicons',
    position: 'top',
    maxShows: 5,
    cooldownHours: 24,
    canDismiss: true,
    autoHideSeconds: 6,
    primaryAction: {
      label: 'Keep Going',
      onPress: () => {}
    }
  },
  'feature-unlock': {
    id: 'feature-unlock',
    context: 'feature-unlock',
    title: 'New Feature Unlocked!',
    message: 'Your trial progress has unlocked a new premium feature. Give it a try!',
    icon: 'gift-outline',
    iconLibrary: 'Ionicons',
    position: 'center',
    maxShows: 4,
    cooldownHours: 0,
    canDismiss: true,
    autoHideSeconds: 8,
    primaryAction: {
      label: 'Try It Now',
      onPress: () => {}
    }
  },
  'canadian-data': {
    id: 'canadian-data',
    context: 'canadian-data',
    title: 'Your Data Stays in Canada',
    message: 'All your family\'s information is stored securely in Canadian data centers, ensuring PIPEDA compliance.',
    icon: 'shield-checkmark-outline',
    iconLibrary: 'Ionicons',
    position: 'bottom',
    maxShows: 1,
    cooldownHours: 0,
    canDismiss: true,
    autoHideSeconds: 8,
    primaryAction: {
      label: 'Learn More',
      onPress: () => {}
    }
  },
  'subscription-benefits': {
    id: 'subscription-benefits',
    context: 'subscription-benefits',
    title: 'Continue Your Success',
    message: 'Keep all the features that have been helping your family stay organized and stress-free.',
    icon: 'heart-outline',
    iconLibrary: 'Ionicons',
    position: 'center',
    maxShows: 3,
    cooldownHours: 24,
    canDismiss: true,
    autoHideSeconds: 10,
    primaryAction: {
      label: 'Continue with Premium',
      onPress: () => {}
    },
    secondaryAction: {
      label: 'Not Yet',
      onPress: () => {}
    }
  }
};

/**
 * Hook for managing tooltip state and logic
 */
function useTooltipManager() {
  const [tooltipStates, setTooltipStates] = useState<Record<string, any>>({});
  const hasAnalyticsAccess = useAnalyticsAccess();
  const { subscriptionStatus } = useFeatureAccess();

  // Load tooltip state from storage
  useEffect(() => {
    loadTooltipStates();
  }, []);

  const loadTooltipStates = async () => {
    try {
      const savedStatesString = await AsyncStorage.getItem(TOOLTIP_STORAGE_KEY);
      if (savedStatesString) {
        const savedStates = JSON.parse(savedStatesString);
        setTooltipStates(savedStates);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading tooltip states:', error);
      }
    }
  };

  const saveTooltipState = async (tooltipId: string, state: any) => {
    try {
      const newStates = {
        ...tooltipStates,
        [tooltipId]: {
          ...tooltipStates[tooltipId],
          ...state,
          lastShown: Date.now()
        }
      };
      setTooltipStates(newStates);
      await AsyncStorage.setItem(TOOLTIP_STORAGE_KEY, JSON.stringify(newStates));
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving tooltip state:', error);
      }
    }
  };

  const shouldShowTooltip = (config: TooltipConfig): boolean => {
    // Don't show tooltips if user already has premium access
    if (hasAnalyticsAccess || subscriptionStatus === 'premium' || subscriptionStatus === 'family') {
      return false;
    }

    const state = tooltipStates[config.id];
    if (!state) {
      return true; // First time showing
    }

    // Check if explicitly dismissed
    if (state.dismissed) {
      return false;
    }

    // Check if max shows exceeded
    if (state.showCount >= config.maxShows) {
      return false;
    }

    // Check cooldown period
    const timeSinceLastShow = Date.now() - (state.lastShown || 0);
    const cooldownMs = config.cooldownHours * 60 * 60 * 1000;

    return timeSinceLastShow >= cooldownMs;
  };

  const markTooltipShown = (tooltipId: string) => {
    saveTooltipState(tooltipId, {
      showCount: (tooltipStates[tooltipId]?.showCount || 0) + 1
    });
  };

  const markTooltipDismissed = (tooltipId: string) => {
    saveTooltipState(tooltipId, {
      dismissed: true,
      showCount: (tooltipStates[tooltipId]?.showCount || 0) + 1 // Increment actual count for tracking
    });
  };

  return {
    shouldShowTooltip,
    markTooltipShown,
    markTooltipDismissed
  };
}

/**
 * Individual tooltip component
 */
function TooltipBubble({
  config,
  position,
  targetPosition,
  onDismiss,
  onPrimaryAction,
  onSecondaryAction
}: {
  config: TooltipConfig;
  position: TooltipPosition;
  targetPosition?: { x: number; y: number; width: number; height: number };
  onDismiss: () => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}) {
  const theme = useNestSyncTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0.8));

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide if configured
    if (config.autoHideSeconds) {
      const timer = setTimeout(() => {
        onDismiss();
      }, config.autoHideSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Calculate tooltip position based on target element
  const getTooltipStyle = () => {
    let tooltipStyle: any = {
      position: 'absolute',
      maxWidth: SCREEN_WIDTH - 32,
      zIndex: 1000,
    };

    if (position === 'center' || !targetPosition) {
      tooltipStyle = {
        ...tooltipStyle,
        top: SCREEN_HEIGHT / 2 - 100,
        left: 16,
        right: 16,
      };
    } else {
      const { x, y, width, height } = targetPosition;

      switch (position) {
        case 'top':
          tooltipStyle = {
            ...tooltipStyle,
            bottom: SCREEN_HEIGHT - y + 8,
            left: Math.max(16, x - 100),
            right: Math.max(16, SCREEN_WIDTH - x - width - 100),
          };
          break;
        case 'bottom':
          tooltipStyle = {
            ...tooltipStyle,
            top: y + height + 8,
            left: Math.max(16, x - 100),
            right: Math.max(16, SCREEN_WIDTH - x - width - 100),
          };
          break;
        case 'left':
          tooltipStyle = {
            ...tooltipStyle,
            top: y,
            right: SCREEN_WIDTH - x + 8,
            maxWidth: x - 24,
          };
          break;
        case 'right':
          tooltipStyle = {
            ...tooltipStyle,
            top: y,
            left: x + width + 8,
            maxWidth: SCREEN_WIDTH - x - width - 24,
          };
          break;
      }
    }

    return tooltipStyle;
  };

  const IconComponent = config.iconLibrary === 'MaterialIcons' ? MaterialIcons : Ionicons;

  const styles = StyleSheet.create({
    tooltip: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[800] : colors.background,
      borderRadius: 16,
      padding: 20,
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
      ...getTooltipStyle(),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      marginRight: 12,
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme === 'dark'
        ? NestSyncColors.primary.blue + '30'
        : NestSyncColors.primary.blueLight,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
      lineHeight: 22,
    },
    dismissButton: {
      padding: 4,
      borderRadius: 4,
    },
    message: {
      fontSize: 14,
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      lineHeight: 20,
      marginBottom: 16,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[300],
    },
    secondaryButtonText: {
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <Animated.View
      style={[
        styles.tooltip,
        {
          opacity: fadeAnimation,
          transform: [{ scale: scaleAnimation }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <IconComponent
            name={config.icon as any}
            size={20}
            color={NestSyncColors.primary.blue}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{config.title}</Text>
        </View>
        {config.canDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tooltip"
          >
            <Ionicons
              name="close"
              size={20}
              color={theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[500]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Message */}
      <Text style={styles.message}>{config.message}</Text>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {config.primaryAction && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              config.primaryAction?.onPress();
              onPrimaryAction?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={config.primaryAction.label}
          >
            <Text style={styles.primaryButtonText}>{config.primaryAction.label}</Text>
          </TouchableOpacity>
        )}

        {config.secondaryAction && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              config.secondaryAction?.onPress();
              onSecondaryAction?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={config.secondaryAction.label}
          >
            <Text style={styles.secondaryButtonText}>{config.secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

/**
 * Main TrialOnboardingTooltips component
 */
export function TrialOnboardingTooltips({
  context,
  targetPosition,
  position = 'center',
  onDismiss,
  customConfig,
  isVisible = true
}: TrialOnboardingTooltipsProps) {
  const { shouldShowTooltip, markTooltipShown, markTooltipDismissed } = useTooltipManager();
  const [showTooltip, setShowTooltip] = useState(false);

  // Merge default config with custom config
  const config: TooltipConfig = {
    ...DEFAULT_TOOLTIP_CONFIGS[context],
    ...customConfig,
    position: position || DEFAULT_TOOLTIP_CONFIGS[context].position,
  };

  useEffect(() => {
    if (isVisible && shouldShowTooltip(config)) {
      setShowTooltip(true);
      markTooltipShown(config.id);
    }
  }, [isVisible, context]);

  const handleDismiss = useCallback(() => {
    setShowTooltip(false);
    markTooltipDismissed(config.id);
    onDismiss?.();
  }, [config.id, onDismiss]);

  const handlePrimaryAction = useCallback(() => {
    setShowTooltip(false);
    markTooltipShown(config.id);
  }, [config.id]);

  const handleSecondaryAction = useCallback(() => {
    setShowTooltip(false);
    // Don't mark as dismissed for secondary action, allow re-showing
  }, []);

  if (!showTooltip) {
    return null;
  }

  // Use Modal for center position, direct render for positioned tooltips
  if (config.position === 'center') {
    return (
      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDismiss}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TooltipBubble
            config={config}
            position={config.position}
            targetPosition={targetPosition}
            onDismiss={handleDismiss}
            onPrimaryAction={handlePrimaryAction}
            onSecondaryAction={handleSecondaryAction}
          />
        </View>
      </Modal>
    );
  }

  return (
    <TooltipBubble
      config={config}
      position={config.position}
      targetPosition={targetPosition}
      onDismiss={handleDismiss}
      onPrimaryAction={handlePrimaryAction}
      onSecondaryAction={handleSecondaryAction}
    />
  );
}

/**
 * Helper hook to show specific tooltip contexts
 */
export function useTrialTooltip() {
  const [activeTooltip, setActiveTooltip] = useState<{
    context: TooltipContext;
    position?: { x: number; y: number; width: number; height: number };
    config?: Partial<TooltipConfig>;
  } | null>(null);

  const showTooltip = useCallback((
    context: TooltipContext,
    options?: {
      position?: { x: number; y: number; width: number; height: number };
      config?: Partial<TooltipConfig>;
    }
  ) => {
    setActiveTooltip({
      context,
      position: options?.position,
      config: options?.config,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  return {
    activeTooltip,
    showTooltip,
    hideTooltip,
  };
}

export default TrialOnboardingTooltips;