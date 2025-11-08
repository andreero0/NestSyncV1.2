# Quickstart: Premium Upgrade Flow E2E Tests

**Feature**: Premium Upgrade Flow  
**Date**: 2025-10-02  
**Test User**: parents@nestsync.com  
**Status**: Test Scenarios Defined

## Overview

This document defines end-to-end test scenarios for validating the premium upgrade flow. All tests must pass using Playwright browser automation on real mobile devices (iOS/Android) and web browsers. Tests verify functional requirements, user stories, and constitutional principles.

---

## Prerequisites

### Test Environment Setup
```bash
# 1. Ensure Docker development environment running
./docker/docker-dev.sh up

# 2. Verify backend and frontend servers
curl http://localhost:8001/health  # Backend
curl http://localhost:8082         # Frontend

# 3. Verify test user exists
# Email: parents@nestsync.com
# Password: [test password from .env.test]

# 4. Reset test user to free tier
npm run test:reset-user -- --email=parents@nestsync.com

# 5. Start Playwright server conflict detection (Constitutional Principle 11)
node scripts/playwright-helper.js --auto-resolve

# 6. Run Playwright tests
npm run test:e2e -- --project=chromium --headed
```

### Test Data
- **Test User**: parents@nestsync.com (existing free-tier user)
- **Test Family**: Emma (4 years), Olivia (2 years)
- **Test Province**: ON (Ontario, 13% HST)
- **Test Payment**: Stripe test card (4242 4242 4242 4242)

---

## Test Scenarios

### Scenario 1: Natural Feature Discovery (FR-001, FR-002)

**Given**: Free-tier user hits 4-family-member limit  
**When**: User encounters limitation notification  
**Then**: System displays gentle premium solution preview

#### Test Steps
```typescript
test('Scenario 1: Natural Feature Discovery', async ({ page }) => {
  // 1. Login as free-tier user
  await page.goto('http://localhost:8082/auth/signin');
  await page.fill('[data-testid="email-input"]', 'parents@nestsync.com');
  await page.fill('[data-testid="password-input"]', process.env.TEST_PASSWORD);
  await page.click('[data-testid="signin-button"]');
  
  // 2. Navigate to family management
  await page.click('[data-testid="family-tab"]');
  
  // 3. Attempt to add 5th family member (beyond free limit)
  await page.click('[data-testid="add-family-member-button"]');
  await page.fill('[data-testid="name-input"]', 'Grandmother Susan');
  await page.click('[data-testid="save-button"]');
  
  // 4. Verify limitation notification appears
  const limitNotification = page.locator('[data-testid="feature-limit-notification"]');
  await expect(limitNotification).toBeVisible();
  await expect(limitNotification).toContainText('upgrade to premium');
  
  // 5. Verify gentle, non-intrusive presentation (Principle 2: Stress Reduction)
  await expect(limitNotification).not.toContainText('URGENT');
  await expect(limitNotification).not.toContainText('LIMITED TIME');
  
  // 6. Verify Canadian family testimonial present (FR-003)
  await page.click('[data-testid="view-premium-button"]');
  const testimonial = page.locator('[data-testid="testimonial"]');
  await expect(testimonial).toContainText('Burlington, ON');
  await expect(testimonial).toContainText('hours/week');
  
  // 7. Verify transparent CAD pricing with provincial taxes (FR-005, FR-006)
  const pricingCard = page.locator('[data-testid="pricing-card-standard"]');
  await expect(pricingCard).toContainText('$4.99 CAD/month');
  await expect(pricingCard).toContainText('HST');
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario1-feature-discovery.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ Limitation notification appears when free tier limit reached
- ✅ Presentation is gentle and non-intrusive (no aggressive sales language)
- ✅ Canadian family testimonial includes location and time savings
- ✅ Pricing displayed in CAD with provincial tax label

---

### Scenario 2: Trial Activation (FR-010, FR-011)

**Given**: User decides to try premium features  
**When**: User activates 14-day free trial  
**Then**: System provides immediate full access with guided onboarding

#### Test Steps
```typescript
test('Scenario 2: Trial Activation', async ({ page }) => {
  // 1. Login and navigate to upgrade flow
  await loginAsTestUser(page);
  await page.click('[data-testid="upgrade-button"]');
  
  // 2. Verify no credit card required (FR-010)
  const trialCard = page.locator('[data-testid="trial-card"]');
  await expect(trialCard).toContainText('14-day free trial');
  await expect(trialCard).toContainText('No credit card required');
  
  // 3. Activate trial
  await page.click('[data-testid="start-trial-button"]');
  
  // 4. Verify GraphQL mutation success
  await page.waitForResponse(resp => 
    resp.url().includes('/graphql') && resp.status() === 200
  );
  
  // 5. Verify immediate premium feature access (FR-010)
  await page.waitForSelector('[data-testid="premium-badge"]');
  const subscriptionStatus = await page.locator('[data-testid="subscription-status"]').textContent();
  expect(subscriptionStatus).toContain('Trial Active');
  
  // 6. Verify guided onboarding starts (FR-011)
  const onboardingModal = page.locator('[data-testid="onboarding-modal"]');
  await expect(onboardingModal).toBeVisible();
  await expect(onboardingModal).toContainText('Welcome to Premium');
  
  // 7. Verify onboarding steps (days 1-3)
  const onboardingSteps = page.locator('[data-testid="onboarding-step"]');
  await expect(onboardingSteps).toHaveCount(5);  // 5 premium features
  
  // 8. Complete first onboarding step
  await page.click('[data-testid="onboarding-step-1"]');
  await page.click('[data-testid="try-feature-button"]');
  await page.click('[data-testid="complete-step-button"]');
  
  // 9. Verify trial progress dashboard visible (FR-012, FR-013)
  await page.click('[data-testid="trial-progress-button"]');
  const trialDashboard = page.locator('[data-testid="trial-dashboard"]');
  await expect(trialDashboard).toBeVisible();
  await expect(trialDashboard).toContainText('days remaining');
  await expect(trialDashboard).toContainText('features explored');
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario2-trial-activation.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ No credit card required for trial activation
- ✅ Immediate full premium feature access granted
- ✅ Guided onboarding modal appears with 5 feature steps
- ✅ Trial progress dashboard shows days remaining and features explored

---

### Scenario 3: Trial Value Tracking (FR-012)

**Given**: User on active trial  
**When**: User engages with premium features  
**Then**: System tracks and displays real-time value metrics

#### Test Steps
```typescript
test('Scenario 3: Trial Value Tracking', async ({ page }) => {
  // 1. Login as trial user
  await loginAsTrialUser(page);
  
  // 2. Trigger automation feature (time saved)
  await page.click('[data-testid="automation-tab"]');
  await page.click('[data-testid="setup-automation-button"]');
  await page.selectOption('[data-testid="automation-type"]', 'reorder_suggestion');
  await page.click('[data-testid="activate-automation"]');
  
  // 3. Wait for automation to trigger (simulated backend event)
  await page.waitForTimeout(2000);
  
  // 4. Verify GraphQL mutation trackFeatureUsage called
  const trackingRequest = await page.waitForRequest(req => 
    req.url().includes('/graphql') && 
    req.postDataJSON()?.query?.includes('trackFeatureUsage')
  );
  expect(trackingRequest).toBeTruthy();
  
  // 5. Navigate to trial dashboard
  await page.click('[data-testid="trial-dashboard-button"]');
  
  // 6. Verify time saved metric updated (FR-012)
  const timeSavedCard = page.locator('[data-testid="time-saved-card"]');
  await expect(timeSavedCard).toBeVisible();
  const timeSavedText = await timeSavedCard.textContent();
  expect(parseFloat(timeSavedText)).toBeGreaterThan(0);
  
  // 7. Verify conflicts prevented metric (simulated)
  await page.click('[data-testid="calendar-tab"]');
  await page.click('[data-testid="add-event-button"]');
  // Add event that conflicts with existing event
  await page.fill('[data-testid="event-title"]', 'Doctor Appointment');
  await page.selectOption('[data-testid="child-select"]', 'emma');
  await page.fill('[data-testid="event-time"]', '2025-10-15T14:00');
  await page.click('[data-testid="save-event"]');
  
  // Conflict detection should trigger
  const conflictAlert = page.locator('[data-testid="conflict-alert"]');
  await expect(conflictAlert).toBeVisible();
  await expect(conflictAlert).toContainText('scheduling conflict');
  
  // 8. Navigate back to trial dashboard
  await page.click('[data-testid="trial-dashboard-button"]');
  
  // 9. Verify conflicts prevented count incremented
  const conflictsCard = page.locator('[data-testid="conflicts-prevented-card"]');
  const conflictsText = await conflictsCard.textContent();
  expect(parseInt(conflictsText)).toBeGreaterThanOrEqual(1);
  
  // 10. Verify value score calculated (FR-012)
  const valueScore = page.locator('[data-testid="value-score"]');
  await expect(valueScore).toBeVisible();
  const scoreValue = await valueScore.getAttribute('data-score');
  expect(parseInt(scoreValue)).toBeGreaterThan(0);
  expect(parseInt(scoreValue)).toBeLessThanOrEqual(100);
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario3-value-tracking.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ Feature usage tracked via GraphQL mutation
- ✅ Time saved metric displays hours with decimal precision
- ✅ Conflicts prevented counter increments on detection
- ✅ Value score calculated (0-100 range)

---

### Scenario 4: Trial-to-Paid Conversion (FR-016, FR-017, FR-021)

**Given**: Trial user with proven value (8+ days usage)  
**When**: User converts to paid subscription  
**Then**: System processes payment and activates premium tier

#### Test Steps
```typescript
test('Scenario 4: Trial-to-Paid Conversion', async ({ page, context }) => {
  // 1. Login as trial user (day 10+)
  await loginAsTrialUser(page);
  await page.click('[data-testid="trial-dashboard-button"]');
  
  // 2. Verify conversion prompt appears (FR-014, days 10-14)
  const conversionPrompt = page.locator('[data-testid="conversion-prompt"]');
  await expect(conversionPrompt).toBeVisible();
  await expect(conversionPrompt).toContainText('saved');  // Value-focused
  await expect(conversionPrompt).not.toContainText('URGENT');  // No pressure
  
  // 3. Click upgrade now
  await page.click('[data-testid="upgrade-now-button"]');
  
  // 4. Select subscription plan
  await page.click('[data-testid="plan-standard-monthly"]');
  
  // 5. Verify Canadian tax calculation (FR-005, FR-006, FR-007)
  const pricingBreakdown = page.locator('[data-testid="pricing-breakdown"]');
  await expect(pricingBreakdown).toContainText('Subtotal: $4.99 CAD');
  await expect(pricingBreakdown).toContainText('HST (13%): $0.65 CAD');
  await expect(pricingBreakdown).toContainText('Total: $5.64 CAD');
  
  // 6. Verify payment method requirement (mobile app only, FR-019)
  if (await page.locator('[data-testid="web-platform-notice"]').isVisible()) {
    await expect(page.locator('[data-testid="web-platform-notice"]')).toContainText('mobile app');
    console.log('Web platform detected - skipping payment processing test');
    return;  // Payment must be done on mobile
  }
  
  // 7. Open Stripe PaymentSheet (FR-016, FR-017)
  await page.click('[data-testid="add-payment-method-button"]');
  
  // Wait for PaymentSheet to load (Stripe native component)
  await page.waitForSelector('[data-testid="stripe-payment-sheet"]');
  
  // 8. Enter test card details (Stripe test mode)
  await page.fill('[data-testid="card-number-input"]', '4242424242424242');
  await page.fill('[data-testid="card-expiry-input"]', '12/28');
  await page.fill('[data-testid="card-cvc-input"]', '123');
  
  // 9. Enter Canadian billing address (FR-018)
  await page.fill('[data-testid="address-line1"]', '123 Main Street');
  await page.fill('[data-testid="address-city"]', 'Toronto');
  await page.selectOption('[data-testid="address-province"]', 'ON');
  await page.fill('[data-testid="address-postal-code"]', 'M5H 2N2');
  
  // 10. Confirm payment
  await page.click('[data-testid="confirm-payment-button"]');
  
  // 11. Wait for Stripe payment processing
  await page.waitForResponse(resp => 
    resp.url().includes('stripe.com') && resp.status() === 200,
    { timeout: 10000 }
  );
  
  // 12. Verify immediate premium feature activation (FR-021)
  await page.waitForSelector('[data-testid="conversion-success-message"]');
  const successMessage = page.locator('[data-testid="conversion-success-message"]');
  await expect(successMessage).toContainText('Welcome to Premium');
  
  // 13. Verify subscription status updated
  const subscriptionBadge = page.locator('[data-testid="subscription-badge"]');
  await expect(subscriptionBadge).toContainText('Premium Active');
  
  // 14. Verify billing history record created
  await page.click('[data-testid="account-menu"]');
  await page.click('[data-testid="billing-history"]');
  
  const firstInvoice = page.locator('[data-testid="invoice-row"]').first();
  await expect(firstInvoice).toContainText('$5.64 CAD');
  await expect(firstInvoice).toContainText('Paid');
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario4-conversion.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ Conversion prompt appears on day 10+ with value-focused messaging
- ✅ Tax breakdown shows correct HST calculation for Ontario (13%)
- ✅ Stripe PaymentSheet accepts Canadian billing address
- ✅ Payment processes successfully with test card
- ✅ Subscription status updates to "Premium Active" immediately
- ✅ Billing history shows first invoice as "Paid"

---

### Scenario 5: Subscription Cancellation with Cooling-Off (FR-035)

**Given**: User subscribed to annual plan 5 days ago  
**When**: User cancels within 14-day cooling-off period  
**Then**: System processes full refund automatically

#### Test Steps
```typescript
test('Scenario 5: Cancellation with Cooling-Off Refund', async ({ page }) => {
  // 1. Login as paid user (annual plan, 5 days old)
  await loginAsPaidUser(page, 'yearly', 5);
  
  // 2. Navigate to subscription management
  await page.click('[data-testid="account-menu"]');
  await page.click('[data-testid="manage-subscription"]');
  
  // 3. Verify cooling-off period banner visible (FR-035)
  const coolingOffBanner = page.locator('[data-testid="cooling-off-banner"]');
  await expect(coolingOffBanner).toBeVisible();
  await expect(coolingOffBanner).toContainText('9 days remaining');
  await expect(coolingOffBanner).toContainText('full refund');
  
  // 4. Click cancel subscription
  await page.click('[data-testid="cancel-subscription-button"]');
  
  // 5. Verify cancellation modal explains refund policy
  const cancelModal = page.locator('[data-testid="cancel-modal"]');
  await expect(cancelModal).toContainText('full refund');
  await expect(cancelModal).toContainText('14 days');
  
  // 6. Provide cancellation reason
  await page.selectOption('[data-testid="cancel-reason"]', 'cost');
  
  // 7. Confirm cancellation
  await page.click('[data-testid="confirm-cancel-button"]');
  
  // 8. Wait for GraphQL mutation
  await page.waitForResponse(resp => 
    resp.url().includes('/graphql') && 
    resp.postDataJSON()?.query?.includes('cancelSubscription')
  );
  
  // 9. Verify cancellation success with refund amount
  const successMessage = page.locator('[data-testid="cancel-success-message"]');
  await expect(successMessage).toContainText('refund');
  await expect(successMessage).toContainText('$');  // Refund amount displayed
  
  // 10. Verify subscription status changed to CANCELED
  const statusBadge = page.locator('[data-testid="subscription-status"]');
  await expect(statusBadge).toContainText('Canceled');
  
  // 11. Verify refund appears in billing history
  await page.click('[data-testid="billing-history"]');
  const refundRow = page.locator('[data-testid="invoice-row"]').filter({ hasText: 'Refund' });
  await expect(refundRow).toBeVisible();
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario5-cancellation-refund.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ Cooling-off period banner shows days remaining
- ✅ Cancellation modal explains full refund policy
- ✅ Refund amount displayed in success message
- ✅ Subscription status updates to "Canceled"
- ✅ Refund record appears in billing history

---

### Scenario 6: Payment Failure Recovery (FR-027, FR-038, FR-039)

**Given**: Monthly subscription payment fails  
**When**: Grace period active (3 days)  
**Then**: System maintains premium access and provides recovery options

#### Test Steps
```typescript
test('Scenario 6: Payment Failure Recovery', async ({ page }) => {
  // 1. Simulate payment failure via Stripe webhook (backend test utility)
  await triggerPaymentFailure('parents@nestsync.com');
  
  // 2. Login as user
  await loginAsTestUser(page);
  
  // 3. Verify grace period banner appears (FR-027)
  const gracePeriodBanner = page.locator('[data-testid="grace-period-banner"]');
  await expect(gracePeriodBanner).toBeVisible();
  await expect(gracePeriodBanner).toContainText('payment issue');
  await expect(gracePeriodBanner).toContainText('days remaining');
  await expect(gracePeriodBanner).not.toContainText('ERROR');  // User-friendly (Principle 2)
  
  // 4. Verify premium features still accessible
  await page.click('[data-testid="automation-tab"]');
  const automationFeature = page.locator('[data-testid="automation-feature"]');
  await expect(automationFeature).not.toHaveClass(/locked/);
  
  // 5. Navigate to payment recovery flow
  await page.click('[data-testid="update-payment-button"]');
  
  // 6. Verify multiple recovery paths available (FR-039)
  await expect(page.locator('[data-testid="add-new-card-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="retry-payment-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="contact-support-button"]')).toBeVisible();
  
  // 7. Add new payment method
  await page.click('[data-testid="add-new-card-button"]');
  // ... (same payment method flow as Scenario 4)
  
  // 8. Retry payment
  await page.click('[data-testid="retry-payment-button"]');
  
  // 9. Wait for payment retry
  await page.waitForResponse(resp => 
    resp.url().includes('stripe.com') && resp.status() === 200,
    { timeout: 10000 }
  );
  
  // 10. Verify recovery success
  const recoveryMessage = page.locator('[data-testid="recovery-success-message"]');
  await expect(recoveryMessage).toContainText('payment updated');
  
  // 11. Verify subscription status restored to ACTIVE
  const statusBadge = page.locator('[data-testid="subscription-badge"]');
  await expect(statusBadge).toContainText('Premium Active');
  
  // Screenshot for evidence
  await page.screenshot({ path: 'test-screenshots/scenario6-payment-recovery.png', fullPage: true });
});
```

**Success Criteria**:
- ✅ Grace period banner displays user-friendly message (no technical errors)
- ✅ Premium features remain accessible during grace period
- ✅ Multiple recovery paths available (update card, retry, contact support)
- ✅ Payment retry processes successfully
- ✅ Subscription status restores to "Active"

---

## Edge Case Tests

### Edge Case 1: Trial Expiration Without Conversion (FR-040)

```typescript
test('Edge Case: Trial Expiration Without Conversion', async ({ page }) => {
  // 1. Simulate trial expiration (day 15)
  await expireTrial('parents@nestsync.com');
  
  // 2. Login as expired trial user
  await loginAsTestUser(page);
  
  // 3. Verify graceful transition to free tier
  const tierBadge = page.locator('[data-testid="subscription-badge"]');
  await expect(tierBadge).toContainText('Free');
  
  // 4. Verify data access maintained (FR-040)
  await page.click('[data-testid="my-children-tab"]');
  const childCards = page.locator('[data-testid="child-card"]');
  await expect(childCards).toHaveCount(2);  // Emma and Olivia still visible
  
  // 5. Verify premium features locked with upgrade prompts
  await page.click('[data-testid="automation-tab"]');
  const lockOverlay = page.locator('[data-testid="feature-lock-overlay"]');
  await expect(lockOverlay).toBeVisible();
  await expect(lockOverlay).toContainText('upgrade');
  
  // Success: Data preserved, premium features locked, no data loss
});
```

---

### Edge Case 2: Bilingual Support (FR-037, Quebec/NB)

```typescript
test('Edge Case: French Language Support for Quebec User', async ({ page }) => {
  // 1. Set user province to Quebec
  await updateUserProvince('parents@nestsync.com', 'QC');
  
  // 2. Login and detect French locale
  await page.goto('http://localhost:8082/auth/signin?locale=fr');
  await loginAsTestUser(page);
  
  // 3. Navigate to upgrade flow
  await page.click('[data-testid="upgrade-button"]');
  
  // 4. Verify French language content (FR-037)
  const trialCard = page.locator('[data-testid="trial-card"]');
  await expect(trialCard).toContainText('essai gratuit');  // "free trial"
  await expect(trialCard).toContainText('Aucune carte de crédit requise');  // "No credit card required"
  
  // 5. Verify Quebec tax calculation (GST+QST)
  await page.click('[data-testid="plan-standard-monthly"]');
  const pricingBreakdown = page.locator('[data-testid="pricing-breakdown"]');
  await expect(pricingBreakdown).toContainText('TPS (5%)');  // GST in French
  await expect(pricingBreakdown).toContainText('TVQ (9.975%)');  // QST in French
  
  // Success: French content displayed, Quebec taxes calculated correctly
});
```

---

## Constitutional Principle Validation

### Principle 1: Cognitive Load Management
- ✅ Trial activation requires <10 seconds (single button click)
- ✅ Progressive disclosure (onboarding steps reveal features gradually)
- ✅ Visual hierarchy (pricing cards sized by importance)

### Principle 2: Stress Reduction
- ✅ No aggressive sales language ("URGENT", "LIMITED TIME")
- ✅ Supportive microcopy ("You're all set!")
- ✅ Gentle conversion prompts focused on value, not urgency

### Principle 3: Canadian Cultural Sensitivity
- ✅ PIPEDA compliance messaging visible
- ✅ Polite interaction patterns ("Please", "Thank you")
- ✅ America/Toronto timezone for all timestamps

### Principle 10: E2E Verification (Playwright)
- ✅ All scenarios tested in real browser environment
- ✅ Screenshots captured for evidence
- ✅ GraphQL requests/responses validated

---

## Performance Validation

### FR-042: Load Time Requirements
```typescript
test('Performance: Upgrade Flow Screens Load Within 2 Seconds on 3G', async ({ page, context }) => {
  // 1. Throttle network to 3G speeds
  await context.route('**/*', route => route.continue({
    maxDownloadSpeed: 750 * 1024 / 8,  // 750 Kbps
    maxUploadSpeed: 250 * 1024 / 8     // 250 Kbps
  }));
  
  // 2. Navigate to upgrade flow
  const startTime = Date.now();
  await page.goto('http://localhost:8082/upgrade');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  // 3. Verify load time under 2 seconds
  expect(loadTime).toBeLessThan(2000);
  console.log(`Upgrade flow loaded in ${loadTime}ms on 3G`);
});
```

---

## Test Execution Report Template

```markdown
## Playwright E2E Test Report
**Date**: [YYYY-MM-DD]
**Duration**: [X minutes]
**Platform**: [Chromium/WebKit/Firefox]

### Test Results Summary
- Total Tests: 6 scenarios + 2 edge cases + 1 performance = 9
- Passed: X/9
- Failed: X/9
- Skipped: X/9

### Failed Tests (if any)
1. **Test Name**: Scenario 4 - Trial-to-Paid Conversion
   - **Failure Reason**: Stripe PaymentSheet timeout
   - **Error Message**: "Timeout waiting for Stripe response after 10000ms"
   - **Screenshot**: test-screenshots/scenario4-conversion-FAILED.png
   - **Action Required**: Investigate Stripe webhook delivery latency

### Constitutional Compliance
- [x] Principle 1: Cognitive Load Management
- [x] Principle 2: Stress Reduction
- [x] Principle 3: Canadian Cultural Sensitivity
- [x] Principle 10: E2E Verification

### Evidence Artifacts
- Screenshots: test-screenshots/ (9 files)
- Console Logs: logs/playwright-console.log
- Network Traces: logs/network-trace.har
- Video Recordings: videos/ (if --video=on)
```

---

**Status**: ✅ COMPLETE  
**Total Scenarios**: 6 primary + 2 edge cases + 1 performance = 9 tests  
**Next**: Execute tests via `/tasks` command implementation phase

