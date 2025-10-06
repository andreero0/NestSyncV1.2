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
import { Colors } from '@/constants/Colors';
import {
  useMySubscription,
  useSubscriptionPlans,
  useChangeSubscriptionPlan,
  useCancelSubscriptionPremium,
  useCancellationPreview,
} from '@/lib/hooks/useSubscription';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
  const { cancellationPreview, loading: previewLoading } = useCancellationPreview();

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const handleChangePlan = async (newPlanId: string) => {
    try {
      const result = await changePlan({
        newPlanId,
        effectiveDate: 'immediate', // or 'next_billing_cycle'
      });

      if (result.success) {
        Alert.alert(
          'Plan Changed',
          result.message || 'Your subscription plan has been updated successfully.',
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
        immediate: false, // Cancel at period end
        reason: 'USER_REQUESTED',
      });

      if (result.success) {
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
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
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
          <Pressable
            onPress={() => router.push('/(subscription)/trial-activation')}
            style={({ pressed }) => [
              styles.startTrialButton,
              { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.startTrialButtonText}>Start Free Trial</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const statusColors = {
    ACTIVE: colors.success || '#10B981',
    TRIALING: colors.info || '#3B82F6',
    PAST_DUE: colors.warning || '#F59E0B',
    CANCELLED: colors.error,
    INCOMPLETE: colors.warning || '#F59E0B',
  };

  const currentPlan = availablePlans?.find(p => p.id === subscription.plan.id);
  const groupedPlans = availablePlans ? groupPlansByTier(availablePlans) : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Subscription",
          headerBackTitle: "Settings"
        }}
      />
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
            My Subscription
          </Text>
        </View>

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

          {/* Trial Banner */}
          {subscription.isOnTrial && subscription.trialEnd && (
            <View style={[styles.trialBanner, { backgroundColor: colors.info + '20' }]}>
              <IconSymbol name="clock.fill" size={20} color={colors.info || '#3B82F6'} />
              <Text style={[styles.trialText, { color: colors.info || '#3B82F6' }]}>
                Trial ends {format(new Date(subscription.trialEnd), 'MMM d, yyyy')}
              </Text>
            </View>
          )}

          {/* Cooling-Off Period */}
          {subscription.isInCoolingOffPeriod && subscription.coolingOffEnd && (
            <View style={[styles.coolingOffBanner, { backgroundColor: colors.success + '20' }]}>
              <IconSymbol name="shield.checkmark.fill" size={20} color={colors.success || '#10B981'} />
              <Text style={[styles.coolingOffText, { color: colors.success || '#10B981' }]}>
                Cooling-off period ends {format(new Date(subscription.coolingOffEnd), 'MMM d, yyyy')}
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
                          <View style={[styles.currentBadge, { backgroundColor: colors.tint }]}>
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
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
                          <Text style={[styles.savingsText, { color: colors.success || '#10B981' }]}>
                            Save {savingsPercent}% with annual billing
                          </Text>
                        </View>
                      )}
                    </View>

                    {!isCurrent && (
                      <Pressable
                        onPress={() => handleChangePlan(planForInterval.id)}
                        disabled={changingPlan}
                        style={({ pressed }) => [
                          styles.changePlanButton,
                          {
                            backgroundColor: colors.tint,
                            opacity: pressed ? 0.8 : changingPlan ? 0.6 : 1,
                          },
                        ]}
                        accessibilityLabel={`Switch to ${tierInfo.name} plan`}
                        accessibilityRole="button"
                      >
                        <Text style={styles.changePlanButtonText}>
                          {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Switch'}
                        </Text>
                      </Pressable>
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
            <Pressable
              onPress={() => setShowCancelConfirmation(true)}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: colors.error,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel="Cancel subscription"
              accessibilityRole="button"
            >
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancel Subscription
              </Text>
            </Pressable>

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

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowCancelConfirmation(false)}
                  style={({ pressed }) => [
                    styles.modalButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Keep Subscription
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCancelSubscription}
                  disabled={cancellingSubscription}
                  style={({ pressed }) => [
                    styles.modalButton,
                    {
                      backgroundColor: colors.error,
                      opacity: pressed ? 0.8 : cancellingSubscription ? 0.6 : 1,
                    },
                  ]}
                >
                  {cancellingSubscription ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                      Cancel Subscription
                    </Text>
                  )}
                </Pressable>
              </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  currentSubscriptionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
  },
  coolingOffBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  coolingOffText: {
    fontSize: 14,
    fontWeight: '600',
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
    padding: 4,
    borderRadius: 10,
    marginBottom: 20,
  },
  billingToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  billingToggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tierCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
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
    gap: 12,
    marginBottom: 6,
  },
  tierName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  tierDescription: {
    fontSize: 14,
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  changePlanButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  cancelSection: {
    marginTop: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
    margin: 20,
    padding: 24,
    borderRadius: 16,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
