/**
 * Premium Subscription TypeScript Interfaces
 * Generated from backend SQLAlchemy models for Premium Upgrade Flow
 *
 * PIPEDA Compliance: Canadian subscription management types
 * - Subscription plans with CAD pricing
 * - Payment methods with Stripe integration
 * - Trial tracking and feature access
 * - Canadian tax calculations
 */

// =============================================================================
// Enums
// =============================================================================

export enum SubscriptionTier {
  FREE = 'free',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum TransactionType {
  SUBSCRIPTION_CHARGE = 'subscription_charge',
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  REFUND = 'refund',
  TRIAL_CONVERSION = 'trial_conversion',
  RENEWAL = 'renewal',
  CANCELLATION_FEE = 'cancellation_fee',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

export enum PaymentMethodType {
  CARD = 'card',
}

export enum FeatureAccessSource {
  SUBSCRIPTION = 'subscription',
  TRIAL = 'trial',
  PROMO = 'promo',
  LIFETIME = 'lifetime',
  ADMIN_GRANT = 'admin_grant',
}

export enum TrialEventType {
  FEATURE_USED = 'feature_used',
  VALUE_SAVED = 'value_saved',
  PROMPT_SHOWN = 'prompt_shown',
  PROMPT_CLICKED = 'prompt_clicked',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
  TRIAL_CONVERTED = 'trial_converted',
  TRIAL_CANCELED = 'trial_canceled',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNKNOWN = 'unknown',
}

export enum CanadianProvince {
  ON = 'ON',
  QC = 'QC',
  BC = 'BC',
  AB = 'AB',
  SK = 'SK',
  MB = 'MB',
  NS = 'NS',
  NB = 'NB',
  PE = 'PE',
  NL = 'NL',
  NT = 'NT',
  YT = 'YT',
  NU = 'NU',
}

export enum TaxType {
  GST_PST = 'GST+PST',
  HST = 'HST',
  GST_QST = 'GST+QST',
  GST = 'GST',
}

// =============================================================================
// Core Subscription Types
// =============================================================================

/**
 * Subscription Plan definition
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  tier: SubscriptionTier;
  price: number;
  billingInterval: BillingInterval;
  features: string[];
  limits: {
    familyMembers: number;
    reorderSuggestions: number;
    priceAlerts: boolean;
    automation: boolean;
  };
  description?: string;
  sortOrder: number;
  isActive: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Subscription
 */
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  amount: number;
  currency: string;
  province: CanadianProvince;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialStart?: string;
  trialEnd?: string;
  coolingOffEnd?: string;
  paymentConsentAt?: string;
  isOnTrial: boolean;
  isInCoolingOffPeriod: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment Method
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  stripeCustomerId: string;
  type: PaymentMethodType;
  cardBrand?: CardBrand;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Billing History Record
 */
export interface BillingHistory {
  id: string;
  userId: string;
  subscriptionId?: string;
  transactionType: TransactionType;
  description: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  province?: CanadianProvince;
  gstAmount?: number;
  pstAmount?: number;
  hstAmount?: number;
  qstAmount?: number;
  taxRate?: number;
  paymentMethodId?: string;
  status: TransactionStatus;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
  periodStart?: string;
  periodEnd?: string;
  refunded: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Canadian Tax Rate
 */
export interface CanadianTaxRate {
  id: string;
  province: CanadianProvince;
  provinceName: string;
  gstRate?: number;
  pstRate?: number;
  hstRate?: number;
  qstRate?: number;
  combinedRate: number;
  taxType: TaxType;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tax Calculation Result
 */
export interface TaxCalculation {
  subtotal: number;
  gstAmount: number;
  pstAmount: number;
  hstAmount: number;
  qstAmount: number;
  totalTax: number;
  totalAmount: number;
}

// =============================================================================
// Trial and Feature Access Types
// =============================================================================

/**
 * Trial Progress Tracking
 */
export interface TrialProgress {
  id: string;
  userId: string;
  subscriptionId?: string;
  isActive: boolean;
  trialTier: SubscriptionTier;
  trialStartedAt: string;
  trialEndsAt: string;
  daysRemaining: number;
  convertedToPaid: boolean;
  convertedAt?: string;
  conversionPlanId?: string;
  canceled: boolean;
  canceledAt?: string;
  cancellationReason?: string;
  featuresUsedCount: number;
  usageDays: number;
  valueSavedEstimate?: number;
  familySharingUsed: boolean;
  reorderSuggestionsUsed: boolean;
  analyticsViewed: boolean;
  priceAlertsUsed: boolean;
  automationUsed: boolean;
  lastActivityAt?: string;
  engagementScore?: number;
  softPromptsShown: number;
  lastPromptShownAt?: string;
  upgradePromptClicked: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Trial Usage Event
 */
export interface TrialUsageEvent {
  id: string;
  trialProgressId: string;
  userId: string;
  eventType: TrialEventType;
  featureUsed?: string;
  eventDescription?: string;
  valueSaved?: number;
  timeSavedMinutes?: number;
  screen?: string;
  context?: Record<string, any>;
  createdAt: string;
}

/**
 * Feature Access Control
 */
export interface FeatureAccess {
  id: string;
  userId: string;
  subscriptionId?: string;
  featureId: string;
  featureName: string;
  tierRequired: SubscriptionTier;
  hasAccess: boolean;
  accessSource: FeatureAccessSource;
  usageLimit?: number;
  usageCount: number;
  limitResetAt?: string;
  accessGrantedAt: string;
  accessExpiresAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// GraphQL Input Types
// =============================================================================

/**
 * Start Trial Input
 * IMPORTANT: Must match backend schema exactly
 * Backend expects: { tier: SubscriptionTier!, province: CanadianProvince! }
 */
export interface StartTrialInput {
  tier: SubscriptionTier;
  province: CanadianProvince;
}

/**
 * Add Payment Method Input
 */
export interface AddPaymentMethodInput {
  stripePaymentMethodId: string;
  setAsDefault?: boolean;
}

/**
 * Subscribe Input
 */
export interface SubscribeInput {
  planId: string;
  paymentMethodId: string;
  province: CanadianProvince;
}

/**
 * Cancel Subscription Input
 */
export interface CancelSubscriptionInput {
  reason?: string;
  feedback?: string;
  requestRefund?: boolean;
}

/**
 * Update Payment Method Input
 */
export interface UpdatePaymentMethodInput {
  paymentMethodId: string;
  setAsDefault?: boolean;
}

/**
 * Track Trial Event Input
 */
export interface TrackTrialEventInput {
  eventType: TrialEventType;
  featureUsed?: string;
  valueSaved?: number;
  timeSavedMinutes?: number;
  screen?: string;
  context?: Record<string, any>;
}

// =============================================================================
// GraphQL Response Types
// =============================================================================

/**
 * Generic Success Response
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Subscription Response
 */
export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

/**
 * Trial Start Response
 */
export interface TrialStartResponse {
  success: boolean;
  trialProgress?: TrialProgress;
  subscription?: Subscription;
  error?: string;
}

/**
 * Payment Method Response
 */
export interface PaymentMethodResponse {
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}

/**
 * Billing History Response
 */
export interface BillingHistoryResponse {
  records: BillingHistory[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Available Plans Response
 */
export interface AvailablePlansResponse {
  plans: SubscriptionPlan[];
  currentTier: SubscriptionTier;
  recommendedPlan?: SubscriptionPlan;
}

/**
 * Trial Progress Response
 */
export interface TrialProgressResponse {
  trialProgress?: TrialProgress;
  usageEvents: TrialUsageEvent[];
  recommendedUpgrade?: SubscriptionPlan;
}

/**
 * Feature Access Response
 */
export interface FeatureAccessResponse {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  recommendedPlan?: SubscriptionPlan;
}

// =============================================================================
// UI Component Props Types
// =============================================================================

/**
 * Premium Upgrade Modal Props
 */
export interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  initialTier?: SubscriptionTier;
  contextualFeature?: string;
  onUpgradeSuccess?: (subscription: Subscription) => void;
}

/**
 * Plan Selection Card Props
 */
export interface PlanSelectionCardProps {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  showBadge?: boolean;
  badgeText?: string;
}

/**
 * Payment Method Card Props
 */
export interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  selected: boolean;
  onSelect: (paymentMethod: PaymentMethod) => void;
  onDelete?: (paymentMethod: PaymentMethod) => void;
  showDefault?: boolean;
}

/**
 * Trial Progress Banner Props
 */
export interface TrialProgressBannerProps {
  trialProgress: TrialProgress;
  onUpgradeClick: () => void;
  onDismiss?: () => void;
}

/**
 * Billing History Item Props
 */
export interface BillingHistoryItemProps {
  billingRecord: BillingHistory;
  onViewInvoice?: (billingRecord: BillingHistory) => void;
  onDownloadReceipt?: (billingRecord: BillingHistory) => void;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Subscription Summary for Dashboard
 */
export interface SubscriptionSummary {
  currentTier: SubscriptionTier;
  status: SubscriptionStatus;
  nextBillingDate?: string;
  nextBillingAmount?: number;
  isOnTrial: boolean;
  trialEndsAt?: string;
  daysRemainingInTrial?: number;
  canCancelWithRefund: boolean;
  coolingOffEndsAt?: string;
}

/**
 * Feature Limit Info
 */
export interface FeatureLimitInfo {
  featureId: string;
  featureName: string;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  isUnlimited: boolean;
  requiresUpgrade: boolean;
}

/**
 * Upgrade Recommendation
 */
export interface UpgradeRecommendation {
  fromTier: SubscriptionTier;
  toTier: SubscriptionTier;
  recommendedPlan: SubscriptionPlan;
  reason: string;
  benefits: string[];
  estimatedSavings?: number;
  confidenceScore: number;
}

/**
 * Price Breakdown for UI Display
 */
export interface PriceBreakdown {
  subtotal: number;
  taxBreakdown: {
    gst?: number;
    pst?: number;
    hst?: number;
    qst?: number;
  };
  totalTax: number;
  total: number;
  currency: string;
  billingInterval: BillingInterval;
  province: CanadianProvince;
}

// =============================================================================
// Export All Types
// =============================================================================

export type {
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  BillingHistory,
  CanadianTaxRate,
  TaxCalculation,
  TrialProgress,
  TrialUsageEvent,
  FeatureAccess,
  StartTrialInput,
  AddPaymentMethodInput,
  SubscribeInput,
  CancelSubscriptionInput,
  UpdatePaymentMethodInput,
  TrackTrialEventInput,
  SuccessResponse,
  SubscriptionResponse,
  TrialStartResponse,
  PaymentMethodResponse,
  BillingHistoryResponse,
  AvailablePlansResponse,
  TrialProgressResponse,
  FeatureAccessResponse,
  PremiumUpgradeModalProps,
  PlanSelectionCardProps,
  PaymentMethodCardProps,
  TrialProgressBannerProps,
  BillingHistoryItemProps,
  SubscriptionSummary,
  FeatureLimitInfo,
  UpgradeRecommendation,
  PriceBreakdown,
};
