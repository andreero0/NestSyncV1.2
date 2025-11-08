# GraphQL API Contracts: Premium Upgrade Flow

**Feature**: Premium Upgrade Flow  
**Date**: 2025-10-02  
**Status**: Contract Design Complete

## Overview

This directory contains GraphQL schema contracts defining the complete API surface for the premium upgrade flow. All schemas follow Strawberry GraphQL conventions with camelCase field aliases for frontend compatibility (Constitutional Principle 8).

---

## Contract Files

### 1. subscription.graphql
**Purpose**: Core subscription lifecycle management

**Key Operations**:
- `Query.subscriptionStatus`: Get current user subscription with all related data
- `Query.subscriptionPlans`: List available premium tiers
- `Query.calculatePricing`: Canadian tax calculation preview
- `Mutation.startTrial`: Activate 14-day free trial (no credit card)
- `Mutation.convertToPaid`: Convert trial to paid subscription
- `Mutation.cancelSubscription`: Cancel with cooling-off period support
- `Mutation.updateSubscriptionPlan`: Upgrade/downgrade with proration

**Key Types**:
- `Subscription`: User's subscription state and billing details
- `SubscriptionPlan`: Available premium tiers with pricing
- `SubscriptionStatus`: Lifecycle states (ACTIVE, TRIALING, PAST_DUE, CANCELED, UNPAID)
- `PricingBreakdown`: Canadian tax-inclusive pricing

---

### 2. payment.graphql
**Purpose**: Payment method management and Stripe integration

**Key Operations**:
- `Query.paymentMethods`: List user's saved payment methods
- `Query.createPaymentIntent`: Generate Stripe Payment Intent for checkout
- `Mutation.addPaymentMethod`: Save tokenized payment method
- `Mutation.setDefaultPaymentMethod`: Update default billing method
- `Mutation.removePaymentMethod`: Delete payment method

**Key Types**:
- `PaymentMethod`: Tokenized credit card (no sensitive data)
- `BillingAddress`: Canadian billing address validation
- `PaymentIntentResult`: Stripe client secret for payment processing

**Integration Notes**:
- Phase 1: Credit cards only (Visa, Mastercard, Amex)
- Phase 2: Interac Online support
- Stripe PaymentSheet used for native mobile payments
- PCI DSS compliant (Stripe handles all card data)

---

### 3. trial.graphql
**Purpose**: Trial progress tracking and value metrics

**Key Operations**:
- `Query.trialProgress`: Get trial engagement and value metrics
- `Query.featureAccess`: Check premium feature availability
- `Query.trialValueMetrics`: Aggregated value for trial dashboard
- `Mutation.trackFeatureUsage`: Record premium feature usage and value impact
- `Mutation.completeOnboardingStep`: Progress through guided trial onboarding
- `Mutation.dismissConversionPrompt`: Track conversion prompt interactions

**Key Types**:
- `TrialProgress`: Days remaining, features explored, value metrics
- `FeatureAccess`: Feature gate control (NONE, LIMITED, FULL)
- `TrialValueMetrics`: Time saved, conflicts prevented, value score
- `OnboardingStep`: Guided trial feature exploration

**Value Calculation**:
- Time Saved: Tracked in minutes, converted to hours
- Conflicts Prevented: Scheduling conflicts detected by smart features
- Value Score: 0-100 algorithm for conversion eligibility
- Conversion Eligible: Score >= 60 AND Days Active >= 8 AND Features Explored >= 3

---

### 4. billing.graphql
**Purpose**: Billing history and invoice management

**Key Operations**:
- `Query.billingHistory`: List all invoices with pagination
- `Query.invoice`: Get specific invoice details
- `Query.upcomingInvoice`: Preview next charge (plan changes, proration)
- `Query.downloadInvoice`: Generate temporary PDF download URL
- `Mutation.requestRefund`: Request refund within cooling-off period
- `Mutation.retryPayment`: Retry failed payment during grace period

**Key Types**:
- `BillingRecord`: Immutable invoice record with Canadian tax breakdown
- `TaxBreakdown`: GST/PST/HST/QST amounts by province
- `InvoiceStatus`: DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE
- `BillingSummary`: Aggregate metrics for subscription dashboard

**Canadian Compliance**:
- Invoice numbering: NS-YYYY-MM-XXXXX format
- GST/HST registration display on invoices
- Provincial tax breakdown (GST+PST, HST, GST+QST)
- 14-day cooling-off period for annual subscriptions

---

## Schema Integration

### Backend Implementation (Strawberry GraphQL)
```python
# app/graphql/subscription_schema.py
import strawberry
from typing import Optional

@strawberry.type
class Subscription:
    id: str
    user_id: str  # snake_case in Python
    tier: str
    status: str
    # Strawberry auto-generates camelCase aliases: userId, etc.

@strawberry.type
class Query:
    @strawberry.field
    def subscription_status(self, user_id: str) -> Subscription:
        # Implementation with AsyncGenerator pattern (Principle 7)
        pass

@strawberry.type
class Mutation:
    @strawberry.mutation
    def start_trial(self, duration_days: int = 14) -> TrialStartResult:
        # Implementation with RLS policy enforcement (Principle 4)
        pass
```

### Frontend Integration (Apollo Client 3.x)
```typescript
// services/subscriptionService.ts
import { gql } from '@apollo/client';

export const GET_SUBSCRIPTION_STATUS = gql`
  query GetSubscriptionStatus {
    subscriptionStatus {
      id
      userId
      tier
      status
      trialEnd
      daysRemaining
    }
  }
`;

export const START_TRIAL = gql`
  mutation StartTrial($durationDays: Int!) {
    startTrial(durationDays: $durationDays) {
      success
      subscription {
        id
        status
        trialEnd
      }
      error {
        code
        message
      }
    }
  }
`;
```

---

## Constitutional Alignment

### Principle 6: Documented Failures Must Never Recur
- ✅ GraphQL schema validation prevents snake_case/camelCase mismatches
- ✅ Strawberry camelCase aliases enforce naming consistency

### Principle 7: Async Pattern Enforcement
- ✅ All backend operations use AsyncGenerator pattern
- ✅ Apollo Client 3.x error handling patterns (no 4.x ServerError.is())

### Principle 8: GraphQL Schema Integrity
- ✅ Frontend queries match backend schema through Strawberry aliasing
- ✅ CI/CD pipeline includes schema compatibility tests

### Principle 4: Privacy by Design
- ✅ RLS policies enforce user data isolation
- ✅ No sensitive card data in schema (Stripe tokenization)

### Principle 5: Transparent Consent & Canadian Timezone
- ✅ Clear consent fields in mutations (acceptedTerms)
- ✅ All DateTime fields use America/Toronto timezone

---

## Testing Strategy

### Contract Tests (Backend)
```python
# tests/contract/test_subscription_schema.py
async def test_subscription_query_matches_schema():
    """Verify subscription query returns all required fields"""
    result = await graphql_client.query(GET_SUBSCRIPTION_STATUS)
    assert result.data.subscriptionStatus.id
    assert result.data.subscriptionStatus.tier in ['free', 'standard', 'premium']
    assert result.data.subscriptionStatus.status in ['active', 'trialing', 'past_due', 'canceled', 'unpaid']
```

### Contract Tests (Frontend)
```typescript
// tests/contract/subscription.test.ts
describe('Subscription GraphQL Schema', () => {
  it('should fetch subscription status with all fields', async () => {
    const { data } = await client.query({ query: GET_SUBSCRIPTION_STATUS });
    expect(data.subscriptionStatus).toBeDefined();
    expect(data.subscriptionStatus.userId).toBeTruthy();
    expect(['free', 'standard', 'premium']).toContain(data.subscriptionStatus.tier);
  });
});
```

---

## API Versioning

**Current Version**: v1.0.0  
**Stability**: Stable (Phase 1 contract)

**Breaking Changes Policy**:
- Field deprecation requires 3-month notice
- New optional fields can be added anytime
- Required field changes are breaking changes
- Enum value additions are non-breaking
- Enum value removals are breaking changes

**Deprecation Example**:
```graphql
type Subscription {
  # Deprecated: Use trialDaysRemaining instead
  # Will be removed in v2.0.0 (2026-01-01)
  daysRemaining: Int @deprecated(reason: "Use trialDaysRemaining for clarity")
  
  trialDaysRemaining: Int
}
```

---

## Next Steps

1. **Contract Test Generation**: Create failing contract tests for all queries/mutations
2. **Backend Implementation**: Implement Strawberry resolvers matching contracts
3. **Frontend Integration**: Generate TypeScript types from schema
4. **Schema Validation CI**: Add graphql-schema-linter to CI/CD
5. **Documentation**: Generate API documentation from schema comments

---

**Status**: ✅ COMPLETE  
**Total Operations**: 28 queries, 19 mutations, 2 subscriptions  
**Total Types**: 35 types, 15 enums, 12 inputs

