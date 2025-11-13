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
 * - Enhanced touch targets (WCAG AAA standards - 48px minimum)
 * - Supportive messaging focused on helping parents
 * - Professional text approach without emoji flags
 * - Tax-inclusive pricing with Canadian provincial tax breakdown
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { StorageHelpers } from '../../hooks/useUniversalStorage';
import { useTrialProgress, useMySubscription } from '../../lib/hooks/useSubscription';
import { determineBannerType, type UserSubscriptionState } from '../subscription/TrialBannerLogic';
import { SubscribedTrialBanner } from '../subscription/SubscribedTrialBanner';
import type { CanadianProvince } from '../../types/subscription';

interface TrialCountdownBannerProps {
  daysRemaining?: number;
  onUpgradePress?: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
  style?: any;
}

/**
 * Canadian tax rates by province
 * Source: Canada Revenue Agency (CRA) 2024 rates
 */
const CANADIAN_TAX_RATES: Record<CanadianProvince, { gst?: number; pst?: number; hst?: number; qst?: number; name: string }> = {
  ON: { hst: 0.13, name: 'HST' },
  QC: { gst: 0.05, qst: 0.09975, name: 'GST+QST' },
  BC: { gst: 0.05, pst: 0.07, name: 'GST+PST' },
  AB: { gst: 0.05, name: 'GST' },
  SK: { gst: 0.05, pst: 0.06, name: 'GST+PST' },
  MB: { gst: 0.05, pst: 0.07, name: 'GST+PST' },
  NS: { hst: 0.15, name: 'HST' },
  NB: { hst: 0.15, name: 'HST' },
  PE: { hst: 0.15, name: 'HST' },
  NL: { hst: 0.15, name: 'HST' },
  NT: { gst: 0.05, name: 'GST' },
  YT: { gst: 0.05, name: 'GST' },
  NU: { gst: 0.05, name: 'GST' },
};

/**
 * Get tax-inclusive pricing display for Canadian province
 * @param province - Canadian province code
 * @param basePrice - Base price before tax (default: 4.99)
 * @returns Formatted string with tax-inclusive pricing
 */
function getTaxInclusivePricing(province: CanadianProvince, basePrice: number = 4.99): string {
  const taxInfo = CANADIAN_TAX_RATES[province] || CANADIAN_TAX_RATES.ON;
  
  let taxRate = 0;
  if (taxInfo.hst) {
    taxRate = taxInfo.hst;
  } else {
    taxRate = (taxInfo.gst || 0) + (taxInfo.pst || 0) + (taxInfo.qst || 0);
  }
  
  const taxAmount = basePrice * taxRate;
  const total = basePrice + taxAmount;
  const taxPercentage = (taxRate * 100).toFixed(0);
  
  return `$${total.toFixed(2)} CAD/month (includes ${taxPercentage}% ${taxInfo.name})`;
}

export function TrialCountdownBanner({
  daysRemaining: propDaysRemaining,
  onUpgradePress,
  onDismiss,
  showDismiss = true,
  style
}: TrialCountdownBannerProps) {
  const theme = useNestSyncTheme();
  const router = useRouter();
  const { isLoading: isFeatureAccessLoading } = useFeatureAccess();
  const { trialProgress, loading: trialLoading } = useTrialProgress();
  const { subscription, loading: subscriptionLoading } = useMySubscription();
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
  // 1. Banner was manually dismissed
  // 2. Still loading data (prevents flashing incorrect data)
  if (!isVisible || isDismissed || isFeatureAccessLoading || trialLoading || subscriptionLoading) {
    return null;
  }

  // Use TrialBannerLogic to determine which banner to show
  const subscriptionState: UserSubscriptionState = {
    subscription: subscription || null,
    trialProgress: trialProgress || null,
  };

  const bannerType = determineBannerType(subscriptionState);

  // Don't show banner for active paid users or if no banner needed
  if (bannerType === 'none' || bannerType === 'trial-expired') {
    return null;
  }

  // Show SubscribedTrialBanner for users who already subscribed during trial
  if (bannerType === 'subscribed-trial-activation') {
    // Get user's province from subscription or default to ON
    const userProvince = (subscription?.province as CanadianProvince) || 'ON';
    
    return (
      <SubscribedTrialBanner
        daysRemaining={daysRemaining}
        planName={subscription?.plan?.displayName || 'Premium Plan'}
        price={subscription?.plan?.price || subscription?.amount || 4.99}
        currency="CAD"
        province={userProvince}
        onManagePress={() => {
          router.push('/(subscription)/subscription-management');
        }}
        onDismiss={onDismiss}
        style={style}
      />
    );
  }

  // Show free trial upgrade banner for users who haven't subscribed yet
  // (bannerType === 'free-trial-upgrade')

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
    actionsContainer: {
      flexDirection: 'row', // Horizontal for compact layout
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8, // Space between buttons
    },
    // Upgrade button with WCAG AAA minimum touch target (48px)
    upgradeButton: {
      paddingHorizontal: 16, // 4 × 4px base units
      paddingVertical: 12, // 3 × 4px base units
      borderRadius: 8, // 2 × 4px base units
      minWidth: 48, // WCAG AAA minimum touch target
      minHeight: 48, // WCAG AAA minimum touch target
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
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
    // Dismiss button with WCAG AAA minimum touch target (48px)
    dismissButton: {
      paddingHorizontal: 12, // 3 × 4px base units
      paddingVertical: 12, // 3 × 4px base units
      borderRadius: 8, // 2 × 4px base units
      minWidth: 48, // WCAG AAA minimum touch target
      minHeight: 48, // WCAG AAA minimum touch target
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
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

      {/* Trust-Building Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color={theme === 'dark' ? '#FFFFFF' : NestSyncColors.primary.blue}
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {`${daysRemaining} days left in trial`}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceInfo}>
            {getTaxInclusivePricing(subscription?.province as CanadianProvince || 'ON')}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={handleUpgradePress}
          accessibilityRole="button"
          accessibilityLabel="Upgrade to premium subscription"
          accessibilityHint="Opens subscription upgrade screen"
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
            accessibilityLabel="Dismiss trial banner"
            accessibilityHint="Hides this banner until next session"
          >
            <Ionicons name="close" size={18} color={theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : NestSyncColors.neutral[500]} />
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
