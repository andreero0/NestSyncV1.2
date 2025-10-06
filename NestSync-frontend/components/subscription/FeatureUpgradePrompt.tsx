/**
 * Feature Upgrade Prompt Component
 * Reusable modal/overlay component to gate premium features
 *
 * Usage:
 * - Displays upgrade prompt when user lacks feature access
 * - Navigates to subscription management screen
 * - Supports dismissible and blocking modes
 * - Follows NestSync design system and psychology-driven UX
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFeatureAccess } from '@/lib/hooks/useSubscription';

export interface FeatureUpgradePromptProps {
  featureId: string;
  title?: string;
  description?: string;
  requiredTier?: 'STANDARD' | 'PREMIUM' | 'FAMILY';
  mode?: 'dismissible' | 'blocking';
  onDismiss?: () => void;
  visible?: boolean;
}

export function FeatureUpgradePrompt({
  featureId,
  title = 'Upgrade to Premium',
  description,
  requiredTier,
  mode = 'dismissible',
  onDismiss,
  visible = true,
}: FeatureUpgradePromptProps) {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];
  const router = useRouter();

  // Check feature access via GraphQL
  const { hasAccess, featureAccess, loading } = useFeatureAccess(featureId);

  // If user has access, don't render anything
  if (hasAccess || !visible) {
    return null;
  }

  // Determine the required tier and pricing
  const tierName = featureAccess?.tierRequired || requiredTier || 'PREMIUM';
  const tierPricing = {
    STANDARD: '$19.99 CAD/month',
    PREMIUM: '$24.99 CAD/month',
    FAMILY: '$34.99 CAD/month',
  };

  // Default description based on feature
  const defaultDescription = description || `This feature is available on the ${tierName} plan. Upgrade now to unlock premium capabilities.`;

  const handleUpgrade = () => {
    router.push('/(subscription)/subscription-management');
  };

  const handleDismiss = () => {
    if (mode === 'dismissible' && onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!hasAccess && visible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={mode === 'dismissible' ? handleDismiss : undefined}
          disabled={mode === 'blocking'}
        />

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Close button (dismissible mode only) */}
          {mode === 'dismissible' && (
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
            </Pressable>
          )}

          {/* Premium icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.premium + '20' }]}>
            <IconSymbol name="star.fill" size={32} color={colors.premium} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {defaultDescription}
          </Text>

          {/* Pricing badge */}
          <View style={[styles.pricingBadge, { backgroundColor: colors.tint + '10' }]}>
            <Text style={[styles.pricingText, { color: colors.tint }]}>
              {tierPricing[tierName as keyof typeof tierPricing]}
            </Text>
          </View>

          {/* Feature benefits (if available) */}
          {featureAccess?.description && (
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                What you'll get:
              </Text>
              <View style={styles.benefitRow}>
                <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  {featureAccess.description}
                </Text>
              </View>
            </View>
          )}

          {/* Loading state */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleUpgrade}
              style={({ pressed }) => [
                styles.upgradeButton,
                { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityLabel="Upgrade now"
              accessibilityRole="button"
            >
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </Pressable>

            {mode === 'dismissible' && (
              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [
                  styles.laterButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                accessibilityLabel="Maybe later"
                accessibilityRole="button"
              >
                <Text style={[styles.laterButtonText, { color: colors.textSecondary }]}>
                  Maybe Later
                </Text>
              </Pressable>
            )}
          </View>

          {/* Canadian trust indicator */}
          <View style={styles.trustIndicator}>
            <IconSymbol name="shield.checkered" size={16} color={colors.info} />
            <Text style={[styles.trustText, { color: colors.info }]}>
              Data stored in Canada
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  pricingBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  pricingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 12,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  laterButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
