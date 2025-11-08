# Premium Subscription System - GraphQL API Documentation

**Version:** 1.0.0
**Last Updated:** October 3, 2025
**Backend Endpoint:** http://localhost:8001/graphql
**Production Endpoint:** https://nestsync-api.railway.app/graphql

---

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Subscription Plans](#subscription-plans)
- [Trial System](#trial-system)
- [Payment Methods](#payment-methods)
- [Subscription Management](#subscription-management)
- [Billing & Invoices](#billing--invoices)
- [Feature Access Control](#feature-access-control)
- [Canadian Tax System](#canadian-tax-system)
- [Compliance & Reporting](#compliance--reporting)
- [Error Handling](#error-handling)
- [Complete Schema Reference](#complete-schema-reference)

---

## Overview

The Premium Subscription System provides a complete Canadian-compliant subscription management platform with:
- 14-day free trial without credit card
- 5 subscription tiers (FREE, STANDARD monthly/yearly, PREMIUM monthly/yearly)
- Stripe payment processing with CAD currency
- Canadian tax compliance (GST/PST/HST/QST for all 13 provinces)
- PIPEDA-compliant data handling
- 14-day cooling-off period for annual subscriptions
- Dynamic feature access control

### Pricing Structure
- **FREE**: $0.00 CAD/month (basic features)
- **STANDARD_MONTHLY**: $4.99 CAD/month
- **STANDARD_YEARLY**: $49.99 CAD/year (save $10)
- **PREMIUM_MONTHLY**: $6.99 CAD/month
- **PREMIUM_YEARLY**: $69.99 CAD/year (save $14)

---

## Authentication

All subscription-related queries and mutations require authentication via JWT token.

### Required Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Data-Residency: Canada
X-Compliance-Framework: PIPEDA
```

### Unauthenticated Error Response
```json
{
  "success": false,
  "error": "Authentication required. Please sign in to access subscription features."
}
```

---

## Subscription Plans

### Query: availablePlans

Get all available subscription plans with personalized recommendations.

**Authentication:** Required

**Query:**
```graphql
query GetAvailablePlans {
  availablePlans {
    plans {
      id
      displayName
      tier
      price
      billingInterval
      currency
      features
      limits {
        maxChildren
        maxInventoryItems
        maxFamilyMembers
        storageGB
      }
      stripeProductId
      stripePriceId
      isActive
      sortOrder
    }
    recommendedPlanId
    currentPlanId
  }
}
```

**Response:**
```json
{
  "data": {
    "availablePlans": {
      "plans": [
        {
          "id": "standard_monthly",
          "displayName": "Standard Plan",
          "tier": "STANDARD",
          "price": 4.99,
          "billingInterval": "MONTHLY",
          "currency": "CAD",
          "features": ["Advanced analytics", "Family sharing", "Export reports"],
          "limits": {
            "maxChildren": 3,
            "maxInventoryItems": 100,
            "maxFamilyMembers": 5,
            "storageGB": 5.0
          }
        }
      ],
      "recommendedPlanId": "standard_monthly",
      "currentPlanId": "free"
    }
  }
}
```

---

### Query: subscriptionPlan

Get details of a specific subscription plan.

**Authentication:** Optional

**Query:**
```graphql
query GetSubscriptionPlan($planId: String!) {
  subscriptionPlan(planId: $planId) {
    id
    displayName
    tier
    price
    billingInterval
    features
    limits {
      maxChildren
      maxInventoryItems
    }
  }
}
```

**Variables:**
```json
{
  "planId": "standard_monthly"
}
```

---

## Trial System

### Mutation: startTrial

Activate a 14-day free trial without requiring a credit card.

**Authentication:** Required

**Mutation:**
```graphql
mutation StartTrial($input: StartTrialInput!) {
  startTrial(input: $input) {
    success
    trialProgress {
      userId
      trialTier
      trialStartedAt
      trialEndsAt
      daysRemaining
      isActive
      hasConverted
      engagementScore
      featuresUsedCount
    }
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "tier": "STANDARD"
  }
}
```

**Success Response:**
```json
{
  "data": {
    "startTrial": {
      "success": true,
      "trialProgress": {
        "userId": "uuid",
        "trialTier": "STANDARD",
        "trialStartedAt": "2025-10-03T00:00:00Z",
        "trialEndsAt": "2025-10-17T00:00:00Z",
        "daysRemaining": 14,
        "isActive": true,
        "hasConverted": false,
        "engagementScore": 0.0,
        "featuresUsedCount": 0
      },
      "error": null
    }
  }
}
```

---

### Mutation: trackTrialEvent

Record feature usage during trial to demonstrate value.

**Authentication:** Required

**Mutation:**
```graphql
mutation TrackTrialEvent($input: TrackTrialEventInput!) {
  trackTrialEvent(input: $input) {
    success
    message
    error
  }
}
```

**Variables:**
```graphql
{
  "input": {
    "eventType": "FEATURE_USED",
    "featureName": "advanced_analytics",
    "valueDemonstrated": {
      "timeSavedMinutes": 15,
      "costAvoided": 5.99
    }
  }
}
```

---

### Query: myTrialProgress

Get current trial progress and engagement metrics.

**Authentication:** Required

**Query:**
```graphql
query GetMyTrialProgress {
  myTrialProgress {
    userId
    trialTier
    trialStartedAt
    trialEndsAt
    daysRemaining
    isActive
    hasConverted
    engagementScore
    featuresUsedCount
    valueDemonstration {
      totalTimeSavedMinutes
      totalCostAvoided
    }
  }
}
```

---

## Payment Methods

### Mutation: addPaymentMethod

Attach a Stripe PaymentMethod to the user's account.

**Authentication:** Required

**Mutation:**
```graphql
mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
  addPaymentMethod(input: $input) {
    success
    paymentMethod {
      id
      stripePaymentMethodId
      paymentMethodType
      cardBrand
      cardLast4
      cardExpMonth
      cardExpYear
      isDefault
    }
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "stripePaymentMethodId": "pm_1234567890",
    "setAsDefault": true
  }
}
```

---

### Mutation: removePaymentMethod

Detach a payment method from the user's account.

**Authentication:** Required

**Mutation:**
```graphql
mutation RemovePaymentMethod($paymentMethodId: ID!) {
  removePaymentMethod(paymentMethodId: $paymentMethodId) {
    success
    message
    error
  }
}
```

---

### Query: myPaymentMethods

Get all saved payment methods.

**Authentication:** Required

**Query:**
```graphql
query GetMyPaymentMethods {
  myPaymentMethods {
    id
    paymentMethodType
    cardBrand
    cardLast4
    cardExpMonth
    cardExpYear
    isDefault
    createdAt
  }
}
```

---

## Subscription Management

### Mutation: subscribe

Convert trial to paid subscription or create new subscription.

**Authentication:** Required

**Mutation:**
```graphql
mutation Subscribe($input: SubscribeInput!) {
  subscribe(input: $input) {
    success
    subscription {
      id
      userId
      planId
      status
      currentPeriodStart
      currentPeriodEnd
      cancelAtPeriodEnd
      trialEnd
      province
      stripeSubscriptionId
      stripeCustomerId
      coolingOffEnd
    }
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "planId": "standard_monthly",
    "paymentMethodId": "pm_1234567890",
    "province": "ON"
  }
}
```

---

### Mutation: changeSubscriptionPlan

Upgrade or downgrade subscription with automatic proration.

**Authentication:** Required

**Mutation:**
```graphql
mutation ChangeSubscriptionPlan($input: ChangeSubscriptionPlanInput!) {
  changeSubscriptionPlan(input: $input) {
    success
    subscription {
      id
      planId
      status
      currentPeriodStart
      currentPeriodEnd
    }
    message
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "newPlanId": "premium_monthly"
  }
}
```

---

### Mutation: cancelSubscriptionPremium

Cancel subscription with optional refund during cooling-off period.

**Authentication:** Required

**Mutation:**
```graphql
mutation CancelSubscription($input: CancelSubscriptionInput!) {
  cancelSubscriptionPremium(input: $input) {
    success
    subscription {
      id
      status
      cancelAtPeriodEnd
      canceledAt
      currentPeriodEnd
    }
    message
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "cancelImmediately": false,
    "cancellationReason": "Switching to different service"
  }
}
```

---

### Mutation: requestRefund

Request refund during 14-day cooling-off period (annual subscriptions only).

**Authentication:** Required

**Mutation:**
```graphql
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
```

---

### Query: mySubscription

Get current subscription details.

**Authentication:** Required

**Query:**
```graphql
query GetMySubscription {
  mySubscription {
    id
    planId
    status
    currentPeriodStart
    currentPeriodEnd
    cancelAtPeriodEnd
    trialEnd
    province
    coolingOffEnd
    plan {
      displayName
      price
      billingInterval
    }
  }
}
```

---

### Query: cancellationPreview

Preview the impact of canceling subscription.

**Authentication:** Required

**Query:**
```graphql
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
```

---

## Billing & Invoices

### Query: myBillingHistory

Get paginated billing transaction history.

**Authentication:** Required

**Query:**
```graphql
query GetMyBillingHistory($page: Int, $pageSize: Int) {
  myBillingHistory(page: $page, pageSize: $pageSize) {
    records {
      id
      userId
      subscriptionId
      amount
      currency
      taxAmount
      totalAmount
      transactionType
      status
      invoiceUrl
      createdAt
      taxBreakdown {
        gst
        pst
        hst
        qst
        province
        totalTax
      }
    }
    totalRecords
    page
    pageSize
    totalPages
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "pageSize": 20
}
```

---

### Query: billingRecord

Get details of a specific billing transaction.

**Authentication:** Required

**Query:**
```graphql
query GetBillingRecord($recordId: ID!) {
  billingRecord(recordId: $recordId) {
    id
    amount
    taxAmount
    totalAmount
    transactionType
    status
    description
    invoiceUrl
    taxBreakdown {
      gst
      pst
      hst
      qst
      province
      totalTax
    }
    createdAt
  }
}
```

---

### Query: downloadInvoice

Get downloadable invoice URL for a billing record.

**Authentication:** Required

**Query:**
```graphql
query DownloadInvoice($recordId: ID!) {
  downloadInvoice(recordId: $recordId) {
    invoiceUrl
    recordId
    expiresAt
  }
}
```

---

## Feature Access Control

### Query: checkFeatureAccess

Check if user has access to a specific feature.

**Authentication:** Required

**Query:**
```graphql
query CheckFeatureAccess($featureId: String!) {
  checkFeatureAccess(featureId: $featureId) {
    featureId
    hasAccess
    tierRequired
    upgradeRecommendation
    usageCount
    usageLimit
  }
}
```

**Variables:**
```json
{
  "featureId": "advanced_analytics"
}
```

---

### Query: myFeatureAccess

Get all feature access records for current user.

**Authentication:** Required

**Query:**
```graphql
query GetMyFeatureAccess {
  myFeatureAccess {
    featureId
    hasAccess
    accessSource
    tierRequired
    usageCount
    usageLimit
    lastUsedAt
  }
}
```

---

### Mutation: syncFeatureAccess

Synchronize feature access based on current subscription.

**Authentication:** Required

**Mutation:**
```graphql
mutation SyncFeatureAccess {
  syncFeatureAccess {
    success
    message
    featuresGranted
    featuresRevoked
    error
  }
}
```

---

## Canadian Tax System

### Query: calculateTax

Calculate Canadian taxes for a given amount and province.

**Authentication:** Optional

**Query:**
```graphql
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
```

**Variables:**
```json
{
  "amount": 49.99,
  "province": "ON"
}
```

**Response (Ontario - HST 13%):**
```json
{
  "data": {
    "calculateTax": {
      "subtotal": 49.99,
      "province": "ON",
      "taxBreakdown": {
        "gst": null,
        "pst": null,
        "hst": 6.50,
        "qst": null
      },
      "totalTax": 6.50,
      "totalAmount": 56.49,
      "taxType": "HST",
      "currency": "CAD"
    }
  }
}
```

**Response (Quebec - GST 5% + QST 9.975%):**
```json
{
  "data": {
    "calculateTax": {
      "subtotal": 49.99,
      "province": "QC",
      "taxBreakdown": {
        "gst": 2.50,
        "pst": null,
        "hst": null,
        "qst": 5.24
      },
      "totalTax": 7.74,
      "totalAmount": 57.73,
      "taxType": "GST_QST",
      "currency": "CAD"
    }
  }
}
```

---

### Query: taxRates

Get all Canadian provincial tax rates.

**Authentication:** Optional

**Query:**
```graphql
query GetTaxRates {
  taxRates {
    province
    provinceName
    gstRate
    pstRate
    hstRate
    qstRate
    totalRate
    taxType
    effectiveDate
  }
}
```

---

### Mutation: updateBillingProvince

Change billing province for subscription (affects tax calculations).

**Authentication:** Required

**Mutation:**
```graphql
mutation UpdateBillingProvince($province: CanadianProvince!) {
  updateBillingProvince(province: $province) {
    success
    message
    newProvince
    newTaxRate
    error
  }
}
```

---

## Compliance & Reporting

### Query: complianceReport

Generate PIPEDA compliance report for user's subscription data.

**Authentication:** Required

**Query:**
```graphql
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
```

---

## Error Handling

### Common Error Response Format
```json
{
  "data": {
    "queryOrMutation": {
      "success": false,
      "error": "Detailed error message"
    }
  }
}
```

### Error Types

**Authentication Errors:**
- `"Authentication required. Please sign in to access subscription features."`
- `"Invalid or expired authentication token."`

**Validation Errors:**
- `"Invalid subscription plan ID."`
- `"Invalid Canadian province code."`
- `"Payment method not found."`

**Business Logic Errors:**
- `"User already has an active trial."`
- `"Cannot start trial - user already has a paid subscription."`
- `"Cannot cancel - subscription not found."`
- `"Refund not eligible - cooling-off period expired."`

**Payment Errors:**
- `"Payment method declined."`
- `"Insufficient funds."`
- `"Stripe integration error: <details>"`

**Canadian Tax Errors:**
- `"Tax calculation failed for province: <province>"`
- `"Invalid province for Canadian tax calculation."`

---

## Complete Schema Reference

The complete GraphQL schema is exported to `schema.graphql` (3,322 lines).

### Key Types

**Enums:**
- `SubscriptionTier`: FREE, STANDARD, PREMIUM
- `BillingInterval`: MONTHLY, YEARLY
- `PremiumSubscriptionStatus`: ACTIVE, PAST_DUE, CANCELED, TRIALING, INCOMPLETE
- `CanadianProvince`: ON, QC, BC, AB, MB, SK, NS, NB, NL, PE, NT, YT, NU
- `PaymentMethodType`: CARD, BANK_ACCOUNT, CASH, OTHER
- `CardBrand`: VISA, MASTERCARD, AMEX, DISCOVER, DINERS, JCB, UNIONPAY, UNKNOWN
- `TransactionType`: SUBSCRIPTION_CHARGE, REFUND, PRORATION, ADJUSTMENT
- `TransactionStatus`: PENDING, COMPLETED, FAILED, REFUNDED
- `TaxType`: GST, PST, HST, QST, GST_PST, GST_QST
- `TrialEventType`: TRIAL_STARTED, FEATURE_USED, ENGAGEMENT_MILESTONE, VALUE_DEMONSTRATED
- `FeatureAccessSource`: SUBSCRIPTION, TRIAL, PROMOTION

**Input Types:**
- `StartTrialInput`
- `TrackTrialEventInput`
- `AddPaymentMethodInput`
- `SubscribeInput`
- `ChangeSubscriptionPlanInput`
- `CancelSubscriptionInput`
- `RequestRefundInput`

**Response Types:**
- `AvailablePlansResponse`
- `TrialStartResponse`
- `PaymentMethodResponse`
- `PremiumSubscriptionResponse`
- `RefundResponse`
- `PremiumMutationResponse`
- `BillingHistoryResponse`
- `FeatureAccessResponse`
- `TaxCalculationResponse`
- `ComplianceReportResponse`

---

## Frontend Integration Guide

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:8001/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getAccessToken(); // From your auth system
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      'X-Data-Residency': 'Canada',
      'X-Compliance-Framework': 'PIPEDA',
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Example Query Hook

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_AVAILABLE_PLANS = gql`
  query GetAvailablePlans {
    availablePlans {
      plans {
        id
        displayName
        price
        billingInterval
        features
      }
      recommendedPlanId
    }
  }
`;

export function useAvailablePlans() {
  const { data, loading, error } = useQuery(GET_AVAILABLE_PLANS);
  return { plans: data?.availablePlans, loading, error };
}
```

### Example Mutation Hook

```typescript
import { gql, useMutation } from '@apollo/client';

const START_TRIAL = gql`
  mutation StartTrial($input: StartTrialInput!) {
    startTrial(input: $input) {
      success
      trialProgress {
        trialEndsAt
        daysRemaining
      }
      error
    }
  }
`;

export function useStartTrial() {
  const [startTrial, { data, loading, error }] = useMutation(START_TRIAL);

  const handleStartTrial = (tier: string) => {
    return startTrial({
      variables: { input: { tier } }
    });
  };

  return { startTrial: handleStartTrial, data, loading, error };
}
```

---

## Support & Resources

- **GraphQL Playground:** http://localhost:8001/graphql
- **Schema SDL:** `schema.graphql`
- **Contract Tests:** `tests/contracts/`
- **Backend Status:** http://localhost:8001/health

For technical questions or bug reports, contact the NestSync development team.

---

**Document Version:** 1.0.0
**Last Updated:** October 3, 2025
**Backend Version:** NestSync API v1.0.0
