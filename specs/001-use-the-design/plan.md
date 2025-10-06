
# Implementation Plan: Premium Upgrade Flow

**Branch**: `001-use-the-design` | **Date**: 2025-10-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/mayenikhalo/Public/From aEroPartition/Dev/NestSyncv1.2/specs/001-use-the-design/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a comprehensive, modular premium upgrade flow system for Canadian families to discover, evaluate (14-day free trial), and purchase premium subscription tiers ($4.99 Standard, $6.99 Premium monthly). The system replaces the existing PremiumUpgradeModal.tsx with a psychology-driven, PIPEDA-compliant solution featuring contextual feature discovery, no-credit-card trials, real-time value metrics tracking, Canadian tax calculations (GST/PST/HST), Stripe payment processing (credit cards Phase 1), bilingual support (Quebec/New Brunswick), and 14-day cooling-off period for annual subscriptions. Target success metrics: 12-15% conversion rate, 75% trial completion, 90% retention.

## Technical Context
**Language/Version**: TypeScript (React Native/Expo SDK ~53), Python 3.11+ (FastAPI backend)  
**Primary Dependencies**: React Native, Expo SDK ~53, @stripe/stripe-react-native, Apollo Client 3.14.0, FastAPI, Strawberry GraphQL, Supabase SDK  
**Storage**: Supabase PostgreSQL with Row Level Security (RLS), Canadian data centers for PIPEDA compliance  
**Testing**: Playwright (end-to-end), Jest (unit tests), GraphQL schema validation  
**Target Platform**: iOS 15+, Android API 26+, mobile-first with web fallback for informational flows
**Project Type**: Mobile (React Native app + FastAPI API backend)  
**Performance Goals** (Constitutional Principle 6):
- **Bundle Size**: <5MB total for premium feature bundle (includes Stripe SDK ~2MB, tracked via Metro bundler)
- **Critical Path API** (<100ms): Trial activation (`startTrial`), subscription status check (`subscriptionStatus`)
- **Non-Critical Path API** (<500ms): Billing history fetch, tax calculation, feature access verification
- **Animation Performance**: 60fps for modal transitions, pricing carousel scrolling, subscription tier animations
- **Offline Support**: Trial status viewable offline via `useUniversalStorage` cache, subscription details cached for 5 min
- **Network Resilience**: <2 seconds load time on 3G networks (FR-042), graceful degradation on offline/slow connections
- **Real-Time Metrics**: Trial progress updates via GraphQL subscriptions, value demonstration tracking  
**Constraints**: PIPEDA compliance, Canadian data residency, 14-day cooling-off period, credit cards only (Phase 1), bilingual support (Quebec/NB), GST/PST/HST tax calculations  
**Scale/Scope**: Premium upgrade flow replacing 1,125-line PremiumUpgradeModal.tsx with modular system, 7 key entities, 46 functional requirements, 6 primary user scenarios

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Article I: Psychology-First User Experience
- ✅ **Principle 1** (Cognitive Load): Modular upgrade flow reduces decision fatigue, progressive disclosure (trial → payment), <10 second actions
- ✅ **Principle 2** (Stress Reduction): Gentle conversion prompts (days 10-14), supportive microcopy, no aggressive sales tactics
- ✅ **Principle 3** (Canadian Cultural Sensitivity): PIPEDA messaging, polite language, America/Toronto timezone for all timestamps

### Article II: PIPEDA Compliance & Data Privacy
- ✅ **Principle 4** (Privacy by Design): RLS policies for subscription data, Canadian data center storage (FR-032)
- ✅ **Principle 5** (Transparent Consent): Clear consent for billing data collection, timezone configured as America/Toronto

### Article III: Systematic Failure Prevention
- ✅ **Principle 6** (Documented Failures): GraphQL schema validation prevents snake_case/camelCase mismatches
- ✅ **Principle 7** (Async Patterns): FastAPI backend follows AsyncGenerator pattern, Apollo Client 3.x error handling
- ✅ **Principle 8** (GraphQL Schema Integrity): Strawberry camelCase aliases, frontend/backend schema compatibility tests

### Article IV: Business Continuity
- ✅ **Principle 9** (Four-Layer Defense): Payment processing reliability (3-day grace period FR-027), Stripe integration health monitoring

### Article V: Quality Assurance
- ✅ **Principle 10** (E2E Verification): Playwright verification mandatory for all upgrade flow screens and payment processing
- ✅ **Principle 11** (Proactive Playwright): Server conflict detection, GraphQL introspection validation before testing

### Article VI: Professional Standards
- ✅ **Principle 12** (No Emojis): Design system icons instead (Canadian flag, trust indicators)
- ✅ **Principle 13** (Professional Commits): Conventional commit format, comprehensive squash merge messages

### Article VII: Business-Critical Dependencies
- ✅ **Principle 14** (Premium Feature Protection): Stripe SDK (@stripe/stripe-react-native) essential for subscription revenue model

### Article VIII: Development Workflow
- ✅ **Principle 15** (Docker-First): Both frontend (8082) and backend (8001) in Docker for payment flow testing
- ✅ **Principle 16** (Feature Integration): Squash merge to main with comprehensive implementation journey documentation

### Article IX: AI Agent Orchestration
- ✅ **Principle 17** (Systematic Thinking): Complex feature requires System Architect, Senior Frontend, Senior Backend, QA agents

### Article X: Cross-Platform Storage
- ✅ **Principle 18** (Platform-Agnostic Storage): Trial status and subscription data use universal storage hooks (useUniversalStorage.ts)

### Article XI: Development Environment
- ✅ **Principle 19** (Dev Configuration): America/Toronto timezone, rate limiting disabled for testing, Apollo Client 3.x pinned

**Initial Gate Status**: ✅ PASS - No constitutional violations detected. All principles align with feature requirements.

---

## Post-Design Constitution Re-Evaluation

After completing Phase 1 design (data-model.md, contracts/, quickstart.md), re-evaluating all constitutional principles:

### Article I: Psychology-First User Experience
- ✅ **Maintained**: Trial dashboard provides visual progress tracking (Principle 1)
- ✅ **Maintained**: Conversion prompts use value-focused messaging, no aggressive tactics (Principle 2)
- ✅ **Maintained**: All timestamps use America/Toronto timezone in schema (Principle 3)

### Article II: PIPEDA Compliance & Data Privacy
- ✅ **Maintained**: RLS policies defined for all subscription tables (Principle 4)
- ✅ **Maintained**: Audit logging trigger functions created (Principle 5)

### Article III: Systematic Failure Prevention
- ✅ **Maintained**: Strawberry camelCase aliases in GraphQL schema prevent field mismatches (Principle 6, 8)
- ✅ **Maintained**: Backend implementation will use AsyncGenerator pattern (Principle 7)

### Article IV: Business Continuity
- ✅ **Maintained**: 3-day grace period and payment recovery flows designed (Principle 9)

### Article V: Quality Assurance
- ✅ **Maintained**: 9 Playwright E2E test scenarios defined in quickstart.md (Principle 10, 11)

### Article VI-XI: Other Principles
- ✅ **Maintained**: All other principles remain aligned through design phase

**Post-Design Gate Status**: ✅ PASS - No constitutional violations introduced during design phase. All principles maintained in data model, API contracts, and test scenarios.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
NestSync-backend/
├── app/
│   ├── models/          # SQLAlchemy models (Subscription, Payment, BillingHistory)
│   ├── graphql/         # Strawberry GraphQL resolvers (subscription queries/mutations)
│   ├── services/        # Business logic (SubscriptionService, StripeService, TaxService)
│   ├── middleware/      # Authentication, RLS enforcement
│   └── utils/           # Canadian tax calculations, timezone utilities
├── tests/
│   ├── contract/        # GraphQL schema validation
│   ├── integration/     # End-to-end subscription flow tests
│   └── unit/            # Service layer tests
└── alembic/             # Database migrations for subscription schema

NestSync-frontend/
├── app/
│   ├── screens/         # Premium upgrade flow screens
│   │   ├── discovery/   # Feature discovery & limitation notifications
│   │   ├── trial/       # Trial activation & progress tracking
│   │   ├── payment/     # Stripe payment processing
│   │   └── manage/      # Subscription management dashboard
│   ├── components/      # Reusable upgrade flow components
│   │   ├── PricingCard.tsx
│   │   ├── TrialProgressBar.tsx
│   │   ├── CanadianTaxBreakdown.tsx
│   │   └── StripePaymentSheet.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useSubscription.ts
│   │   ├── useTrial.ts
│   │   └── useStripePayment.ts
│   ├── services/        # API integration
│   │   └── subscriptionService.ts
│   └── types/           # TypeScript interfaces
└── tests/
    ├── e2e/             # Playwright premium flow tests
    └── unit/            # Component tests

design-documentation/
└── features/
    └── premium-upgrade-flow/  # Source design specifications
```

**Structure Decision**: Mobile + API architecture selected. React Native frontend (NestSync-frontend) communicates with FastAPI backend (NestSync-backend) via GraphQL. Premium upgrade flow components organized by user journey stage (discovery → trial → payment → management). Backend subscription services handle Stripe integration, Canadian tax calculations, and PIPEDA-compliant data storage.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

### Task Generation Strategy

The `/tasks` command will generate a comprehensive, ordered task list following Test-Driven Development (TDD) principles. Tasks will be derived from:

1. **From contracts/** (GraphQL API contracts):
   - Each query/mutation → contract test task
   - Schema validation task
   - Frontend type generation task

2. **From data-model.md** (7 entities):
   - Database migration tasks (PostgreSQL schemas)
   - SQLAlchemy model creation tasks
   - RLS policy implementation tasks
   - Audit trigger implementation tasks
   - TypeScript interface generation tasks

3. **From quickstart.md** (9 test scenarios):
   - Playwright E2E test implementation tasks
   - Test fixture setup tasks
   - Test data generation tasks

4. **From research.md** (9 technology decisions):
   - Stripe SDK integration tasks
   - Canadian tax service implementation tasks
   - Trial management service tasks
   - Payment processing flow tasks
   - Bilingual i18n setup tasks

### Task Categories & Ordering

#### Category 1: Foundation (Tasks 1-10)
**Purpose**: Database schema, migrations, base infrastructure

- Task 1: Create database migration for subscription tables [P]
- Task 2: Create database migration for billing tables [P]
- Task 3: Create database migration for trial tables [P]
- Task 4: Implement RLS policies for all tables
- Task 5: Implement audit logging triggers
- Task 6: Create SQLAlchemy models (Subscription, Payment, etc.) [P]
- Task 7: Generate TypeScript interfaces from GraphQL schema [P]
- Task 8: Setup Stripe SDK configuration (backend + frontend) [P]
- Task 9: Implement Canadian tax rate service
- Task 10: Create contract test skeleton (failing tests)

**Dependencies**: Tasks 1-3 can run in parallel. Tasks 4-5 depend on 1-3. Tasks 6-9 can run in parallel after database tasks.

#### Category 2: Backend API Layer (Tasks 11-25)
**Purpose**: GraphQL resolvers, business logic, Stripe integration

- Task 11: Implement subscription GraphQL queries (subscriptionStatus, plans, pricing)
- Task 12: Implement trial mutations (startTrial, trackFeatureUsage)
- Task 13: Implement conversion mutation (convertToPaid)
- Task 14: Implement cancellation mutations (cancel, reactivate)
- Task 15: Implement payment GraphQL queries (paymentMethods, createPaymentIntent)
- Task 16: Implement payment mutations (add, remove, setDefault)
- Task 17: Implement billing GraphQL queries (billingHistory, invoice)
- Task 18: Implement trial GraphQL queries (trialProgress, featureAccess)
- Task 19: Create SubscriptionService (trial, conversion, cancellation logic)
- Task 20: Create StripeService (customer, subscription, payment intent creation)
- Task 21: Create TaxService (provincial rate calculation)
- Task 22: Create TrialAnalyticsService (value metrics aggregation)
- Task 23: Implement Stripe webhook handlers (/webhooks/stripe endpoint)
- Task 24: Implement feature access gate service
- Task 25: Write backend contract tests (pass existing test skeletons)

**Dependencies**: Tasks 11-18 depend on Task 6 (models). Tasks 19-24 depend on service dependencies. Task 25 validates all backend tasks.

#### Category 3: Frontend Components (Tasks 26-40)
**Purpose**: React Native UI components, screens, hooks

- Task 26: Create useSubscription hook (Apollo Client integration)
- Task 27: Create useTrial hook (trial progress tracking)
- Task 28: Create useStripePayment hook (PaymentSheet integration)
- Task 29: Create FeatureDiscovery notification component
- Task 30: Create PricingCard component with Canadian tax breakdown
- Task 31: Create TrialActivation screen
- Task 32: Create TrialDashboard screen (value metrics display)
- Task 33: Create TrialProgress component (days remaining, features explored)
- Task 34: Create OnboardingModal component (guided feature exploration)
- Task 35: Create PaymentMethodScreen (Stripe PaymentSheet)
- Task 36: Create BillingAddress form component (Canadian validation)
- Task 37: Create BillingHistory screen
- Task 38: Create SubscriptionManagement screen (cancel, reactivate)
- Task 39: Implement bilingual i18n (EN/FR for subscription flows)
- Task 40: Create feature access gate HOC (lock premium features)

**Dependencies**: Tasks 26-28 (hooks) must complete before screen tasks 29-40. i18n (Task 39) should complete early for integration across components.

#### Category 4: Integration & E2E Tests (Tasks 41-50)
**Purpose**: Playwright E2E scenarios from quickstart.md

- Task 41: Setup Playwright test environment (server conflict detection)
- Task 42: Implement test fixtures (create/reset trial users)
- Task 43: Implement Scenario 1: Natural Feature Discovery test
- Task 44: Implement Scenario 2: Trial Activation test
- Task 45: Implement Scenario 3: Trial Value Tracking test
- Task 46: Implement Scenario 4: Trial-to-Paid Conversion test
- Task 47: Implement Scenario 5: Cancellation with Cooling-Off test
- Task 48: Implement Scenario 6: Payment Failure Recovery test
- Task 49: Implement Edge Case tests (trial expiration, bilingual)
- Task 50: Implement performance test (2-second load time on 3G)

**Dependencies**: All E2E tests depend on Tasks 1-40 (full implementation). Tests can run in parallel once implementation complete.

#### Category 5: Polish & Documentation (Tasks 51-55)
**Purpose**: Deployment readiness, documentation, monitoring

- Task 51: Configure Stripe webhooks in production
- Task 52: Setup monitoring/alerting for payment failures
- Task 53: Generate API documentation from GraphQL schema
- Task 54: Update user-facing help documentation
- Task 55: Final constitutional compliance validation

**Dependencies**: Tasks 51-55 depend on all previous tasks passing.

### Estimated Task Breakdown

**Total Tasks**: ~55 tasks
- Foundation: 10 tasks (database, models, contracts)
- Backend API: 15 tasks (GraphQL, services, Stripe integration)
- Frontend UI: 15 tasks (components, screens, hooks, i18n)
- E2E Tests: 10 tasks (Playwright scenarios)
- Polish: 5 tasks (deployment, docs, monitoring)

**Parallel Execution Opportunities**: ~20 tasks marked [P] can run in parallel
**Estimated Duration**: 6-8 weeks (per spec complexity estimate)

**Critical Path**: 
1. Database migrations (Tasks 1-5)
2. Backend services (Tasks 19-24)
3. Frontend screens (Tasks 31-38)
4. E2E validation (Tasks 41-50)

### Task Dependencies Graph (High-Level)

```
Foundation (1-10)
    ↓
Backend API (11-25)
    ↓
Frontend Components (26-40)
    ↓
E2E Tests (41-50)
    ↓
Polish (51-55)
```

### Task Acceptance Criteria Pattern

Each task will include:
- **Description**: What needs to be built
- **Acceptance Criteria**: 3-5 testable conditions
- **Files to Create/Modify**: Specific file paths
- **Dependencies**: Task IDs that must complete first
- **Constitutional Principles**: Which principles this task validates
- **Test Command**: How to verify task completion
- **Estimated Time**: Hours/days for complexity planning

### Example Task Format
```markdown
### Task 19: Create SubscriptionService

**Description**: Implement subscription business logic service with trial activation, conversion, and cancellation methods.

**Acceptance Criteria**:
1. `start_trial()` creates trialing subscription without payment method
2. `convert_to_paid()` transitions trial to active with Stripe subscription
3. `cancel_subscription()` handles cooling-off period refunds (14 days for annual)
4. All methods use AsyncGenerator pattern (Principle 7)
5. RLS policies enforced on all database operations (Principle 4)

**Files to Create**:
- `NestSync-backend/app/services/subscription_service.py`

**Files to Modify**:
- `NestSync-backend/app/graphql/subscription_schema.py` (import service)

**Dependencies**: Tasks 1-6 (database, models)

**Constitutional Principles**: 4 (Privacy), 5 (Timezone), 7 (Async Patterns)

**Test Command**: `pytest tests/unit/test_subscription_service.py -v`

**Estimated Time**: 6 hours
```

**IMPORTANT**: This phase is executed by the `/tasks` command, NOT by /plan. The above is a planning description only.

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md generated with 9 technology decisions
- [x] Phase 1: Design complete (/plan command) - data-model.md (7 entities), contracts/ (4 GraphQL schemas), quickstart.md (9 test scenarios), CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 55 tasks estimated across 5 categories
- [x] Phase 3: Tasks generated (/tasks command) - tasks.md with 57 detailed implementation tasks
- [ ] Phase 4: Implementation in progress (execute tasks T001-T057)
- [ ] Phase 5: Validation passed (E2E tests, constitutional compliance)

**Gate Status**:
- [x] Initial Constitution Check: PASS - All principles aligned
- [x] Post-Design Constitution Check: PASS - No violations introduced during design
- [x] All NEEDS CLARIFICATION resolved - 5 clarifications from /clarify session
- [x] Complexity deviations documented - None detected

**Artifacts Generated**:
- ✅ research.md (9 technology decisions, 8,923 words)
- ✅ data-model.md (7 entities with full schemas, migrations, RLS policies)
- ✅ contracts/subscription.graphql (subscription lifecycle management)
- ✅ contracts/payment.graphql (payment processing with Stripe)
- ✅ contracts/trial.graphql (trial progress and value tracking)
- ✅ contracts/billing.graphql (billing history and invoices)
- ✅ contracts/README.md (contract documentation, 28 operations)
- ✅ quickstart.md (9 Playwright E2E test scenarios)
- ✅ CLAUDE.md (agent context updated with premium upgrade flow)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
