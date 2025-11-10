/**
 * SubscribedTrialBanner Component
 *
 * Success-themed banner for users who have already subscribed to a paid plan
 * but are still in their trial period before billing begins.
 *
 * Key Distinction:
 * - This banner is for SUBSCRIBED trial users (have stripeSubscriptionId + TRIALING status)
 * - Shows activation countdown, not upgrade CTA
 * - Uses success green gradient to indicate positive commitment
 * - Displays "Manage" button instead of "Upgrade"
 *
 * Design Principles:
 * - Success-themed styling (green gradient) to reinforce positive decision
 * - Checkmark icon to indicate successful subscription
 * - Clear activation countdown messaging
 * - Tax-inclusive pricing with provincial breakdown
 * - 48px minimum touch targets (WCAG AAA)
 * - 4px base unit spacing system
 * - Matches design system from reference screens
 *
 * Requirements: 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 7.2, 7.3
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import type { CanadianProvince } from '../../types/subscription';

/**
 * Props interface for SubscribedTrialBanner
 */
export interface SubscribedTrialBannerProps {
  /** Number of days until paid plan activates */
  daysRemaining: number;
  /** Name of the subscribed plan (e.g., "Standard Plan", "Premium Plan") */
  planName: string;
  /** Monthly price in CAD (before tax) */
  price: number;
  /** Currency code (always 'CAD' for Canadian compliance) */
  currency: 'CAD';
  /** User's Canadian province for tax calculation */
  province: CanadianProvince;
  /** Callback when "Manage" button is pressed */
  onManagePress: () => void;
  /** Optional callback when banner is dismissed */
  onDismiss?: () => void;
  /** Optional custom styling */
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
 * Calculate tax-inclusive price for Canadian province
 */
function calculateTaxInclusivePrice(subtotal: number, province: CanadianProvince): {
  total: number;
  taxAmount: number;
  taxRate: number;
  taxName: string;
} {
  const taxInfo = CANADIAN_TAX_RATES[province];
  
  let taxRate = 0;
  if (taxInfo.hst) {
    taxRate = taxInfo.hst;
  } else {
    taxRate = (taxInfo.gst || 0) + (taxInfo.pst || 0) + (taxInfo.qst || 0);
  }
  
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  return {
    total,
    taxAmount,
    taxRate,
    taxName: taxInfo.name,
  };
}

/**
 * SubscribedTrialBanner Component
 *
 * Displays activation countdown for users who have already committed to a paid plan
 * but are still in their trial period.
 */
export function SubscribedTrialBanner({
  daysRemaining,
  planName,
  price,
  currency,
  province,
  onManagePress,
  onDismiss,
  style,
}: SubscribedTrialBannerProps) {
  const theme = useNestSyncTheme();

  // Calculate tax-inclusive pricing
  const { total, taxRate, taxName } = calculateTaxInclusivePrice(price, province);
  const taxPercentage = (taxRate * 100).toFixed(2);

  // Generate activation message based on days remaining
  const getActivationMessage = () => {
    if (daysRemaining <= 1) {
      return {
        title: 'Your Plan Activates Tomorrow',
        subtitle: `${planName} billing begins in 1 day`,
      };
    } else if (daysRemaining <= 3) {
      return {
        title: 'Your Plan Activates Soon',
        subtitle: `${planName} billing begins in ${daysRemaining} days`,
      };
    } else {
      return {
        title: 'Subscription Active',
        subtitle: `${planName} billing begins in ${daysRemaining} days`,
      };
    }
  };

  const message = getActivationMessage();

  const styles = StyleSheet.create({
    banner: {
      borderWidth: 1,
      borderColor: theme === 'dark'
        ? 'rgba(5, 150, 105, 0.2)'
        : 'rgba(5, 150, 105, 0.08)',
      paddingVertical: 12, // 3 × 4px base units
      paddingHorizontal: 16, // 4 × 4px base units
      marginHorizontal: 16, // 4 × 4px base units
      marginVertical: 8, // 2 × 4px base units
      borderRadius: 12, // 3 × 4px base units
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: NestSyncColors.semantic.success,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden',
      minHeight: 80, // Comfortable height for content
    },
    bannerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    iconContainer: {
      marginRight: 12, // 3 × 4px base units
      padding: 8, // 2 × 4px base units
      borderRadius: 8, // 2 × 4px base units
      backgroundColor: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(5, 150, 105, 0.1)',
      borderWidth: 1,
      borderColor: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(5, 150, 105, 0.15)',
      width: 40, // Proper size for icon container
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      flex: 1,
      marginRight: 12, // 3 × 4px base units
    },
    title: {
      fontSize: 16, // Readable title size
      fontWeight: '600', // Semi-bold for emphasis
      letterSpacing: -0.2,
      color: theme === 'dark'
        ? '#FFFFFF'
        : NestSyncColors.semantic.success,
      marginBottom: 4, // 1 × 4px base unit
      lineHeight: 20,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System'
      }),
    },
    subtitle: {
      fontSize: 14, // Readable subtitle
      fontWeight: '400',
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.85)'
        : NestSyncColors.neutral[600],
      lineHeight: 18,
      marginBottom: 4, // 1 × 4px base unit
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    priceInfo: {
      fontSize: 12,
      fontWeight: '500',
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.7)'
        : NestSyncColors.neutral[500],
      lineHeight: 16,
    },
    actionsContainer: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: 8, // 2 × 4px base units
    },
    manageButton: {
      paddingHorizontal: 16, // 4 × 4px base units
      paddingVertical: 12, // 3 × 4px base units
      borderRadius: 8, // 2 × 4px base units
      minWidth: 48, // WCAG AAA minimum touch target
      minHeight: 48, // WCAG AAA minimum touch target
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: NestSyncColors.semantic.success,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 2,
      overflow: 'hidden',
    },
    manageButtonGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    manageButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
      fontFamily: Platform.select({
        ios: 'System',
        android: 'Roboto',
        default: 'System'
      }),
    },
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
    dismissButtonText: {
      color: theme === 'dark'
        ? 'rgba(255, 255, 255, 0.6)'
        : NestSyncColors.neutral[500],
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 20,
    },
  });

  return (
    <View style={[styles.banner, style]}>
      {/* Success-themed gradient background */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(5, 150, 105, 0.15)', 'rgba(4, 120, 87, 0.08)']
          : ['rgba(209, 250, 229, 0.6)', 'rgba(240, 253, 244, 0.9)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerGradient}
      />

      {/* Success checkmark icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="checkmark-circle"
          size={24}
          color={theme === 'dark' ? '#FFFFFF' : NestSyncColors.semantic.success}
        />
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.subtitle}>{message.subtitle}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceInfo}>
            ${total.toFixed(2)} {currency}/month (includes {taxName} {taxPercentage}%)
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={onManagePress}
          accessibilityRole="button"
          accessibilityLabel={`Manage ${planName} subscription`}
          accessibilityHint="Opens subscription management screen"
        >
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.manageButtonGradient}
          />
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss subscription banner"
            accessibilityHint="Hides this banner until next session"
          >
            <Text style={styles.dismissButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default SubscribedTrialBanner;
