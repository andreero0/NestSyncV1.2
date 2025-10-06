"""
GraphQL Premium Subscription Types for NestSync
PIPEDA-compliant Canadian subscription management

Comprehensive GraphQL types for premium subscription system:
- Subscription plans with Canadian pricing
- Trial activation and tracking
- Payment method management
- Billing history with tax breakdown
- Feature access control
"""

import strawberry
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


# =============================================================================
# Subscription Enums
# =============================================================================

@strawberry.enum
class SubscriptionTier(Enum):
    """Premium subscription tiers"""
    FREE = "free"
    STANDARD = "standard"
    PREMIUM = "premium"


@strawberry.enum
class PremiumSubscriptionStatus(Enum):
    """Premium subscription status"""
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"


@strawberry.enum
class BillingInterval(Enum):
    """Billing interval"""
    MONTHLY = "monthly"
    YEARLY = "yearly"


@strawberry.enum
class TransactionType(Enum):
    """Billing transaction types"""
    SUBSCRIPTION_CHARGE = "subscription_charge"
    UPGRADE = "upgrade"
    DOWNGRADE = "downgrade"
    REFUND = "refund"
    TRIAL_CONVERSION = "trial_conversion"
    RENEWAL = "renewal"
    CANCELLATION_FEE = "cancellation_fee"


@strawberry.enum
class TransactionStatus(Enum):
    """Transaction status"""
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELED = "canceled"


@strawberry.enum
class PaymentMethodType(Enum):
    """Payment method types"""
    CARD = "card"


@strawberry.enum
class CardBrand(Enum):
    """Credit card brands"""
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMEX = "amex"
    DISCOVER = "discover"
    DINERS = "diners"
    JCB = "jcb"
    UNKNOWN = "unknown"


@strawberry.enum
class CanadianProvince(Enum):
    """Canadian provinces and territories"""
    ON = "ON"
    QC = "QC"
    BC = "BC"
    AB = "AB"
    SK = "SK"
    MB = "MB"
    NS = "NS"
    NB = "NB"
    PE = "PE"
    NL = "NL"
    NT = "NT"
    YT = "YT"
    NU = "NU"


@strawberry.enum
class TaxType(Enum):
    """Canadian tax types"""
    GST_PST = "GST+PST"
    HST = "HST"
    GST_QST = "GST+QST"
    GST = "GST"


@strawberry.enum
class FeatureAccessSource(Enum):
    """Source of feature access"""
    SUBSCRIPTION = "subscription"
    TRIAL = "trial"
    PROMO = "promo"
    LIFETIME = "lifetime"
    ADMIN_GRANT = "admin_grant"


@strawberry.enum
class TrialEventType(Enum):
    """Trial event types"""
    FEATURE_USED = "feature_used"
    VALUE_SAVED = "value_saved"
    PROMPT_SHOWN = "prompt_shown"
    PROMPT_CLICKED = "prompt_clicked"
    TRIAL_STARTED = "trial_started"
    TRIAL_ENDED = "trial_ended"
    TRIAL_CONVERTED = "trial_converted"
    TRIAL_CANCELED = "trial_canceled"


# =============================================================================
# Subscription Plan Types
# =============================================================================

@strawberry.type
class FeatureLimits:
    """Feature limits for subscription plan"""
    family_members: int = strawberry.field(description="Maximum family members")
    reorder_suggestions: int = strawberry.field(description="Reorder suggestions limit (-1 = unlimited)")
    price_alerts: bool = strawberry.field(description="Price alerts enabled")
    automation: bool = strawberry.field(description="Automation features enabled")


@strawberry.type(name="PremiumSubscriptionPlan")
class PremiumSubscriptionPlan:
    """Premium subscription plan definition"""
    id: str = strawberry.field(description="Plan identifier")
    name: str = strawberry.field(description="Internal plan name")
    display_name: str = strawberry.field(description="User-facing plan name", name="displayName")
    tier: SubscriptionTier = strawberry.field(description="Subscription tier")
    price: float = strawberry.field(description="Plan price in CAD")
    billing_interval: BillingInterval = strawberry.field(description="Billing interval", name="billingInterval")
    features: List[str] = strawberry.field(description="Feature IDs included")
    limits: FeatureLimits = strawberry.field(description="Feature limits")
    description: Optional[str] = strawberry.field(default=None, description="Plan description")
    sort_order: int = strawberry.field(description="Display order", name="sortOrder")
    is_active: bool = strawberry.field(description="Plan available for new subscriptions", name="isActive")
    stripe_price_id: Optional[str] = strawberry.field(default=None, description="Stripe Price ID", name="stripePriceId")
    stripe_product_id: Optional[str] = strawberry.field(default=None, description="Stripe Product ID", name="stripeProductId")
    created_at: datetime = strawberry.field(description="Creation timestamp", name="createdAt")
    updated_at: datetime = strawberry.field(description="Update timestamp", name="updatedAt")


# =============================================================================
# Subscription Types
# =============================================================================

@strawberry.type
class PremiumSubscription:
    """User premium subscription"""
    id: str = strawberry.field(description="Subscription ID")
    user_id: str = strawberry.field(description="User ID", name="userId")
    plan: PremiumSubscriptionPlan = strawberry.field(description="Current plan")
    tier: SubscriptionTier = strawberry.field(description="Current tier")
    status: PremiumSubscriptionStatus = strawberry.field(description="Subscription status")
    billing_interval: BillingInterval = strawberry.field(description="Billing interval", name="billingInterval")
    amount: float = strawberry.field(description="Subscription amount CAD")
    currency: str = strawberry.field(description="Currency code")
    province: CanadianProvince = strawberry.field(description="Province for tax")
    stripe_customer_id: Optional[str] = strawberry.field(default=None, description="Stripe Customer ID", name="stripeCustomerId")
    stripe_subscription_id: Optional[str] = strawberry.field(default=None, description="Stripe Subscription ID", name="stripeSubscriptionId")
    trial_start: Optional[datetime] = strawberry.field(default=None, description="Trial start", name="trialStart")
    trial_end: Optional[datetime] = strawberry.field(default=None, description="Trial end", name="trialEnd")
    cooling_off_end: Optional[datetime] = strawberry.field(default=None, description="Cooling-off period end", name="coolingOffEnd")
    payment_consent_at: Optional[datetime] = strawberry.field(default=None, description="Payment consent timestamp", name="paymentConsentAt")
    is_on_trial: bool = strawberry.field(description="Currently on trial", name="isOnTrial")
    is_in_cooling_off_period: bool = strawberry.field(description="In cooling-off period", name="isInCoolingOffPeriod")
    created_at: datetime = strawberry.field(description="Creation timestamp", name="createdAt")
    updated_at: datetime = strawberry.field(description="Update timestamp", name="updatedAt")


# =============================================================================
# Payment Method Types
# =============================================================================

@strawberry.type
class PaymentMethod:
    """Payment method"""
    id: str = strawberry.field(description="Payment method ID")
    user_id: str = strawberry.field(description="User ID", name="userId")
    type: PaymentMethodType = strawberry.field(description="Payment method type")
    card_brand: Optional[CardBrand] = strawberry.field(default=None, description="Card brand", name="cardBrand")
    card_last4: Optional[str] = strawberry.field(default=None, description="Last 4 digits", name="cardLast4")
    card_exp_month: Optional[int] = strawberry.field(default=None, description="Expiration month", name="cardExpMonth")
    card_exp_year: Optional[int] = strawberry.field(default=None, description="Expiration year", name="cardExpYear")
    is_default: bool = strawberry.field(description="Default payment method", name="isDefault")
    is_active: bool = strawberry.field(description="Active status", name="isActive")
    created_at: datetime = strawberry.field(description="Creation timestamp", name="createdAt")
    updated_at: datetime = strawberry.field(description="Update timestamp", name="updatedAt")


# =============================================================================
# Billing History Types
# =============================================================================

@strawberry.type
class PremiumTaxBreakdown:
    """Canadian tax breakdown for premium subscriptions"""
    gst: Optional[float] = strawberry.field(default=None, description="GST amount")
    pst: Optional[float] = strawberry.field(default=None, description="PST amount")
    hst: Optional[float] = strawberry.field(default=None, description="HST amount")
    qst: Optional[float] = strawberry.field(default=None, description="QST amount")


@strawberry.type
class BillingRecord:
    """Billing history record"""
    id: str = strawberry.field(description="Billing record ID")
    user_id: str = strawberry.field(description="User ID", name="userId")
    subscription_id: Optional[str] = strawberry.field(default=None, description="Subscription ID", name="subscriptionId")
    transaction_type: TransactionType = strawberry.field(description="Transaction type", name="transactionType")
    description: str = strawberry.field(description="Transaction description")
    subtotal: float = strawberry.field(description="Subtotal before tax")
    tax_amount: float = strawberry.field(description="Total tax", name="taxAmount")
    total_amount: float = strawberry.field(description="Total charged", name="totalAmount")
    currency: str = strawberry.field(description="Currency code")
    province: Optional[CanadianProvince] = strawberry.field(default=None, description="Province")
    tax_breakdown: PremiumTaxBreakdown = strawberry.field(description="Tax breakdown", name="taxBreakdown")
    tax_rate: Optional[float] = strawberry.field(default=None, description="Tax rate", name="taxRate")
    status: TransactionStatus = strawberry.field(description="Transaction status")
    stripe_invoice_id: Optional[str] = strawberry.field(default=None, description="Stripe Invoice ID", name="stripeInvoiceId")
    refunded: bool = strawberry.field(description="Refunded flag")
    refund_amount: Optional[float] = strawberry.field(default=None, description="Refund amount", name="refundAmount")
    refund_reason: Optional[str] = strawberry.field(default=None, description="Refund reason", name="refundReason")
    invoice_number: Optional[str] = strawberry.field(default=None, description="Invoice number", name="invoiceNumber")
    invoice_pdf_url: Optional[str] = strawberry.field(default=None, description="Invoice PDF URL", name="invoicePdfUrl")
    receipt_url: Optional[str] = strawberry.field(default=None, description="Receipt URL", name="receiptUrl")
    created_at: datetime = strawberry.field(description="Transaction timestamp", name="createdAt")


# =============================================================================
# Tax Rate Types
# =============================================================================

@strawberry.type
class TaxRateInfo:
    """Canadian tax rate information"""
    province: CanadianProvince = strawberry.field(description="Province code")
    province_name: str = strawberry.field(description="Province name", name="provinceName")
    gst_rate: Optional[float] = strawberry.field(default=None, description="GST rate", name="gstRate")
    pst_rate: Optional[float] = strawberry.field(default=None, description="PST rate", name="pstRate")
    hst_rate: Optional[float] = strawberry.field(default=None, description="HST rate", name="hstRate")
    qst_rate: Optional[float] = strawberry.field(default=None, description="QST rate", name="qstRate")
    combined_rate: float = strawberry.field(description="Combined tax rate", name="combinedRate")
    tax_type: TaxType = strawberry.field(description="Tax type", name="taxType")


@strawberry.type
class TaxCalculation:
    """Tax calculation result"""
    subtotal: float = strawberry.field(description="Subtotal before tax")
    province: CanadianProvince = strawberry.field(description="Province")
    tax_breakdown: PremiumTaxBreakdown = strawberry.field(description="Tax breakdown", name="taxBreakdown")
    tax_type: TaxType = strawberry.field(description="Tax type", name="taxType")
    combined_rate: float = strawberry.field(description="Combined tax rate", name="combinedRate")
    total_tax: float = strawberry.field(description="Total tax", name="totalTax")
    total_amount: float = strawberry.field(description="Total amount", name="totalAmount")
    currency: str = strawberry.field(description="Currency code")


# =============================================================================
# Trial Progress Types
# =============================================================================

@strawberry.type
class TrialProgress:
    """Trial progress tracking"""
    id: str = strawberry.field(description="Trial progress ID")
    user_id: str = strawberry.field(description="User ID", name="userId")
    is_active: bool = strawberry.field(description="Trial active", name="isActive")
    trial_tier: SubscriptionTier = strawberry.field(description="Trial tier", name="trialTier")
    trial_started_at: datetime = strawberry.field(description="Trial start", name="trialStartedAt")
    trial_ends_at: datetime = strawberry.field(description="Trial end", name="trialEndsAt")
    days_remaining: int = strawberry.field(description="Days remaining", name="daysRemaining")
    converted_to_paid: bool = strawberry.field(description="Converted to paid", name="convertedToPaid")
    converted_at: Optional[datetime] = strawberry.field(default=None, description="Conversion timestamp", name="convertedAt")
    canceled: bool = strawberry.field(description="Trial canceled")
    features_used_count: int = strawberry.field(description="Features used count", name="featuresUsedCount")
    usage_days: int = strawberry.field(description="Usage days", name="usageDays")
    value_saved_estimate: Optional[float] = strawberry.field(default=None, description="Value saved CAD", name="valueSavedEstimate")
    engagement_score: Optional[int] = strawberry.field(default=None, description="Engagement score 0-100", name="engagementScore")
    created_at: datetime = strawberry.field(description="Creation timestamp", name="createdAt")
    updated_at: datetime = strawberry.field(description="Update timestamp", name="updatedAt")


@strawberry.type
class TrialUsageEvent:
    """Trial usage event"""
    id: str = strawberry.field(description="Event ID")
    trial_progress_id: str = strawberry.field(description="Trial progress ID", name="trialProgressId")
    user_id: str = strawberry.field(description="User ID", name="userId")
    event_type: TrialEventType = strawberry.field(description="Event type", name="eventType")
    feature_used: Optional[str] = strawberry.field(default=None, description="Feature used", name="featureUsed")
    event_description: Optional[str] = strawberry.field(default=None, description="Event description", name="eventDescription")
    value_saved: Optional[float] = strawberry.field(default=None, description="Value saved CAD", name="valueSaved")
    time_saved_minutes: Optional[int] = strawberry.field(default=None, description="Time saved minutes", name="timeSavedMinutes")
    screen: Optional[str] = strawberry.field(default=None, description="Screen")
    created_at: datetime = strawberry.field(description="Event timestamp", name="createdAt")


# =============================================================================
# Feature Access Types
# =============================================================================

@strawberry.type
class FeatureAccess:
    """Feature access control"""
    id: str = strawberry.field(description="Feature access ID")
    user_id: str = strawberry.field(description="User ID", name="userId")
    feature_id: str = strawberry.field(description="Feature identifier", name="featureId")
    feature_name: str = strawberry.field(description="Feature name", name="featureName")
    tier_required: SubscriptionTier = strawberry.field(description="Minimum tier required", name="tierRequired")
    has_access: bool = strawberry.field(description="Has access", name="hasAccess")
    access_source: FeatureAccessSource = strawberry.field(description="Access source", name="accessSource")
    usage_limit: Optional[int] = strawberry.field(default=None, description="Usage limit", name="usageLimit")
    usage_count: int = strawberry.field(description="Usage count", name="usageCount")
    access_expires_at: Optional[datetime] = strawberry.field(default=None, description="Access expires", name="accessExpiresAt")
    created_at: datetime = strawberry.field(description="Creation timestamp", name="createdAt")


@strawberry.type
class FeatureAccessRecord:
    """Feature access record for feature access queries"""
    id: str = strawberry.field(description="Feature access ID")
    feature_id: str = strawberry.field(description="Feature identifier", name="featureId")
    feature_name: str = strawberry.field(description="Feature name", name="featureName")
    tier_required: SubscriptionTier = strawberry.field(description="Minimum tier required", name="tierRequired")
    has_access: bool = strawberry.field(description="Has access", name="hasAccess")
    access_source: FeatureAccessSource = strawberry.field(description="Access source", name="accessSource")
    usage_count: int = strawberry.field(description="Usage count", name="usageCount")
    usage_limit: Optional[int] = strawberry.field(default=None, description="Usage limit", name="usageLimit")


# =============================================================================
# Input Types
# =============================================================================

@strawberry.input
class StartTrialInput:
    """Start trial input"""
    tier: SubscriptionTier = strawberry.field(description="Trial tier")
    province: CanadianProvince = strawberry.field(description="Canadian province")


@strawberry.input
class AddPaymentMethodInput:
    """Add payment method input"""
    stripe_payment_method_id: str = strawberry.field(description="Stripe PaymentMethod ID", name="stripePaymentMethodId")
    set_as_default: Optional[bool] = strawberry.field(default=False, description="Set as default", name="setAsDefault")


@strawberry.input
class SubscribeInput:
    """Subscribe input"""
    plan_id: str = strawberry.field(description="Subscription plan ID", name="planId")
    payment_method_id: str = strawberry.field(description="Payment method ID", name="paymentMethodId")
    province: CanadianProvince = strawberry.field(description="Canadian province")


@strawberry.input
class CancelSubscriptionInput:
    """Cancel subscription input"""
    reason: Optional[str] = strawberry.field(default=None, description="Cancellation reason")
    feedback: Optional[str] = strawberry.field(default=None, description="User feedback")
    request_refund: Optional[bool] = strawberry.field(default=False, description="Request refund", name="requestRefund")


@strawberry.input
class UpdatePaymentMethodInput:
    """Update payment method input"""
    payment_method_id: str = strawberry.field(description="Payment method ID", name="paymentMethodId")
    set_as_default: Optional[bool] = strawberry.field(default=None, description="Set as default", name="setAsDefault")


@strawberry.input
class TrackTrialEventInput:
    """Track trial event input"""
    event_type: TrialEventType = strawberry.field(description="Event type", name="eventType")
    feature_used: Optional[str] = strawberry.field(default=None, description="Feature used", name="featureUsed")
    value_saved: Optional[float] = strawberry.field(default=None, description="Value saved", name="valueSaved")
    time_saved_minutes: Optional[int] = strawberry.field(default=None, description="Time saved minutes", name="timeSavedMinutes")
    screen: Optional[str] = strawberry.field(default=None, description="Screen")


@strawberry.input
class CalculateTaxInput:
    """Calculate tax input"""
    amount: float = strawberry.field(description="Amount to calculate tax for")
    province: CanadianProvince = strawberry.field(description="Canadian province")


@strawberry.input
class ChangeSubscriptionPlanInput:
    """Change subscription plan input"""
    new_plan_id: str = strawberry.field(description="New plan ID", name="newPlanId")


@strawberry.input
class RequestRefundInput:
    """Request refund input"""
    reason: str = strawberry.field(description="Refund reason")


# =============================================================================
# Response Types
# =============================================================================

@strawberry.type
class PremiumMutationResponse:
    """Generic premium feature mutation response"""
    success: bool = strawberry.field(description="Operation success")
    message: Optional[str] = strawberry.field(default=None, description="Success message")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class PremiumSubscriptionResponse:
    """Premium subscription mutation response"""
    success: bool = strawberry.field(description="Operation success")
    subscription: Optional[PremiumSubscription] = strawberry.field(default=None, description="Subscription data")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class TrialStartResponse:
    """Trial start response"""
    success: bool = strawberry.field(description="Operation success")
    trial_progress: Optional[TrialProgress] = strawberry.field(default=None, description="Trial progress", name="trialProgress")
    subscription: Optional[PremiumSubscription] = strawberry.field(default=None, description="Subscription data")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class PaymentMethodResponse:
    """Payment method response"""
    success: bool = strawberry.field(description="Operation success")
    payment_method: Optional[PaymentMethod] = strawberry.field(default=None, description="Payment method", name="paymentMethod")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class BillingHistoryResponse:
    """Billing history response"""
    records: List[BillingRecord] = strawberry.field(description="Billing records")
    total_count: int = strawberry.field(description="Total count", name="totalCount")
    has_more: bool = strawberry.field(description="Has more records", name="hasMore")


@strawberry.type
class AvailablePlansResponse:
    """Available plans response"""
    plans: List[PremiumSubscriptionPlan] = strawberry.field(description="Available plans")
    current_tier: SubscriptionTier = strawberry.field(description="Current tier", name="currentTier")
    recommended_plan: Optional[PremiumSubscriptionPlan] = strawberry.field(default=None, description="Recommended plan", name="recommendedPlan")


@strawberry.type
class FeatureAccessResponse:
    """Feature access check response"""
    has_access: bool = strawberry.field(description="Has access", name="hasAccess")
    feature_id: str = strawberry.field(description="Feature ID", name="featureId")
    tier_required: Optional[SubscriptionTier] = strawberry.field(default=None, description="Minimum tier required", name="tierRequired")
    usage_count: Optional[int] = strawberry.field(default=None, description="Usage count", name="usageCount")
    usage_limit: Optional[int] = strawberry.field(default=None, description="Usage limit", name="usageLimit")
    upgrade_recommendation: Optional[str] = strawberry.field(default=None, description="Upgrade recommendation", name="upgradeRecommendation")


@strawberry.type
class InvoiceDownloadResponse:
    """Invoice download response"""
    success: bool = strawberry.field(description="Operation success")
    download_url: Optional[str] = strawberry.field(default=None, description="Invoice download URL", name="downloadUrl")
    expires_at: Optional[datetime] = strawberry.field(default=None, description="URL expiration timestamp", name="expiresAt")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class RefundResponse:
    """Refund response"""
    success: bool = strawberry.field(description="Operation success")
    refund_amount: Optional[float] = strawberry.field(default=None, description="Refund amount", name="refundAmount")
    refund_id: Optional[str] = strawberry.field(default=None, description="Stripe refund ID", name="refundId")
    error: Optional[str] = strawberry.field(default=None, description="Error message")


@strawberry.type
class CancellationPreview:
    """Cancellation preview response"""
    is_refund_eligible: bool = strawberry.field(description="Refund eligible", name="isRefundEligible")
    refund_amount: Optional[float] = strawberry.field(default=None, description="Refund amount", name="refundAmount")
    access_ends_at: Optional[datetime] = strawberry.field(default=None, description="Access end date", name="accessEndsAt")
    features_lost: List[str] = strawberry.field(description="Features that will be lost", name="featuresLost")


# =============================================================================
# Batch 4: Tax Calculation and Compliance Types (T047-T050)
# =============================================================================

@strawberry.type
class TaxCalculationResponse:
    """Tax calculation preview response"""
    subtotal: float = strawberry.field(description="Subtotal before tax")
    province: CanadianProvince = strawberry.field(description="Province")
    tax_breakdown: PremiumTaxBreakdown = strawberry.field(description="Tax breakdown", name="taxBreakdown")
    tax_type: TaxType = strawberry.field(description="Tax type", name="taxType")
    combined_rate: float = strawberry.field(description="Combined tax rate", name="combinedRate")
    total_tax: float = strawberry.field(description="Total tax", name="totalTax")
    total_amount: float = strawberry.field(description="Total amount", name="totalAmount")
    currency: str = strawberry.field(description="Currency code")


@strawberry.type
class CanadianTaxRateType:
    """Canadian tax rate information"""
    province: str = strawberry.field(description="Province code")
    province_name: str = strawberry.field(description="Province name", name="provinceName")
    tax_type: TaxType = strawberry.field(description="Tax type", name="taxType")
    gst_rate: Optional[float] = strawberry.field(default=None, description="GST rate", name="gstRate")
    pst_rate: Optional[float] = strawberry.field(default=None, description="PST rate", name="pstRate")
    hst_rate: Optional[float] = strawberry.field(default=None, description="HST rate", name="hstRate")
    qst_rate: Optional[float] = strawberry.field(default=None, description="QST rate", name="qstRate")
    combined_rate: float = strawberry.field(description="Combined tax rate", name="combinedRate")
    effective_from: datetime = strawberry.field(description="Effective from date", name="effectiveFrom")
    effective_to: Optional[datetime] = strawberry.field(default=None, description="Effective to date", name="effectiveTo")


@strawberry.type
class SubscriptionComplianceData:
    """Subscription data for compliance report"""
    plan_name: str = strawberry.field(description="Plan name", name="planName")
    tier: SubscriptionTier = strawberry.field(description="Subscription tier")
    status: PremiumSubscriptionStatus = strawberry.field(description="Subscription status")
    billing_interval: BillingInterval = strawberry.field(description="Billing interval", name="billingInterval")
    province: str = strawberry.field(description="Billing province")
    created_at: datetime = strawberry.field(description="Subscription created", name="createdAt")


@strawberry.type
class PaymentMethodComplianceData:
    """Payment method data for compliance report"""
    card_brand: str = strawberry.field(description="Card brand", name="cardBrand")
    card_last4: str = strawberry.field(description="Last 4 digits", name="cardLast4")
    is_default: bool = strawberry.field(description="Default payment method", name="isDefault")
    created_at: datetime = strawberry.field(description="Payment method added", name="createdAt")


@strawberry.type
class ConsentRecords:
    """Consent records for compliance"""
    payment_consent_at: Optional[datetime] = strawberry.field(default=None, description="Payment consent timestamp", name="paymentConsentAt")
    privacy_consent_at: Optional[datetime] = strawberry.field(default=None, description="Privacy consent timestamp", name="privacyConsentAt")


@strawberry.type
class ComplianceReportResponse:
    """PIPEDA compliance report response"""
    user_id: str = strawberry.field(description="User ID", name="userId")
    report_generated_at: datetime = strawberry.field(description="Report generation timestamp", name="reportGeneratedAt")
    subscription_data: Optional[SubscriptionComplianceData] = strawberry.field(default=None, description="Subscription data", name="subscriptionData")
    payment_methods: List[PaymentMethodComplianceData] = strawberry.field(description="Payment methods", name="paymentMethods")
    billing_records: List[BillingRecord] = strawberry.field(description="Billing records", name="billingRecords")
    consent_records: ConsentRecords = strawberry.field(description="Consent records", name="consentRecords")
    data_retention_policy: str = strawberry.field(description="Data retention policy", name="dataRetentionPolicy")


# =============================================================================
# Export All Types
# =============================================================================

__all__ = [
    # Enums
    "SubscriptionTier",
    "PremiumSubscriptionStatus",
    "BillingInterval",
    "TransactionType",
    "TransactionStatus",
    "PaymentMethodType",
    "CardBrand",
    "CanadianProvince",
    "TaxType",
    "FeatureAccessSource",
    "TrialEventType",

    # Types
    "FeatureLimits",
    "PremiumSubscriptionPlan",
    "PremiumSubscription",
    "PaymentMethod",
    "PremiumTaxBreakdown",
    "BillingRecord",
    "TaxRateInfo",
    "TaxCalculation",
    "TrialProgress",
    "TrialUsageEvent",
    "FeatureAccess",
    "FeatureAccessRecord",

    # Input Types
    "StartTrialInput",
    "AddPaymentMethodInput",
    "SubscribeInput",
    "CancelSubscriptionInput",
    "UpdatePaymentMethodInput",
    "TrackTrialEventInput",
    "CalculateTaxInput",
    "ChangeSubscriptionPlanInput",
    "RequestRefundInput",

    # Response Types
    "PremiumMutationResponse",
    "PremiumSubscriptionResponse",
    "TrialStartResponse",
    "PaymentMethodResponse",
    "BillingHistoryResponse",
    "AvailablePlansResponse",
    "FeatureAccessResponse",
    "InvoiceDownloadResponse",
    "RefundResponse",
    "CancellationPreview",
    "TaxCalculationResponse",
    "CanadianTaxRateType",
    "SubscriptionComplianceData",
    "PaymentMethodComplianceData",
    "ConsentRecords",
    "ComplianceReportResponse",
]
