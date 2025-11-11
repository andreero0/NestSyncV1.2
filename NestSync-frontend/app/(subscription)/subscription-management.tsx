/**
 * Subscription Management Screen
 * View current subscription, change plans, and manage subscription settings
 *
 * Features:
 * - Current subscription status display
 * - Plan comparison and upgrade/downgrade options
 * - Subscription cancellation with cooling-off period
 * - Tax calculation preview for plan changes
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors, NestSyncColors } from '@/constants/Colors';
import {
  useMySubscription,
  useSubscriptionPlans,
  useChangeSubscriptionPlan,
  useCancelSubscriptionPremium,
  useCancellationPreview,
} from '@/lib/hooks/useSubscription';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StandardHeader } from '@/components/ui/StandardHeader';
import { Button, ButtonGroup } from '@/components/ui/Button';
import {
  groupPlansByTier,
  formatFeatureName,
  getTierInfo,
  formatBillingInterval,
  calculateAnnualSavings,
  isAnnualPlan,
  type SubscriptionTier,
} from '@/lib/utils/subscriptionUtils';

export default function SubscriptionManagementScreen() {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const { subscription, loading: subscriptionLoading, refetch: refetchSubscription } = useMySubscription();
  const { plans: availablePlans, loading: plansLoading } = useSubscriptionPlans();
  const { changePlan, loading: changingPlan } = useChangeSubscriptionPlan();
  const { cancelSubscriptionPremium, loading: cancellingSubscription } = useCancelSubscriptionPremium();
  const { preview: cancellationPreview, loading: previewLoading } = useCancellationPreview();

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Helper function to calculate days remaining in trial
  const getDaysRemaining = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleChangePlan = async (newPlanId: string) => {
    try {
      const result = await changePlan({
        newPlanId,
      });

      if (result.success) {
        Alert.alert(
          'Plan Changed',
          'Your subscription plan has been updated successfully.',
          [{ text: 'OK', onPress: () => refetchSubscription() }]
        );
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
      Alert.alert('Error', 'Failed to change subscription plan. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const result = await cancelSubscriptionPremium({
        input: {
          immediate: false, // Cancel at period end
          reason: 'USER_REQUESTED',
        },
      });

      if (result?.success) {
        Alert.alert(
          'Subscription Cancelled',
          result.message || 'Your subscription will remain active until the end of your billing period.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCancelConfirmation(false);
                refetchSubscription();
              },
            },
          ]
        );
      } else {
        // Handle case where mutation succeeded but returned success: false
        Alert.alert(
          'Cancellation Failed',
          result?.error || result?.message || 'Unable to cancel subscription. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to cancel subscription. Please try again.';
      
      if (error.networkError) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Subscription",
            headerBackTitle: "Settings"
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading subscription details...
          </Text>
        </View>
      </>
    );
  }

  if (!subscription) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: "Subscription",
            headerBackTitle: "Settings"
          }}
        />
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Active Subscription
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Start a free trial to unlock premium features
          </Text>
          <Button
            title="Start Free Trial"
            onPress={() => router.push('/(subscription)/trial-activation')}
            variant="primary"
            size="large"
            fullWidth
          />
        </View>
      </>
    );
  }

  const statusColors = {
    ACTIVE: colors.success || NestSyncColors.semantic.success,
    TRIALING: colors.info || NestSyncColors.primary.blue,
    PAST_DUE: colors.warning || NestSyncColors.accent.amber,
    CANCELLED: colors.error,
    INCOMPLETE: colors.warning || NestSyncColors.accent.amber,
  };

  const currentPlan = availablePlans?.find(p => p.id === subscription.plan.id);
  const groupedPlans = availablePlans ? groupPlansByTier(availablePlans) : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <StandardHeader
          title="My Subscription"
          onBack={() => router.back()}
        />

        {/* Current Subscription Card */}
        <View style={[styles.currentSubscriptionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.subscriptionHeader}>
            <View style={styles.planInfo}>
              <Text style={[styles.planName, { color: colors.text }]}>
                {subscription.plan.displayName}
              </Text>
              <Text style={[styles.planPrice, { color: colors.textSecondary }]}>
                ${subscription.amount.toFixed(2)} CAD/{subscription.billingInterval.toLowerCase()}
              </Text>
              <Text style={[styles.taxInfo, { color: colors.textSecondary }]}>
                (includes {subscription.province === 'ON' ? '13% HST' : 
                          subscription.province === 'BC' ? '12% GST + PST' :
                          subscription.province === 'AB' ? '5% GST' :
                          subscription.province === 'QC' ? '14.975% GST + QST' :
                          ['NB', 'NS', 'PE', 'NL'].includes(subscription.province) ? '15% HST' :
                          ['YT', 'NT', 'NU'].includes(subscription.province) ? '5% GST' :
                          '13% HST'})
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors[subscription.status] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors[subscription.status] },
                ]}
              >
                {subscription.status}
              </Text>
            </View>
          </View>

          {/* Trial Banner - Only show when actually on trial */}
          {subscription.isOnTrial &&
           subscription.status === 'TRIALING' &&
           subscription.trialEnd && (
            <View style={[styles.trialBanner, { backgroundColor: colors.info + '20' }]}>
              <IconSymbol name="clock.fill" size={20} color={colors.info || NestSyncColors.semantic.info} />
              <Text style={[styles.trialText, { color: colors.info || NestSyncColors.semantic.info }]}>
                {getDaysRemaining(subscription.trialEnd)} days left in trial
                {' '}(ends {format(new Date(subscription.trialEnd), 'MMM d, yyyy')})
              </Text>
            </View>
          )}

          {/* Money-Back Guarantee Period */}
          {subscription.isInCoolingOffPeriod && subscription.coolingOffEnd && (
            <View style={[styles.coolingOffBanner, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol name="shield.checkmark.fill" size={20} color={colors.success || NestSyncColors.semantic.success} />
              <Text style={[styles.coolingOffText, { color: colors.success || NestSyncColors.semantic.success }]}>
                Money-back guarantee until {format(new Date(subscription.coolingOffEnd), 'MMM d, yyyy')}
              </Text>
            </View>
          )}

          {/* Subscription Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Province
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {subscription.province}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Member since
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {format(new Date(subscription.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>

            {subscription.stripeCustomerId && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Customer ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                  {subscription.stripeCustomerId.slice(-8)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Available Plans - Tier-Based Grouping */}
        {groupedPlans && (
          <View style={styles.plansSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Change Plan
            </Text>

            {/* Billing Interval Toggle */}
            <View style={[styles.billingToggleContainer, { backgroundColor: colors.surface }]}>
              <Pressable
                onPress={() => setSelectedBillingInterval('MONTHLY')}
                style={({ pressed }) => [
                  styles.billingToggleButton,
                  {
                    backgroundColor: selectedBillingInterval === 'MONTHLY' ? colors.tint : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select monthly billing"
              >
                <Text
                  style={[
                    styles.billingToggleText,
                    {
                      color: selectedBillingInterval === 'MONTHLY' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedBillingInterval('YEARLY')}
                style={({ pressed }) => [
                  styles.billingToggleButton,
                  {
                    backgroundColor: selectedBillingInterval === 'YEARLY' ? colors.tint : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select annual billing"
              >
                <Text
                  style={[
                    styles.billingToggleText,
                    {
                      color: selectedBillingInterval === 'YEARLY' ? '#FFFFFF' : colors.textSecondary,
                    },
                  ]}
                >
                  Annual
                </Text>
              </Pressable>
            </View>

            {/* Tier Cards */}
            {(['FREE', 'STANDARD', 'PREMIUM'] as SubscriptionTier[]).map((tier) => {
              const tierPlans = groupedPlans[tier];
              if (!tierPlans || tierPlans.length === 0) return null;

              const planForInterval = tierPlans.find(
                (p) => p.billingInterval === selectedBillingInterval
              ) || tierPlans[0];

              const isCurrent = planForInterval.id === subscription.plan.id;
              const isUpgrade = planForInterval.price > subscription.plan.price;
              const isDowngrade = planForInterval.price < subscription.plan.price;
              const tierInfo = getTierInfo(tier);

              // Calculate annual savings if showing yearly plan
              const monthlyPlan = tierPlans.find((p) => p.billingInterval === 'MONTHLY');
              const annualPlan = tierPlans.find((p) => p.billingInterval === 'YEARLY');
              const showSavingsBadge = selectedBillingInterval === 'YEARLY' && monthlyPlan && annualPlan;
              const savingsPercent = showSavingsBadge
                ? calculateAnnualSavings(monthlyPlan.price, annualPlan.price)
                : 0;

              return (
                <View
                  key={tier}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: isCurrent ? colors.tint + '10' : colors.surface,
                      borderColor: isCurrent ? colors.tint : colors.border,
                      borderWidth: isCurrent ? 2 : 1,
                    },
                  ]}
                >
                  {/* Tier Header */}
                  <View style={styles.tierCardHeader}>
                    <View style={styles.tierCardInfo}>
                      <View style={styles.tierNameRow}>
                        <Text style={[styles.tierName, { color: tierInfo.color }]}>
                          {tierInfo.name}
                        </Text>
                        {isCurrent && (
                          <View style={[styles.currentBadge, { backgroundColor: subscription.status === 'TRIALING' ? colors.info || NestSyncColors.semantic.info : colors.tint }]}>
                            <Text style={styles.currentBadgeText}>
                              {subscription.status === 'TRIALING' ? 'TRIAL' : 'CURRENT'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.tierDescription, { color: colors.textSecondary }]}>
                        {tierInfo.description}
                      </Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.tierPrice, { color: colors.text }]}>
                          ${planForInterval.price.toFixed(2)} CAD
                        </Text>
                        <Text style={[styles.tierBillingInterval, { color: colors.textSecondary }]}>
                          /{formatBillingInterval(planForInterval.billingInterval)}
                        </Text>
                      </View>
                      {showSavingsBadge && savingsPercent > 0 && (
                        <View style={[styles.savingsBadge, { backgroundColor: colors.success + '20' }]}>
                          <Text style={[styles.savingsText, { color: colors.success || NestSyncColors.semantic.success }]}>
                            Save {savingsPercent}% with annual billing
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isCurrent && (
                      <Button
                        title={isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Switch'}
                        onPress={() => handleChangePlan(planForInterval.id)}
                        variant="primary"
                        size="small"
                        disabled={changingPlan}
                        loading={changingPlan}
                        accessibilityLabel={`Switch to ${tierInfo.name} plan`}
                      />
                    )}
                  </View>

                  {/* Features List */}
                  <View style={styles.planFeatures}>
                    {planForInterval.features.slice(0, 4).map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={18}
                          color={tierInfo.color}
                        />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                          {formatFeatureName(feature)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cancel Subscription */}
        {subscription.status !== 'CANCELLED' && (
          <View style={styles.cancelSection}>
            <Button
              title="Cancel Subscription"
              onPress={() => setShowCancelConfirmation(true)}
              variant="danger"
              size="medium"
              fullWidth
              accessibilityLabel="Cancel subscription"
            />

            {cancellationPreview && (
              <Text style={[styles.cancelInfo, { color: colors.textSecondary }]}>
                {cancellationPreview.refundEligible
                  ? `You're eligible for a refund of $${cancellationPreview.refundAmount?.toFixed(2)} CAD`
                  : `Your access will continue until ${format(
                      new Date(cancellationPreview.accessUntil),
                      'MMM d, yyyy'
                    )}`}
              </Text>
            )}
          </View>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirmation && (
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Cancel Subscription?
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Are you sure you want to cancel your subscription? You&apos;ll lose access to premium features at the end of your billing period.
              </Text>

              <ButtonGroup direction="row" gap={12}>
                <Button
                  title="Keep Subscription"
                  onPress={() => setShowCancelConfirmation(false)}
                  variant="secondary"
                  size="medium"
                  style={{ flex: 1 }}
                />

                <Button
                  title="Cancel Subscription"
                  onPress={handleCancelSubscription}
                  variant="danger"
                  size="medium"
                  disabled={cancellingSubscription}
                  loading={cancellingSubscription}
                  style={{ flex: 1, backgroundColor: colors.error, borderColor: colors.error }}
                  textStyle={{ color: '#FFFFFF' }}
                />
              </ButtonGroup>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  </>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  startTrialButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startTrialButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    minHeight: 44,
  },
  backButton: {
    padding: 12, // 3 × 4px base unit (updated from 10px for better touch target)
    marginRight: 12, // 3 × 4px base unit (updated from 8px)
    minHeight: 48, // WCAG AA minimum touch target
    minWidth: 48, // WCAG AA minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    letterSpacing: -0.01,
  },
  currentSubscriptionCard: {
    padding: 20, // 5 × 4px base unit
    borderRadius: 16, // XLarge border radius for large cards
    marginBottom: 24, // 6 × 4px base unit
    // Shadow for depth and elevation
    boxShadow: '0px 2px 4px rgba(NaN, 186, NaN, 0.1)',
    elevation: 2, // Android shadow
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planPrice: {
    fontSize: 16,
    marginTop: 4,
  },
  taxInfo: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12, // 3 × 4px base unit
    paddingVertical: 6, // 1.5 × 4px base unit (acceptable for badges)
    borderRadius: 12, // Large border radius
    minHeight: 32, // Adequate for badge, not a primary touch target
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // 3 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 8px)
    marginBottom: 12, // 3 × 4px base unit
    gap: 8, // 2 × 4px base unit
  },
  trialText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  coolingOffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // 3 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 8px)
    marginBottom: 12, // 3 × 4px base unit
    gap: 8, // 2 × 4px base unit
  },
  coolingOffText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  billingToggleContainer: {
    flexDirection: 'row',
    padding: 4, // 1 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 10px)
    marginBottom: 20, // 5 × 4px base unit
  },
  billingToggleButton: {
    flex: 1,
    paddingVertical: 12, // 3 × 4px base unit (updated from 10px)
    paddingHorizontal: 16, // 4 × 4px base unit
    borderRadius: 8, // Medium border radius
    alignItems: 'center',
    minHeight: 48, // WCAG AA minimum touch target
  },
  billingToggleText: {
    fontSize: 14, // Body size (updated from 15px to match design system)
    fontWeight: '600',
  },
  tierCard: {
    padding: 20, // 5 × 4px base unit
    borderRadius: 16, // XLarge border radius for large cards
    marginBottom: 16, // 4 × 4px base unit
    // Shadow for depth and elevation
    boxShadow: '0px 2px 4px rgba(NaN, 186, NaN, 0.1)',
    elevation: 2, // Android shadow
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tierCardInfo: {
    flex: 1,
    marginRight: 12,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // 3 × 4px base unit
    marginBottom: 8, // 2 × 4px base unit (updated from 6px)
  },
  tierName: {
    fontSize: 20, // Title size (updated from 22px to match design system)
    fontWeight: 'bold',
  },
  tierDescription: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  tierPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tierBillingInterval: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsBadge: {
    paddingHorizontal: 12, // 3 × 4px base unit (updated from 10px)
    paddingVertical: 6, // 1.5 × 4px base unit (updated from 5px)
    borderRadius: 6, // Small border radius for badges
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 12, // Small size (updated from 13px to match design system)
    fontWeight: '600',
  },
  planCard: {
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius for cards
    marginBottom: 12, // 3 × 4px base unit
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planCardInfo: {
    flex: 1,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planCardPrice: {
    fontSize: 14,
    marginTop: 4,
  },
  currentBadge: {
    paddingHorizontal: 12, // 3 × 4px base unit
    paddingVertical: 6, // 1.5 × 4px base unit (acceptable for badges)
    borderRadius: 12, // Large border radius
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  changePlanButton: {
    paddingHorizontal: 16, // 4 × 4px base unit
    paddingVertical: 12, // 3 × 4px base unit (updated from 8px for better touch target)
    borderRadius: 12, // Large border radius (updated from 8px)
    minHeight: 48, // WCAG AA minimum touch target
  },
  changePlanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  planFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8, // 2 × 4px base unit (updated from 10px)
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  cancelSection: {
    marginTop: 16,
  },
  cancelButton: {
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius for buttons
    alignItems: 'center',
    minHeight: 48, // WCAG AA minimum touch target
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20, // 5 × 4px base unit
    padding: 24, // 6 × 4px base unit
    borderRadius: 16, // XLarge border radius for modals
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius for buttons
    alignItems: 'center',
    minHeight: 48, // WCAG AA minimum touch target
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
