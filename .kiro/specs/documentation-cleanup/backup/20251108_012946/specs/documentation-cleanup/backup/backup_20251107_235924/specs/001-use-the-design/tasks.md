# Tasks: Premium Upgrade Flow

**Input**: Design documents from `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/specs/001-use-the-design/`  
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md  
**Branch**: `001-use-the-design`  
**Estimated Duration**: 6-8 weeks  
**Total Tasks**: 57 tasks across 5 phases

## Execution Flow Summary
```
Phase 3.1: Setup & Infrastructure (T001-T010)
  ↓
Phase 3.2: Tests First - TDD (T011-T025) ⚠️ MUST FAIL BEFORE IMPLEMENTATION
  ↓
Phase 3.3: Core Implementation (T026-T050)
  Backend API (T026-T034)
  Frontend Components (T035-T050)
  ↓
Phase 3.4: Integration & E2E Tests (T051-T055)
  ↓
Phase 3.5: Polish & Deployment (T056-T057)
```

**Key Principles**:
- ✅ TDD: All tests written and failing before implementation
- ✅ Parallel [P]: Tasks with different files and no dependencies
- ✅ Constitutional Compliance: Each task references relevant principles
- ✅ Specific File Paths: Every task includes exact file locations

---

## Phase 3.1: Setup & Infrastructure

### T001: Create Stripe SDK configuration files
**Description**: Initialize Stripe SDK for backend (Python) and frontend (React Native) with test mode credentials.

**Files to Create**:
- `NestSync-backend/app/config/stripe_config.py`
- `NestSync-frontend/config/stripe.ts`

**Acceptance Criteria**:
1. Backend Stripe client initialized with secret key from environment
2. Frontend @stripe/stripe-react-native configured with publishable key
3. Test mode credentials documented in `.env.example`
4. Canada (CA) set as default country code
5. CAD currency configured as default

**Constitutional Principles**: 14 (Premium Dependencies), 19 (Dev Configuration)

**Dependencies**: None

**Test Command**: `pytest tests/unit/test_stripe_config.py`

**Estimated Time**: 2 hours

---

### T002: [P] Create database migration for subscription tables
**Description**: Create Alembic migration for subscriptions, subscription_plans, and feature_access tables with RLS policies.

**Files to Create**:
- `NestSync-backend/alembic/versions/001_create_subscription_tables.py`

**Acceptance Criteria**:
1. `subscriptions` table created with all columns from data-model.md
2. `subscription_plans` table created with 4 initial plans seeded
3. `feature_access` table created with sync trigger function
4. RLS policies enabled for all three tables
5. Indexes created for user_id, status, trial_end columns
6. Migration runs successfully: `alembic upgrade head`

**Constitutional Principles**: 4 (Privacy by Design), 5 (Transparent Consent)

**Dependencies**: None (can run parallel with T003, T004)

**Test Command**: `alembic upgrade head && python -m pytest tests/integration/test_subscription_migrations.py`

**Estimated Time**: 4 hours

---

### T003: [P] Create database migration for billing tables
**Description**: Create Alembic migration for billing_history, payment_methods, and canadian_tax_rates tables.

**Files to Create**:
- `NestSync-backend/alembic/versions/002_create_billing_tables.py`

**Acceptance Criteria**:
1. `billing_history` table created with Canadian tax breakdown columns
2. `payment_methods` table created with Stripe token storage
3. `canadian_tax_rates` table created and seeded with 13 provinces
4. RLS policies enabled for billing_history and payment_methods
5. Total calculation constraint: `total = subtotal + tax_amount`
6. Migration runs successfully

**Constitutional Principles**: 4 (Privacy by Design), 5 (Canadian Timezone)

**Dependencies**: None (can run parallel with T002, T004)

**Test Command**: `alembic upgrade head && python -m pytest tests/integration/test_billing_migrations.py`

**Estimated Time**: 4 hours

---

### T004: [P] Create database migration for trial tables
**Description**: Create Alembic migration for trial_progress and trial_usage_events tables.

**Files to Create**:
- `NestSync-backend/alembic/versions/003_create_trial_tables.py`

**Acceptance Criteria**:
1. `trial_progress` table created with value metric columns
2. `trial_usage_events` table created for event logging
3. Generated column for days_remaining calculation
4. RLS policies enabled for both tables
5. Indexes created for user_id and timestamp columns
6. Migration runs successfully

**Constitutional Principles**: 4 (Privacy by Design), 1 (Value Tracking)

**Dependencies**: None (can run parallel with T002, T003)

**Test Command**: `alembic upgrade head && python -m pytest tests/integration/test_trial_migrations.py`

**Estimated Time**: 3 hours

---

### T005: Implement audit logging triggers
**Description**: Create PostgreSQL trigger functions for subscription audit logging per PIPEDA requirements.

**Files to Create**:
- `NestSync-backend/alembic/versions/004_create_audit_triggers.py`

**Acceptance Criteria**:
1. `subscription_audit_log` table created
2. `audit_subscription_changes()` trigger function created
3. Trigger fires on INSERT, UPDATE, DELETE for subscriptions table
4. Old and new values stored as JSONB
5. IP address captured: `inet_client_addr()`
6. Audit logs queryable for compliance reporting

**Constitutional Principles**: 5 (Transparent Consent), 4 (Privacy by Design)

**Dependencies**: T002 (subscriptions table must exist)

**Test Command**: `python -m pytest tests/integration/test_audit_logging.py`

**Estimated Time**: 3 hours

---

### T006: [P] Create SQLAlchemy models for subscription entities
**Description**: Implement SQLAlchemy ORM models for Subscription, SubscriptionPlan, FeatureAccess.

**Files to Create**:
- `NestSync-backend/app/models/subscription.py`
- `NestSync-backend/app/models/subscription_plan.py`
- `NestSync-backend/app/models/feature_access.py`

**Acceptance Criteria**:
1. Models match database schema from migrations
2. Relationships defined: Subscription -> SubscriptionPlan, FeatureAccess
3. State machine methods: `is_in_cooling_off_period()`, `is_trial_active()`
4. America/Toronto timezone used for all datetime operations
5. Type hints for all fields
6. `__repr__` methods for debugging

**Constitutional Principles**: 5 (Canadian Timezone), 7 (Async Patterns)

**Dependencies**: T002 (database tables must exist)

**Test Command**: `python -m pytest tests/unit/test_subscription_models.py`

**Estimated Time**: 4 hours

---

### T007: [P] Create SQLAlchemy models for billing entities
**Description**: Implement SQLAlchemy ORM models for BillingHistory, PaymentMethod, CanadianTaxRate.

**Files to Create**:
- `NestSync-backend/app/models/billing_history.py`
- `NestSync-backend/app/models/payment_method.py`
- `NestSync-backend/app/models/canadian_tax_rate.py`

**Acceptance Criteria**:
1. Models match database schema from migrations
2. Money amounts stored as integers (cents) per Stripe convention
3. Canadian tax breakdown properties: `gst_amount`, `pst_amount`, etc.
4. Payment method expiration check: `is_expired` property
5. Invoice number generation method
6. Type hints and validation

**Constitutional Principles**: 4 (Privacy by Design), 5 (Canadian Timezone)

**Dependencies**: T003 (database tables must exist)

**Test Command**: `python -m pytest tests/unit/test_billing_models.py`

**Estimated Time**: 4 hours

---

### T008: [P] Create SQLAlchemy models for trial entities
**Description**: Implement SQLAlchemy ORM models for TrialProgress, TrialUsageEvent.

**Files to Create**:
- `NestSync-backend/app/models/trial_progress.py`
- `NestSync-backend/app/models/trial_usage_event.py`

**Acceptance Criteria**:
1. Models match database schema from migrations
2. Value score calculation method (0-100 algorithm from research.md)
3. Conversion eligibility logic: score >= 60, days active >= 8, features >= 3
4. Time saved aggregation from usage events
5. Features explored tracking as JSONB array
6. Type hints and validation

**Constitutional Principles**: 1 (Cognitive Load), 10 (Value Demonstration)

**Dependencies**: T004 (database tables must exist)

**Test Command**: `python -m pytest tests/unit/test_trial_models.py`

**Estimated Time**: 3 hours

---

### T009: [P] Generate TypeScript interfaces from GraphQL schema
**Description**: Create TypeScript interfaces for all GraphQL types in contracts/ directory.

**Files to Create**:
- `NestSync-frontend/types/subscription.ts`
- `NestSync-frontend/types/payment.ts`
- `NestSync-frontend/types/trial.ts`
- `NestSync-frontend/types/billing.ts`

**Acceptance Criteria**:
1. Interfaces match GraphQL schema definitions exactly
2. Enums exported: SubscriptionTier, SubscriptionStatus, CanadianProvince
3. Union types for Error responses
4. Date fields typed as `Date` not `string`
5. Nullable fields marked with `?` operator
6. JSDoc comments from GraphQL schema preserved

**Constitutional Principles**: 8 (GraphQL Schema Integrity)

**Dependencies**: None (can run parallel with other setup tasks)

**Test Command**: `npm run type-check`

**Estimated Time**: 3 hours

---

### T010: Implement Canadian tax service
**Description**: Create service class for calculating Canadian provincial taxes (GST/PST/HST/QST).

**Files to Create**:
- `NestSync-backend/app/services/tax_service.py`

**Acceptance Criteria**:
1. `calculate_taxes(amount, province)` method returns breakdown
2. Tax rates loaded from `canadian_tax_rates` table
3. Supports all 13 provinces/territories
4. Returns subtotal, tax_amount, total, and tax_breakdown
5. Decimal precision for currency (2 decimal places)
6. Default to Ontario (ON) if province unknown
7. Cache tax rates in memory (refresh every 24 hours)

**Constitutional Principles**: 2 (Stress Reduction - transparent pricing), 5 (Canadian Compliance)

**Dependencies**: T003, T007 (CanadianTaxRate model)

**Test Command**: `python -m pytest tests/unit/test_tax_service.py`

**Estimated Time**: 3 hours

---

### T010.5: [OPTIONAL] Tax calculation validation strategy
**Description**: Document agent-driven validation approach for Canadian tax rates to ensure accuracy and maintainability. This task is OPTIONAL for V1 launch but recommended for ongoing compliance.

**Files to Create**:
- `.specify/agents/tax-validation.md` (new - validation strategy documentation)
- `NestSync-backend/scripts/validate_tax_rates.py` (new - automated validation script)

**Acceptance Criteria**:
1. **Validation Agent**: Document strategy for comparing `canadian_tax_rates` table against official CRA tax tables
2. **Architecture Agent**: Design fallback flow: Stripe Tax API → local cache → hardcoded rates
3. **Test Agent**: Generate test fixtures for all 13 provinces × 2 tiers × 2 intervals = 52 test cases
4. Automated script to scrape CRA official rates (or use Stripe Tax API) and compare to DB
5. Alert system if tax rate discrepancies detected (>0.1% variance)
6. Quarterly validation schedule documented
7. Rollback procedure if incorrect tax rate deployed

**Agent Orchestration Pattern**:
```markdown
## Tax Validation Agents

### 1. Validation Agent
**Goal**: Verify tax calculation accuracy against authoritative sources
**Approach**: 
- Scrape CRA GST/HST rates: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-rates.html
- Compare to `canadian_tax_rates` table
- Flag discrepancies >0.1%

### 2. Architecture Agent
**Goal**: Design robust fallback strategy
**Approach**:
- Primary: Local DB cache (fast, offline-capable)
- Secondary: Stripe Tax API (real-time, authoritative)
- Tertiary: Hardcoded constants (emergency fallback)

### 3. Test Agent
**Goal**: Comprehensive tax calculation test coverage
**Approach**:
- Generate fixtures for 52 scenarios (13 provinces × 4 plans)
- Edge cases: QST (Quebec), no PST (Alberta), dual taxes (Ontario)
```

**Implementation Notes**:
This task supports Constitutional Principle 9 (AI Agent Orchestration) by applying systematic thinking to complex tax logic. While optional for V1, it reduces long-term maintenance burden and legal risk.

**Constitutional Principles**: 9 (AI Agent Orchestration), 5 (Canadian Compliance)

**Dependencies**: T010 (tax service)

**Test Command**: `python scripts/validate_tax_rates.py --dry-run`

**Estimated Time**: 3 hours (optional)

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3.3

**CRITICAL**: All tests in this phase MUST be written and MUST FAIL before implementing Phase 3.3. This enforces Test-Driven Development.

### T011: [P] Contract test for subscription GraphQL queries
**Description**: Write failing contract tests for subscriptionStatus, subscriptionPlans, calculatePricing queries.

**Files to Create**:
- `NestSync-backend/tests/contract/test_subscription_queries.py`

**Acceptance Criteria**:
1. Test `subscriptionStatus` query returns Subscription type
2. Test `subscriptionPlans` query returns array of plans
3. Test `calculatePricing` query returns PricingBreakdown with Canadian taxes
4. Assert all required fields present in responses
5. Assert camelCase field names (not snake_case)
6. Tests MUST FAIL initially (no resolvers implemented yet)

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 10 (E2E Verification)

**Dependencies**: T006, T009 (models and types)

**Test Command**: `python -m pytest tests/contract/test_subscription_queries.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T011.5: Configure bundle size monitoring for premium upgrade flow
**Description**: Set up Metro bundler size limits and CI/CD monitoring for premium upgrade feature bundle to enforce Constitutional Principle 6 (<5MB per feature).

**Files to Create**:
- `.github/workflows/bundle-size-check.yml` (new - CI/CD workflow)

**Files to Modify**:
- `NestSync-frontend/metro.config.js` (add size budget plugin)
- `NestSync-frontend/package.json` (add bundle-size script)

**Acceptance Criteria**:
1. Metro bundler configured to warn if bundle exceeds 5MB
2. Bundle size analysis script: `npm run analyze-bundle`
3. CI/CD workflow fails PR if bundle grows >10% without explicit approval comment
4. Baseline bundle size recorded: `premium-upgrade-bundle-baseline.json`
5. Stripe SDK (~2MB) excluded from size budget (external dependency)
6. Bundle size report generated on PR: shows before/after comparison
7. GitHub Action comment posts bundle size to PR automatically

**Implementation Notes**:
```javascript
// metro.config.js - Add bundle size budget check
const { getDefaultConfig } = require('expo/metro-config');
module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  // Bundle size monitoring in production builds
  if (process.env.NODE_ENV === 'production') {
    config.transformer.minifierConfig = {
      ...config.transformer.minifierConfig,
      mangle: { keep_fnames: false },
    };
  }
  return config;
})();
```

**Constitutional Principles**: 6 (Performance - Bundle Size Budget)

**Dependencies**: None (setup task, runs parallel)

**Test Command**: `npm run analyze-bundle`

**Estimated Time**: 2 hours

---

### T012: [P] Contract test for subscription GraphQL mutations
**Description**: Write failing contract tests for startTrial, convertToPaid, cancelSubscription mutations.

**Files to Create**:
- `NestSync-backend/tests/contract/test_subscription_mutations.py`

**Acceptance Criteria**:
1. Test `startTrial` mutation creates trialing subscription
2. Test `convertToPaid` mutation with payment method ID
3. Test `cancelSubscription` mutation handles cooling-off period
4. Assert success/error result types
5. Assert subscription status transitions correctly
6. Tests MUST FAIL initially

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 10 (E2E Verification)

**Dependencies**: T006, T009 (models and types)

**Test Command**: `python -m pytest tests/contract/test_subscription_mutations.py -v` (should fail)

**Estimated Time**: 4 hours

---

### T013: [P] Contract test for payment GraphQL operations
**Description**: Write failing contract tests for paymentMethods, createPaymentIntent, addPaymentMethod.

**Files to Create**:
- `NestSync-backend/tests/contract/test_payment_operations.py`

**Acceptance Criteria**:
1. Test `paymentMethods` query returns array of payment methods
2. Test `createPaymentIntent` returns Stripe client secret
3. Test `addPaymentMethod` mutation with Canadian billing address
4. Assert Canadian postal code format validation (A1A 1A1)
5. Assert Stripe payment method ID format
6. Tests MUST FAIL initially

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 14 (Stripe Integration)

**Dependencies**: T007, T009 (models and types)

**Test Command**: `python -m pytest tests/contract/test_payment_operations.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T014: [P] Contract test for trial GraphQL operations
**Description**: Write failing contract tests for trialProgress, trackFeatureUsage, featureAccess.

**Files to Create**:
- `NestSync-backend/tests/contract/test_trial_operations.py`

**Acceptance Criteria**:
1. Test `trialProgress` query returns TrialProgress with value metrics
2. Test `trackFeatureUsage` mutation updates trial progress
3. Test `featureAccess` query returns access levels for premium features
4. Assert value score calculation (0-100 range)
5. Assert conversion eligibility logic
6. Tests MUST FAIL initially

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 1 (Value Tracking)

**Dependencies**: T008, T009 (models and types)

**Test Command**: `python -m pytest tests/contract/test_trial_operations.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T015: [P] Contract test for billing GraphQL operations
**Description**: Write failing contract tests for billingHistory, invoice, requestRefund.

**Files to Create**:
- `NestSync-backend/tests/contract/test_billing_operations.py`

**Acceptance Criteria**:
1. Test `billingHistory` query with pagination
2. Test `invoice` query returns BillingRecord with Canadian tax breakdown
3. Test `requestRefund` mutation for cooling-off period
4. Assert Canadian invoice numbering format (NS-YYYY-MM-XXXXX)
5. Assert GST/PST/HST/QST breakdown fields
6. Tests MUST FAIL initially

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 3 (Canadian Compliance)

**Dependencies**: T007, T009 (models and types)

**Test Command**: `python -m pytest tests/contract/test_billing_operations.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T016: [P] Integration test for trial activation flow
**Description**: Write failing end-to-end integration test for trial activation without credit card.

**Files to Create**:
- `NestSync-backend/tests/integration/test_trial_activation.py`

**Acceptance Criteria**:
1. Test user can activate 14-day trial without payment method
2. Test trial status set to TRIALING
3. Test premium features immediately accessible
4. Test trial end date = trial start + 14 days
5. Test trial progress record created
6. Test MUST FAIL initially (no implementation)

**Constitutional Principles**: 1 (Cognitive Load), 3 (Trust Building)

**Dependencies**: T006, T008 (models)

**Test Command**: `python -m pytest tests/integration/test_trial_activation.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T017: [P] Integration test for trial-to-paid conversion
**Description**: Write failing integration test for converting trial to paid subscription with Stripe.

**Files to Create**:
- `NestSync-backend/tests/integration/test_trial_conversion.py`

**Acceptance Criteria**:
1. Test Stripe subscription creation with payment method
2. Test subscription status transition: TRIALING -> ACTIVE
3. Test billing record created with Canadian taxes
4. Test cooling-off period set for annual plans (14 days)
5. Test premium features remain accessible
6. Test MUST FAIL initially

**Constitutional Principles**: 14 (Stripe Integration), 3 (Cooling-Off Period)

**Dependencies**: T006, T007 (models)

**Test Command**: `python -m pytest tests/integration/test_trial_conversion.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T018: [P] Integration test for payment failure recovery
**Description**: Write failing integration test for grace period and payment retry flow.

**Files to Create**:
- `NestSync-backend/tests/integration/test_payment_recovery.py`

**Acceptance Criteria**:
1. Test subscription status: ACTIVE -> PAST_DUE on payment failure
2. Test 3-day grace period maintains premium access
3. Test payment retry with new payment method
4. Test recovery: PAST_DUE -> ACTIVE on successful retry
5. Test expiration: PAST_DUE -> UNPAID after 3 days
6. Test MUST FAIL initially

**Constitutional Principles**: 9 (Four-Layer Defense), 2 (Stress Reduction)

**Dependencies**: T006, T007 (models)

**Test Command**: `python -m pytest tests/integration/test_payment_recovery.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T019: [P] Integration test for cancellation with cooling-off refund
**Description**: Write failing integration test for 14-day cooling-off period refunds.

**Files to Create**:
- `NestSync-backend/tests/integration/test_cooling_off_refund.py`

**Acceptance Criteria**:
1. Test annual subscription cancellation within 14 days triggers full refund
2. Test refund processed through Stripe
3. Test billing history updated with refund record
4. Test subscription status: ACTIVE -> CANCELED
5. Test cancellation after 14 days continues until period end
6. Test MUST FAIL initially

**Constitutional Principles**: 3 (Canadian Consumer Protection), 9 (Customer-Friendly)

**Dependencies**: T006, T007 (models)

**Test Command**: `python -m pytest tests/integration/test_cooling_off_refund.py -v` (should fail)

**Estimated Time**: 3 hours

---

### T020: [P] Integration test for Canadian tax calculation
**Description**: Write failing integration test for provincial tax rates across all 13 provinces.

**Files to Create**:
- `NestSync-backend/tests/integration/test_canadian_taxes.py`

**Acceptance Criteria**:
1. Test Ontario (ON): 13% HST calculation
2. Test Quebec (QC): 5% GST + 9.975% QST calculation
3. Test British Columbia (BC): 5% GST + 7% PST calculation
4. Test Alberta (AB): 5% GST only
5. Test all 13 provinces/territories covered
6. Test MUST FAIL initially

**Constitutional Principles**: 2 (Transparent Pricing), 5 (Canadian Compliance)

**Dependencies**: T007, T010 (tax models and service)

**Test Command**: `python -m pytest tests/integration/test_canadian_taxes.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T021: [P] Unit test for trial value score algorithm
**Description**: Write failing unit tests for value score calculation (0-100).

**Files to Create**:
- `NestSync-backend/tests/unit/test_value_score_algorithm.py`

**Acceptance Criteria**:
1. Test time saved weight (40 points): 0-15min=0, 121+min=40
2. Test conflicts prevented weight (30 points): 0=0, 3+=30
3. Test feature exploration weight (20 points): 5 features = 20
4. Test engagement weight (10 points): sessions/14 days
5. Test total score range: 0-100
6. Test MUST FAIL initially

**Constitutional Principles**: 1 (Value Demonstration), 10 (Conversion Optimization)

**Dependencies**: T008 (TrialProgress model)

**Test Command**: `python -m pytest tests/unit/test_value_score_algorithm.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T022: [P] Unit test for subscription state machine
**Description**: Write failing unit tests for subscription lifecycle state transitions.

**Files to Create**:
- `NestSync-backend/tests/unit/test_subscription_states.py`

**Acceptance Criteria**:
1. Test valid transitions: free->trialing, trialing->active, active->past_due
2. Test invalid transitions rejected (e.g., free->active without trial)
3. Test cooling-off period calculation for annual plans
4. Test trial expiration: trialing->free after 14 days
5. Test grace period: past_due->unpaid after 3 days
6. Test MUST FAIL initially

**Constitutional Principles**: 9 (Four-Layer Defense), 1 (Cognitive Load)

**Dependencies**: T006 (Subscription model)

**Test Command**: `python -m pytest tests/unit/test_subscription_states.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T023: [P] Unit test for Canadian billing address validation
**Description**: Write failing unit tests for Canadian postal code and address validation.

**Files to Create**:
- `NestSync-backend/tests/unit/test_address_validation.py`

**Acceptance Criteria**:
1. Test valid postal code format: A1A 1A1
2. Test invalid formats rejected: A1A1A1, 12345, A1A-1A1
3. Test all 13 province codes accepted
4. Test invalid province codes rejected
5. Test address required fields: line1, city, province, postalCode
6. Test MUST FAIL initially

**Constitutional Principles**: 3 (Canadian Context), 5 (Data Validation)

**Dependencies**: T007 (PaymentMethod model)

**Test Command**: `python -m pytest tests/unit/test_address_validation.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T024: [P] Unit test for invoice numbering format
**Description**: Write failing unit tests for Canadian-compliant invoice number generation.

**Files to Create**:
- `NestSync-backend/tests/unit/test_invoice_numbering.py`

**Acceptance Criteria**:
1. Test format: NS-YYYY-MM-XXXXX (e.g., NS-2025-10-00123)
2. Test sequential numbering within month
3. Test no gaps in sequence
4. Test month rollover: resets sequence to 00001
5. Test year rollover: updates YYYY
6. Test MUST FAIL initially

**Constitutional Principles**: 4 (PIPEDA Compliance), 5 (Canadian Standards)

**Dependencies**: T007 (BillingHistory model)

**Test Command**: `python -m pytest tests/unit/test_invoice_numbering.py -v` (should fail)

**Estimated Time**: 2 hours

---

### T025: [P] Unit test for feature access gates
**Description**: Write failing unit tests for premium feature access control.

**Files to Create**:
- `NestSync-backend/tests/unit/test_feature_access.py`

**Acceptance Criteria**:
1. Test free tier: all premium features NONE access
2. Test trialing: all premium features FULL access
3. Test active subscription: premium features FULL access
4. Test expired trial: features revert to NONE
5. Test unpaid subscription: features revoked to NONE
6. Test MUST FAIL initially

**Constitutional Principles**: 1 (Progressive Disclosure), 14 (Premium Features)

**Dependencies**: T006 (FeatureAccess model)

**Test Command**: `python -m pytest tests/unit/test_feature_access.py -v` (should fail)

**Estimated Time**: 2 hours

---

## Phase 3.3: Core Implementation (ONLY after Phase 3.2 tests are failing)

**CRITICAL**: Do NOT start Phase 3.3 until ALL Phase 3.2 tests are written and failing. Verify with:
```bash
python -m pytest tests/contract/ tests/integration/ tests/unit/ -v
# Expected: All tests FAIL
```

### T026: Implement SubscriptionService for trial management
**Description**: Create service class with trial activation, conversion, and cancellation logic.

**Files to Create**:
- `NestSync-backend/app/services/subscription_service.py`

**Acceptance Criteria**:
1. `start_trial(user_id, duration_days=14)` creates trialing subscription
2. `convert_to_paid(user_id, plan_id, payment_method_id)` transitions to active
3. `cancel_subscription(subscription_id, immediately=False)` handles cooling-off
4. All methods use AsyncGenerator pattern (Constitutional Principle 7)
5. RLS policies enforced on all database operations
6. America/Toronto timezone used for all datetime operations
7. Contract tests T011, T012 now PASS

**Constitutional Principles**: 4 (Privacy), 5 (Timezone), 7 (Async Patterns)

**Dependencies**: T002-T008 (models), T011-T012 (tests must fail first)

**Test Command**: `python -m pytest tests/contract/test_subscription_mutations.py -v` (should now pass)

**Estimated Time**: 6 hours

---

### T027: Implement StripeService for payment processing
**Description**: Create service class for Stripe customer, subscription, and payment intent operations.

**Files to Create**:
- `NestSync-backend/app/services/stripe_service.py`

**Acceptance Criteria**:
1. `create_customer(user_email, metadata)` creates Stripe customer
2. `create_subscription(customer_id, price_id)` creates Stripe subscription
3. `create_payment_intent(amount, currency='CAD')` returns client secret
4. `attach_payment_method(customer_id, payment_method_id)` saves payment method
5. `process_refund(payment_intent_id, amount)` handles cooling-off refunds
6. Error handling for Stripe API failures with retry logic
7. Contract tests T013 now PASS

**Constitutional Principles**: 14 (Stripe Integration), 9 (Four-Layer Defense)

**Dependencies**: T001 (Stripe config), T013 (tests must fail first)

**Test Command**: `python -m pytest tests/contract/test_payment_operations.py -v` (should now pass)

**Estimated Time**: 6 hours

---

### T028: Implement TrialAnalyticsService for value metrics
**Description**: Create service class for tracking and aggregating trial value metrics.

**Files to Create**:
- `NestSync-backend/app/services/trial_analytics_service.py`

**Acceptance Criteria**:
1. `track_feature_usage(user_id, feature, value_impact)` logs usage event
2. `calculate_value_metrics(user_id)` returns aggregated metrics
3. Value score algorithm implemented (T021 algorithm)
4. Time saved, conflicts prevented, features explored tracked
5. Conversion eligibility calculated: score >= 60, days >= 8, features >= 3
6. Contract tests T014 now PASS

**Constitutional Principles**: 1 (Value Demonstration), 10 (Conversion Optimization)

**Dependencies**: T004, T008 (trial models), T014 (tests must fail first)

**Test Command**: `python -m pytest tests/contract/test_trial_operations.py -v` (should now pass)

**Estimated Time**: 5 hours

---

### T029: Implement Strawberry GraphQL subscription queries
**Description**: Implement GraphQL query resolvers for subscriptionStatus, subscriptionPlans, calculatePricing.

**Files to Create**:
- `NestSync-backend/app/graphql/subscription_schema.py`

**Acceptance Criteria**:
1. `subscription_status` resolver fetches user's subscription with RLS
2. `subscription_plans` resolver returns active plans sorted by sort_order
3. `calculate_pricing` resolver calls TaxService for provincial tax breakdown
4. camelCase field aliases configured via Strawberry
5. Error handling returns Error type per contract
6. Contract tests T011 now PASS

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 7 (Async Patterns)

**Dependencies**: T006, T010, T026 (models, services), T011 (tests)

**Test Command**: `python -m pytest tests/contract/test_subscription_queries.py -v` (should now pass)

**Estimated Time**: 4 hours

---

### T030: Implement Strawberry GraphQL subscription mutations
**Description**: Implement GraphQL mutation resolvers for startTrial, convertToPaid, cancelSubscription.

**Files to Modify**:
- `NestSync-backend/app/graphql/subscription_schema.py`

**Acceptance Criteria**:
1. `start_trial` resolver calls SubscriptionService.start_trial()
2. `convert_to_paid` resolver calls SubscriptionService.convert_to_paid()
3. `cancel_subscription` resolver handles cooling-off period logic
4. Input validation for all mutations (planId, paymentMethodId)
5. Success/error results per contract
6. Contract tests T012 now PASS

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 3 (Trust Building)

**Dependencies**: T026, T027 (services), T012 (tests)

**Test Command**: `python -m pytest tests/contract/test_subscription_mutations.py -v` (should now pass)

**Estimated Time**: 5 hours

---

### T031: Implement Strawberry GraphQL payment operations
**Description**: Implement GraphQL resolvers for paymentMethods, createPaymentIntent, addPaymentMethod.

**Files to Create**:
- `NestSync-backend/app/graphql/payment_schema.py`

**Acceptance Criteria**:
1. `payment_methods` resolver returns user's saved payment methods
2. `create_payment_intent` resolver generates Stripe client secret
3. `add_payment_method` resolver validates Canadian billing address
4. Canadian postal code validation (A1A 1A1 format)
5. Stripe payment method ID format validation
6. Contract tests T013 now PASS

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 14 (Stripe Integration)

**Dependencies**: T007, T027 (models, services), T013 (tests)

**Test Command**: `python -m pytest tests/contract/test_payment_operations.py -v` (should now pass)

**Estimated Time**: 4 hours

---

### T032: Implement Strawberry GraphQL trial operations
**Description**: Implement GraphQL resolvers for trialProgress, trackFeatureUsage, featureAccess.

**Files to Create**:
- `NestSync-backend/app/graphql/trial_schema.py`

**Acceptance Criteria**:
1. `trial_progress` resolver returns TrialProgress with value metrics
2. `track_feature_usage` resolver logs usage events
3. `feature_access` resolver returns access levels for premium features
4. Value score calculated real-time from usage events
5. Conversion eligibility logic implemented
6. Contract tests T014 now PASS

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 1 (Value Tracking)

**Dependencies**: T008, T028 (models, services), T014 (tests)

**Test Command**: `python -m pytest tests/contract/test_trial_operations.py -v` (should now pass)

**Estimated Time**: 4 hours

---

### T033: Implement Strawberry GraphQL billing operations
**Description**: Implement GraphQL resolvers for billingHistory, invoice, requestRefund.

**Files to Create**:
- `NestSync-backend/app/graphql/billing_schema.py`

**Acceptance Criteria**:
1. `billing_history` resolver with pagination support
2. `invoice` resolver returns BillingRecord with Canadian tax breakdown
3. `request_refund` resolver handles cooling-off period refunds
4. Invoice numbering format: NS-YYYY-MM-XXXXX
5. GST/PST/HST/QST breakdown calculated
6. Contract tests T015 now PASS

**Constitutional Principles**: 8 (GraphQL Schema Integrity), 3 (Canadian Compliance)

**Dependencies**: T007, T027 (models, services), T015 (tests)

**Test Command**: `python -m pytest tests/contract/test_billing_operations.py -v` (should now pass)

**Estimated Time**: 4 hours

---

### T034: Implement Stripe webhook handlers
**Description**: Create webhook endpoint to handle Stripe events for subscription lifecycle.

**Files to Create**:
- `NestSync-backend/app/webhooks/stripe_handlers.py`
- `NestSync-backend/app/api/webhooks.py`

**Acceptance Criteria**:
1. `/webhooks/stripe` endpoint validates Stripe signature
2. `invoice.paid` handler creates billing_history record
3. `payment_intent.succeeded` handler updates subscription to ACTIVE
4. `invoice.payment_failed` handler sets subscription to PAST_DUE
5. `customer.subscription.deleted` handler sets subscription to CANCELED
6. All handlers use AsyncGenerator pattern
7. Integration tests T017-T019 now PASS

**Constitutional Principles**: 9 (Four-Layer Defense), 6 (Documented Failures)

**Dependencies**: T006, T007, T026, T027 (models, services)

**Test Command**: `python -m pytest tests/integration/test_stripe_webhooks.py -v`

**Estimated Time**: 5 hours

---

### T035: [P] Create useSubscription custom hook
**Description**: Implement React hook for subscription status and operations with Apollo Client.

**Files to Create**:
- `NestSync-frontend/app/hooks/useSubscription.ts`

**Acceptance Criteria**:
1. `useSubscription()` fetches subscription status via GraphQL
2. Apollo Client 3.x error handling (no 4.x patterns)
3. Returns subscription data, loading, error states
4. Exposes methods: `startTrial()`, `cancelSubscription()`
5. Optimistic UI updates for mutations
6. TypeScript types from generated interfaces

**Constitutional Principles**: 7 (Apollo Client 3.x), 8 (GraphQL Schema)

**Dependencies**: T009, T029, T030 (types, backend resolvers)

**Test Command**: `npm run test -- useSubscription.test.ts`

**Estimated Time**: 4 hours

---

### T036: [P] Create useTrial custom hook
**Description**: Implement React hook for trial progress tracking and value metrics. Integrates with existing `useUniversalStorage` hook (hooks/useUniversalStorage.ts) for offline trial status caching.

**Files to Create**:
- `NestSync-frontend/app/hooks/useTrial.ts`

**Files to Reference** (existing):
- `NestSync-frontend/hooks/useUniversalStorage.ts` (React hook with tuple pattern: `[data, loading, setValue]`)

**Acceptance Criteria**:
1. `useTrial()` fetches trial progress via GraphQL
2. Returns value metrics: timeSavedHours, conflictsPrevented, valueScore
3. `trackFeatureUsage()` method for logging events
4. Real-time trial days remaining calculation (14 calendar days in America/Toronto, expires 23:59:59 on day 14)
5. Conversion eligibility flag exposed
6. TypeScript types from generated interfaces
7. Offline support: Uses existing `useUniversalStorage` hook for caching: `const [trialCache, loading, setTrialCache] = useUniversalStorage<TrialStatus>('nestsync:trial_status', { secure: true })`

**Usage Pattern**:
```typescript
export function useTrial() {
  const [trialCache, cacheLoading, setTrialCache] = useUniversalStorage<TrialStatus>('nestsync:trial_status', { secure: true });
  const [fetchTrial] = useQuery(GET_TRIAL_PROGRESS);
  
  // Merge GraphQL data with cached data
  return { trialStatus: trialCache, loading: cacheLoading, trackFeatureUsage };
}
```

**Constitutional Principles**: 1 (Value Demonstration), 8 (GraphQL Schema), 18 (Cross-Platform Storage)

**Dependencies**: T009, T032 (types, backend resolvers)

**Test Command**: `npm run test -- useTrial.test.ts`

**Estimated Time**: 3 hours

---

### T037: [P] Create useStripePayment custom hook
**Description**: Implement React hook for Stripe PaymentSheet integration.

**Files to Create**:
- `NestSync-frontend/app/hooks/useStripePayment.ts`

**Acceptance Criteria**:
1. `useStripePayment()` initializes Stripe SDK
2. `createPaymentIntent()` fetches client secret from backend
3. `processPayment()` opens native PaymentSheet
4. Canadian configuration: currency='CAD', country='CA'
5. Error handling with user-friendly messages
6. Platform-aware (mobile vs web fallback)

**Constitutional Principles**: 14 (Stripe Integration), 18 (Cross-Platform)

**Dependencies**: T001, T027, T031 (Stripe config, backend)

**Test Command**: `npm run test -- useStripePayment.test.ts`

**Estimated Time**: 4 hours

---

### T037.5: [P] Implement bilingual error messages for GraphQL mutations
**Description**: Add French translations for all subscription flow error messages to comply with Quebec Bill 96 and FR-037 (bilingual content requirement).

**Files to Create**:
- `NestSync-backend/app/i18n/error_messages.py` (new - bilingual error catalog)

**Files to Modify**:
- `NestSync-backend/app/resolvers/subscription_resolvers.py`
- `NestSync-backend/app/resolvers/payment_resolvers.py`
- `NestSync-backend/app/resolvers/trial_resolvers.py`
- `NestSync-backend/app/resolvers/billing_resolvers.py`

**Acceptance Criteria**:
1. Create `ErrorMessage` utility class with `get_bilingual_error(code, params)` method
2. All GraphQL errors return both `messageEn` and `messageFr` fields (contracts updated to include these)
3. French translations for common error codes:
   - `TRIAL_ALREADY_USED`: "Vous avez déjà utilisé votre période d'essai" / "You have already used your trial period"
   - `PAYMENT_METHOD_DECLINED`: "Votre mode de paiement a été refusé" / "Your payment method was declined"
   - `SUBSCRIPTION_NOT_FOUND`: "Abonnement introuvable" / "Subscription not found"
   - `INVALID_PROVINCE`: "Code de province invalide" / "Invalid province code"
   - `INSUFFICIENT_PERMISSIONS`: "Permissions insuffisantes" / "Insufficient permissions"
4. Frontend detects user locale (Quebec/NB) and displays appropriate language based on `province` field
5. Unit tests for all error messages in both languages
6. Error catalog supports parameter interpolation: `get_bilingual_error("TRIAL_ENDS", {"days": 5})`

**Usage Pattern**:
```python
from app.i18n.error_messages import get_bilingual_error

return Error(
    code="TRIAL_ALREADY_USED",
    **get_bilingual_error("TRIAL_ALREADY_USED", {"trial_end": user.trial_end}),
    field="userId"
)
# Returns: {"messageEn": "You have already used your trial period", "messageFr": "Vous avez déjà utilisé votre période d'essai", "message": "You have already used your trial period"}
```

**Constitutional Principles**: 4 (PIPEDA Compliance - Quebec Bill 96), 7 (Canadian Context)

**Dependencies**: T009 (GraphQL types), T026+ (resolvers)

**Test Command**: `python -m pytest tests/unit/test_i18n_errors.py`

**Estimated Time**: 3 hours

---

### T038: Create FeatureDiscovery notification component
**Description**: Create gentle, non-intrusive premium feature discovery notification.

**Files to Create**:
- `NestSync-frontend/app/components/premium/FeatureDiscoveryNotification.tsx`

**Acceptance Criteria**:
1. Appears when free-tier limit reached (e.g., 4 family members)
2. Gentle, supportive microcopy (no "URGENT" or aggressive language)
3. Canadian family testimonial with location (Burlington, ON)
4. Transparent CAD pricing with provincial tax label
5. Dismissible without penalty
6. Animations: 300-400ms spring physics

**Constitutional Principles**: 1 (Cognitive Load), 2 (Stress Reduction), 3 (Canadian Context)

**Dependencies**: T009, T035 (types, hooks)

**Test Command**: `npm run test -- FeatureDiscoveryNotification.test.tsx`

**Estimated Time**: 4 hours

---

### T039: Create PricingCard component with Canadian tax breakdown
**Description**: Create pricing card component showing plan details with provincial taxes.

**Files to Create**:
- `NestSync-frontend/app/components/premium/PricingCard.tsx`

**Acceptance Criteria**:
1. Displays plan name, price, features, and limits
2. Canadian tax breakdown: subtotal, GST/PST/HST/QST, total
3. Monthly vs yearly toggle with savings visualization
4. Province selector for tax calculation
5. "Start Trial" CTA button
6. Accessible: 44px minimum touch targets

**Constitutional Principles**: 2 (Transparent Pricing), 5 (Canadian Taxes), 12 (No Emojis)

**Dependencies**: T009, T010, T029 (types, tax service, backend)

**Test Command**: `npm run test -- PricingCard.test.tsx`

**Estimated Time**: 5 hours

---

### T040: Create TrialActivation screen
**Description**: Create screen for activating 14-day free trial without credit card.

**Files to Create**:
- `NestSync-frontend/app/screens/premium/TrialActivationScreen.tsx`

**Acceptance Criteria**:
1. Displays "No credit card required" prominently
2. Shows 14-day trial duration
3. Lists premium features with icons
4. "Start Trial" button calls `useSubscription().startTrial()`
5. Success screen shows immediate premium badge
6. Loading state during mutation

**Constitutional Principles**: 1 (Cognitive Load), 3 (Trust Building)

**Dependencies**: T009, T035 (types, hooks)

**Test Command**: `npm run test -- TrialActivationScreen.test.tsx`

**Estimated Time**: 4 hours

---

### T041: Create TrialDashboard screen with value metrics
**Description**: Create screen displaying trial progress and real-time value metrics.

**Files to Create**:
- `NestSync-frontend/app/screens/premium/TrialDashboardScreen.tsx`

**Acceptance Criteria**:
1. Displays days remaining with progress bar
2. Shows value metrics: time saved (hours), conflicts prevented
3. Features explored progress ring (5 features total)
4. Value score visualization (0-100)
5. Gentle conversion prompt if eligible (day 10+)
6. Real-time updates via GraphQL subscription

**Constitutional Principles**: 1 (Visual Progress), 2 (Stress Reduction)

**Dependencies**: T009, T036 (types, hooks)

**Test Command**: `npm run test -- TrialDashboardScreen.test.tsx`

**Estimated Time**: 6 hours

---

### T042: Create TrialProgress component
**Description**: Create reusable component for displaying trial progress indicators.

**Files to Create**:
- `NestSync-frontend/app/components/premium/TrialProgress.tsx`

**Acceptance Criteria**:
1. Circular progress indicator for days remaining
2. Linear progress bar for features explored
3. Color coding: green (healthy), yellow (ending soon), neutral
4. Supports reduced motion preference (disable animations)
5. Accessible: ARIA labels for screen readers
6. Responsive: adapts to mobile/tablet layouts

**Constitutional Principles**: 1 (Visual Hierarchy), 12 (Accessibility)

**Dependencies**: T009, T036 (types, hooks)

**Test Command**: `npm run test -- TrialProgress.test.tsx`

**Estimated Time**: 3 hours

---

### T043: Create OnboardingModal component
**Description**: Create guided onboarding modal for trial users (days 1-3).

**Files to Create**:
- `NestSync-frontend/app/components/premium/OnboardingModal.tsx`

**Acceptance Criteria**:
1. Shows 5 onboarding steps (one per premium feature)
2. Interactive tutorials for each feature
3. "Try it now" buttons navigate to feature
4. Progress tracking: completed steps checkmarked
5. Dismissible but resumable later
6. Supports reduced motion

**Constitutional Principles**: 1 (Progressive Disclosure), 2 (Supportive Experience)

**Dependencies**: T009, T036 (types, hooks)

**Test Command**: `npm run test -- OnboardingModal.test.tsx`

**Estimated Time**: 5 hours

---

### T044: Create PaymentMethodScreen with Stripe PaymentSheet
**Description**: Create screen for adding payment method via Stripe PaymentSheet.

**Files to Create**:
- `NestSync-frontend/app/screens/premium/PaymentMethodScreen.tsx`

**Acceptance Criteria**:
1. Opens Stripe native PaymentSheet on mobile
2. Displays web fallback message on browser
3. Canadian billing address form (city, province, postal code)
4. Postal code validation: A1A 1A1 format
5. Payment method saved on success
6. Error handling with retry options

**Constitutional Principles**: 14 (Stripe Integration), 18 (Cross-Platform)

**Dependencies**: T009, T037 (types, hooks)

**Test Command**: `npm run test -- PaymentMethodScreen.test.tsx`

**Estimated Time**: 6 hours

---

### T044.5: [P] Create PIPEDA Payment Consent Modal
**Description**: Implement explicit consent flow for payment data processing, complying with PIPEDA Principle 3 (Consent) and Quebec Bill 96. Users must provide informed consent before payment method collection.

**Files to Create**:
- `NestSync-frontend/app/components/premium/PaymentConsentModal.tsx` (new - consent UI)

**Files to Modify**:
- `NestSync-frontend/app/hooks/useSubscription.ts` (add consent check before payment)
- `NestSync-frontend/app/screens/premium/PaymentMethodScreen.tsx` (integrate consent modal)

**Acceptance Criteria**:
1. Modal displays BEFORE Stripe PaymentSheet opens
2. Consent text (bilingual - English/French based on user province):
   - **EN**: "Your payment information will be securely processed by Stripe and stored in Canadian data centers. NestSync does not store your full credit card details. By proceeding, you consent to sharing your payment data with Stripe (a PCI-DSS Level 1 certified payment processor) for subscription billing. You can withdraw consent by canceling your subscription at any time. [Privacy Policy]"
   - **FR**: "Vos informations de paiement seront traitées de manière sécurisée par Stripe et stockées dans des centres de données canadiens. NestSync ne stocke pas les détails complets de votre carte de crédit. En continuant, vous consentez à partager vos données de paiement avec Stripe (un processeur de paiement certifié PCI-DSS niveau 1) pour la facturation de l'abonnement. Vous pouvez retirer votre consentement en annulant votre abonnement à tout moment. [Politique de confidentialité]"
3. Two action buttons: "I Consent" (primary) and "Cancel" (secondary)
4. Privacy Policy link opens modal/webview with full policy
5. Consent logged via `convertToPaid()` mutation → sets `payment_consent_at` timestamp
6. User cannot proceed to payment without explicit "I Consent" tap
7. Consent timestamp stored in `subscriptions.payment_consent_at` field
8. E2E test scenario: User rejects consent, payment flow aborts gracefully

**Usage Pattern**:
```typescript
// In PaymentMethodScreen.tsx
const [showConsentModal, setShowConsentModal] = useState(false);
const { convertToPaid } = useSubscription();

const handleAddPaymentMethod = () => {
  setShowConsentModal(true); // Show consent FIRST
};

const handleConsentGiven = async () => {
  // Log consent timestamp, then proceed to Stripe
  await convertToPaid({ consentGiven: true, consentAt: new Date() });
  openStripePaymentSheet();
};
```

**Constitutional Principles**: 4 (PIPEDA Compliance - Principle 3: Consent), 7 (Canadian Privacy Laws), 1 (Trust Building)

**Dependencies**: T044 (PaymentMethodScreen), T009 (types)

**Test Command**: `npm run test -- PaymentConsentModal.test.tsx`

**Estimated Time**: 4 hours

---

### T045: Create BillingAddress form component
**Description**: Create Canadian billing address form with validation.

**Files to Create**:
- `NestSync-frontend/app/components/premium/BillingAddressForm.tsx`

**Acceptance Criteria**:
1. Fields: line1, line2 (optional), city, province, postalCode
2. Province dropdown with all 13 provinces/territories
3. Postal code validation: A1A 1A1 format (regex)
4. Error messages for invalid formats
5. Accessible: proper labels and ARIA attributes
6. Form state management with validation

**Constitutional Principles**: 3 (Canadian Context), 12 (Accessibility)

**Dependencies**: T009 (types)

**Test Command**: `npm run test -- BillingAddressForm.test.tsx`

**Estimated Time**: 4 hours

---

### T046: Create BillingHistory screen
**Description**: Create screen displaying subscription billing history with invoices.

**Files to Create**:
- `NestSync-frontend/app/screens/premium/BillingHistoryScreen.tsx`

**Acceptance Criteria**:
1. Lists all invoices sorted by date (newest first)
2. Shows invoice number, date, amount, status (Paid/Open)
3. Canadian tax breakdown expandable per invoice
4. Download invoice PDF button (temporary signed URL)
5. Pagination for large invoice lists
6. Refresh to load new invoices

**Constitutional Principles**: 5 (Canadian Compliance), 2 (Transparent Information)

**Dependencies**: T009, T033 (types, backend resolvers)

**Test Command**: `npm run test -- BillingHistoryScreen.test.tsx`

**Estimated Time**: 5 hours

---

### T046.5: Create PaymentFailureRecovery component
**Description**: Create UI component for handling payment failure recovery with 3-day grace period, implementing FR-027, FR-038, and FR-039 requirements.

**Files to Create**:
- `NestSync-frontend/app/components/premium/PaymentFailureAlert.tsx` (new - alert banner)
- `NestSync-frontend/app/components/premium/PaymentRetryModal.tsx` (new - retry flow modal)

**Files to Modify**:
- `NestSync-frontend/app/screens/premium/SubscriptionManagementScreen.tsx` (integrate alert)
- `NestSync-frontend/app/hooks/useSubscription.ts` (add retryPayment method)

**Acceptance Criteria**:
1. **Alert Banner** (displays when subscription status = PAST_DUE):
   - Non-dismissible banner at top of app
   - Shows: "Payment failed. [X] days remaining to update payment method"
   - Countdown timer showing grace period remaining (3 days from failure)
   - "Update Payment" CTA button
   - Bilingual support (EN/FR based on user province)
2. **Payment Retry Modal**:
   - Displays clear error reason: "Card declined", "Insufficient funds", "Network issue"
   - Shows failed invoice details: amount, date, payment method used
   - Three recovery paths (FR-039):
     - Option 1: "Retry with same card" (for network/temporary issues)
     - Option 2: "Update payment method" (opens Stripe PaymentSheet)
     - Option 3: "Contact Support" (opens support chat/email)
   - Loading states during retry
   - Success: "Payment successful! Subscription reactivated"
   - Error: Actionable error messages with next steps
3. **Grace Period Countdown**:
   - Real-time countdown: "2 days, 14 hours remaining"
   - Warning escalation: Red text when <24 hours remaining
   - Expires: Subscription moves to UNPAID, premium features revoked
4. **GraphQL Integration**:
   - Mutation: `retryPayment(invoiceId)` from billing.graphql
   - Query: `subscriptionStatus` to check PAST_DUE state
   - Subscription: `subscriptionStatusChanged` for real-time updates
5. **E2E Test Coverage**:
   - Scenario 6 in quickstart.md (payment failure → retry → success)
   - Edge case: Grace period expires → features locked

**Usage Pattern**:
```typescript
// In SubscriptionManagementScreen.tsx
const { subscription, retryPayment } = useSubscription();

if (subscription?.status === 'PAST_DUE') {
  const daysRemaining = Math.ceil((gracePeriodEnd - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <>
      <PaymentFailureAlert daysRemaining={daysRemaining} onUpdatePayment={handleRetry} />
      {/* Rest of UI */}
    </>
  );
}

const handleRetry = async (method: 'same' | 'new') => {
  if (method === 'same') {
    await retryPayment(failedInvoiceId);
  } else {
    // Open Stripe PaymentSheet to add new card
  }
};
```

**Error Messages (Bilingual)**:
```typescript
const ERROR_MESSAGES = {
  card_declined: {
    en: "Your card was declined. Please check with your bank or use a different card.",
    fr: "Votre carte a été refusée. Veuillez vérifier avec votre banque ou utiliser une autre carte."
  },
  insufficient_funds: {
    en: "Insufficient funds. Please add funds to your account or use a different payment method.",
    fr: "Fonds insuffisants. Veuillez ajouter des fonds à votre compte ou utiliser un autre mode de paiement."
  },
  network_error: {
    en: "Network error. Please check your connection and try again.",
    fr: "Erreur réseau. Veuillez vérifier votre connexion et réessayer."
  }
};
```

**Constitutional Principles**: 2 (Stress Reduction - clear guidance), 1 (Psychology-First UX - no panic), 4 (PIPEDA - grace period compliance)

**Dependencies**: T046 (BillingHistory screen), T035 (useSubscription hook), T009 (types)

**Test Command**: `npm run test -- PaymentFailureRecovery.test.tsx`

**Estimated Time**: 6 hours

---

### T047: Create SubscriptionManagement screen
**Description**: Create screen for managing active subscription (cancel, reactivate).

**Files to Create**:
- `NestSync-frontend/app/screens/premium/SubscriptionManagementScreen.tsx`

**Acceptance Criteria**:
1. Displays current subscription status and tier
2. Shows cooling-off period banner if within 14 days
3. Cancel subscription button with confirmation modal
4. Refund amount displayed for cooling-off cancellations
5. Reactivate button for canceled subscriptions (within cooling-off)
6. Payment method management section

**Constitutional Principles**: 3 (Consumer Protection), 2 (Stress Reduction)

**Dependencies**: T009, T035 (types, hooks)

**Test Command**: `npm run test -- SubscriptionManagementScreen.test.tsx`

**Estimated Time**: 6 hours

---

### T048: Implement bilingual i18n for subscription flows
**Description**: Setup react-i18next with English/French translations for premium upgrade flow.

**Files to Create**:
- `NestSync-frontend/i18n/config.ts`
- `NestSync-frontend/i18n/locales/en/subscription.json`
- `NestSync-frontend/i18n/locales/fr/subscription.json`

**Acceptance Criteria**:
1. Device locale detection: French for Quebec/NB users
2. Language toggle available in settings
3. All premium upgrade flow screens translated
4. French translations professionally reviewed (not machine-translated)
5. Pricing formatted per locale: $4.99 CAD vs 4,99 $ CAD
6. Date/time formatting respects locale

**Constitutional Principles**: 3 (Canadian Cultural Sensitivity), 5 (Bilingual Requirement)

**Dependencies**: All frontend components T038-T047

**Test Command**: `npm run test -- i18n.test.ts`

**Estimated Time**: 8 hours

---

### T049: Create feature access gate HOC
**Description**: Create Higher-Order Component for locking premium features.

**Files to Create**:
- `NestSync-frontend/app/components/premium/withFeatureAccess.tsx`

**Acceptance Criteria**:
1. `withFeatureAccess(Component, featureKey)` wraps components
2. Checks feature access level: NONE, LIMITED, FULL
3. Shows lock overlay for NONE access with upgrade prompt
4. Shows usage limit for LIMITED access
5. Allows full access for FULL access level
6. Real-time updates when subscription changes

**Constitutional Principles**: 1 (Progressive Disclosure), 14 (Premium Features)

**Dependencies**: T009, T035, T036 (types, hooks)

**Test Command**: `npm run test -- withFeatureAccess.test.tsx`

**Estimated Time**: 4 hours

---

### T050: Verify storage abstraction for trial/subscription status
**Description**: Verify that trial and subscription hooks correctly use existing `useUniversalStorage` hook (hooks/useUniversalStorage.ts) for cross-platform compatibility. The hook already exists and implements Constitutional Principle 18 with React tuple pattern.

**Files to Verify**:
- `NestSync-frontend/hooks/useUniversalStorage.ts` (existing - line 1-91, already implements Platform.OS branching)
- `NestSync-frontend/app/hooks/useTrial.ts` (created in T036)
- `NestSync-frontend/app/hooks/useSubscription.ts` (created in T035)

**Acceptance Criteria**:
1. Verify `useTrial` uses existing hook API: `const [trialCache, loading, setTrialCache] = useUniversalStorage<TrialStatus>('nestsync:trial_status', { secure: true })`
2. Verify `useSubscription` uses existing hook API: `const [subCache, loading, setSubCache] = useUniversalStorage<Subscription>('nestsync:subscription', { secure: true })`
3. Confirm works on iOS (SecureStore), Android (SecureStore), web (localStorage) via existing implementation
4. Verify cache invalidation on subscription changes (call `setCache(newData)` on mutation success)
5. Verify offline support: trial/subscription status available without network
6. Confirm no direct SecureStore imports in hooks (use `useUniversalStorage` abstraction)
7. Add unit tests for offline scenarios

**Existing API Pattern** (hooks/useUniversalStorage.ts):
```typescript
// Returns React tuple: [data, loading, setValue]
const [data, loading, setValue] = useUniversalStorage<T>(key, { secure: boolean });
```

**Constitutional Principles**: 18 (Cross-Platform Storage Abstraction)

**Dependencies**: T035, T036 (hooks implemented)

**Test Command**: `npm run test -- storage-abstraction.test.ts`

**Estimated Time**: 2 hours

---

## Phase 3.4: Integration & E2E Tests (Playwright)

**Prerequisites**: Backend and frontend implementation complete (T001-T050)

### T051: Setup Playwright test environment with conflict detection
**Description**: Configure Playwright with proactive server conflict detection.

**Files to Create**:
- `tests/e2e/playwright.config.ts`
- `tests/e2e/fixtures/subscription-fixtures.ts`

**Acceptance Criteria**:
1. Playwright configured for Chromium, WebKit, Firefox
2. `scripts/playwright-helper.js --auto-resolve` runs pre-test
3. Server conflict detection on ports 8001, 8082
4. Test user fixtures: create/reset trial users
5. GraphQL schema introspection validation
6. Screenshot and video recording on failure

**Constitutional Principles**: 11 (Proactive Playwright Workflow)

**Dependencies**: T001-T050 (full implementation)

**Test Command**: `npm run test:e2e:setup`

**Estimated Time**: 4 hours

---

### T052: Implement Playwright E2E test scenarios 1-3
**Description**: Implement first three E2E test scenarios from quickstart.md.

**Files to Create**:
- `tests/e2e/scenarios/scenario1-feature-discovery.spec.ts`
- `tests/e2e/scenarios/scenario2-trial-activation.spec.ts`
- `tests/e2e/scenarios/scenario3-value-tracking.spec.ts`

**Acceptance Criteria**:
1. Scenario 1: Natural feature discovery when hitting free-tier limits
2. Scenario 2: Trial activation without credit card requirement
3. Scenario 3: Real-time trial value metrics tracking
4. All steps from quickstart.md implemented
5. Screenshots captured for evidence
6. Tests pass on all browsers

**Constitutional Principles**: 10 (E2E Verification), 1 (User Experience)

**Dependencies**: T051 (Playwright setup)

**Test Command**: `npm run test:e2e -- scenarios/scenario[1-3]*`

**Estimated Time**: 8 hours

---

### T053: Implement Playwright E2E test scenarios 4-6
**Description**: Implement final three primary E2E test scenarios from quickstart.md.

**Files to Create**:
- `tests/e2e/scenarios/scenario4-trial-conversion.spec.ts`
- `tests/e2e/scenarios/scenario5-cancellation-refund.spec.ts`
- `tests/e2e/scenarios/scenario6-payment-recovery.spec.ts`

**Acceptance Criteria**:
1. Scenario 4: Trial-to-paid conversion with Stripe PaymentSheet
2. Scenario 5: Cancellation with 14-day cooling-off refund
3. Scenario 6: Payment failure recovery with 3-day grace period
4. All steps from quickstart.md implemented
5. Stripe test card handling (4242 4242 4242 4242)
6. Tests pass on all browsers

**Constitutional Principles**: 10 (E2E Verification), 9 (Four-Layer Defense)

**Dependencies**: T051 (Playwright setup)

**Test Command**: `npm run test:e2e -- scenarios/scenario[4-6]*`

**Estimated Time**: 8 hours

---

### T054: Implement Playwright edge case tests
**Description**: Implement edge case tests for trial expiration and bilingual support.

**Files to Create**:
- `tests/e2e/edge-cases/trial-expiration.spec.ts`
- `tests/e2e/edge-cases/bilingual-support.spec.ts`

**Acceptance Criteria**:
1. Edge Case 1: Trial expiration without conversion (graceful free-tier transition)
2. Edge Case 2: French language support for Quebec users (Bill 96 compliance)
3. Data preservation verified after trial expiration
4. Quebec tax calculation: GST + QST
5. French content displayed correctly
6. Tests pass on all browsers

**Constitutional Principles**: 10 (E2E Verification), 3 (Canadian Compliance)

**Dependencies**: T051 (Playwright setup)

**Test Command**: `npm run test:e2e -- edge-cases/*`

**Estimated Time**: 4 hours

---

### T055: Implement Playwright performance test
**Description**: Implement performance test for <2 second load time on 3G networks.

**Files to Create**:
- `tests/e2e/performance/load-time.spec.ts`

**Acceptance Criteria**:
1. Network throttled to 3G speeds (750 Kbps down, 250 Kbps up)
2. Upgrade flow screens load within 2 seconds
3. Measurements: LCP, FID, CLS
4. Test passes on all browsers
5. Performance report generated
6. Fails if load time exceeds 2 seconds

**Constitutional Principles**: 12 (Performance Goals - FR-042)

**Dependencies**: T051 (Playwright setup)

**Test Command**: `npm run test:e2e -- performance/*`

**Estimated Time**: 3 hours

---

## Phase 3.5: Polish & Deployment

### T056: Configure Stripe webhooks in production
**Description**: Setup Stripe webhook endpoint configuration for production environment.

**Files to Create**:
- `NestSync-backend/docs/stripe-webhook-setup.md`

**Acceptance Criteria**:
1. Webhook endpoint URL registered in Stripe Dashboard
2. Events subscribed: invoice.paid, payment_intent.succeeded, payment_intent.payment_failed
3. Webhook secret stored in environment variables
4. Signature verification enabled
5. Webhook delivery monitoring configured
6. Retry logic tested for failed deliveries

**Constitutional Principles**: 9 (Four-Layer Defense), 6 (Failure Prevention)

**Dependencies**: T034 (webhook handlers)

**Test Command**: Manual verification with Stripe CLI: `stripe listen --forward-to localhost:8001/webhooks/stripe`

**Estimated Time**: 2 hours

---

### T056.5: WCAG 2.1 Accessibility Audit
**Description**: Conduct comprehensive WCAG 2.1 Level AA accessibility audit for premium upgrade flow, implementing Constitutional Principle 3 (Accessibility).

**Files to Create**:
- `specs/001-use-the-design/accessibility-audit-report.md` (new - audit findings)
- `NestSync-frontend/tests/accessibility/premium-flow.a11y.test.ts` (new - automated a11y tests)

**Files to Modify**:
- All premium upgrade flow components (add ARIA labels, roles, semantic HTML)

**Acceptance Criteria - WCAG 2.1 Level AA Compliance**:

#### 1. Perceivable
- [ ] **1.1.1 Non-text Content**: All images, icons, and buttons have descriptive `alt` text or `aria-label`
- [ ] **1.3.1 Info and Relationships**: Semantic HTML used (e.g., `<button>` not `<div onClick>`)
- [ ] **1.3.2 Meaningful Sequence**: Tab order follows visual flow (trial activation → payment → confirmation)
- [ ] **1.4.3 Contrast (Minimum)**: 4.5:1 contrast ratio for text, 3:1 for large text (18px+)
- [ ] **1.4.4 Resize Text**: Text readable at 200% zoom without horizontal scrolling
- [ ] **1.4.11 Non-text Contrast**: 3:1 contrast for UI components (buttons, input borders)

#### 2. Operable
- [ ] **2.1.1 Keyboard**: All interactive elements reachable via keyboard (Tab, Enter, Space)
- [ ] **2.1.2 No Keyboard Trap**: Users can tab out of all modals and components
- [ ] **2.4.3 Focus Order**: Logical focus order: Trial CTA → Plan selection → Payment → Confirm
- [ ] **2.4.7 Focus Visible**: Clear focus indicators on all interactive elements
- [ ] **2.5.1 Pointer Gestures**: No multi-touch-only interactions (support single tap)
- [ ] **2.5.5 Target Size**: Minimum 44x44px touch targets for all buttons (Constitutional Principle 3)

#### 3. Understandable
- [ ] **3.1.1 Language of Page**: `lang="en-CA"` or `lang="fr-CA"` attribute based on user province
- [ ] **3.2.1 On Focus**: No automatic submission when focusing form fields
- [ ] **3.2.2 On Input**: No context changes on input (e.g., changing plan doesn't auto-submit)
- [ ] **3.3.1 Error Identification**: Errors clearly identified with `role="alert"` and descriptive text
- [ ] **3.3.2 Labels or Instructions**: All form fields have visible labels
- [ ] **3.3.3 Error Suggestion**: Actionable error recovery (FR-038, FR-039)
- [ ] **3.3.4 Error Prevention**: Confirmation screen before final payment

#### 4. Robust
- [ ] **4.1.2 Name, Role, Value**: All custom components use proper ARIA attributes
  - Trial progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - Pricing toggle: `role="switch"`, `aria-checked`
  - Modal dialogs: `role="dialog"`, `aria-labelledby`, `aria-describedby`
  - Payment consent modal: `role="alertdialog"`, `aria-modal="true"`
- [ ] **Screen Reader Testing**: Test with VoiceOver (iOS) and TalkBack (Android)

#### 5. Additional Constitutional Principle 3 Requirements
- [ ] **Reduced Motion**: Respect `prefers-reduced-motion` media query (FR-045)
- [ ] **Touch Target Consistency**: 44px minimum across all premium flow (FR-046)
- [ ] **Loading States**: `aria-live="polite"` regions announce loading/success states
- [ ] **Empty States**: Descriptive empty states (not just blank screens)

**Automated Testing**:
```typescript
// tests/accessibility/premium-flow.a11y.test.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Trial Activation screen is accessible', async () => {
  const { container } = render(<TrialActivationScreen />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Payment consent modal meets WCAG 2.1 AA', async () => {
  const { container } = render(<PaymentConsentModal />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Manual Testing Checklist**:
1. [ ] Lighthouse accessibility score: 95+
2. [ ] axe DevTools: 0 violations, 0 warnings
3. [ ] VoiceOver navigation test (iOS): All elements announced correctly
4. [ ] TalkBack navigation test (Android): All interactive elements reachable
5. [ ] Keyboard-only navigation: Complete premium flow without mouse
6. [ ] Color contrast verification: Use WebAIM Contrast Checker
7. [ ] 200% zoom test: No horizontal scroll, all text readable
8. [ ] Reduced motion test: Animations disabled when OS preference set

**Deliverables**:
1. Accessibility audit report with WCAG 2.1 AA checklist results
2. Automated a11y tests passing: `npm run test:a11y`
3. Lighthouse accessibility score: 95+

**Constitutional Principles**: 3 (Accessibility - WCAG 2.1 AA compliance)

**Dependencies**: T050 (all frontend components complete)

**Test Command**: `npm run test:a11y && npm run lighthouse:a11y`

**Estimated Time**: 6 hours

---

### T057: Final constitutional compliance validation
**Description**: Run comprehensive validation against all 19 constitutional principles.

**Files to Create**:
- `specs/001-use-the-design/compliance-report.md`

**Acceptance Criteria**:
1. All 19 constitutional principles validated
2. Principle 1: Cognitive load checked (< 10 second actions)
3. Principle 2: Stress reduction verified (no aggressive language)
4. Principle 3: Canadian context validated (PIPEDA, timezone)
5. Principle 4-5: RLS policies and audit logging functional
6. Principle 6-8: GraphQL schema integrity, async patterns, failure prevention
7. Principle 10-11: Playwright E2E tests passing with 95%+ first-attempt rate
8. Principle 14: Stripe premium dependencies protected
9. Principle 18: Cross-platform storage abstraction functional
10. Compliance report generated with evidence artifacts

**Constitutional Principles**: ALL (1-19)

**Dependencies**: All previous tasks (T001-T056)

**Test Command**: `npm run compliance:check`

**Estimated Time**: 4 hours

---

## Dependencies Graph

```
Foundation (T001-T010)
    ├─→ Tests (T011-T025) ⚠️ MUST FAIL BEFORE IMPLEMENTATION
    │
    └─→ Backend Implementation (T026-T034)
            ├─→ Frontend Hooks (T035-T037) [P]
            │
            └─→ Frontend Components (T038-T050)
                    │
                    └─→ E2E Tests (T051-T055)
                            │
                            └─→ Polish (T056-T057)
```

---

## Parallel Execution Examples

### Group 1: Database Migrations [P]
```bash
# These can run simultaneously (different migration files):
Task T002: "Create database migration for subscription tables"
Task T003: "Create database migration for billing tables"
Task T004: "Create database migration for trial tables"
```

### Group 2: SQLAlchemy Models [P]
```bash
# These can run simultaneously (different model files):
Task T006: "Create SQLAlchemy models for subscription entities"
Task T007: "Create SQLAlchemy models for billing entities"
Task T008: "Create SQLAlchemy models for trial entities"
Task T009: "Generate TypeScript interfaces from GraphQL schema"
```

### Group 3: Contract Tests [P]
```bash
# These can run simultaneously (different test files):
Task T011: "Contract test for subscription GraphQL queries"
Task T012: "Contract test for subscription GraphQL mutations"
Task T013: "Contract test for payment GraphQL operations"
Task T014: "Contract test for trial GraphQL operations"
Task T015: "Contract test for billing GraphQL operations"
```

### Group 4: Integration Tests [P]
```bash
# These can run simultaneously (different test files):
Task T016: "Integration test for trial activation flow"
Task T017: "Integration test for trial-to-paid conversion"
Task T018: "Integration test for payment failure recovery"
Task T019: "Integration test for cancellation with cooling-off refund"
Task T020: "Integration test for Canadian tax calculation"
```

### Group 5: Unit Tests [P]
```bash
# These can run simultaneously (different test files):
Task T021: "Unit test for trial value score algorithm"
Task T022: "Unit test for subscription state machine"
Task T023: "Unit test for Canadian billing address validation"
Task T024: "Unit test for invoice numbering format"
Task T025: "Unit test for feature access gates"
```

### Group 6: Frontend Hooks [P]
```bash
# These can run simultaneously (different hook files):
Task T035: "Create useSubscription custom hook"
Task T036: "Create useTrial custom hook"
Task T037: "Create useStripePayment custom hook"
```

---

## Task Execution Checklist

### Before Starting Implementation
- [ ] All design documents reviewed (plan.md, data-model.md, contracts/, research.md, quickstart.md)
- [ ] Development environment ready (Docker containers on ports 8001, 8082)
- [ ] Stripe test mode credentials configured
- [ ] Database migrations ready to run
- [ ] Constitutional principles understood

### TDD Enforcement
- [ ] Phase 3.2 tests written BEFORE Phase 3.3 implementation
- [ ] Verified all tests fail initially: `pytest tests/ -v` shows failures
- [ ] Tests pass after implementation: `pytest tests/ -v` shows success

### After Each Task
- [ ] Task acceptance criteria met
- [ ] Tests passing for that task
- [ ] Code reviewed for constitutional compliance
- [ ] No linter errors: `npm run lint && python -m flake8`
- [ ] Changes committed: `git commit -m "feat(premium): T0XX - [description]"`

### Before E2E Tests
- [ ] Backend fully implemented (T001-T034)
- [ ] Frontend fully implemented (T035-T050)
- [ ] Contract tests passing (T011-T015)
- [ ] Integration tests passing (T016-T020)
- [ ] Playwright environment configured (T051)

### Final Validation
- [ ] All 57 tasks completed
- [ ] All Playwright E2E scenarios passing (T052-T055)
- [ ] Performance requirements met (<2 second load time)
- [ ] Constitutional compliance validated (T057)
- [ ] Stripe webhooks configured (T056)
- [ ] Ready for production deployment

---

## Notes

**TDD Critical**: Never implement Phase 3.3 tasks until Phase 3.2 tests are written and failing. This ensures proper test coverage.

**Parallel Execution**: Tasks marked [P] can run simultaneously if resources available. Use separate branches/developers for parallel work.

**Constitutional Compliance**: Each task references relevant constitutional principles. Validate compliance during code review.

**Estimated Timeline**:
- Phase 3.1: 1 week (setup & infrastructure)
- Phase 3.2: 1.5 weeks (tests first - TDD)
- Phase 3.3: 3-4 weeks (core implementation)
- Phase 3.4: 1 week (E2E tests)
- Phase 3.5: 0.5 weeks (polish & deployment)
- **Total**: 7-8 weeks

**Success Criteria**:
- 100% of contract tests passing
- 100% of integration tests passing
- 100% of E2E scenarios passing (9 scenarios)
- Performance test passing (<2s load time on 3G)
- Constitutional compliance report: 19/19 principles validated

---

**Tasks Status**: ✅ READY FOR EXECUTION  
**Next Action**: Begin with T001 (Stripe SDK configuration)  
**Suggested Command**: Start implementing tasks sequentially, marking [P] tasks for parallel execution when appropriate.

