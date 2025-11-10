# Visual Regression Test Suite

## Overview

This test suite provides comprehensive visual regression testing for the NestSync application, ensuring design consistency across all screens and user states.

**Requirements Covered:** 8.1, 8.2

## Test Coverage

### Trial Banner States
- ✅ Free trial banner (mobile & desktop)
- ✅ Subscribed trial banner (mobile & desktop)
- ✅ Active paid user - no banner (mobile & desktop)
- ✅ Expired trial state (mobile & desktop)

### Premium Upgrade Flow
- ✅ Subscription management screen (mobile & desktop)
- ✅ Payment methods screen (mobile & desktop)
- ✅ Billing history screen (mobile & desktop)

### Reorder Flow
- ✅ Reorder suggestions screen (mobile, tablet & desktop)
- ✅ Reorder with trial banner (mobile)

### Size Prediction Interface
- ✅ Size guide screen (mobile, tablet & desktop)
- ✅ Size guide with tab navigation (mobile)

### Payment Screens
- ✅ Payment methods (mobile & desktop)
- ✅ Billing history (mobile & desktop)
- ✅ Subscription with payment info (mobile & desktop)

### Cross-Screen Consistency
- ✅ Button styling consistency
- ✅ Card styling consistency
- ✅ Spacing consistency

## Running the Tests

### Prerequisites

1. Ensure the frontend development server is running:
   ```bash
   cd NestSync-frontend
   npm run start
   ```

2. Ensure the backend server is running:
   ```bash
   cd NestSync-backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

### Run All Visual Regression Tests

```bash
cd NestSync-frontend
npx playwright test --config=playwright.visual-regression.config.ts
```

### Run Specific Test Suites

```bash
# Trial banner tests only
npx playwright test --config=playwright.visual-regression.config.ts -g "Trial Banner States"

# Premium upgrade flow only
npx playwright test --config=playwright.visual-regression.config.ts -g "Premium Upgrade Flow"

# Reorder flow only
npx playwright test --config=playwright.visual-regression.config.ts -g "Reorder Flow"

# Size prediction only
npx playwright test --config=playwright.visual-regression.config.ts -g "Size Prediction Interface"

# Payment screens only
npx playwright test --config=playwright.visual-regression.config.ts -g "Payment Screens"

# Cross-screen consistency only
npx playwright test --config=playwright.visual-regression.config.ts -g "Cross-Screen Consistency"
```

### Run Tests for Specific Viewport

```bash
# Mobile only
npx playwright test --config=playwright.visual-regression.config.ts --project=visual-mobile-chrome

# Tablet only
npx playwright test --config=playwright.visual-regression.config.ts --project=visual-tablet-chrome

# Desktop only
npx playwright test --config=playwright.visual-regression.config.ts --project=visual-desktop-chrome
```

### View Test Results

```bash
# Open HTML report
npx playwright show-report test-results/visual-regression-report

# View screenshots
open test-results/visual-regression/
```

## Screenshot Baselines

Screenshots are saved to `test-results/visual-regression/` with descriptive names:

### Trial Banner Screenshots
- `trial-banner-free-trial-mobile.png`
- `trial-banner-free-trial-desktop.png`
- `trial-banner-subscribed-trial-mobile.png`
- `trial-banner-subscribed-trial-desktop.png`
- `trial-banner-active-paid-mobile.png`
- `trial-banner-active-paid-desktop.png`
- `trial-banner-expired-trial-mobile.png`
- `trial-banner-expired-trial-desktop.png`

### Premium Upgrade Flow Screenshots
- `premium-upgrade-subscription-management-mobile.png`
- `premium-upgrade-subscription-management-desktop.png`
- `premium-upgrade-payment-methods-mobile.png`
- `premium-upgrade-payment-methods-desktop.png`
- `premium-upgrade-billing-history-mobile.png`
- `premium-upgrade-billing-history-desktop.png`

### Reorder Flow Screenshots
- `reorder-flow-suggestions-mobile.png`
- `reorder-flow-suggestions-desktop.png`
- `reorder-flow-suggestions-tablet.png`
- `reorder-flow-with-trial-banner-mobile.png`

### Size Prediction Screenshots
- `size-prediction-guide-mobile.png`
- `size-prediction-guide-desktop.png`
- `size-prediction-guide-tablet.png`
- `size-prediction-guide-tab-interaction-mobile.png`

### Payment Screens Screenshots
- `payment-screens-methods-mobile.png`
- `payment-screens-methods-desktop.png`
- `payment-screens-billing-history-mobile.png`
- `payment-screens-billing-history-desktop.png`
- `payment-screens-subscription-with-payment-mobile.png`
- `payment-screens-subscription-with-payment-desktop.png`

### Consistency Screenshots
- `consistency-buttons-{screen}-mobile.png`
- `consistency-cards-{screen}-mobile.png`
- `consistency-spacing-{screen}-desktop.png`

## Updating Baselines

When design changes are intentional and you need to update the baseline screenshots:

```bash
# Update all baselines
npx playwright test --config=playwright.visual-regression.config.ts --update-snapshots

# Update specific test baselines
npx playwright test --config=playwright.visual-regression.config.ts -g "Trial Banner" --update-snapshots
```

## Test Architecture

### Mock Authentication States

The tests use `mockAuthState()` helper to simulate different user states:

- **free-trial**: User in trial period without subscription
- **subscribed-trial**: User subscribed but still in trial period
- **active-paid**: User with active paid subscription
- **expired-trial**: User whose trial has expired

### Helper Functions

- `waitForPageReady(page)`: Ensures page is fully loaded before screenshots
- `mockAuthState(page, userType)`: Injects mock subscription state into page context

## Troubleshooting

### Tests Failing Due to Timing Issues

If tests fail due to elements not being visible:

1. Increase wait timeout in `waitForPageReady()`
2. Add specific waits for dynamic content:
   ```typescript
   await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });
   ```

### Screenshots Look Different Locally vs CI

This is expected due to font rendering differences. Configure threshold:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,
    threshold: 0.2, // Increase if needed
  },
}
```

### Backend Not Running

Ensure backend is running before tests:

```bash
cd NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend Not Running

Ensure frontend is running before tests:

```bash
cd NestSync-frontend
npm run start
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd NestSync-frontend
          npm ci
      
      - name: Install Playwright
        run: |
          cd NestSync-frontend
          npx playwright install --with-deps
      
      - name: Run visual regression tests
        run: |
          cd NestSync-frontend
          npx playwright test --config=playwright.visual-regression.config.ts
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: visual-regression-results
          path: NestSync-frontend/test-results/
```

## Best Practices

1. **Always run tests locally before committing** to catch visual regressions early
2. **Review screenshot diffs carefully** when tests fail to ensure changes are intentional
3. **Update baselines only when design changes are approved** by design team
4. **Run tests on multiple viewports** to ensure responsive design consistency
5. **Keep test data consistent** to avoid false positives from dynamic content

## Related Documentation

- [Design System Compliance Checklist](../design-documentation/validation/design-compliance-checklist.md)
- [Design Audit Report](../design-documentation/validation/design-audit-report.md)
- [Design Tokens](../design-documentation/validation/design-tokens-extracted.md)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## Maintenance

### Adding New Tests

1. Add test case to `visual-regression.spec.ts`
2. Follow naming convention: `{feature}-{screen}-{viewport}.png`
3. Document new screenshots in this README
4. Run test to generate baseline
5. Commit baseline screenshots to repository

### Removing Obsolete Tests

1. Remove test case from `visual-regression.spec.ts`
2. Delete associated baseline screenshots
3. Update this README
4. Commit changes

## Support

For questions or issues with visual regression tests:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [Playwright Documentation](https://playwright.dev/docs/intro)
3. Contact the development team

---

**Last Updated:** 2025-01-09  
**Test Suite Version:** 1.0.0  
**Requirements:** 8.1, 8.2
