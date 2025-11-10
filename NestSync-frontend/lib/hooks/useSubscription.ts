/**
 * Premium Subscription Custom Hooks
 * React hooks for managing subscription state and operations
 * Integrates with Apollo GraphQL client and NestSync backend
 */

import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { useState, useEffect } from 'react';
import {
  GET_AVAILABLE_PLANS,
  GET_MY_SUBSCRIPTION,
  GET_MY_TRIAL_PROGRESS,
  GET_MY_PAYMENT_METHODS,
  GET_MY_BILLING_HISTORY,
  GET_MY_FEATURE_ACCESS,
  CHECK_FEATURE_ACCESS,
  CALCULATE_TAX,
  GET_TAX_RATES,
  START_TRIAL,
  SUBSCRIBE,
  CHANGE_SUBSCRIPTION_PLAN,
  CANCEL_SUBSCRIPTION_PREMIUM,
  ADD_PAYMENT_METHOD,
  REMOVE_PAYMENT_METHOD,
  SET_DEFAULT_PAYMENT_METHOD,
  TRACK_TRIAL_EVENT,
  REQUEST_REFUND,
  UPDATE_BILLING_PROVINCE,
  SYNC_FEATURE_ACCESS,
  GET_CANCELLATION_PREVIEW,
} from '../graphql/subscriptionOperations';
import type {
  AvailablePlansResponse,
  PremiumSubscription,
  TrialProgress,
  PaymentMethod,
  BillingHistoryResponse,
  FeatureAccess,
  TaxCalculationResponse,
  TaxRate,
  SubscriptionTier,
  CanadianProvince,
  StartTrialInput,
  SubscribeInput,
  ChangeSubscriptionPlanInput,
  CancelSubscriptionInput,
  AddPaymentMethodInput,
  TrackTrialEventInput,
  RequestRefundInput,
} from '../../types/subscription';

// =============================================================================
// SUBSCRIPTION PLANS HOOKS
// =============================================================================

/**
 * Hook: Get available subscription plans
 */
export function useSubscriptionPlans() {
  console.log('[useSubscriptionPlans] Hook called');

  const { data, loading, error, refetch } = useQuery<{ availablePlans: AvailablePlansResponse }>(
    GET_AVAILABLE_PLANS,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  console.log('[useSubscriptionPlans] Query state:', {
    hasData: !!data,
    loading,
    hasError: !!error,
    plansCount: data?.availablePlans?.plans?.length || 0,
    currentTier: data?.availablePlans?.currentTier
  });

  if (error) {
    console.error('[useSubscriptionPlans] GraphQL Error:', {
      message: error.message,
      graphQLErrors: error.graphQLErrors,
      networkError: error.networkError
    });
  }

  return {
    plans: data?.availablePlans?.plans || [],
    currentTier: data?.availablePlans?.currentTier,
    recommendedPlan: data?.availablePlans?.recommendedPlan,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Get current user subscription
 */
export function useMySubscription() {
  const { data, loading, error, refetch } = useQuery<{ mySubscription: PremiumSubscription | null }>(
    GET_MY_SUBSCRIPTION,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    subscription: data?.mySubscription,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// TRIAL SYSTEM HOOKS
// =============================================================================

/**
 * Hook: Get trial progress
 */
export function useTrialProgress() {
  const { data, loading, error, refetch } = useQuery<{ myTrialProgress: TrialProgress | null }>(
    GET_MY_TRIAL_PROGRESS,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    trialProgress: data?.myTrialProgress,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Start trial mutation
 */
export function useStartTrial() {
  const [startTrialMutation, { data, loading, error }] = useMutation(START_TRIAL, {
    refetchQueries: [
      { query: GET_MY_TRIAL_PROGRESS },
      { query: GET_MY_SUBSCRIPTION },
      { query: GET_MY_FEATURE_ACCESS },
    ],
  });

  const startTrial = async (input: StartTrialInput) => {
    try {
      const result = await startTrialMutation({ variables: { input } });
      return result.data?.startTrial;
    } catch (err) {
      throw err;
    }
  };

  return {
    startTrial,
    data: data?.startTrial,
    loading,
    error,
  };
}

/**
 * Hook: Track trial event mutation
 */
export function useTrackTrialEvent() {
  const [trackEventMutation, { loading, error }] = useMutation(TRACK_TRIAL_EVENT);

  const trackEvent = async (input: TrackTrialEventInput) => {
    try {
      const result = await trackEventMutation({ variables: { input } });
      return result.data?.trackTrialEvent;
    } catch (err) {
      throw err;
    }
  };

  return {
    trackEvent,
    loading,
    error,
  };
}

// =============================================================================
// PAYMENT METHODS HOOKS
// =============================================================================

/**
 * Hook: Get payment methods
 */
export function usePaymentMethods() {
  const { data, loading, error, refetch } = useQuery<{ myPaymentMethods: PaymentMethod[] }>(
    GET_MY_PAYMENT_METHODS,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    paymentMethods: data?.myPaymentMethods || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Get payment methods (alias for compatibility)
 */
export const useMyPaymentMethods = usePaymentMethods;

// =============================================================================
// COMPATIBILITY ALIASES (for screen imports)
// =============================================================================

/**
 * Alias: useAvailablePlans → useSubscriptionPlans
 */
export const useAvailablePlans = useSubscriptionPlans;

/**
 * Alias: useMyBillingHistory → useBillingHistory
 */
export const useMyBillingHistory = useBillingHistory;

/**
 * Alias: useCancelSubscriptionPremium → useCancelSubscription
 */
export const useCancelSubscriptionPremium = useCancelSubscription;

/**
 * Alias: useCheckFeatureAccess → useFeatureAccess
 */
export const useCheckFeatureAccess = useFeatureAccess;

/**
 * Alias: useDownloadInvoice (placeholder - needs backend implementation)
 */
export function useDownloadInvoice() {
  const downloadInvoice = async (recordId: string) => {
    // TODO: Implement GraphQL mutation for invoice download
    // For now, return mock response
    return {
      success: true,
      invoiceUrl: `https://billing.stripe.com/invoice/${recordId}`,
    };
  };

  return {
    downloadInvoice,
    loading: false,
    error: null,
  };
}

/**
 * Hook: Add payment method mutation
 */
export function useAddPaymentMethod() {
  const [addPaymentMethodMutation, { data, loading, error }] = useMutation(ADD_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_MY_PAYMENT_METHODS }],
  });

  const addPaymentMethod = async (input: AddPaymentMethodInput) => {
    try {
      const result = await addPaymentMethodMutation({ variables: { input } });
      return result.data?.addPaymentMethod;
    } catch (err) {
      throw err;
    }
  };

  return {
    addPaymentMethod,
    data: data?.addPaymentMethod,
    loading,
    error,
  };
}

/**
 * Hook: Remove payment method mutation
 */
export function useRemovePaymentMethod() {
  const [removePaymentMethodMutation, { loading, error }] = useMutation(REMOVE_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_MY_PAYMENT_METHODS }],
  });

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const result = await removePaymentMethodMutation({ variables: { paymentMethodId } });
      return result.data?.removePaymentMethod;
    } catch (err) {
      throw err;
    }
  };

  return {
    removePaymentMethod,
    loading,
    error,
  };
}

/**
 * Hook: Set default payment method mutation
 */
export function useSetDefaultPaymentMethod() {
  const [setDefaultMutation, { loading, error }] = useMutation(SET_DEFAULT_PAYMENT_METHOD, {
    refetchQueries: [{ query: GET_MY_PAYMENT_METHODS }],
  });

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const result = await setDefaultMutation({ variables: { paymentMethodId } });
      return result.data?.setDefaultPaymentMethod;
    } catch (err) {
      throw err;
    }
  };

  return {
    setDefaultPaymentMethod,
    loading,
    error,
  };
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook: Subscribe mutation (convert trial or new subscription)
 */
export function useSubscribe() {
  const [subscribeMutation, { data, loading, error }] = useMutation(SUBSCRIBE, {
    refetchQueries: [
      { query: GET_MY_SUBSCRIPTION },
      { query: GET_MY_TRIAL_PROGRESS },
      { query: GET_MY_FEATURE_ACCESS },
    ],
  });

  const subscribe = async (input: SubscribeInput) => {
    try {
      const result = await subscribeMutation({ variables: { input } });
      return result.data?.subscribe;
    } catch (err) {
      throw err;
    }
  };

  return {
    subscribe,
    data: data?.subscribe,
    loading,
    error,
  };
}

/**
 * Hook: Change subscription plan mutation
 */
export function useChangeSubscriptionPlan() {
  const [changePlanMutation, { data, loading, error }] = useMutation(CHANGE_SUBSCRIPTION_PLAN, {
    refetchQueries: [
      { query: GET_MY_SUBSCRIPTION },
      { query: GET_MY_FEATURE_ACCESS },
    ],
  });

  const changePlan = async (input: ChangeSubscriptionPlanInput) => {
    try {
      const result = await changePlanMutation({ variables: { input } });
      return result.data?.changeSubscriptionPlan;
    } catch (err) {
      throw err;
    }
  };

  return {
    changePlan,
    data: data?.changeSubscriptionPlan,
    loading,
    error,
  };
}

/**
 * Hook: Cancel subscription mutation
 */
export function useCancelSubscription() {
  const [cancelMutation, { data, loading, error }] = useMutation(CANCEL_SUBSCRIPTION_PREMIUM, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const cancelSubscriptionPremium = async (variables: { input: CancelSubscriptionInput }) => {
    try {
      const result = await cancelMutation({ variables });
      return result.data?.cancelSubscriptionPremium;
    } catch (err) {
      throw err;
    }
  };

  return {
    cancelSubscriptionPremium,
    data: data?.cancelSubscriptionPremium,
    loading,
    error,
  };
}

/**
 * Hook: Request refund mutation
 */
export function useRequestRefund() {
  const [requestRefundMutation, { data, loading, error }] = useMutation(REQUEST_REFUND, {
    refetchQueries: [
      { query: GET_MY_SUBSCRIPTION },
      { query: GET_MY_BILLING_HISTORY, variables: { page: 1, pageSize: 20 } },
    ],
  });

  const requestRefund = async (input: RequestRefundInput) => {
    try {
      const result = await requestRefundMutation({ variables: { input } });
      return result.data?.requestRefund;
    } catch (err) {
      throw err;
    }
  };

  return {
    requestRefund,
    data: data?.requestRefund,
    loading,
    error,
  };
}

/**
 * Hook: Get cancellation preview
 */
export function useCancellationPreview() {
  const { data, loading, error, refetch } = useQuery(GET_CANCELLATION_PREVIEW, {
    fetchPolicy: 'network-only',
  });

  return {
    preview: data?.cancellationPreview,
    loading,
    error,
    refetch,
  };
}

// =============================================================================
// BILLING HISTORY HOOKS
// =============================================================================

/**
 * Hook: Get billing history with pagination
 */
export function useBillingHistory(page: number = 1, pageSize: number = 20) {
  const { data, loading, error, refetch, fetchMore } = useQuery<{
    myBillingHistory: BillingHistoryResponse;
  }>(GET_MY_BILLING_HISTORY, {
    variables: { page, pageSize },
    fetchPolicy: 'cache-and-network',
  });

  const loadMore = () => {
    if (!data?.myBillingHistory) return;

    const currentPage = data.myBillingHistory.page;
    const totalPages = data.myBillingHistory.totalPages;

    if (currentPage < totalPages) {
      fetchMore({
        variables: { page: currentPage + 1, pageSize },
      });
    }
  };

  return {
    records: data?.myBillingHistory?.records || [],
    totalRecords: data?.myBillingHistory?.totalRecords || 0,
    page: data?.myBillingHistory?.page || 1,
    pageSize: data?.myBillingHistory?.pageSize || 20,
    totalPages: data?.myBillingHistory?.totalPages || 0,
    hasMore: (data?.myBillingHistory?.page || 0) < (data?.myBillingHistory?.totalPages || 0),
    loading,
    error,
    refetch,
    loadMore,
  };
}

// =============================================================================
// FEATURE ACCESS HOOKS
// =============================================================================

/**
 * Hook: Check feature access
 */
export function useFeatureAccess(featureId: string) {
  const { data, loading, error, refetch } = useQuery<{ checkFeatureAccess: FeatureAccess }>(
    CHECK_FEATURE_ACCESS,
    {
      variables: { featureId },
      fetchPolicy: 'cache-first',
      skip: !featureId,
    }
  );

  return {
    hasAccess: data?.checkFeatureAccess?.hasAccess || false,
    featureAccess: data?.checkFeatureAccess,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Get all feature access records
 */
export function useAllFeatureAccess() {
  const { data, loading, error, refetch } = useQuery<{ myFeatureAccess: FeatureAccess[] }>(
    GET_MY_FEATURE_ACCESS,
    {
      fetchPolicy: 'cache-and-network',
    }
  );

  return {
    featureAccessRecords: data?.myFeatureAccess || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Sync feature access mutation
 */
export function useSyncFeatureAccess() {
  const [syncMutation, { data, loading, error }] = useMutation(SYNC_FEATURE_ACCESS, {
    refetchQueries: [{ query: GET_MY_FEATURE_ACCESS }],
  });

  const syncFeatureAccess = async () => {
    try {
      const result = await syncMutation();
      return result.data?.syncFeatureAccess;
    } catch (err) {
      throw err;
    }
  };

  return {
    syncFeatureAccess,
    data: data?.syncFeatureAccess,
    loading,
    error,
  };
}

// =============================================================================
// CANADIAN TAX HOOKS
// =============================================================================

/**
 * Hook: Calculate tax for amount and province
 */
export function useCanadianTax(amount: number, province: CanadianProvince) {
  const { data, loading, error, refetch } = useQuery<{ calculateTax: TaxCalculationResponse }>(
    CALCULATE_TAX,
    {
      variables: { amount, province },
      fetchPolicy: 'cache-first',
      skip: !amount || !province,
    }
  );

  return {
    taxCalculation: data?.calculateTax,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Get all Canadian tax rates
 */
export function useTaxRates() {
  const { data, loading, error, refetch } = useQuery<{ taxRates: TaxRate[] }>(GET_TAX_RATES, {
    fetchPolicy: 'cache-first',
  });

  return {
    taxRates: data?.taxRates || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook: Update billing province mutation
 */
export function useUpdateBillingProvince() {
  const [updateProvinceMutation, { data, loading, error }] = useMutation(UPDATE_BILLING_PROVINCE, {
    refetchQueries: [{ query: GET_MY_SUBSCRIPTION }],
  });

  const updateProvince = async (province: CanadianProvince) => {
    try {
      const result = await updateProvinceMutation({ variables: { province } });
      return result.data?.updateBillingProvince;
    } catch (err) {
      throw err;
    }
  };

  return {
    updateProvince,
    data: data?.updateBillingProvince,
    loading,
    error,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook: Combined subscription status
 * Provides consolidated subscription and trial information
 */
export function useSubscriptionStatus() {
  const { subscription, loading: subscriptionLoading } = useMySubscription();
  const { trialProgress, loading: trialLoading } = useTrialProgress();
  const { plans, currentTier } = useSubscriptionPlans();

  const isOnTrial = trialProgress?.isActive || false;
  const isPaidSubscriber = subscription?.status === 'ACTIVE' && !isOnTrial;
  const hasActiveSubscription = isPaidSubscriber || isOnTrial;

  return {
    subscription,
    trialProgress,
    plans,
    currentTier,
    isOnTrial,
    isPaidSubscriber,
    hasActiveSubscription,
    loading: subscriptionLoading || trialLoading,
  };
}

/**
 * Hook: Feature gate wrapper
 * Simplified hook for feature gating in components
 *
 * SECURITY: Fails closed - blocks access if backend doesn't confirm access
 */
export function useFeatureGate(featureId: string) {
  const { hasAccess, featureAccess, loading, error } = useFeatureAccess(featureId);
  const { plans } = useSubscriptionPlans();

  // Timeout after 5 seconds - assume no access if query hangs
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setTimedOut(true);
        console.warn('[useFeatureGate] Feature check timed out for:', featureId);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [loading, featureId]);

  const recommendedPlan = featureAccess?.tierRequired
    ? plans.find((p) => p.tier === featureAccess.tierRequired)
    : null;

  // CRITICAL SECURITY: Fail closed, not open
  // Block access if user doesn't have access OR if still loading
  // Don't rely solely on tierRequired field from backend
  // If query times out or errors, assume no access (fail-closed security)
  const effectiveLoading = loading && !timedOut && !error;
  const upgradeRequired = !hasAccess || effectiveLoading;

  return {
    hasAccess,
    loading: effectiveLoading,
    featureAccess,
    recommendedPlan,
    upgradeRequired,
    error: error || (timedOut ? new Error('Feature check timed out') : null),
  };
}
