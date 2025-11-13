/**
 * PremiumFeatureGate Component
 * Psychology-driven subscription gating for premium features
 * Canadian pricing and PIPEDA-compliant messaging for stressed parents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GET_SUBSCRIPTION_STATUS } from '@/lib/graphql/reorder-queries';

const { width: screenWidth } = Dimensions.get('window');

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface PremiumFeatureGateProps {
  feature: 'reorder' | 'analytics' | 'automation' | 'collaboration';
  onUpgrade: () => void;
  children?: React.ReactNode;
}

interface SubscriptionStatus {
  status: 'free' | 'premium' | 'family';
  hasAccessTo: string[];
}

interface FeatureConfig {
  title: string;
  description: string;
  benefit: string;
  icon: string;
  gradientColors: [string, string];
  premiumPlan: string;
  canadianPrice: string;
}

// =============================================================================
// FEATURE CONFIGURATIONS
// =============================================================================

const FEATURE_CONFIGS: Record<string, FeatureConfig> = {
  reorder: {
    title: 'Smart Reorder Suggestions',
    description: 'Unlock unlimited ML-powered reorder suggestions and never run out again',
    benefit: 'Save 3+ hours per week with automated diaper planning',
    icon: 'sparkles',
    gradientColors: [NestSyncColors.accent.purple, NestSyncColors.primary.blue],
    premiumPlan: 'Premium',
    canadianPrice: '$6.99 CAD/month',
  },
  analytics: {
    title: 'Detailed Analytics & Insights',
    description: 'Get detailed insights and predictions about your baby\'s needs',
    benefit: 'Understand growth patterns and optimize spending',
    icon: 'chart.bar',
    gradientColors: [NestSyncColors.primary.blue, NestSyncColors.secondary.green],
    premiumPlan: 'Premium',
    canadianPrice: '$6.99 CAD/month',
  },
  automation: {
    title: 'Automated Reordering',
    description: 'Set up automatic reordering and never think about diapers again',
    benefit: 'Complete peace of mind with zero mental load',
    icon: 'arrow.triangle.2.circlepath',
    gradientColors: [NestSyncColors.accent.amber, NestSyncColors.accent.orange],
    premiumPlan: 'Premium',
    canadianPrice: '$6.99 CAD/month',
  },
  collaboration: {
    title: 'Family Collaboration',
    description: 'Share suggestions and coordinate with your partner seamlessly',
    benefit: 'Keep everyone in sync without the stress',
    icon: 'person.2',
    gradientColors: [NestSyncColors.secondary.green, NestSyncColors.primary.blue],
    premiumPlan: 'Premium',
    canadianPrice: '$6.99 CAD/month',
  },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PremiumFeatureGate({
  feature,
  onUpgrade,
  children,
}: PremiumFeatureGateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Animation values
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.95);
  const shimmerValue = useSharedValue(0);

  // State
  const [isVisible, setIsVisible] = useState(false);

  // Get subscription status
  const { data: subscriptionData, loading: subscriptionLoading } = useQuery(
    GET_SUBSCRIPTION_STATUS,
    {
      errorPolicy: 'all',
      fetchPolicy: Platform.OS === 'web' ? 'cache-first' : 'cache-and-network',
    }
  );

  const config = FEATURE_CONFIGS[feature];

  // Check if user has access to this feature
  const hasAccess = React.useMemo(() => {
    if (!subscriptionData?.getSubscriptionStatus) {
      return false; // Show gate by default if no subscription data
    }

    const status = subscriptionData.getSubscriptionStatus;

    // Family plan has access to everything
    if (status.status === 'family') {
      return true;
    }

    // Premium plan has access to most features except collaboration
    if (status.status === 'premium' && feature !== 'collaboration') {
      return true;
    }

    // Free plan has no access to premium features
    return false;
  }, [subscriptionData, feature]);

  // Show children if user has access
  if (hasAccess && !subscriptionLoading) {
    return <>{children}</>;
  }

  // Show loading state while checking subscription
  if (subscriptionLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.tint} />
        <ThemedText style={styles.loadingText}>Checking access...</ThemedText>
      </ThemedView>
    );
  }

  // Entrance animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fadeValue.value = withTiming(1, { duration: 600 });
      scaleValue.value = withSpring(1, {
        damping: 8,
        stiffness: 100,
      });
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Shimmer animation for premium effect
  React.useEffect(() => {
    if (isVisible) {
      shimmerValue.value = withTiming(1, { duration: 2000 }, () => {
        shimmerValue.value = withTiming(0, { duration: 2000 });
      });
    }
  }, [isVisible]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ scale: scaleValue.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.3, 0.7, 0.3],
      Extrapolate.CLAMP
    ),
  }));

  const handleUpgradePress = async () => {
    // Haptic feedback for premium interaction
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onUpgrade();
  };

  if (!config) {
    console.warn(`PremiumFeatureGate: Unknown feature "${feature}"`);
    return <>{children}</>;
  }

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 20 : 0}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.blurOverlay}
        >
          <View style={styles.content}>
            {/* Premium Crown Icon */}
            <View style={styles.iconContainer}>
              <Animated.View style={[styles.iconShimmer, shimmerAnimatedStyle]}>
                <IconSymbol
                  name="crown.fill"
                  size={32}
                  color="#FFD700"
                  style={styles.crownIcon}
                />
              </Animated.View>
            </View>

            {/* Feature Title */}
            <ThemedText
              type="subtitle"
              style={[styles.title, { color: colors.background }]}
            >
              {config.title}
            </ThemedText>

            {/* Feature Description */}
            <ThemedText
              style={[styles.description, { color: colors.background }]}
            >
              {config.description}
            </ThemedText>

            {/* Key Benefit */}
            <View style={styles.benefitContainer}>
              <IconSymbol
                name="checkmark.circle.fill"
                size={16}
                color={NestSyncColors.secondary.green}
              />
              <ThemedText
                style={[styles.benefit, { color: colors.background }]}
              >
                {config.benefit}
              </ThemedText>
            </View>

            {/* Canadian Context */}
            <View style={styles.canadianContainer}>
              <ThemedText style={[styles.canadianText, { color: colors.background }]}>
                Data stored in Canada • GST/PST included
              </ThemedText>
            </View>

            {/* Upgrade Button */}
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.background, colorScheme === 'dark' ? NestSyncColors.neutral[800] : '#F8F9FA']}
                style={styles.buttonGradient}
              >
                <ThemedText style={styles.buttonText}>
                  Upgrade to {config.premiumPlan}
                </ThemedText>
                <ThemedText style={styles.priceText}>
                  {config.canadianPrice}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Trust Indicator */}
            <ThemedText style={[styles.trustText, { color: colors.background }]}>
              30-day money-back guarantee • Cancel anytime
            </ThemedText>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)',
  },

  gradientBackground: {
    flex: 1,
  },

  blurOverlay: {
    flex: 1,
    borderRadius: 16,
  },

  content: {
    padding: 24,
    alignItems: 'center',
  },

  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconShimmer: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  crownIcon: {
    textAlign: 'center',
  },

  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  description: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.95,
  },

  benefitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },

  benefit: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },

  canadianContainer: {
    marginBottom: 20,
  },

  canadianText: {
    fontSize: 12,
    // color applied inline with theme awareness (with opacity)
    opacity: 0.8,
    textAlign: 'center',
  },

  upgradeButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.15)',
  },

  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: NestSyncColors.primary.blue,
    marginBottom: 2,
  },

  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: NestSyncColors.neutral[600],
  },

  trustText: {
    fontSize: 11,
    // color applied inline with theme awareness (with opacity)
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 16,
  },

  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
  },
});

export default PremiumFeatureGate;