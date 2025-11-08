# Research & Technology Decisions: Premium Upgrade Flow

**Feature**: Premium Upgrade Flow  
**Date**: 2025-10-02  
**Status**: Research Complete

## Overview

This document captures technology decisions, patterns, and best practices for implementing the comprehensive premium upgrade flow system. All decisions align with NestSync constitution v1.1.0 and resolve Technical Context unknowns.

---

## 1. Stripe Payment Integration for React Native

### Decision
Use `@stripe/stripe-react-native` with native PaymentSheet component for mobile payments, web fallback messaging for browser users.

### Rationale
- **Native Experience**: PaymentSheet provides platform-native payment UI following Apple/Google design guidelines
- **PCI DSS Compliance**: Stripe handles sensitive card data, tokens only stored in backend
- **Canadian Support**: Stripe supports CAD currency, Canadian billing addresses, postal code validation (A1A 1A1 format)
- **Constitutional Alignment**: Principle 18 (Platform-Agnostic Storage) - payment processing abstracted behind hooks

### Implementation Pattern
```typescript
// hooks/useStripePayment.ts
import { useStripe, PaymentSheet } from '@stripe/stripe-react-native';

export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  const processPayment = async (clientSecret: string) => {
    await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'NestSync',
      merchantCountryCode: 'CA',
      defaultBillingDetails: { country: 'CA' }
    });
    const { error } = await presentPaymentSheet();
    // Error handling per Apollo Client 3.x patterns
  };
}
```

### Canadian Region Configuration

**Critical**: Stripe must be configured to use Canadian data centers and comply with PIPEDA data residency requirements (Constitutional Principle 4).

#### Backend Configuration (Python/FastAPI)
```python
# app/services/stripe_service.py
import stripe

# Configure Stripe for Canadian operations
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe.api_version = "2024-10-28.acacia"  # Use latest stable API version

# CRITICAL: Use Canadian Stripe account for data residency compliance
# stripe.api_base = "https://api.stripe.com"  # Default (US-based)
# For Canadian data residency:
# - Create Stripe account with Canadian business address
# - Stripe automatically routes data to Canadian data centers
# - Verify via Stripe Dashboard → Settings → Business Settings → Country: Canada

class StripeService:
    def create_customer(self, user_id: str, email: str, province: str):
        """Create Stripe customer with Canadian configuration"""
        return stripe.Customer.create(
            email=email,
            metadata={
                'nestsync_user_id': user_id,
                'country': 'CA',
                'province': province,
                'data_residency': 'canada'  # Track for PIPEDA compliance
            },
            address={
                'country': 'CA',
                'state': province  # Required for Canadian tax calculation
            },
            preferred_locales=['en-CA', 'fr-CA']  # Bilingual support
        )
    
    def create_payment_intent(self, amount: int, currency='CAD', customer_id: str):
        """Create Payment Intent for Canadian customer"""
        return stripe.PaymentIntent.create(
            amount=amount,  # Amount in cents
            currency='cad',  # MUST be lowercase 'cad'
            customer=customer_id,
            payment_method_types=['card'],  # Phase 1: Credit cards only
            metadata={'country': 'CA'},
            setup_future_usage='off_session',  # Enable recurring payments
        )
```

#### Environment Variables
```bash
# Backend (.env)
STRIPE_SECRET_KEY=sk_live_...  # Canadian Stripe account secret key
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Canadian Stripe account publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook endpoint signing secret

# Frontend (.env)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Verify Canadian configuration:
# 1. Stripe Dashboard → Settings → Business Settings → Country: Canada
# 2. Stripe Dashboard → Settings → Tax → Enable Canadian tax calculation
# 3. Test mode: Use sk_test_... keys, then switch to live keys for production
```

#### PIPEDA Compliance Verification
1. **Data Residency**: Stripe customers created with Canadian address → data stored in Canadian data centers
2. **Consent**: Payment consent modal (Task T044.5) documents Stripe as processor
3. **Transparency**: Privacy policy discloses Stripe as payment processor
4. **Retention**: Stripe retains payment data per PCI-DSS requirements, deletable via customer portal

### Alternatives Considered
- **In-App Purchases (IAP)**: Rejected - conflicts with Stripe direct billing, 30% App Store fee
- **Web-only payments**: Rejected - requires deep linking from mobile app, poor UX
- **Stripe Elements Web**: Kept as fallback for web users with clear mobile download messaging

### References
- Stripe React Native SDK: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- Constitutional Principle 14: Premium Feature Protection (payment dependencies)

---

## 2. Canadian Tax Calculation Strategy

### Decision
Implement server-side Canadian tax calculation service with provincial rate table stored in PostgreSQL, real-time rate updates via configuration management.

### Rationale
- **Accuracy**: Server-side calculation prevents client manipulation
- **Compliance**: Canadian tax law requires accurate GST/PST/HST calculations
- **Maintainability**: Centralized rate updates when provinces change tax rates
- **Constitutional Alignment**: Principle 5 (Transparent Consent) - clear tax breakdown builds trust

### Implementation Pattern
```python
# services/tax_service.py
from decimal import Decimal
from datetime import datetime

class CanadianTaxService:
    # Provincial tax rates (effective 2025)
    TAX_RATES = {
        'AB': {'gst': Decimal('0.05'), 'pst': Decimal('0.00'), 'total': Decimal('0.05')},
        'BC': {'gst': Decimal('0.05'), 'pst': Decimal('0.07'), 'total': Decimal('0.12')},
        'ON': {'hst': Decimal('0.13'), 'total': Decimal('0.13')},
        'QC': {'gst': Decimal('0.05'), 'qst': Decimal('0.09975'), 'total': Decimal('0.14975')},
        'NB': {'hst': Decimal('0.15'), 'total': Decimal('0.15')},
        # ... other provinces
    }
    
    def calculate_taxes(self, amount: Decimal, province: str) -> dict:
        rates = self.TAX_RATES.get(province, self.TAX_RATES['ON'])  # Default to ON
        subtotal = amount
        tax_amount = subtotal * rates['total']
        total = subtotal + tax_amount
        return {
            'subtotal': subtotal,
            'tax_breakdown': rates,
            'tax_amount': tax_amount,
            'total': total,
            'province': province
        }
```

### Alternatives Considered
- **Third-party tax API** (TaxJar, Avalara): Rejected - overkill for Canadian-only scope, recurring API costs
- **Client-side calculation**: Rejected - security risk, accuracy concerns, audit trail requirements
- **Hardcoded rates in frontend**: Rejected - synchronization issues, maintenance burden

### References
- Canada Revenue Agency: GST/HST rates by province
- Constitutional Principle 2 (Stress Reduction): Transparent pricing reduces anxiety

---

## 3. No-Credit-Card Trial Management

### Decision
Implement trial activation with email-only verification, backend trial expiration tracking with daily cron job, graceful feature degradation on expiration.

### Rationale
- **Conversion Optimization**: Removes payment friction, increases trial activation by 40%+ (business assumption)
- **Trust Building**: Aligns with Canadian cultural values (Principle 3)
- **PIPEDA Compliance**: Minimal data collection during trial
- **Constitutional Alignment**: Principle 1 (Cognitive Load) - simplified trial start reduces decision fatigue

### Implementation Pattern
```python
# models/subscription.py
from datetime import datetime, timedelta
from sqlalchemy import Column, DateTime, String, Boolean

class TrialSubscription:
    user_id = Column(String, primary_key=True)
    trial_start = Column(DateTime, default=datetime.utcnow)
    trial_end = Column(DateTime)  # trial_start + 14 days
    is_active = Column(Boolean, default=True)
    features_used = Column(JSONB)  # Track engagement for conversion prompts
    
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.trial_end
    
    def days_remaining(self) -> int:
        return max(0, (self.trial_end - datetime.utcnow()).days)
```

```typescript
// hooks/useTrial.ts
export function useTrial() {
  const { data, loading } = useQuery(GET_TRIAL_STATUS);
  
  const activateTrial = async () => {
    const { data } = await client.mutate({
      mutation: START_TRIAL,
      variables: { duration: 14 }  // 14-day trial
    });
    // Store trial status in universal storage (Principle 18)
    await useUniversalStorage.set('trial_status', data.startTrial);
  };
}
```

### Alternatives Considered
- **Credit card for trial with $0 charge**: Rejected - adds friction, contradicts spec requirement (FR-010)
- **7-day trial**: Rejected - spec requires 14 days for family decision-making
- **Unlimited trial**: Rejected - revenue impact, conversion optimization requires urgency

### References
- Behavioral Economics: Frictionless trials increase conversion (Thaler & Sunstein, 2008)
- Constitutional Principle 3: Canadian trust-building requires transparency

---

## 4. GraphQL Subscription Schema Design

### Decision
Use Strawberry GraphQL with camelCase field aliases, subscription status as root query, mutations for lifecycle transitions (start trial, convert, cancel).

### Rationale
- **Schema Integrity**: Strawberry auto-generates camelCase from Python snake_case (Principle 8)
- **Type Safety**: GraphQL schema provides frontend/backend contract
- **Real-time Updates**: Subscriptions enable live trial progress tracking
- **Constitutional Alignment**: Principle 6 (Documented Failures) - prevents field mismatch failures

### Implementation Pattern
```python
# graphql/subscription_schema.py
import strawberry
from typing import Optional
from decimal import Decimal

@strawberry.type
class SubscriptionStatus:
    user_id: str
    tier: str  # 'free', 'standard', 'premium'
    status: str  # 'active', 'trialing', 'past_due', 'canceled'
    trial_end: Optional[datetime]
    billing_interval: str  # 'monthly', 'yearly'
    amount: Decimal
    currency: str = 'CAD'
    province: str
    tax_amount: Decimal
    
@strawberry.type
class Query:
    @strawberry.field
    def subscription_status(self, user_id: str) -> SubscriptionStatus:
        # Fetch from database with RLS policy enforcement
        pass

@strawberry.type
class Mutation:
    @strawberry.mutation
    def start_trial(self, duration_days: int = 14) -> SubscriptionStatus:
        # Create trial subscription without payment method
        pass
    
    @strawberry.mutation
    def convert_to_paid(self, plan_id: str, payment_method_id: str) -> SubscriptionStatus:
        # Convert trial to paid with Stripe subscription creation
        pass
```

```typescript
// services/subscriptionService.ts (Frontend)
export const GET_SUBSCRIPTION_STATUS = gql`
  query GetSubscriptionStatus($userId: String!) {
    subscriptionStatus(userId: $userId) {
      userId
      tier
      status
      trialEnd
      billingInterval
      amount
      currency
      province
      taxAmount
    }
  }
`;

export const START_TRIAL = gql`
  mutation StartTrial($durationDays: Int!) {
    startTrial(durationDays: $durationDays) {
      userId
      status
      trialEnd
    }
  }
`;
```

### Alternatives Considered
- **REST API**: Rejected - GraphQL provides better type safety and frontend flexibility
- **snake_case fields**: Rejected - violates Principle 8, causes documented P0 failures
- **Separate microservices**: Rejected - premature complexity, violates constitution simplicity principles

### References
- Strawberry GraphQL Documentation: https://strawberry.rocks/
- Constitutional Principle 8: GraphQL Schema Integrity

---

## 5. Cross-Platform Storage for Trial Status

### Decision
Use `useUniversalStorage` hook abstraction wrapping Expo SecureStore (native) and localStorage (web), with encryption for sensitive trial metadata.

### Rationale
- **Platform Compatibility**: Single API surface across iOS, Android, web
- **Security**: SecureStore provides hardware-backed encryption on native platforms
- **Offline Support**: Trial status available without network requests
- **Constitutional Alignment**: Principle 18 (Platform-Agnostic Storage) - prevents documented SecureStore web failures

### Implementation Pattern
```typescript
// hooks/useUniversalStorage.ts (ALREADY EXISTS - line 1-91)
// Location: NestSync-frontend/hooks/useUniversalStorage.ts
// React hook pattern that returns tuple: [data, loading, setValue]

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

interface StorageOptions {
  secure?: boolean;
  keychainService?: string;
}

export function useUniversalStorage<T = string>(
  key: string, 
  options: StorageOptions = { secure: true }
): [T | null, boolean, (value: T | null) => Promise<void>] {
  const { secure = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Platform.OS === 'web' → localStorage
  // Native + secure → SecureStore
  // Native + !secure → AsyncStorage
  
  return [data, loading, setValue];
}

// Usage in trial hook (correct pattern)
export function useTrial() {
  const [trialCache, cacheLoading, setTrialCache] = useUniversalStorage<TrialStatus>(
    'nestsync:trial_status', 
    { secure: true }
  );
  
  const [fetchTrial] = useQuery(GET_TRIAL_PROGRESS);
  
  useEffect(() => {
    if (!cacheLoading && !trialCache) {
      fetchTrial().then(result => setTrialCache(result.data.trialProgress));
    }
  }, [cacheLoading]);
  
  return { trialStatus: trialCache, loading: cacheLoading };
}
```

### Alternatives Considered
- **Direct SecureStore imports**: Rejected - causes "function not found" errors on web (documented failure)
- **AsyncStorage**: Rejected - not secure enough for subscription metadata
- **Server-only storage**: Rejected - requires constant network requests, poor offline experience

### References
- Expo SecureStore Documentation: https://docs.expo.dev/versions/latest/sdk/securestore/
- Constitutional Principle 18: Cross-Platform Universal Storage Abstraction

---

## 6. Bilingual Support Implementation (Quebec/New Brunswick)

### Decision
Implement i18n using `react-i18next` with language detection based on device locale and explicit user preference toggle, separate translation files for subscription flows.

### Rationale
- **Legal Compliance**: Quebec Bill 96 requires French language option
- **Market Expansion**: New Brunswick bilingual requirement
- **User Experience**: Device locale detection reduces friction
- **Constitutional Alignment**: Principle 3 (Canadian Cultural Sensitivity) - multiculturalism support

### Implementation Pattern
```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

i18n.use(initReactI18next).init({
  resources: {
    en: { subscription: require('./locales/en/subscription.json') },
    fr: { subscription: require('./locales/fr/subscription.json') }
  },
  lng: Localization.locale.startsWith('fr') ? 'fr' : 'en',
  fallbackLng: 'en',
  ns: ['subscription'],
  defaultNS: 'subscription'
});

// locales/en/subscription.json
{
  "trial": {
    "title": "Start Your 14-Day Free Trial",
    "subtitle": "No credit card required",
    "cta": "Activate Trial"
  },
  "pricing": {
    "standard": "$4.99 CAD/month",
    "premium": "$6.99 CAD/month",
    "tax_notice": "Plus applicable {{province}} taxes"
  }
}

// locales/fr/subscription.json
{
  "trial": {
    "title": "Commencez votre essai gratuit de 14 jours",
    "subtitle": "Aucune carte de crédit requise",
    "cta": "Activer l'essai"
  },
  "pricing": {
    "standard": "4,99 $ CAD/mois",
    "premium": "6,99 $ CAD/mois",
    "tax_notice": "Plus les taxes applicables de {{province}}"
  }
}

// Usage in components
import { useTranslation } from 'react-i18next';

export function TrialActivationScreen() {
  const { t } = useTranslation('subscription');
  return (
    <View>
      <Text>{t('trial.title')}</Text>
      <Text>{t('trial.subtitle')}</Text>
      <Button title={t('trial.cta')} />
    </View>
  );
}
```

### Alternatives Considered
- **Manual string replacement**: Rejected - maintenance burden, error-prone
- **Full app translation**: Rejected - spec only requires subscription flows (Phase 1 scope)
- **Google Translate API**: Rejected - quality concerns, legal compliance requires professional translation

### References
- react-i18next Documentation: https://react.i18next.com/
- Quebec Bill 96: Language requirements for digital services
- Constitutional Principle 3: Canadian Cultural Sensitivity

---

## 7. PIPEDA-Compliant Subscription Data Handling

### Decision
Implement Row Level Security (RLS) policies in Supabase PostgreSQL for subscription tables, audit logging for all data access, Canadian data center storage enforcement.

### Rationale
- **Legal Compliance**: PIPEDA requires privacy by design (Principle 4)
- **Data Isolation**: RLS prevents unauthorized cross-user data access
- **Audit Trail**: Required for PIPEDA compliance and dispute resolution
- **Constitutional Alignment**: Principle 4 (Privacy by Design) - foundation-level privacy

### Implementation Pattern
```sql
-- migrations/001_subscription_tables.sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'standard', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
    province TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT trial_dates CHECK (trial_end > trial_start OR trial_start IS NULL)
);

-- Row Level Security Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Audit logging
CREATE TABLE subscription_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO subscription_audit_log (user_id, action, old_values, new_values, ip_address)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        to_jsonb(OLD),
        to_jsonb(NEW),
        inet_client_addr()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_subscription_changes();
```

```python
# services/subscription_service.py
from datetime import datetime
from app.models import Subscription, SubscriptionAuditLog

class SubscriptionService:
    async def create_trial(self, user_id: str, duration_days: int = 14):
        # AsyncGenerator pattern per Principle 7
        async for session in get_async_session():
            trial_start = datetime.now(timezone('America/Toronto'))  # Principle 5
            trial_end = trial_start + timedelta(days=duration_days)
            
            subscription = Subscription(
                user_id=user_id,
                tier='free',
                status='trialing',
                trial_start=trial_start,
                trial_end=trial_end,
                province=user.province  # From user profile
            )
            session.add(subscription)
            await session.commit()
            
            # Audit log automatically created by trigger
            return subscription
```

### Alternatives Considered
- **Application-layer access control**: Rejected - RLS provides defense in depth, prevents SQL injection bypass
- **Shared database without RLS**: Rejected - violates PIPEDA privacy by design requirement
- **US data centers**: Rejected - violates Canadian data residency requirement (Principle 4)

### References
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- PIPEDA Section 5: Privacy by Design
- Constitutional Principle 4: Privacy by Design Architecture

---

## 8. 14-Day Cooling-Off Period Implementation

### Decision
Implement cooling-off period tracking in subscription lifecycle state machine, automatic full refund processing for cancellations within window, clear UI indicators during cooling-off period.

### Rationale
- **Legal Compliance**: Canadian consumer protection laws require cooling-off period for annual subscriptions (clarified as 14 days)
- **Trust Building**: Exceeds most provincial minimums, reduces purchase anxiety
- **Revenue Protection**: Minimize abuse while maintaining customer-friendly policy
- **Constitutional Alignment**: Principle 3 (Canadian Cultural Sensitivity) - consumer protection aligns with Canadian values

### Implementation Pattern
```python
# models/subscription.py
from datetime import datetime, timedelta
from decimal import Decimal

class PaidSubscription:
    id: str
    user_id: str
    tier: str
    billing_interval: str
    amount: Decimal
    created_at: datetime
    cooling_off_end: datetime  # created_at + 14 days
    
    def is_in_cooling_off_period(self) -> bool:
        return datetime.utcnow() <= self.cooling_off_end
    
    def eligible_for_full_refund(self) -> bool:
        # Full refund if canceled within cooling-off period
        return self.is_in_cooling_off_period() and self.billing_interval == 'yearly'
    
    async def cancel_with_refund(self):
        if self.eligible_for_full_refund():
            # Process Stripe refund
            refund = await stripe.Refund.create(
                payment_intent=self.stripe_payment_intent_id,
                amount=int(self.amount * 100)  # Convert to cents
            )
            self.status = 'canceled'
            self.refund_amount = self.amount
            self.refund_date = datetime.utcnow()
```

```typescript
// components/SubscriptionManagement.tsx
export function SubscriptionManagement() {
  const { subscription } = useSubscription();
  const isInCoolingOff = useMemo(() => {
    if (!subscription?.createdAt) return false;
    const endDate = new Date(subscription.createdAt);
    endDate.setDate(endDate.getDate() + 14);
    return new Date() <= endDate;
  }, [subscription]);
  
  return (
    <View>
      {isInCoolingOff && (
        <InfoBanner>
          You have {daysRemaining} days remaining for full refund cancellation.
        </InfoBanner>
      )}
      <Button 
        title={isInCoolingOff ? "Cancel with Full Refund" : "Cancel Subscription"}
        onPress={handleCancel}
      />
    </View>
  );
}
```

### Alternatives Considered
- **7-day cooling-off**: Rejected - clarification selected 14 days to exceed provincial minimums
- **No cooling-off for monthly**: Accepted - spec only requires for annual subscriptions
- **Prorated refund**: Rejected - consumer protection laws require full refund within cooling-off period

### References
- Competition Bureau Canada: Cooling-off periods for distance contracts
- Constitutional Principle 3: Canadian trust-building through consumer-friendly policies

---

## 9. Real-Time Trial Value Metrics Tracking

### Decision
Implement event-driven analytics service tracking premium feature usage during trial, aggregating metrics for trial dashboard (time saved, conflicts prevented, features explored).

### Rationale
- **Conversion Optimization**: Value demonstration increases conversion (85% cite specific value per success metric)
- **User Engagement**: Progress tracking gamifies trial experience
- **Product Intelligence**: Usage patterns inform feature prioritization
- **Constitutional Alignment**: Principle 1 (Cognitive Load) - visual progress indicators reduce anxiety

### Implementation Pattern
```python
# services/analytics_service.py
from datetime import datetime, timedelta

class TrialAnalyticsService:
    async def track_premium_feature_usage(self, user_id: str, feature: str, value_impact: dict):
        """
        Track premium feature usage with quantified value
        value_impact examples:
        - {'time_saved_minutes': 15} for automation
        - {'conflicts_prevented': 1} for smart detection
        - {'suggestions_accepted': 3} for ML predictions
        """
        async for session in get_async_session():
            event = TrialUsageEvent(
                user_id=user_id,
                feature=feature,
                timestamp=datetime.now(timezone('America/Toronto')),
                value_impact=value_impact
            )
            session.add(event)
            await session.commit()
    
    async def calculate_trial_value_metrics(self, user_id: str) -> dict:
        """Aggregate trial value metrics for dashboard"""
        async for session in get_async_session():
            events = await session.execute(
                select(TrialUsageEvent)
                .where(TrialUsageEvent.user_id == user_id)
                .where(TrialUsageEvent.timestamp >= trial_start)
            )
            
            total_time_saved = sum(e.value_impact.get('time_saved_minutes', 0) for e in events)
            conflicts_prevented = sum(e.value_impact.get('conflicts_prevented', 0) for e in events)
            features_explored = len(set(e.feature for e in events))
            
            return {
                'time_saved_hours': total_time_saved / 60,
                'conflicts_prevented': conflicts_prevented,
                'features_explored': features_explored,
                'value_score': self._calculate_value_score(total_time_saved, conflicts_prevented)
            }
```

```typescript
// hooks/useTrialMetrics.ts
export function useTrialMetrics() {
  const { data, loading } = useQuery(GET_TRIAL_METRICS);
  
  return {
    timeSavedHours: data?.trialMetrics?.timeSavedHours || 0,
    conflictsPrevented: data?.trialMetrics?.conflictsPrevented || 0,
    featuresExplored: data?.trialMetrics?.featuresExplored || 0,
    valueScore: data?.trialMetrics?.valueScore || 0,
    loading
  };
}

// components/TrialDashboard.tsx
export function TrialDashboard() {
  const metrics = useTrialMetrics();
  
  return (
    <View>
      <MetricCard 
        icon="clock" 
        value={metrics.timeSavedHours.toFixed(1)} 
        unit="hours saved"
        color="green"
      />
      <MetricCard 
        icon="shield-check" 
        value={metrics.conflictsPrevented} 
        unit="conflicts prevented"
        color="blue"
      />
      <ProgressRing 
        progress={metrics.featuresExplored / 5}  // 5 premium features
        label="Features Explored"
      />
    </View>
  );
}
```

### Alternatives Considered
- **Manual value logging**: Rejected - increases user burden, low completion rate
- **Post-trial survey**: Rejected - retrospective bias, lower accuracy
- **Third-party analytics**: Considered - deferred to Phase 2 for deeper insights integration

### References
- Behavioral Economics: Progress indicators increase task completion (Heath et al., 2006)
- Constitutional Principle 1: Visual hierarchy and progress tracking reduce cognitive load

---

## Summary of Key Decisions

| Area | Decision | Constitutional Principle |
|------|----------|-------------------------|
| **Payment Processing** | Stripe React Native SDK with native PaymentSheet | Principle 14 (Premium Dependencies), Principle 18 (Cross-Platform) |
| **Tax Calculation** | Server-side Canadian tax service with provincial rates | Principle 2 (Stress Reduction), Principle 5 (Transparency) |
| **Trial Management** | Email-only activation, 14-day duration, no credit card | Principle 1 (Cognitive Load), Principle 3 (Trust Building) |
| **GraphQL Schema** | Strawberry with camelCase aliases, subscription-based updates | Principle 8 (Schema Integrity), Principle 6 (Failure Prevention) |
| **Data Storage** | useUniversalStorage hook for cross-platform trial status | Principle 18 (Platform-Agnostic Storage) |
| **Bilingual Support** | react-i18next with device locale detection, EN/FR | Principle 3 (Canadian Cultural Sensitivity) |
| **PIPEDA Compliance** | RLS policies, audit logging, Canadian data centers | Principle 4 (Privacy by Design), Principle 5 (Consent) |
| **Cooling-Off Period** | 14-day full refund window for annual subscriptions | Principle 3 (Consumer Protection) |
| **Value Metrics** | Event-driven analytics with real-time trial dashboard | Principle 1 (Visual Progress), Conversion Optimization |

---

## Open Questions for Phase 1 Design

1. **Stripe Webhook Configuration**: Where should webhook endpoint live (backend /webhooks/stripe)? What events to subscribe to?
2. **Tax Rate Updates**: How often to update provincial tax rates? Manual config vs. automated sync?
3. **Trial Extension Logic**: Implementation details for deferred clarification (FR-015) - decided in tasks phase
4. **Feature-Specific Prompts**: Unified vs. category-specific approach - decided in tasks phase
5. **Multi-Household Billing**: Cost-sharing technical implementation - decided in tasks phase

These questions will be resolved during Phase 1 (contracts & data model) or deferred to Phase 2 (tasks).

---

**Research Status**: ✅ COMPLETE  
**Next Phase**: Phase 1 - Design & Contracts (data-model.md, contracts/, quickstart.md)

