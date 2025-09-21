/**
 * PremiumUpgradeModal Component
 * Subscription upgrade modal with Stripe PaymentSheet integration for Canadian users
 * Designed for psychology-driven UX patterns to reduce decision fatigue for tired parents
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery } from '@apollo/client';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../ui/IconSymbol';
import { NestSyncButton } from '../ui/NestSyncButton';
import { NestSyncCard } from '../ui/NestSyncCard';
import { Colors, NestSyncColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useReorderStore } from '@/stores/reorderStore';
import { GET_SUBSCRIPTION_STATUS, UPDATE_SUBSCRIPTION } from '@/lib/graphql/reorder-queries';

// TODO: Install Stripe React Native SDK
// npm install @stripe/stripe-react-native
// import { useStripe, usePaymentSheet } from '@stripe/stripe-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  features: string[];
  price: {
    amount: number;
    currency: string;
    billingInterval: 'MONTHLY' | 'YEARLY';
    canadianTaxes: {
      gst: number;
      pst: number;
      hst: number;
      total: number;
    };
  };
  limits: {
    reorderSuggestions: number;
    familyMembers: number;
    priceAlerts: number;
    autoOrdering: boolean;
  };
}

export interface SubscriptionStatus {
  id: string;
  status: string;
  currentPlan: SubscriptionPlan;
  nextBillingDate: string;
  paymentMethod?: {
    id: string;
    type: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  };
  usage: {
    currentPeriod: {
      reordersSuggested: number;
      ordersPlaced: number;
      savingsGenerated: {
        amount: number;
        currency: string;
      };
      priceAlertsReceived: number;
    };
    lifetime: {
      totalOrders: number;
      totalSavings: {
        amount: number;
        currency: string;
      };
      memberSince: string;
    };
  };
  availableUpgrades: Array<{
    planId: string;
    name: string;
    monthlyPricing: {
      amount: number;
      currency: string;
    };
    yearlyPricing: {
      amount: number;
      currency: string;
      savingsPerMonth: {
        amount: number;
        currency: string;
      };
    };
    newFeatures: string[];
    valueProposition: string;
  }>;
  billingDataConsent: boolean;
  updatedAt: string;
}

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradeSuccess?: (planId: string) => void;
  initialPlanId?: string;
  feature?: 'reorder' | 'analytics' | 'automation' | 'family_sharing';
  testID?: string;
}

type BillingInterval = 'MONTHLY' | 'YEARLY';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatCADPrice = (amount: number, currency: string = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatSavings = (monthlyPrice: number, yearlyPrice: number): string => {
  const monthlyCost = monthlyPrice * 12;
  const savings = monthlyCost - yearlyPrice;
  const percentage = ((savings / monthlyCost) * 100).toFixed(0);
  return `Save ${formatCADPrice(savings)} (${percentage}%)`;
};

const getFeatureIcon = (feature: string): string => {
  const iconMap: { [key: string]: string } = {
    'ML-powered predictions': 'brain.head.profile',
    'Unlimited reorder suggestions': 'arrow.clockwise.circle.fill',
    'Price tracking & alerts': 'chart.line.uptrend.xyaxis',
    'Automated reordering': 'gear.circle.fill',
    'Family collaboration': 'person.2.fill',
    'Premium analytics': 'chart.bar.fill',
    'Priority support': 'headphones.circle.fill',
    'Advanced inventory insights': 'cube.box.fill',
    'Bulk discount alerts': 'tag.circle.fill',
    'Custom delivery scheduling': 'calendar.circle.fill',
  };
  return iconMap[feature] || 'checkmark.circle.fill';
};

// Mock Stripe PaymentSheet hook (replace with actual implementation)
const usePaymentSheet = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
});

// =============================================================================
// PREMIUM UPGRADE MODAL COMPONENT
// =============================================================================

export function PremiumUpgradeModal({
  visible,
  onClose,
  onUpgradeSuccess,
  initialPlanId,
  feature,
  testID,
}: PremiumUpgradeModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // State management
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId || '');
  const [selectedBilling, setSelectedBilling] = useState<BillingInterval>('YEARLY');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string>('');

  // Animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const slideY = useSharedValue(screenHeight * 0.3);

  // Psychology-driven spring configuration
  const springConfig = {
    damping: 18,
    stiffness: 280,
    mass: 1.1,
  };

  // Stripe PaymentSheet hook
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  // GraphQL queries and mutations
  const { data: subscriptionData, loading: subscriptionLoading } = useQuery(GET_SUBSCRIPTION_STATUS, {
    skip: !visible,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [updateSubscription, { loading: upgradeLoading }] = useMutation(UPDATE_SUBSCRIPTION);

  const subscriptionStatus: SubscriptionStatus | null = subscriptionData?.getSubscriptionStatus || null;

  // =============================================================================
  // PLAN SELECTION LOGIC
  // =============================================================================

  const availablePlans = useMemo(() => {
    if (!subscriptionStatus?.availableUpgrades) return [];
    return subscriptionStatus.availableUpgrades;
  }, [subscriptionStatus]);

  const selectedPlan = useMemo(() => {
    return availablePlans.find(plan => plan.planId === selectedPlanId) || availablePlans[0];
  }, [availablePlans, selectedPlanId]);

  // Set default plan if none selected
  useEffect(() => {
    if (availablePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(availablePlans[0].planId);
    }
  }, [availablePlans, selectedPlanId]);

  // =============================================================================
  // ANIMATION EFFECTS
  // =============================================================================

  useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, springConfig);
      slideY.value = withSpring(0, springConfig);
    } else {
      modalOpacity.value = withTiming(0, { duration: 250 });
      modalScale.value = withTiming(0.9, { duration: 250 });
      slideY.value = withTiming(screenHeight * 0.3, { duration: 250 });
    }
  }, [visible]);

  // =============================================================================
  // PAYMENT PROCESSING
  // =============================================================================

  const initializePaymentSheet = async (planId: string, billingInterval: BillingInterval) => {
    try {
      setIsProcessingPayment(true);

      // Initialize payment with backend
      const response = await updateSubscription({
        variables: {
          planId,
          billingInterval,
        },
      });

      if (response.data?.updateSubscription?.paymentIntent?.clientSecret) {
        const clientSecret = response.data.updateSubscription.paymentIntent.clientSecret;
        setPaymentIntentClientSecret(clientSecret);

        // Initialize Stripe PaymentSheet
        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'NestSync',
          customerId: subscriptionStatus?.id,
          customerEphemeralKeySecret: '', // TODO: Get from backend
          allowsDelayedPaymentMethods: false,
          appearance: {
            colors: {
              primary: colors.tint,
              background: colors.background,
              componentBackground: colors.surface,
            },
          },
          defaultBillingDetails: {
            name: '', // TODO: Get from user profile
            email: '', // TODO: Get from user profile
            address: {
              country: 'CA', // Canadian users only
            },
          },
          // Canadian payment methods
          paymentMethodTypes: ['card', 'afterpay_clearpay'],
        });

        if (error) {
          throw new Error(error.message);
        }

        return true;
      }

      throw new Error('Failed to initialize payment');
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert(
        'Payment Error',
        'Unable to initialize payment. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Initialize payment sheet
      const initialized = await initializePaymentSheet(selectedPlan.planId, selectedBilling);
      if (!initialized) return;

      // Present payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert(
            'Payment Failed',
            error.localizedMessage || 'Payment was not completed. Please try again.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      // Payment successful
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (onUpgradeSuccess) {
        onUpgradeSuccess(selectedPlan.planId);
      }

      // Show success message and close
      Alert.alert(
        'Upgrade Successful!',
        `Welcome to ${selectedPlan.name}! You now have access to all premium features.`,
        [
          {
            text: 'Start Using Features',
            onPress: handleClose,
          },
        ]
      );

    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert(
        'Upgrade Error',
        'There was an issue processing your upgrade. Please contact support if this continues.',
        [{ text: 'OK' }]
      );
    }
  };

  // =============================================================================
  // MODAL MANAGEMENT
  // =============================================================================

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    modalOpacity.value = withTiming(0, { duration: 250 });
    modalScale.value = withTiming(0.9, { duration: 250 });
    slideY.value = withTiming(screenHeight * 0.3, { duration: 250 });

    setTimeout(() => {
      onClose();
      setSelectedPlanId(initialPlanId || '');
      setSelectedBilling('YEARLY');
      setIsProcessingPayment(false);
    }, 250);
  };

  const handlePlanSelect = (planId: string) => {
    Haptics.selectionAsync();
    setSelectedPlanId(planId);
  };

  const handleBillingToggle = (interval: BillingInterval) => {
    if (interval !== selectedBilling) {
      Haptics.selectionAsync();
      setSelectedBilling(interval);
    }
  };

  // =============================================================================
  // ANIMATED STYLES
  // =============================================================================

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: slideY.value },
    ],
    opacity: modalOpacity.value,
  }));

  // =============================================================================
  // FEATURE-SPECIFIC MESSAGING
  // =============================================================================

  const getFeatureSpecificMessage = () => {
    const messages = {
      reorder: 'Unlock unlimited ML-powered reorder suggestions and never run out again',
      analytics: 'Get detailed insights into your baby\'s patterns and growth predictions',
      automation: 'Set up automatic reordering and never worry about running low',
      family_sharing: 'Share inventory management with your partner and family members',
    };
    return feature ? messages[feature] : 'Unlock all premium features for stress-free parenting';
  };

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </BlurView>

        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <SafeAreaView style={[styles.modal, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <LinearGradient
                  colors={[NestSyncColors.accent.purple, NestSyncColors.primary.blue]}
                  style={styles.premiumIcon}
                >
                  <IconSymbol name="crown.fill" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.headerTextContainer}>
                  <ThemedText type="title" style={[styles.headerTitle, { color: colors.text }]}>
                    Upgrade to Premium
                  </ThemedText>
                  <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {getFeatureSpecificMessage()}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close upgrade modal"
              >
                <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Loading State */}
            {(subscriptionLoading || !subscriptionStatus) && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading subscription options...
                </ThemedText>
              </View>
            )}

            {/* Content */}
            {subscriptionStatus && !subscriptionLoading && (
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Usage Stats */}
                <NestSyncCard style={[styles.usageCard, { backgroundColor: colors.surface }]}>
                  <ThemedText type="subtitle" style={[styles.usageTitle, { color: colors.text }]}>
                    Your Savings This Month
                  </ThemedText>
                  <View style={styles.usageStats}>
                    <View style={styles.statItem}>
                      <ThemedText type="title" style={[styles.statValue, { color: NestSyncColors.semantic.success }]}>
                        {formatCADPrice(subscriptionStatus.usage.currentPeriod.savingsGenerated.amount)}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Total Saved
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText type="title" style={[styles.statValue, { color: colors.text }]}>
                        {subscriptionStatus.usage.currentPeriod.reordersSuggested}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                        Suggestions Used
                      </ThemedText>
                    </View>
                  </View>
                </NestSyncCard>

                {/* Billing Toggle */}
                <View style={styles.billingSection}>
                  <ThemedText type="subtitle" style={[styles.billingTitle, { color: colors.text }]}>
                    Billing Period
                  </ThemedText>
                  <View style={[styles.billingToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={[
                        styles.billingOption,
                        {
                          backgroundColor: selectedBilling === 'MONTHLY' ? colors.tint : 'transparent',
                        }
                      ]}
                      onPress={() => handleBillingToggle('MONTHLY')}
                    >
                      <ThemedText
                        style={[
                          styles.billingOptionText,
                          { color: selectedBilling === 'MONTHLY' ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        Monthly
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.billingOption,
                        {
                          backgroundColor: selectedBilling === 'YEARLY' ? colors.tint : 'transparent',
                        }
                      ]}
                      onPress={() => handleBillingToggle('YEARLY')}
                    >
                      <ThemedText
                        style={[
                          styles.billingOptionText,
                          { color: selectedBilling === 'YEARLY' ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        Yearly
                      </ThemedText>
                      <View style={styles.savingsBadge}>
                        <ThemedText style={styles.savingsText}>Save 25%</ThemedText>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Plan Selection */}
                <View style={styles.plansSection}>
                  <ThemedText type="subtitle" style={[styles.plansTitle, { color: colors.text }]}>
                    Choose Your Plan
                  </ThemedText>

                  {availablePlans.map((plan) => {
                    const isSelected = selectedPlanId === plan.planId;
                    const pricing = selectedBilling === 'YEARLY' ? plan.yearlyPricing : plan.monthlyPricing;

                    return (
                      <TouchableOpacity
                        key={plan.planId}
                        style={[
                          styles.planCard,
                          {
                            backgroundColor: isSelected ? colors.tint + '20' : colors.surface,
                            borderColor: isSelected ? colors.tint : colors.border,
                          }
                        ]}
                        onPress={() => handlePlanSelect(plan.planId)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        {/* Plan Header */}
                        <View style={styles.planHeader}>
                          <View style={styles.planInfo}>
                            <ThemedText type="defaultSemiBold" style={[styles.planName, { color: colors.text }]}>
                              {plan.name}
                            </ThemedText>
                            <ThemedText style={[styles.planDescription, { color: colors.textSecondary }]}>
                              {plan.valueProposition}
                            </ThemedText>
                          </View>
                          <View style={styles.planPricing}>
                            <ThemedText type="title" style={[styles.planPrice, { color: colors.text }]}>
                              {formatCADPrice(pricing.amount)}
                            </ThemedText>
                            <ThemedText style={[styles.planBilling, { color: colors.textSecondary }]}>
                              /{selectedBilling === 'YEARLY' ? 'year' : 'month'}
                            </ThemedText>
                            {selectedBilling === 'YEARLY' && (
                              <ThemedText style={[styles.planSavings, { color: NestSyncColors.semantic.success }]}>
                                {formatSavings(plan.monthlyPricing.amount, plan.yearlyPricing.amount)}
                              </ThemedText>
                            )}
                          </View>
                        </View>

                        {/* Plan Features */}
                        <View style={styles.planFeatures}>
                          {plan.newFeatures.slice(0, 4).map((feature, index) => (
                            <View key={index} style={styles.planFeature}>
                              <IconSymbol
                                name={getFeatureIcon(feature)}
                                size={16}
                                color={isSelected ? colors.tint : NestSyncColors.semantic.success}
                              />
                              <ThemedText style={[styles.planFeatureText, { color: colors.text }]}>
                                {feature}
                              </ThemedText>
                            </View>
                          ))}
                          {plan.newFeatures.length > 4 && (
                            <ThemedText style={[styles.planFeaturesMore, { color: colors.textSecondary }]}>
                              +{plan.newFeatures.length - 4} more features
                            </ThemedText>
                          )}
                        </View>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <View style={styles.selectedIndicator}>
                            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.tint} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Canadian Tax Information */}
                {selectedPlan && (
                  <View style={[styles.taxInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <IconSymbol name="info.circle" size={16} color={NestSyncColors.canadian.trust} />
                    <View style={styles.taxContent}>
                      <ThemedText style={[styles.taxTitle, { color: colors.text }]}>
                        🇨🇦 Canadian Pricing
                      </ThemedText>
                      <ThemedText style={[styles.taxDescription, { color: colors.textSecondary }]}>
                        Price includes applicable taxes. Billed in Canadian dollars with secure processing.
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Upgrade Button */}
                <View style={styles.upgradeSection}>
                  <NestSyncButton
                    title={
                      isProcessingPayment
                        ? "Processing..."
                        : `Upgrade to ${selectedPlan?.name || 'Premium'}`
                    }
                    onPress={handleUpgrade}
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={isProcessingPayment || upgradeLoading}
                    disabled={!selectedPlan || isProcessingPayment || upgradeLoading}
                    testID={`${testID}-upgrade`}
                  />

                  <ThemedText style={[styles.upgradeDisclaimer, { color: colors.textSecondary }]}>
                    Cancel anytime. Changes take effect immediately.
                  </ThemedText>
                </View>

                {/* PIPEDA Compliance */}
                <View style={[styles.complianceFooter, { borderTopColor: colors.border }]}>
                  <IconSymbol name="shield.checkmark" size={12} color={NestSyncColors.canadian.trust} />
                  <ThemedText style={[styles.complianceText, { color: colors.textSecondary }]}>
                    Your payment and billing data is processed securely under PIPEDA compliance with data residency in Canada.
                  </ThemedText>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 40,
    maxHeight: screenHeight * 0.9,
    maxWidth: 500,
  },
  modal: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
    padding: 20,
  },

  // Usage Stats
  usageCard: {
    padding: 20,
    marginBottom: 24,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },

  // Billing Toggle
  billingSection: {
    marginBottom: 24,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  billingToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: NestSyncColors.semantic.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Plans
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
    marginRight: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  planBilling: {
    fontSize: 12,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  planFeatures: {
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    flex: 1,
  },
  planFeaturesMore: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },

  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // Tax Info
  taxInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  taxContent: {
    flex: 1,
  },
  taxTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  taxDescription: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Upgrade Section
  upgradeSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  upgradeDisclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },

  // Compliance Footer
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  complianceText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
});

export default PremiumUpgradeModal;