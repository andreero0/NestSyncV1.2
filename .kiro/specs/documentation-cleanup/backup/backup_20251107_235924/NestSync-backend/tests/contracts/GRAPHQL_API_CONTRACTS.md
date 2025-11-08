

# GraphQL API Contracts - Premium Subscription System

**Version**: 1.0.0
**Date**: 2025-10-02
**Status**: Contract Tests Written (TDD) - Resolvers Pending Implementation

This document defines the complete GraphQL API contract for the NestSync Premium Subscription System, following Test-Driven Development (TDD) principles.

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Queries](#queries)
3. [Mutations](#mutations)
4. [Types](#types)
5. [Input Types](#input-types)
6. [Enums](#enums)
7. [Error Handling](#error-handling)
8. [Authorization](#authorization)
9. [Canadian Compliance](#canadian-compliance)

---

## Schema Overview

The Premium Subscription GraphQL API provides:

- **14-day free trial** activation without credit card
- **Stripe-powered** payment processing with Canadian tax compliance
- **Trial progress tracking** with value demonstration
- **Feature access control** with usage limits
- **Billing history** with GST/PST/HST/QST breakdown
- **PIPEDA-compliant** audit trails and consent management

---

## Queries

### `availablePlans: AvailablePlansResponse!`

Returns all available subscription plans with user's current tier and recommendations.

**Response**:
```graphql
type AvailablePlansResponse {
  plans: [SubscriptionPlan!]!
  currentTier: SubscriptionTier!
  recommendedPlan: SubscriptionPlan
}
```

**Example**:
```graphql
query AvailablePlans {
  availablePlans {
    plans {
      id
      displayName
      tier
      price
      billingInterval
      features
      limits {
        familyMembers
        reorderSuggestions
        priceAlerts
        automation
      }
    }
    currentTier
    recommendedPlan {
      id
      displayName
    }
  }
}
```

---

### `subscriptionPlan(planId: String!): SubscriptionPlan`

Returns details for a specific subscription plan.

**Arguments**:
- `planId`: Plan identifier (e.g., `"premium_monthly"`)

**Example**:
```graphql
query GetPlan($planId: String!) {
  subscriptionPlan(planId: $planId) {
    id
    displayName
    price
    features
  }
}
```

---

### `mySubscription: Subscription`

Returns current user's subscription (requires authentication).

**Example**:
```graphql
query MySubscription {
  mySubscription {
    id
    plan {
      id
      displayName
      price
    }
    tier
    status
    isOnTrial
    trialEnd
    isInCoolingOffPeriod
    coolingOffEnd
  }
}
```

---

### `myPaymentMethods: [PaymentMethod!]!`

Returns user's saved payment methods (requires authentication).

**Example**:
```graphql
query MyPaymentMethods {
  myPaymentMethods {
    id
    cardBrand
    cardLast4
    cardExpMonth
    cardExpYear
    isDefault
    isActive
  }
}
```

---

### `myBillingHistory(limit: Int, offset: Int): BillingHistoryResponse!`

Returns paginated billing history (requires authentication).

**Arguments**:
- `limit`: Maximum records to return (default: 50)
- `offset`: Pagination offset (default: 0)

**Example**:
```graphql
query MyBillingHistory($limit: Int, $offset: Int) {
  myBillingHistory(limit: $limit, offset: $offset) {
    records {
      id
      transactionType
      description
      subtotal
      taxBreakdown {
        gst
        pst
        hst
        qst
      }
      totalAmount
      status
      createdAt
    }
    totalCount
    hasMore
  }
}
```

---

### `myTrialProgress: TrialProgress`

Returns user's trial progress and engagement metrics.

**Example**:
```graphql
query MyTrialProgress {
  myTrialProgress {
    id
    trialTier
    daysRemaining
    featuresUsedCount
    valueSavedEstimate
    engagementScore
  }
}
```

---

### `myTrialUsageEvents: [TrialUsageEvent!]!`

Returns trial activity history for value demonstration.

**Example**:
```graphql
query MyTrialUsageEvents {
  myTrialUsageEvents {
    id
    eventType
    featureUsed
    valueSaved
    timeSavedMinutes
    createdAt
  }
}
```

---

### `checkFeatureAccess(featureId: String!): FeatureAccessResponse!`

Checks if user has access to a specific feature.

**Arguments**:
- `featureId`: Feature identifier (e.g., `"price_alerts"`)

**Example**:
```graphql
query CheckFeatureAccess($featureId: String!) {
  checkFeatureAccess(featureId: $featureId) {
    hasAccess
    reason
    upgradeRequired
    recommendedPlan {
      id
      displayName
      price
    }
  }
}
```

---

### `myFeatureAccess: [FeatureAccess!]!`

Returns all feature access permissions for user.

**Example**:
```graphql
query MyFeatureAccess {
  myFeatureAccess {
    featureId
    featureName
    hasAccess
    accessSource
    usageLimit
    usageCount
  }
}
```

---

### `calculateTax(input: CalculateTaxInput!): TaxCalculation!`

Calculates Canadian tax breakdown for amount and province.

**Arguments**:
- `input.amount`: Amount in CAD
- `input.province`: Canadian province code

**Example**:
```graphql
query CalculateTax($input: CalculateTaxInput!) {
  calculateTax(input: $input) {
    subtotal
    province
    taxBreakdown {
      gst
      pst
      hst
      qst
    }
    taxType
    combinedRate
    totalTax
    totalAmount
  }
}
```

---

## Mutations

### `startTrial(input: StartTrialInput!): TrialStartResponse!`

Activates 14-day free trial without credit card (requires authentication).

**Input**:
```graphql
input StartTrialInput {
  tier: SubscriptionTier!
  province: CanadianProvince!
}
```

**Example**:
```graphql
mutation StartTrial($input: StartTrialInput!) {
  startTrial(input: $input) {
    success
    trialProgress {
      id
      daysRemaining
    }
    subscription {
      status
      isOnTrial
    }
    error
  }
}
```

**Error Cases**:
- Trial already active
- Invalid province code
- User authentication required

---

### `addPaymentMethod(input: AddPaymentMethodInput!): PaymentMethodResponse!`

Adds Stripe payment method to user account (requires authentication).

**Input**:
```graphql
input AddPaymentMethodInput {
  stripePaymentMethodId: String!
  setAsDefault: Boolean
}
```

**Example**:
```graphql
mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
  addPaymentMethod(input: $input) {
    success
    paymentMethod {
      id
      cardBrand
      cardLast4
      isDefault
    }
    error
  }
}
```

---

### `subscribe(input: SubscribeInput!): SubscriptionResponse!`

Creates paid subscription (trial conversion or new subscription).

**Input**:
```graphql
input SubscribeInput {
  planId: String!
  paymentMethodId: String!
  province: CanadianProvince!
}
```

**Example**:
```graphql
mutation Subscribe($input: SubscribeInput!) {
  subscribe(input: $input) {
    success
    subscription {
      id
      tier
      status
      amount
      province
    }
    error
  }
}
```

---

### `cancelSubscription(input: CancelSubscriptionInput!): SubscriptionResponse!`

Cancels subscription with optional refund during cooling-off period.

**Input**:
```graphql
input CancelSubscriptionInput {
  reason: String
  feedback: String
  requestRefund: Boolean
}
```

**Example**:
```graphql
mutation CancelSubscription($input: CancelSubscriptionInput!) {
  cancelSubscription(input: $input) {
    success
    subscription {
      status
    }
    error
  }
}
```

---

### `trackTrialEvent(input: TrackTrialEventInput!): MutationResponse!`

Records trial usage event for value demonstration.

**Input**:
```graphql
input TrackTrialEventInput {
  eventType: TrialEventType!
  featureUsed: String
  valueSaved: Float
  timeSavedMinutes: Int
  screen: String
}
```

**Example**:
```graphql
mutation TrackTrialEvent($input: TrackTrialEventInput!) {
  trackTrialEvent(input: $input) {
    success
    error
  }
}
```

---

## Types

### SubscriptionPlan

```graphql
type SubscriptionPlan {
  id: String!
  name: String!
  displayName: String!
  tier: SubscriptionTier!
  price: Float!
  billingInterval: BillingInterval!
  features: [String!]!
  limits: FeatureLimits!
  description: String
  sortOrder: Int!
  isActive: Boolean!
  stripePriceId: String
  stripeProductId: String
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

### Subscription

```graphql
type Subscription {
  id: String!
  userId: String!
  plan: SubscriptionPlan!
  tier: SubscriptionTier!
  status: SubscriptionStatus!
  billingInterval: BillingInterval!
  amount: Float!
  currency: String!
  province: CanadianProvince!
  stripeCustomerId: String
  stripeSubscriptionId: String
  trialStart: DateTime
  trialEnd: DateTime
  coolingOffEnd: DateTime
  paymentConsentAt: DateTime
  isOnTrial: Boolean!
  isInCoolingOffPeriod: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

### PaymentMethod

```graphql
type PaymentMethod {
  id: String!
  userId: String!
  type: PaymentMethodType!
  cardBrand: CardBrand
  cardLast4: String
  cardExpMonth: Int
  cardExpYear: Int
  isDefault: Boolean!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

### BillingRecord

```graphql
type BillingRecord {
  id: String!
  userId: String!
  subscriptionId: String
  transactionType: TransactionType!
  description: String!
  subtotal: Float!
  taxAmount: Float!
  totalAmount: Float!
  currency: String!
  province: CanadianProvince
  taxBreakdown: TaxBreakdown!
  taxRate: Float
  status: TransactionStatus!
  stripeInvoiceId: String
  refunded: Boolean!
  refundAmount: Float
  refundReason: String
  invoiceNumber: String
  invoicePdfUrl: String
  receiptUrl: String
  createdAt: DateTime!
}
```

---

### TrialProgress

```graphql
type TrialProgress {
  id: String!
  userId: String!
  isActive: Boolean!
  trialTier: SubscriptionTier!
  trialStartedAt: DateTime!
  trialEndsAt: DateTime!
  daysRemaining: Int!
  convertedToPaid: Boolean!
  convertedAt: DateTime
  canceled: Boolean!
  featuresUsedCount: Int!
  usageDays: Int!
  valueSavedEstimate: Float
  engagementScore: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

---

### FeatureAccess

```graphql
type FeatureAccess {
  id: String!
  userId: String!
  featureId: String!
  featureName: String!
  tierRequired: SubscriptionTier!
  hasAccess: Boolean!
  accessSource: FeatureAccessSource!
  usageLimit: Int
  usageCount: Int!
  accessExpiresAt: DateTime
  createdAt: DateTime!
}
```

---

## Enums

```graphql
enum SubscriptionTier {
  FREE
  STANDARD
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  TRIALING
  PAST_DUE
  CANCELED
  UNPAID
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

enum CanadianProvince {
  ON  # Ontario
  QC  # Quebec
  BC  # British Columbia
  AB  # Alberta
  SK  # Saskatchewan
  MB  # Manitoba
  NS  # Nova Scotia
  NB  # New Brunswick
  PE  # Prince Edward Island
  NL  # Newfoundland and Labrador
  NT  # Northwest Territories
  YT  # Yukon
  NU  # Nunavut
}

enum TaxType {
  GST_PST  # GST + PST
  HST      # Harmonized Sales Tax
  GST_QST  # GST + QST (Quebec)
  GST      # GST only
}

enum TransactionType {
  SUBSCRIPTION_CHARGE
  UPGRADE
  DOWNGRADE
  REFUND
  TRIAL_CONVERSION
  RENEWAL
  CANCELLATION_FEE
}

enum CardBrand {
  VISA
  MASTERCARD
  AMEX
  DISCOVER
  DINERS
  JCB
  UNKNOWN
}

enum FeatureAccessSource {
  SUBSCRIPTION
  TRIAL
  PROMO
  LIFETIME
  ADMIN_GRANT
}

enum TrialEventType {
  FEATURE_USED
  VALUE_SAVED
  PROMPT_SHOWN
  PROMPT_CLICKED
  TRIAL_STARTED
  TRIAL_ENDED
  TRIAL_CONVERTED
  TRIAL_CANCELED
}
```

---

## Error Handling

All mutations return response types with `success: Boolean!` and `error: String` fields.

### Common Error Messages

| Error | Description |
|-------|-------------|
| `"Trial already active for this user"` | User attempted duplicate trial activation |
| `"Payment method declined. Please try a different card."` | Stripe payment failed |
| `"No active subscription found"` | Cancel/modify operation on non-existent subscription |
| `"Tax rate not found for province"` | Invalid province code |
| `"Service temporarily unavailable. Please try again."` | Database/network error |
| `"Too many requests. Please try again in a few minutes."` | Rate limit exceeded |

---

## Authorization

### Authentication Required

All mutations and user-specific queries require authentication via Supabase JWT:

- `mySubscription`
- `myPaymentMethods`
- `myBillingHistory`
- `myTrialProgress`
- `startTrial`
- `subscribe`
- `cancelSubscription`
- All payment method mutations

### Public Access

Subscription plan information is publicly readable:

- `availablePlans`
- `subscriptionPlan`
- `calculateTax`

### Row Level Security (RLS)

Database policies ensure:
- Users can only access their own subscriptions
- Users can only modify their own payment methods
- Cross-user data access is blocked
- Service role can bypass RLS for admin operations

---

## Canadian Compliance (PIPEDA)

### Payment Consent

All `subscribe` mutations record `paymentConsentAt` timestamp for PIPEDA compliance.

### Tax Breakdown

All billing records include detailed Canadian tax breakdown:
- GST (Goods and Services Tax)
- PST (Provincial Sales Tax)
- HST (Harmonized Sales Tax)
- QST (Quebec Sales Tax)

### Cooling-Off Period

Annual subscriptions include 14-day cooling-off period with full refund eligibility.

### Audit Trails

All subscription modifications create audit log entries:
- Subscription created/updated/canceled
- Payment method added/removed
- Billing transactions

---

## Testing

### Contract Tests

All API contracts have corresponding contract tests in:
- `tests/contracts/test_subscription_schema.py`
- `tests/contracts/test_trial_and_features.py`
- `tests/contracts/test_webhooks_and_validation.py`
- `tests/contracts/test_schema_introspection.py`

### Test Coverage

- 80+ contract test methods
- All queries, mutations, types validated
- Input validation scenarios
- Error handling scenarios
- Authorization policies
- Canadian compliance requirements

---

## Implementation Status

**Current**: Contract tests written (TDD approach)
**Next**: Implement GraphQL resolvers (Phase 3.3)
**Expected**: All contract tests should PASS after resolver implementation

---

## Changelog

### Version 1.0.0 (2025-10-02)
- Initial API contract definition
- Complete type system specification
- Contract tests implemented (TDD)
- Canadian compliance requirements documented
