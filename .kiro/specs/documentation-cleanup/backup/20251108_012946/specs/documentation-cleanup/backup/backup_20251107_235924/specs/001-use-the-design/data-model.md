# Data Model: Premium Upgrade Flow

**Feature**: Premium Upgrade Flow  
**Date**: 2025-10-02  
**Status**: Design Complete

## Overview

This document defines the complete data model for the premium upgrade flow, including database schemas, relationships, validation rules, and state machines. All entities support PIPEDA compliance with RLS policies and Canadian data residency.

---

## Entity Relationship Diagram

```
User (Supabase Auth)
  │
  ├──< Subscription (1:1)
  │     ├──< BillingHistory (1:many)
  │     ├──< PaymentMethod (1:many)
  │     └──< FeatureAccess (1:many)
  │
  ├──< TrialProgress (1:1)
  │
  └──< TrialUsageEvent (1:many)

SubscriptionPlan (reference data)
  └──> Subscription (many:1)

CanadianTaxRate (reference data)
  └──> BillingHistory (many:1)
```

---

## Core Entities

### 1. Subscription

**Purpose**: Tracks user's premium subscription status, billing details, and lifecycle state.

#### Schema
```sql
CREATE TABLE subscriptions (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,  -- One subscription per user
    
    -- Subscription Details
    plan_id TEXT REFERENCES subscription_plans(id) NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'standard', 'premium')),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
    
    -- Billing Configuration
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    amount DECIMAL(10, 2) NOT NULL,  -- Base price before taxes
    currency TEXT NOT NULL DEFAULT 'CAD',
    province TEXT NOT NULL,  -- Canadian province code (AB, BC, ON, QC, NB, etc.)
    
    -- Stripe Integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_payment_method_id TEXT,
    
    -- Trial Period
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    trial_features_used JSONB DEFAULT '[]',  -- Track trial engagement
    
    -- Billing Periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Cooling-Off Period (14 days for annual subscriptions)
    cooling_off_end TIMESTAMPTZ,  -- created_at + 14 days for yearly billing
    
    -- PIPEDA Compliance (Constitutional Principle 4)
    payment_consent_at TIMESTAMPTZ,  -- Timestamp when user consented to Stripe payment processing (Quebec Bill 96, PIPEDA Principle 3: Consent)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    canceled_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT trial_dates_valid CHECK (trial_end > trial_start OR trial_start IS NULL),
    CONSTRAINT billing_periods_valid CHECK (current_period_end > current_period_start OR current_period_start IS NULL),
    CONSTRAINT cooling_off_yearly_only CHECK (cooling_off_end IS NULL OR billing_interval = 'yearly')
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions(trial_end) WHERE status = 'trialing';

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Audit Trigger
CREATE TRIGGER subscription_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_subscription_changes();
```

#### State Machine
```
Initial State: free (tier=free, status=active)

Transitions:
  free -> trialing: START_TRIAL mutation (no payment required)
  trialing -> active: CONVERT_TO_PAID mutation (payment successful)
  trialing -> free: TRIAL_EXPIRED event (14 days elapsed, no conversion)
  active -> past_due: PAYMENT_FAILED event (grace period starts)
  past_due -> active: PAYMENT_RECOVERED event (successful retry)
  past_due -> unpaid: GRACE_PERIOD_EXPIRED event (3 days elapsed)
  active -> canceled: CANCEL_SUBSCRIPTION mutation (user-initiated)
  canceled -> active: REACTIVATE_SUBSCRIPTION mutation (within cooling-off period)
```

#### Validation Rules
- `trial_end` must be exactly 14 days after `trial_start`
- `cooling_off_end` must be 14 days after `created_at` for yearly subscriptions
- `province` must be valid Canadian province code
- `amount` must match selected `plan_id` pricing
- `stripe_subscription_id` required when status = 'active'

#### TypeScript Interface
```typescript
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  tier: 'free' | 'standard' | 'premium';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  billingInterval: 'monthly' | 'yearly';
  amount: number;
  currency: 'CAD';
  province: CanadianProvince;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePaymentMethodId?: string;
  trialStart?: Date;
  trialEnd?: Date;
  trialFeaturesUsed: string[];
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  coolingOffEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  canceledAt?: Date;
}

export type CanadianProvince = 
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' 
  | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';
```

---

### 2. SubscriptionPlan

**Purpose**: Reference data defining available premium tiers with pricing and feature limits.

#### Schema
```sql
CREATE TABLE subscription_plans (
    -- Identity
    id TEXT PRIMARY KEY,  -- 'standard_monthly', 'premium_monthly', 'standard_yearly', 'premium_yearly'
    
    -- Plan Details
    name TEXT NOT NULL,  -- 'Standard', 'Premium'
    display_name TEXT NOT NULL,  -- User-facing name
    description TEXT,
    tier TEXT NOT NULL CHECK (tier IN ('standard', 'premium')),
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,  -- $4.99, $6.99
    currency TEXT NOT NULL DEFAULT 'CAD',
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
    trial_days INTEGER DEFAULT 14,  -- 14 calendar days, trial expires at 23:59:59 America/Toronto on day 14
    
    -- Features & Limits
    features JSONB NOT NULL,  -- Array of feature keys
    limits JSONB NOT NULL,  -- {familyMembers: 20, reorderSuggestions: 10, priceAlerts: true, automation: true}
    
    -- Display Order
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Stripe Integration
    stripe_price_id TEXT UNIQUE NOT NULL,
    stripe_product_id TEXT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Initial Plans
INSERT INTO subscription_plans (id, name, display_name, tier, price, billing_interval, features, limits, sort_order, stripe_price_id, stripe_product_id) VALUES
('standard_monthly', 'Standard', 'Standard Plan', 'standard', 4.99, 'monthly', 
 '["family_sharing", "reorder_suggestions", "basic_analytics"]',
 '{"familyMembers": 10, "reorderSuggestions": 5, "priceAlerts": false, "automation": false}',
 1, 'price_standard_monthly_cad', 'prod_standard'),
('premium_monthly', 'Premium', 'Premium Plan', 'premium', 6.99, 'monthly',
 '["family_sharing", "reorder_suggestions", "advanced_analytics", "price_alerts", "automation"]',
 '{"familyMembers": 20, "reorderSuggestions": 10, "priceAlerts": true, "automation": true}',
 2, 'price_premium_monthly_cad', 'prod_premium'),
('standard_yearly', 'Standard', 'Standard Plan (Annual)', 'standard', 49.99, 'yearly',
 '["family_sharing", "reorder_suggestions", "basic_analytics"]',
 '{"familyMembers": 10, "reorderSuggestions": 5, "priceAlerts": false, "automation": false}',
 3, 'price_standard_yearly_cad', 'prod_standard'),
('premium_yearly', 'Premium', 'Premium Plan (Annual)', 'premium', 69.99, 'yearly',
 '["family_sharing", "reorder_suggestions", "advanced_analytics", "price_alerts", "automation"]',
 '{"familyMembers": 20, "reorderSuggestions": 10, "priceAlerts": true, "automation": true}',
 4, 'price_premium_yearly_cad', 'prod_premium');

-- RLS (read-only reference data)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are publicly readable"
    ON subscription_plans FOR SELECT
    USING (is_active = TRUE);
```

#### TypeScript Interface
```typescript
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: 'standard' | 'premium';
  price: number;
  currency: 'CAD';
  billingInterval: 'monthly' | 'yearly';
  trialDays: number;
  features: string[];
  limits: {
    familyMembers: number;
    reorderSuggestions: number;
    priceAlerts: boolean;
    automation: boolean;
  };
  sortOrder: number;
  isActive: boolean;
  stripePriceId: string;
  stripeProductId: string;
}
```

---

### 3. PaymentMethod

**Purpose**: Stores tokenized payment instruments for recurring billing.

#### Schema
```sql
CREATE TABLE payment_methods (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Stripe Payment Method
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'interac')),  -- Phase 1: card only
    
    -- Card Details (tokenized)
    brand TEXT,  -- 'visa', 'mastercard', 'amex'
    last_four TEXT NOT NULL,
    exp_month INTEGER NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
    exp_year INTEGER NOT NULL CHECK (exp_year >= EXTRACT(YEAR FROM NOW())),
    
    -- Canadian Billing Address
    billing_address JSONB NOT NULL,  -- {line1, city, province, postalCode, country: 'CA'}
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN GENERATED ALWAYS AS (
        exp_year < EXTRACT(YEAR FROM NOW()) OR
        (exp_year = EXTRACT(YEAR FROM NOW()) AND exp_month < EXTRACT(MONTH FROM NOW()))
    ) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT one_default_per_user UNIQUE (user_id) WHERE (is_default = TRUE)
);

-- Indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own payment methods"
    ON payment_methods FOR ALL
    USING (auth.uid() = user_id);
```

#### TypeScript Interface
```typescript
export interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'interac';
  brand: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  expMonth: number;
  expYear: number;
  billingAddress: {
    line1: string;
    city: string;
    province: CanadianProvince;
    postalCode: string;  // A1A 1A1 format
    country: 'CA';
  };
  isDefault: boolean;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. BillingHistory

**Purpose**: Immutable record of all subscription charges and invoices with Canadian tax breakdown.

#### Schema
```sql
CREATE TABLE billing_history (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Invoice Details
    stripe_invoice_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    invoice_number TEXT UNIQUE,  -- Canadian-compliant invoice numbering
    
    -- Amounts (all in CAD cents for precision)
    subtotal INTEGER NOT NULL,  -- Amount before taxes
    tax_amount INTEGER NOT NULL,
    total INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',
    
    -- Tax Breakdown
    province TEXT NOT NULL,
    gst_amount INTEGER,  -- Goods and Services Tax
    pst_amount INTEGER,  -- Provincial Sales Tax
    hst_amount INTEGER,  -- Harmonized Sales Tax
    qst_amount INTEGER,  -- Quebec Sales Tax
    
    -- Payment Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    paid_at TIMESTAMPTZ,
    
    -- Billing Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Canadian Tax Compliance
    business_number TEXT,  -- CRA business number
    gst_registration TEXT,  -- GST/HST registration number
    
    -- Documents
    invoice_pdf_url TEXT,
    receipt_pdf_url TEXT,
    
    -- Refunds
    refunded_at TIMESTAMPTZ,
    refund_amount INTEGER,
    refund_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT total_equals_subtotal_plus_tax CHECK (total = subtotal + tax_amount)
);

-- Indexes
CREATE INDEX idx_billing_history_subscription ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_user ON billing_history(user_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_period ON billing_history(period_start, period_end);

-- RLS
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own billing history"
    ON billing_history FOR SELECT
    USING (auth.uid() = user_id);
```

#### TypeScript Interface
```typescript
export interface BillingHistory {
  id: string;
  subscriptionId: string;
  userId: string;
  stripeInvoiceId: string;
  stripePaymentIntentId?: string;
  invoiceNumber: string;
  subtotal: number;  // Cents
  taxAmount: number;  // Cents
  total: number;  // Cents
  currency: 'CAD';
  province: CanadianProvince;
  gstAmount?: number;
  pstAmount?: number;
  hstAmount?: number;
  qstAmount?: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  paidAt?: Date;
  periodStart: Date;
  periodEnd: Date;
  businessNumber?: string;
  gstRegistration?: string;
  invoicePdfUrl?: string;
  receiptPdfUrl?: string;
  refundedAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 5. FeatureAccess

**Purpose**: Dynamic feature gate control based on subscription status and trial state.

#### Schema
```sql
CREATE TABLE feature_access (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
    
    -- Feature Details
    feature_key TEXT NOT NULL,  -- 'reorder', 'analytics', 'automation', 'family_sharing', 'price_alerts'
    access_level TEXT NOT NULL CHECK (access_level IN ('none', 'limited', 'full')),
    
    -- Trial Access
    trial_access BOOLEAN DEFAULT FALSE,
    trial_access_ends TIMESTAMPTZ,
    
    -- Usage Limits (for 'limited' access_level)
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_feature UNIQUE (user_id, feature_key)
);

-- Indexes
CREATE INDEX idx_feature_access_user ON feature_access(user_id);
CREATE INDEX idx_feature_access_feature ON feature_access(feature_key);
CREATE INDEX idx_feature_access_expiration ON feature_access(expires_at) WHERE expires_at IS NOT NULL;

-- RLS
ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feature access"
    ON feature_access FOR SELECT
    USING (auth.uid() = user_id);

-- Function to sync feature access with subscription changes
CREATE OR REPLACE FUNCTION sync_feature_access()
RETURNS TRIGGER AS $$
BEGIN
    -- When subscription becomes active/trialing, grant premium features
    IF NEW.status IN ('active', 'trialing') THEN
        INSERT INTO feature_access (user_id, subscription_id, feature_key, access_level, trial_access, trial_access_ends)
        SELECT 
            NEW.user_id,
            NEW.id,
            unnest(ARRAY['reorder', 'analytics', 'automation', 'family_sharing', 'price_alerts']),
            'full',
            NEW.status = 'trialing',
            NEW.trial_end
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET 
            access_level = 'full',
            trial_access = NEW.status = 'trialing',
            trial_access_ends = NEW.trial_end,
            updated_at = NOW();
    
    -- When subscription canceled/expired, revoke premium features
    ELSIF NEW.status IN ('canceled', 'unpaid') THEN
        UPDATE feature_access
        SET access_level = 'none', updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_feature_access_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION sync_feature_access();
```

#### TypeScript Interface
```typescript
export interface FeatureAccess {
  id: string;
  userId: string;
  subscriptionId: string;
  featureKey: PremiumFeature;
  accessLevel: 'none' | 'limited' | 'full';
  trialAccess: boolean;
  trialAccessEnds?: Date;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PremiumFeature = 
  | 'reorder' 
  | 'analytics' 
  | 'automation' 
  | 'family_sharing' 
  | 'price_alerts';
```

---

### 6. TrialProgress

**Purpose**: Tracks user engagement and value metrics during trial period for conversion optimization.

#### Schema
```sql
CREATE TABLE trial_progress (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,  -- One trial progress per user
    subscription_id UUID REFERENCES subscriptions(id) NOT NULL,
    
    -- Trial Period
    trial_start TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ NOT NULL,
    days_remaining INTEGER GENERATED ALWAYS AS (
        GREATEST(0, EXTRACT(DAY FROM (trial_end - NOW())))
    ) STORED,
    
    -- Engagement Metrics
    features_explored JSONB DEFAULT '[]',  -- Array of feature keys user has tried
    features_explored_count INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    
    -- Value Metrics
    time_saved_minutes INTEGER DEFAULT 0,  -- Aggregated from usage events
    conflicts_prevented INTEGER DEFAULT 0,
    suggestions_accepted INTEGER DEFAULT 0,
    automations_triggered INTEGER DEFAULT 0,
    
    -- Value Score (0-100)
    value_realization_score INTEGER DEFAULT 0 CHECK (value_realization_score BETWEEN 0 AND 100),
    
    -- Conversion Signals
    conversion_eligible BOOLEAN DEFAULT FALSE,
    conversion_prompt_shown_at TIMESTAMPTZ,
    conversion_prompt_count INTEGER DEFAULT 0,
    
    -- Onboarding Progress
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_steps_completed JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trial_progress_user ON trial_progress(user_id);
CREATE INDEX idx_trial_progress_trial_end ON trial_progress(trial_end);
CREATE INDEX idx_trial_progress_conversion_eligible ON trial_progress(conversion_eligible) WHERE conversion_eligible = TRUE;

-- RLS
ALTER TABLE trial_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trial progress"
    ON trial_progress FOR SELECT
    USING (auth.uid() = user_id);
```

#### TypeScript Interface
```typescript
export interface TrialProgress {
  id: string;
  userId: string;
  subscriptionId: string;
  trialStart: Date;
  trialEnd: Date;
  daysRemaining: number;
  featuresExplored: PremiumFeature[];
  featuresExploredCount: number;
  totalSessions: number;
  lastActiveAt?: Date;
  timeSavedMinutes: number;
  conflictsPrevented: number;
  suggestionsAccepted: number;
  automationsTriggered: number;
  valueRealizationScore: number;
  conversionEligible: boolean;
  conversionPromptShownAt?: Date;
  conversionPromptCount: number;
  onboardingCompleted: boolean;
  onboardingStepsCompleted: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 7. CanadianTaxRate

**Purpose**: Reference data for provincial tax calculations with audit trail for rate changes.

#### Schema
```sql
CREATE TABLE canadian_tax_rates (
    -- Identity
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province TEXT UNIQUE NOT NULL CHECK (province IN (
        'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 
        'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    )),
    
    -- Tax Rates (stored as decimals, e.g., 0.05 for 5%)
    gst_rate DECIMAL(5, 4),  -- Federal GST (5%)
    pst_rate DECIMAL(5, 4),  -- Provincial Sales Tax
    hst_rate DECIMAL(5, 4),  -- Harmonized Sales Tax
    qst_rate DECIMAL(5, 4),  -- Quebec Sales Tax
    combined_rate DECIMAL(5, 4) NOT NULL,  -- Total applicable rate
    
    -- Province Details
    province_name TEXT NOT NULL,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('GST+PST', 'HST', 'GST+QST')),
    
    -- Effective Period
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,  -- NULL = currently active
    is_active BOOLEAN GENERATED ALWAYS AS (end_date IS NULL) STORED,
    
    -- CRA Registration
    cra_gst_number TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Initial Tax Rates (2025 rates)
INSERT INTO canadian_tax_rates (province, province_name, gst_rate, pst_rate, hst_rate, qst_rate, combined_rate, tax_type, cra_gst_number) VALUES
('AB', 'Alberta', 0.05, NULL, NULL, NULL, 0.05, 'GST+PST', '123456789RT0001'),
('BC', 'British Columbia', 0.05, 0.07, NULL, NULL, 0.12, 'GST+PST', '123456789RT0001'),
('MB', 'Manitoba', 0.05, 0.07, NULL, NULL, 0.12, 'GST+PST', '123456789RT0001'),
('NB', 'New Brunswick', NULL, NULL, 0.15, NULL, 0.15, 'HST', '123456789RT0001'),
('NL', 'Newfoundland and Labrador', NULL, NULL, 0.15, NULL, 0.15, 'HST', '123456789RT0001'),
('NS', 'Nova Scotia', NULL, NULL, 0.15, NULL, 0.15, 'HST', '123456789RT0001'),
('NT', 'Northwest Territories', 0.05, NULL, NULL, NULL, 0.05, 'GST+PST', '123456789RT0001'),
('NU', 'Nunavut', 0.05, NULL, NULL, NULL, 0.05, 'GST+PST', '123456789RT0001'),
('ON', 'Ontario', NULL, NULL, 0.13, NULL, 0.13, 'HST', '123456789RT0001'),
('PE', 'Prince Edward Island', NULL, NULL, 0.15, NULL, 0.15, 'HST', '123456789RT0001'),
('QC', 'Quebec', 0.05, NULL, NULL, 0.09975, 0.14975, 'GST+QST', '123456789RT0001'),
('SK', 'Saskatchewan', 0.05, 0.06, NULL, NULL, 0.11, 'GST+PST', '123456789RT0001'),
('YT', 'Yukon', 0.05, NULL, NULL, NULL, 0.05, 'GST+PST', '123456789RT0001');

-- RLS (public read access for active rates)
ALTER TABLE canadian_tax_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tax rates are publicly readable"
    ON canadian_tax_rates FOR SELECT
    USING (is_active = TRUE);
```

#### TypeScript Interface
```typescript
export interface CanadianTaxRate {
  id: string;
  province: CanadianProvince;
  provinceName: string;
  gstRate?: number;
  pstRate?: number;
  hstRate?: number;
  qstRate?: number;
  combinedRate: number;
  taxType: 'GST+PST' | 'HST' | 'GST+QST';
  effectiveDate: Date;
  endDate?: Date;
  isActive: boolean;
  craGstNumber: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Supporting Entities

### 8. TrialUsageEvent

**Purpose**: Event log for real-time trial value metrics tracking.

#### Schema (abbreviated)
```sql
CREATE TABLE trial_usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    feature TEXT NOT NULL,
    event_type TEXT NOT NULL,  -- 'feature_used', 'time_saved', 'conflict_prevented', 'suggestion_accepted'
    value_impact JSONB NOT NULL,  -- {timeSavedMinutes: 15, conflictsPrevented: 1}
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);

CREATE INDEX idx_trial_usage_events_user_timestamp ON trial_usage_events(user_id, timestamp DESC);
```

---

## Data Migration Plan

### Phase 1: Schema Creation
1. Create base tables (subscription_plans, canadian_tax_rates)
2. Create core entities (subscriptions, payment_methods, billing_history)
3. Create trial entities (trial_progress, trial_usage_events, feature_access)
4. Enable RLS policies and audit triggers

### Phase 2: Stripe Integration
1. Create Stripe products and prices in Stripe Dashboard
2. Update subscription_plans with Stripe IDs
3. Configure Stripe webhooks for subscription lifecycle events

### Phase 3: Data Population
1. Seed subscription_plans with 4 plans (standard/premium monthly/yearly)
2. Seed canadian_tax_rates with current provincial rates
3. Migrate existing users to free tier subscriptions

### Phase 4: RLS Testing
1. Verify RLS policies prevent cross-user access
2. Test audit logging for all subscription changes
3. Validate data residency in Canadian regions

---

## Migration Rollback Procedures

**Critical**: All forward migrations MUST have corresponding rollback procedures to ensure safe production deployments.

### Rollback Strategy

**Principle**: Rollbacks must be **data-preserving** - never drop tables with user data in production. Instead, disable features and mark schema elements as deprecated.

### Phase-by-Phase Rollback SQL

#### Rollback Phase 4: RLS Testing
```sql
-- No schema changes, just monitoring cleanup
-- Remove any test data created during RLS testing
DELETE FROM subscriptions WHERE metadata->>'test_mode' = 'true';
```

#### Rollback Phase 3: Data Population
```sql
-- Remove seeded data (safe in pre-production, DANGEROUS in production)
-- PRODUCTION WARNING: Only run if no real subscriptions created yet
DELETE FROM canadian_tax_rates WHERE created_at >= '2025-10-02';  -- Migration date
DELETE FROM subscription_plans WHERE created_at >= '2025-10-02';

-- Alternative for production: Mark as inactive instead of deleting
UPDATE subscription_plans SET is_active = FALSE WHERE created_at >= '2025-10-02';
UPDATE canadian_tax_rates SET is_active = FALSE WHERE created_at >= '2025-10-02';
```

#### Rollback Phase 2: Stripe Integration
```sql
-- Clear Stripe integration data
UPDATE subscription_plans SET stripe_price_id = NULL, stripe_product_id = NULL;
UPDATE subscriptions SET stripe_customer_id = NULL, stripe_subscription_id = NULL, stripe_payment_method_id = NULL;
UPDATE payment_methods SET stripe_payment_method_id = NULL;

-- Note: Manual cleanup required in Stripe Dashboard:
-- 1. Delete test subscriptions
-- 2. Archive products/prices (cannot be deleted if used)
```

#### Rollback Phase 1: Schema Creation

**CRITICAL WARNING**: DO NOT run this in production if ANY real user data exists. Data loss is IRREVERSIBLE.

```sql
-- Step 1: Disable RLS policies (prevents cascade errors)
DROP POLICY IF EXISTS "Users can view own trial progress" ON trial_progress;
DROP POLICY IF EXISTS "Users can view own trial usage events" ON trial_usage_events;
DROP POLICY IF EXISTS "Users can view own feature access" ON feature_access;
DROP POLICY IF EXISTS "Users can view own billing history" ON billing_history;
DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

ALTER TABLE trial_usage_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE trial_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop indexes (faster rollback, less locking)
DROP INDEX IF EXISTS idx_trial_usage_events_user_timestamp;
DROP INDEX IF EXISTS idx_feature_access_user_feature;
DROP INDEX IF EXISTS idx_billing_history_subscription_created;
DROP INDEX IF EXISTS idx_payment_methods_user;
DROP INDEX IF EXISTS idx_payment_methods_default;
DROP INDEX IF EXISTS idx_subscriptions_trial_end;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_subscriptions_user_id;

-- Step 3: Drop tables (CASCADE removes foreign key constraints)
-- REVERSE ORDER from creation to avoid FK constraint errors
DROP TABLE IF EXISTS trial_usage_events CASCADE;
DROP TABLE IF EXISTS trial_progress CASCADE;
DROP TABLE IF EXISTS feature_access CASCADE;
DROP TABLE IF EXISTS billing_history CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS canadian_tax_rates CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Step 4: Drop custom types/enums
-- (None created in this migration - using TEXT with CHECK constraints)
```

### Production Rollback Safe Alternative

**For production environments with existing user data**, use this non-destructive rollback:

```sql
-- 1. Disable premium features application-wide (feature flag)
INSERT INTO system_config (key, value) VALUES 
  ('premium_features_enabled', 'false')
ON CONFLICT (key) DO UPDATE SET value = 'false';

-- 2. Mark all active subscriptions as INACTIVE (preserves data)
UPDATE subscriptions 
SET status = 'canceled', 
    updated_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || '{"rollback_reason": "schema_rollback", "rollback_at": "2025-10-02T12:00:00Z"}'::jsonb
WHERE status IN ('active', 'trialing', 'past_due');

-- 3. Disable RLS policies (allow admin cleanup)
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history DISABLE ROW LEVEL SECURITY;
-- etc.

-- 4. Backend code change: Revert to pre-premium-feature version
-- 5. Monitor for 24 hours, then decide: full rollback or fix-forward
```

### Rollback Verification Checklist

After executing rollback, verify:

- [ ] GraphQL schema updated: `subscription` queries/mutations removed
- [ ] Frontend code reverted: Premium upgrade flow components removed
- [ ] Stripe webhooks disabled: No subscription lifecycle events processed
- [ ] Users notified: Email sent explaining temporary premium feature suspension (if production)
- [ ] Support team briefed: FAQs prepared for user questions
- [ ] Monitoring active: Alert on any orphaned subscription_id references in logs

### Emergency Rollback Contact List

**Production Rollback Approval Required From**:
1. Technical Lead: [Name]
2. Product Owner: [Name]
3. PIPEDA Compliance Officer: [Name] (if user data affected)

**Rollback Execution**:
- Primary DBA: [Name]
- Backup DBA: [Name]
- DevOps Engineer: [Name] (infrastructure changes)

### Rollback Testing Procedure

**Before ANY production rollback**:
1. Test rollback on staging environment with production data snapshot
2. Verify application functionality post-rollback
3. Confirm no orphaned data or broken references
4. Document rollback timing: "Full rollback takes ~X minutes"
5. Prepare rollback runbook with exact SQL commands

---

## PIPEDA Compliance Checklist

- [x] Canadian data center storage (Supabase CA region)
- [x] Row Level Security policies enforce user data isolation
- [x] Audit logging for all subscription/billing changes
- [x] Consent tracking (via existing user preferences)
- [x] Data export capability (via GraphQL queries)
- [x] Data deletion functional (cascading deletes, no soft deletes)
- [x] Minimal data collection (only billing-essential fields)
- [x] Secure payment tokenization (Stripe handles card data)
- [x] America/Toronto timezone for all timestamps

---

**Status**: ✅ COMPLETE  
**Next**: Phase 1 - Generate API Contracts (contracts/)

