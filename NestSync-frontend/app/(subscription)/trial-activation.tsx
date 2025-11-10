/**
 * Trial Activation Screen
 * 14-day free trial activation with PIPEDA compliance
 *
 * Psychology-driven design:
 * - Clear value proposition without overwhelming users
 * - No credit card required (reduces stress)
 * - Prominent Canadian data residency messaging
 * - Accessible touch targets and WCAG AA compliance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useStartTrial, useAvailablePlans } from '@/lib/hooks/useSubscription';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuthStore } from '@/stores/authStore';

export default function TrialActivationScreen() {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];
  const router = useRouter();
  const { user } = useAuthStore();

  const [selectedTier, setSelectedTier] = useState<'STANDARD' | 'PREMIUM'>('STANDARD');
  const { startTrial, loading: startingTrial, error: trialError } = useStartTrial();
  const { availablePlans, loading: plansLoading } = useAvailablePlans();

  const handleStartTrial = async () => {
    console.log('[TrialActivation] START - handleStartTrial called');
    console.log('[TrialActivation] User object:', JSON.stringify(user, null, 2));
    console.log('[TrialActivation] Selected tier:', selectedTier);

    try {
      // Get province from user profile, fallback to BC if not set
      const province = user?.province || 'BC';
      console.log('[TrialActivation] Province resolved to:', province);

      const inputData = {
        tier: selectedTier,
        province: province,
      };
      console.log('[TrialActivation] Mutation input:', JSON.stringify(inputData, null, 2));

      console.log('[TrialActivation] Calling startTrial mutation...');
      const result = await startTrial(inputData);
      console.log('[TrialActivation] Mutation result:', JSON.stringify(result, null, 2));

      if (result.success && result.trialProgress) {
        console.log('[TrialActivation] Trial started successfully, navigating to (tabs)');
        router.replace('/(tabs)');
      } else {
        console.error('[TrialActivation] Trial start failed:', result.error);
      }
    } catch (error) {
      console.error('[TrialActivation] Exception in handleStartTrial:', error);
      console.error('[TrialActivation] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
    }
  };

  const tierFeatures = {
    STANDARD: [
      'Family sharing with up to 2 caregivers',
      'Basic inventory tracking',
      'Diaper change logging',
      'Size change notifications',
      'Canadian data storage (PIPEDA compliant)',
    ],
    PREMIUM: [
      'Everything in Standard',
      'Advanced analytics and insights',
      'Predictive reorder suggestions',
      'Unlimited family members',
      'Priority support',
      'Export data to CSV',
    ],
  };

  const tierPricing = {
    STANDARD: '$4.99 CAD/month',
    PREMIUM: '$9.99 CAD/month',
  };

  if (plansLoading) {
    console.log('[TrialActivation] Still loading plans...');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading trial options...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Start Your Free Trial
          </Text>
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={[colors.tint + '20', colors.tint + '05']}
          style={styles.heroSection}
        >
          <IconSymbol name="star.fill" size={48} color={colors.tint} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            14 Days Free
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            No credit card required. Cancel anytime.
          </Text>
          <View style={[styles.canadaBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.canadaBadgeText, { color: colors.tint }]}>
              🇨🇦 Data stored in Canada
            </Text>
          </View>
        </LinearGradient>

        {/* Tier Selection */}
        <View style={styles.tierSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choose Your Trial Plan
          </Text>

          {(['STANDARD', 'PREMIUM'] as const).map((tier) => {
            const isSelected = selectedTier === tier;
            const isRecommended = tier === 'PREMIUM';

            return (
              <Pressable
                key={tier}
                onPress={() => setSelectedTier(tier)}
                style={({ pressed }) => [
                  styles.tierCard,
                  {
                    backgroundColor: isSelected ? colors.tint + '15' : colors.surface,
                    borderColor: isSelected ? colors.tint : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityLabel={`Select ${tier} tier, ${tierPricing[tier]}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                {isRecommended && (
                  <View style={[styles.recommendedBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.recommendedText}>RECOMMENDED</Text>
                  </View>
                )}

                <View style={styles.tierHeader}>
                  <View style={styles.tierInfo}>
                    <Text style={[styles.tierName, { color: colors.text }]}>
                      {tier.charAt(0) + tier.slice(1).toLowerCase()}
                    </Text>
                    <Text style={[styles.tierPrice, { color: colors.textSecondary }]}>
                      {tierPricing[tier]}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioButton,
                      {
                        borderColor: isSelected ? colors.tint : colors.border,
                        backgroundColor: isSelected ? colors.tint : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {tierFeatures[tier].map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color={colors.tint}
                      />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Error Message */}
        {trialError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {trialError.message}
            </Text>
          </View>
        )}

        {/* PIPEDA Compliance Notice */}
        <View style={[styles.complianceNotice, { backgroundColor: colors.surface }]}>
          <IconSymbol name="shield.checkmark.fill" size={24} color={colors.tint} />
          <Text style={[styles.complianceText, { color: colors.textSecondary }]}>
            Your data is stored securely in Canada and protected under PIPEDA.
            We never share your personal information with third parties.
          </Text>
        </View>

        {/* Start Trial Button */}
        <Pressable
          onPress={() => {
            console.log('[TrialActivation] Button pressed! startingTrial =', startingTrial);
            handleStartTrial();
          }}
          disabled={startingTrial}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: colors.tint,
              opacity: pressed ? 0.8 : startingTrial ? 0.6 : 1,
            },
          ]}
          accessibilityLabel={`Start 14-day free trial of ${selectedTier} plan`}
          accessibilityRole="button"
          accessibilityState={{ disabled: startingTrial }}
        >
          {startingTrial ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.startButtonText}>Start Free Trial</Text>
              <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
            </>
          )}
        </Pressable>

        {/* Terms */}
        <Text style={[styles.termsText, { color: colors.textSecondary }]}>
          By starting your trial, you agree to our Terms of Service and Privacy Policy.
          No payment required during trial. Cancel anytime before trial ends.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20, // 5 × 4px base unit
    paddingBottom: 40, // 10 × 4px base unit
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 12, // 3 × 4px base unit (updated from 8px for better touch target)
    marginRight: 12, // 3 × 4px base unit
    minHeight: 48, // WCAG AA minimum touch target
    minWidth: 48, // WCAG AA minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  heroSection: {
    alignItems: 'center',
    padding: 32, // 8 × 4px base unit
    borderRadius: 16, // XLarge border radius
    marginBottom: 32, // 8 × 4px base unit
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  canadaBadge: {
    marginTop: 16, // 4 × 4px base unit
    paddingHorizontal: 16, // 4 × 4px base unit
    paddingVertical: 8, // 2 × 4px base unit
    borderRadius: 20, // Rounded pill shape (5 × 4px base unit)
  },
  canadaBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tierCard: {
    padding: 20, // 5 × 4px base unit
    borderRadius: 12, // Large border radius for cards
    marginBottom: 16, // 4 × 4px base unit
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10, // Positioned above card
    right: 20, // 5 × 4px base unit
    paddingHorizontal: 12, // 3 × 4px base unit
    paddingVertical: 4, // 1 × 4px base unit
    borderRadius: 12, // Large border radius
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tierPrice: {
    fontSize: 16,
    marginTop: 4,
  },
  radioButton: {
    width: 28, // 7 × 4px base unit
    height: 28, // 7 × 4px base unit
    borderRadius: 14, // Circular (half of width/height)
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 8px)
    marginBottom: 16, // 4 × 4px base unit
    gap: 12, // 3 × 4px base unit
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  complianceNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 8px)
    marginBottom: 24, // 6 × 4px base unit
    gap: 12, // 3 × 4px base unit
  },
  complianceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // 5 × 4px base unit
    paddingVertical: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius for buttons
    marginBottom: 16, // 4 × 4px base unit
    gap: 8, // 2 × 4px base unit
    // WCAG AA minimum touch target
    minHeight: 56, // Exceeds 48px minimum for primary CTA
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
