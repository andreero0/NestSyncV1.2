/**
 * TrialProgressCard Component
 *
 * Comprehensive trial progress card designed with psychology-driven UX for Canadian parents.
 * Displays trial progress, features unlocked, Canadian pricing, and supportive conversion messaging.
 *
 * Design Principles:
 * - Visual progress representation without anxiety
 * - Feature benefit focus rather than loss aversion
 * - Canadian tax transparency and pricing context
 * - Supportive guidance for stressed parents
 * - Accessible design meeting WCAG AAA standards
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NestSyncColors } from '../../constants/Colors';
import { useNestSyncTheme } from '../../contexts/ThemeContext';
import { useAnalyticsAccess } from '../../hooks/useFeatureAccess';

interface TrialProgressCardProps {
  daysRemaining?: number;
  totalTrialDays?: number;
  onUpgradePress?: () => void;
  onAnalyticsNavigate?: () => void;
  onLearnMorePress?: () => void;
  style?: any;
}

interface FeatureBenefit {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function TrialProgressCard({
  daysRemaining = 7,
  totalTrialDays = 14,
  onUpgradePress,
  onAnalyticsNavigate,
  onLearnMorePress,
  style
}: TrialProgressCardProps) {
  const theme = useNestSyncTheme();
  const hasAnalyticsAccess = useAnalyticsAccess();
  const [progressAnimation] = useState(new Animated.Value(0));

  // Calculate progress percentage
  const progressPercentage = Math.max(0, Math.min(100,
    ((totalTrialDays - daysRemaining) / totalTrialDays) * 100
  ));

  // Feature benefits during trial
  const features: FeatureBenefit[] = [
    {
      icon: 'analytics-outline',
      title: 'Smart Analytics',
      description: 'Track diaper patterns and predict needs',
      unlocked: true
    },
    {
      icon: 'timer-outline',
      title: 'Advanced Timeline',
      description: 'View weekly and monthly history',
      unlocked: progressPercentage > 25
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Reorder Alerts',
      description: 'Never run out with predictive ordering',
      unlocked: progressPercentage > 50
    },
    {
      icon: 'share-outline',
      title: 'Family Collaboration',
      description: 'Share insights with caregivers',
      unlocked: progressPercentage > 75
    }
  ];

  // Animate progress bar on mount
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: progressPercentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  // Don't show if user already has access
  if (hasAnalyticsAccess) {
    return null;
  }

  const getProgressMessage = () => {
    if (daysRemaining <= 1) {
      return {
        title: 'Your Trial Journey is Almost Complete!',
        subtitle: 'You\'ve experienced the full power of NestSync Premium',
        cta: 'Continue Your Success',
        action: 'analytics' // Navigate to analytics instead of upgrade
      };
    } else if (daysRemaining <= 3) {
      return {
        title: 'Making Great Progress!',
        subtitle: `${daysRemaining} days to continue exploring all features`,
        cta: 'Keep Going',
        action: 'upgrade' // Show upgrade modal
      };
    } else {
      return {
        title: 'Welcome to Your Premium Trial',
        subtitle: `${daysRemaining} days to discover how NestSync helps families`,
        cta: 'Learn More',
        action: 'upgrade' // Show upgrade modal
      };
    }
  };

  const message = getProgressMessage();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[800] : '#FFFFFF',
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 20,
      shadowColor: NestSyncColors.primary.blue,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
      borderWidth: 1,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme === 'dark' ? NestSyncColors.neutral[100] : NestSyncColors.neutral[800],
      marginBottom: 8,
      lineHeight: 28,
    },
    subtitle: {
      fontSize: 16,
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      lineHeight: 22,
      marginBottom: 16,
    },
    progressSection: {
      marginBottom: 24,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[200] : NestSyncColors.neutral[700],
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: NestSyncColors.primary.blue,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: theme === 'dark' ? NestSyncColors.neutral[700] : NestSyncColors.neutral[200],
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: NestSyncColors.primary.blue,
      borderRadius: 4,
    },
    featuresSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[200] : NestSyncColors.neutral[700],
      marginBottom: 16,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingLeft: 4,
    },
    featureIcon: {
      marginRight: 16,
      width: 32,
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 13,
      lineHeight: 18,
    },
    featureUnlocked: {
      color: theme === 'dark' ? NestSyncColors.neutral[200] : NestSyncColors.neutral[700],
    },
    featureLocked: {
      color: theme === 'dark' ? NestSyncColors.neutral[500] : NestSyncColors.neutral[400],
    },
    pricingSection: {
      backgroundColor: theme === 'dark'
        ? NestSyncColors.primary.blue + '20'
        : NestSyncColors.primary.blueLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    pricingTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: NestSyncColors.primary.blue,
      marginBottom: 8,
      textAlign: 'center',
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    priceLabel: {
      fontSize: 13,
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
    },
    priceValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme === 'dark' ? NestSyncColors.neutral[200] : NestSyncColors.neutral[700],
    },
    canadianNote: {
      fontSize: 11,
      color: theme === 'dark' ? NestSyncColors.neutral[400] : NestSyncColors.neutral[500],
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: NestSyncColors.primary.blue,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: 'transparent',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme === 'dark' ? NestSyncColors.neutral[600] : NestSyncColors.neutral[300],
    },
    secondaryButtonText: {
      color: theme === 'dark' ? NestSyncColors.neutral[300] : NestSyncColors.neutral[600],
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.subtitle}>{message.subtitle}</Text>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Trial Progress</Text>
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features You're Exploring</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons
                name={feature.icon as any}
                size={20}
                color={feature.unlocked
                  ? NestSyncColors.secondary.green
                  : (theme === 'dark' ? NestSyncColors.neutral[500] : NestSyncColors.neutral[400])
                }
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={[
                styles.featureTitle,
                feature.unlocked ? styles.featureUnlocked : styles.featureLocked
              ]}>
                {feature.title}
              </Text>
              <Text style={[
                styles.featureDescription,
                feature.unlocked ? styles.featureUnlocked : styles.featureLocked
              ]}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Canadian Pricing Section */}
      <View style={styles.pricingSection}>
        <Text style={styles.pricingTitle}>🇨🇦 Canadian Pricing</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Standard Monthly</Text>
          <Text style={styles.priceValue}>$4.99 CAD</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Premium Monthly</Text>
          <Text style={styles.priceValue}>$6.99 CAD</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Yearly Plans (Save 20%)</Text>
          <Text style={styles.priceValue}>$49.90 - $69.90 CAD</Text>
        </View>
        <Text style={styles.canadianNote}>
          All data stored in Canada • PIPEDA compliant • Taxes calculated at checkout
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={message.action === 'analytics' ? onAnalyticsNavigate : onUpgradePress}
          accessibilityRole="button"
          accessibilityLabel={message.cta}
          accessibilityHint={message.action === 'analytics' ? "Navigate to analytics view" : "Upgrade to premium subscription"}
        >
          <Text style={styles.primaryButtonText}>{message.cta}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onLearnMorePress}
          accessibilityRole="button"
          accessibilityLabel="View premium features"
          accessibilityHint="See detailed list of premium features"
        >
          <Text style={styles.secondaryButtonText}>View Features</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default TrialProgressCard;