/**
 * TrialCountdownBanner Component
 *
 * Professional psychology-driven trial countdown banner designed for stressed Canadian parents.
 * Uses supportive messaging and systematic design to encourage subscription with trust-building
 * approach while maintaining professional visual hierarchy.
 *
 * Design Principles:
 * - Professional trust-building iconography (shield-checkmark-outline)
 * - Systematic typography scale (H4, Body Small, Caption)
 * - 4px base unit spacing system throughout
 * - Enhanced touch targets (WCAG AAA standards)
 * - Supportive messaging focused on helping parents
 * - Professional text approach without emoji flags
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useAnalyticsAccess, useFeatureAccess } from '../../hooks/useFeatureAccess';
import { StorageHelpers } from '../../hooks/useUniversalStorage';
import { useTrialProgress } from '../../lib/hooks/useSubscription';

interface TrialCountdownBannerProps {
  daysRemaining?: number;
  onUpgradePress?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  style?: any;
}

export function TrialCountdownBanner({
  daysRemaining: propDaysRemaining,
  onUpgradePress,
  onDismiss,
  showDismiss = true,
  style
}: TrialCountdownBannerProps) {
  const theme = useNestSyncTheme();
  const hasAnalyticsAccess = useAnalyticsAccess();
  const { isLoading: isFeatureAccessLoading } = useFeatureAccess();
  const { trialProgress, loading: trialLoading } = useTrialProgress();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Use real trial data if available, otherwise fall back to prop or default
  const daysRemaining = trialProgress?.daysRemaining ?? propDaysRemaining ?? 7;

  // Load dismissed state on mount
  useEffect(() => {
    const loadDismissedState = async () => {
      try {
        const dismissed = await StorageHelpers.getItem('trial_banner_dismissed', false);
        if (dismissed === 'true') {
          setIsDismissed(true);
        }
      } catch (error) {
        console.warn('Failed to load banner dismissed state:', error);
      }
    };

    loadDismissedState();
  }, []);

  // Don't show banner if:
  // 1. User already has access (confirmed, not during loading)
  // 2. Banner was manually dismissed
  // 3. Still loading access status (prevents flashing)
  // 4. Trial is not active or data is still loading
  if (!isVisible || isDismissed || hasAnalyticsAccess || isFeatureAccessLoading || trialLoading) {
    return null;
  }

  // Don't show if no trial is active
  if (!trialProgress?.isActive) {
    return null;
  }

  const handleDismiss = async () => {
    setIsVisible(false);
    setIsDismissed(true);

    // Persist dismissed state
    try {
      await StorageHelpers.setItem('trial_banner_dismissed', 'true', false);
    } catch (error) {
      console.warn('Failed to save banner dismissed state:', error);
    }

    onDismiss?.();
  };

  const handleUpgradePress = () => {
    onUpgradePress?.();
  };

  // Generate supportive messaging based on days remaining - focused on helping stressed parents
  const getMessage = () => {
    if (daysRemaining <= 1) {
      return {
        title: "Continue Building Your Support System",
        subtitle: "You've discovered how NestSync simplifies planning. Keep your peace of mind active."
      };
    } else if (daysRemaining <= 3) {
      return {
        title: "You're Simplifying Your Routine",
        subtitle: `${daysRemaining} days to explore features that reduce daily planning stress`
      };
    } else {
      return {
        title: "Discovering Your Planning Assistant",
        subtitle: `${daysRemaining} days to explore how NestSync supports busy parents`
      };
    }
  };

  const message = getMessage();

  const styles = StyleSheet.create({
    banner: {
      borderWidth: 1,
      borderColor: theme === 'dark'
        ? 'rgba(8, 145, 178, 0.2)'
        : 'rgba(8, 145, 178, 0.08)',
      paddingVertical: 8, // 2 × 4px base units - compact for 50-64px height
      paddingHorizontal: 12, // 3 × 4px base units - compact horizontal
      marginHorizontal: 16, // 4 × 4px base units
      marginVertical: 4, // 1 × 4px base units - minimal vertical margin
      borderRadius: 8, // 2 × 4px base units - subtle corner treatment
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: {
        width: 0,
        height: 2, // Subtle shadow depth
      },
      shadowOpacity: 0.05, // Very subtle shadow
      shadowRadius: 4, // Minimal shadow blur
      elevation: 2, // Minimal Android elevation
      overflow: 'hidden', // For gradient background
      minHeight: 50, // Industry standard minimum
      maxHeight: 64, // Industry standard maximum
    },
    bannerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    iconContainer: {
      marginRight: 8, // 2 × 4px base units - compact spacing
      padding: 6, // 1.5 × 4px base units - minimal padding
      borderRadius: 6, // 1.5 × 4px base units - subtle corners
      backgroundColor: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(8, 145, 178, 0.08)',
      borderWidth: 1,
      borderColor: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(8, 145, 178, 0.12)',
      width: 32, // Compact for banner height
      height: 32, // Compact for banner height
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      flex: 1,
      marginRight: 8, // 2 × 4px base units - compact spacing
      justifyContent: 'center', // Center content vertically
    },
    // Compact Typography - Title
    title: {
      fontSize: 14, // Compact for banner
      fontWeight: '600', // Semi-bold for emphasis
      letterSpacing: -0.2, // Subtle letter spacing
      color: theme === 'dark'
        ? '#FFFFFF'
        : NestSyncColors.primary.blue,
      marginBottom: 2, // 0.5 × 4px base units - minimal spacing
      lineHeight: 18, // Compact line height
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System'
      }),
    },
    // Compact Subtitle Typography
    subtitle: {
      fontSize: 12, // Smaller for compact banner
      fontWeight: '400', // Regular weight
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.85)'
        : NestSyncColors.neutral[600],
      lineHeight: 16, // Compact line height
      marginBottom: 0, // No margin - hide subtitle in compact mode
      display: 'none', // Hide subtitle to save space
    },
    // Compact Price Information Container
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    // Compact Price Information Typography
    priceInfo: {
      fontSize: 11, // Smaller for compact banner
      fontWeight: '500', // Medium weight for emphasis
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.7)'
        : NestSyncColors.neutral[500],
      lineHeight: 14, // Compact line height
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System'
      }),
    },
    canadianTrustText: {
      fontSize: 11, // Matching compact price info size
      fontWeight: '600', // Semi-bold for trust emphasis
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.7)'
        : NestSyncColors.canadian.trust,
      marginRight: 4, // 1 × 4px base unit spacing
    },
    actionsContainer: {
      flexDirection: 'row', // Horizontal for compact layout
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8, // Space between buttons
    },
    // Compact gradient button
    upgradeButton: {
      paddingHorizontal: 12, // 3 × 4px base units - compact padding
      paddingVertical: 6, // 1.5 × 4px base units - minimal vertical
      borderRadius: 6, // 1.5 × 4px base units - subtle corners
      minWidth: 70, // Compact width
      height: 28, // Compact height for banner
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: {
        width: 0,
        height: 1, // Minimal shadow
      },
      shadowOpacity: 0.1, // Subtle shadow
      shadowRadius: 2, // Minimal blur
      elevation: 1, // Minimal Android elevation
      overflow: 'hidden', // For gradient background
    },
    upgradeButtonGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    upgradeButtonText: {
      color: '#FFFFFF',
      fontSize: 12, // Compact font size
      fontWeight: '600', // Semi-bold for button emphasis
      letterSpacing: 0.2, // Subtle letter spacing
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System'
      }),
    },
    // Compact dismiss button
    dismissButton: {
      paddingHorizontal: 8, // 2 × 4px base units
      paddingVertical: 6, // 1.5 × 4px base units
      borderRadius: 6, // 1.5 × 4px base units
      minWidth: 28, // Compact width for dismiss
      height: 28, // Match primary button height
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    dismissButtonText: {
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.6)'
        : NestSyncColors.neutral[500],
      fontSize: 18, // Large enough for touch target
      fontWeight: '400', // Regular weight
      lineHeight: 18,
    },
  });

  return (
    <View style={[styles.banner, style]}>
      {/* Enhanced Gradient Background */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(8, 145, 178, 0.15)', 'rgba(14, 116, 144, 0.08)']
          : ['rgba(224, 242, 254, 0.6)', 'rgba(255, 255, 255, 0.9)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      />

      {/* Compact Trust-Building Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20} // Compact size for banner
          color={theme === 'dark' ? '#FFFFFF' : NestSyncColors.primary.blue}
        />
      </View>

      {/* Compact Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{`${daysRemaining} days left in trial`}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceInfo}>$4.99 CAD/month after trial</Text>
        </View>
      </View>

      {/* Compact Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to premium"
        >
          <LinearGradient
            colors={['#0891B2', '#0E7490']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeButtonGradient}
          />
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>

        {showDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss banner"
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * Hook to get trial days remaining
 * Uses real trial data from backend via useTrialProgress
 */
export function useTrialDaysRemaining(): number {
  const { trialProgress } = useTrialProgress();
  return trialProgress?.daysRemaining ?? 7;
}

export default TrialCountdownBanner;