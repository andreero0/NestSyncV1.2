/**
 * Premium Subscription GraphQL Operations
 * Complete integration with NestSync backend Premium Subscription System
 *
 * Includes all 25 GraphQL resolvers:
 * - Subscription Plans (2 queries)
 * - Trial System (3 operations)
 * - Payment Methods (3 operations)
 * - Subscription Management (5 operations)
 * - Billing & Invoices (3 queries)
 * - Feature Access Control (3 operations)
 * - Canadian Tax System (3 queries)
 * - Compliance & Reporting (1 query)
 * - Administrative Operations (2 mutations)
 */

import { gql } from '@apollo/client';

// =============================================================================
// FRAGMENTS - Reusable GraphQL Fragments
// =============================================================================

export const PLAN_LIMITS_FRAGMENT = gql`
  fragment PlanLimitsFields on FeatureLimits {
    familyMembers
    reorderSuggestions
    priceAlerts
    automation
  }
`;

export const SUBSCRIPTION_PLAN_FRAGMENT = gql`
  ${PLAN_LIMITS_FRAGMENT}
  fragment SubscriptionPlanFields on PremiumSubscriptionPlan {
    id
    displayName
    tier
    price
    billingInterval
    features
    limits {
      ...PlanLimitsFields
    }
    stripeProductId
    stripePriceId
    isActive
    sortOrder
  }
`;

export const SUBSCRIPTION_FRAGMENT = gql`
  ${SUBSCRIPTION_PLAN_FRAGMENT}
  fragment SubscriptionFields on PremiumSubscription {
    id
    userId
    tier
    status
    billingInterval
    amount
    currency
    province
    stripeSubscriptionId
    stripeCustomerId
    trialStart
    trialEnd
    coolingOffEnd
    paymentConsentAt
    isOnTrial
    isInCoolingOffPeriod
    createdAt
    updatedAt
    plan {
      ...SubscriptionPlanFields
    }
  }
`;

export const TRIAL_PROGRESS_FRAGMENT = gql`
  fragment TrialProgressFields on TrialProgress {
    id
    userId
    trialTier
    trialStartedAt
    trialEndsAt
    daysRemaining
    isActive
    convertedToPaid
    convertedAt
    canceled
    engagementScore
    featuresUsedCount
    usageDays
    valueSavedEstimate
    createdAt
    updatedAt
  }
`;

export const PAYMENT_METHOD_FRAGMENT = gql`
  fragment PaymentMethodFields on PaymentMethod {
    id
    userId
    type
    cardBrand
    cardLast4
    cardExpMonth
    cardExpYear
    isDefault
    createdAt
    updatedAt
  }
`;

export const TAX_BREAKDOWN_FRAGMENT = gql`
  fragment TaxBreakdownFields on PremiumTaxBreakdown {
    gst
    pst
    hst
    qst
  }
`;

export const BILLING_RECORD_FRAGMENT = gql`
  ${TAX_BREAKDOWN_FRAGMENT}
  fragment BillingRecordFields on BillingRecord {
    id
    userId
    subscriptionId
    subtotal
    currency
    taxAmount
    totalAmount
    transactionType
    status
    description
    taxBreakdown {
      ...TaxBreakdownFields
    }
    invoiceNumber
    invoicePdfUrl
    receiptUrl
    createdAt
  }
`;

export const FEATURE_ACCESS_FRAGMENT = gql`
  fragment FeatureAccessFields on FeatureAccessResponse {
    featureId
    hasAccess
    tierRequired
    usageCount
    usageLimit
    upgradeRecommendation
  }
`;

// =============================================================================
// SUBSCRIPTION PLANS - 2 Queries
// =============================================================================

/**
 * Query 1: Get all available subscription plans with recommendations
 */
export const GET_AVAILABLE_PLANS = gql`
  ${SUBSCRIPTION_PLAN_FRAGMENT}
  query GetAvailablePlans {
    availablePlans {
      plans {
        ...SubscriptionPlanFields
      }
      currentTier
      recommendedPlan {
        ...SubscriptionPlanFields
      }
    }
  }
`;

/**
 * Query 2: Get specific subscription plan details
 */
export const GET_SUBSCRIPTION_PLAN = gql`
  ${SUBSCRIPTION_PLAN_FRAGMENT}
  query GetSubscriptionPlan($planId: String!) {
    subscriptionPlan(planId: $planId) {
      ...SubscriptionPlanFields
    }
  }
`;

// =============================================================================
// TRIAL SYSTEM - 3 Operations
// =============================================================================

/**
 * Mutation 3: Start 14-day free trial
 */
export const START_TRIAL = gql`
  ${TRIAL_PROGRESS_FRAGMENT}
  mutation StartTrial($input: StartTrialInput!) {
    startTrial(input: $input) {
      success
      trialProgress {
        ...TrialProgressFields
      }
      error
    }
  }
`;

/**
 * Mutation 4: Track trial feature usage events
 */
export const TRACK_TRIAL_EVENT = gql`
  mutation TrackTrialEvent($input: TrackTrialEventInput!) {
    trackTrialEvent(input: $input) {
      success
      message
      error
    }
  }
`;

/**
 * Query 5: Get current trial progress
 */
export const GET_MY_TRIAL_PROGRESS = gql`
  ${TRIAL_PROGRESS_FRAGMENT}
  query GetMyTrialProgress {
    myTrialProgress {
      ...TrialProgressFields
    }
  }
`;

// =============================================================================
// PAYMENT METHODS - 3 Operations
// =============================================================================

/**
 * Mutation 6: Add payment method to user account
 */
export const ADD_PAYMENT_METHOD = gql`
  ${PAYMENT_METHOD_FRAGMENT}
  mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
    addPaymentMethod(input: $input) {
      success
      paymentMethod {
        ...PaymentMethodFields
      }
      error
    }
  }
`;

/**
 * Mutation 7: Remove payment method
 */
export const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($paymentMethodId: ID!) {
    removePaymentMethod(paymentMethodId: $paymentMethodId) {
      success
      message
      error
    }
  }
`;

/**
 * Query 8: Get all saved payment methods
 */
export const GET_MY_PAYMENT_METHODS = gql`
  ${PAYMENT_METHOD_FRAGMENT}
  query GetMyPaymentMethods {
    myPaymentMethods {
      ...PaymentMethodFields
    }
  }
`;

// =============================================================================
// SUBSCRIPTION MANAGEMENT - 5 Operations
// =============================================================================

/**
 * Mutation 9: Subscribe to a plan (convert trial or new subscription)
 */
export const SUBSCRIBE = gql`
  ${SUBSCRIPTION_FRAGMENT}
  mutation Subscribe($input: SubscribeInput!) {
    subscribe(input: $input) {
      success
      subscription {
        ...SubscriptionFields
      }
      error
    }
  }
`;

/**
 * Mutation 10: Change subscription plan (upgrade/downgrade)
 */
export const CHANGE_SUBSCRIPTION_PLAN = gql`
  ${SUBSCRIPTION_FRAGMENT}
  mutation ChangeSubscriptionPlan($input: ChangeSubscriptionPlanInput!) {
    changeSubscriptionPlan(input: $input) {
      success
      subscription {
        ...SubscriptionFields
      }
      error
    }
  }
`;

/**
 * Mutation 11: Cancel subscription
 */
export const CANCEL_SUBSCRIPTION_PREMIUM = gql`
  ${SUBSCRIPTION_FRAGMENT}
  mutation CancelSubscriptionPremium($input: CancelSubscriptionInput!) {
    cancelSubscriptionPremium(input: $input) {
      success
      subscription {
        ...SubscriptionFields
      }
      message
      error
    }
  }
`;

/**
 * Mutation 12: Request refund during cooling-off period
 */
export const REQUEST_REFUND = gql`
  mutation RequestRefund($input: RequestRefundInput!) {
    requestRefund(input: $input) {
      success
      refundAmount
      currency
      refundStatus
      message
      error
    }
  }
`;

/**
 * Query 13: Get current user subscription
 */
export const GET_MY_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FRAGMENT}
  query GetMySubscription {
    mySubscription {
      ...SubscriptionFields
    }
  }
`;

/**
 * Query 14: Preview cancellation impact
 */
export const GET_CANCELLATION_PREVIEW = gql`
  query GetCancellationPreview {
    cancellationPreview {
      canCancel
      currentPeriodEnd
      refundEligible
      refundAmount
      accessUntil
      message
    }
  }
`;

// =============================================================================
// BILLING & INVOICES - 3 Queries
// =============================================================================

/**
 * Query 15: Get billing history with pagination
 */
export const GET_MY_BILLING_HISTORY = gql`
  ${BILLING_RECORD_FRAGMENT}
  query GetMyBillingHistory($page: Int, $pageSize: Int) {
    myBillingHistory(page: $page, pageSize: $pageSize) {
      records {
        ...BillingRecordFields
      }
      totalRecords
      page
      pageSize
      totalPages
    }
  }
`;

/**
 * Query 16: Get specific billing record details
 */
export const GET_BILLING_RECORD = gql`
  ${BILLING_RECORD_FRAGMENT}
  query GetBillingRecord($recordId: ID!) {
    billingRecord(recordId: $recordId) {
      ...BillingRecordFields
    }
  }
`;

/**
 * Query 17: Download invoice for billing record
 */
export const DOWNLOAD_INVOICE = gql`
  query DownloadInvoice($recordId: ID!) {
    downloadInvoice(recordId: $recordId) {
      invoiceUrl
      recordId
      expiresAt
    }
  }
`;

// =============================================================================
// FEATURE ACCESS CONTROL - 3 Operations
// =============================================================================

/**
 * Query 18: Check access to specific feature
 */
export const CHECK_FEATURE_ACCESS = gql`
  ${FEATURE_ACCESS_FRAGMENT}
  query CheckFeatureAccess($featureId: String!) {
    checkFeatureAccess(featureId: $featureId) {
      ...FeatureAccessFields
    }
  }
`;

/**
 * Query 19: Get all feature access records
 */
export const GET_MY_FEATURE_ACCESS = gql`
  ${FEATURE_ACCESS_FRAGMENT}
  query GetMyFeatureAccess {
    myFeatureAccess {
      ...FeatureAccessFields
    }
  }
`;

/**
 * Mutation 20: Sync feature access based on current subscription
 */
export const SYNC_FEATURE_ACCESS = gql`
  mutation SyncFeatureAccess {
    syncFeatureAccess {
      success
      message
      featuresGranted
      featuresRevoked
      error
    }
  }
`;

// =============================================================================
// CANADIAN TAX SYSTEM - 3 Queries
// =============================================================================

/**
 * Query 21: Calculate tax for amount and province
 */
export const CALCULATE_TAX = gql`
  query CalculateTax($amount: Float!, $province: CanadianProvince!) {
    calculateTax(amount: $amount, province: $province) {
      subtotal
      province
      taxBreakdown {
        gst
        pst
        hst
        qst
      }
      totalTax
      totalAmount
      taxType
      currency
    }
  }
`;

/**
 * Query 22: Get all Canadian provincial tax rates
 */
export const GET_TAX_RATES = gql`
  query GetTaxRates {
    taxRates {
      province
      provinceName
      gstRate
      pstRate
      hstRate
      qstRate
      combinedRate
      taxType
      effectiveFrom
      effectiveTo
    }
  }
`;

/**
 * Mutation 23: Update billing province
 */
export const UPDATE_BILLING_PROVINCE = gql`
  mutation UpdateBillingProvince($province: CanadianProvince!) {
    updateBillingProvince(province: $province) {
      success
      message
      newProvince
      newTaxRate
      error
    }
  }
`;

// =============================================================================
// COMPLIANCE & REPORTING - 1 Query
// =============================================================================

/**
 * Query 24: Generate PIPEDA compliance report
 */
export const GET_COMPLIANCE_REPORT = gql`
  query GetComplianceReport {
    complianceReport {
      userId
      reportGeneratedAt
      dataRetentionPeriodDays
      subscriptionData {
        subscriptionId
        planId
        status
        createdAt
        dataStoredInCanada
      }
      paymentData {
        paymentMethodCount
        lastPaymentDate
        pciCompliant
      }
      consentRecords {
        paymentConsentGranted
        paymentConsentDate
        dataProcessingConsent
      }
    }
  }
`;

// =============================================================================
// ADMINISTRATIVE OPERATIONS - 1 Mutation
// =============================================================================

/**
 * Mutation 25: Set default payment method
 */
export const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($paymentMethodId: ID!) {
    setDefaultPaymentMethod(paymentMethodId: $paymentMethodId) {
      success
      message
      error
    }
  }
`;
