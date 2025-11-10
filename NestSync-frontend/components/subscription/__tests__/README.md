# Trial Banner Logic Tests

## Overview

This directory contains unit tests for the Trial Banner Logic module, which determines which trial banner to display based on user subscription state.

## Test Files

### TrialBannerLogic.spec.ts

Comprehensive unit tests for all exported functions in the TrialBannerLogic module:

- **isFreeTrialUser**: Tests type guard for free trial users (6 tests)
- **isSubscribedTrialUser**: Tests type guard for subscribed trial users (6 tests)
- **isActivePaidUser**: Tests type guard for active paid users (5 tests)
- **isTrialExpired**: Tests type guard for expired trial users (4 tests)
- **determineBannerType**: Tests banner type determination logic (7 tests)
- **getDaysRemaining**: Tests days remaining calculation (3 tests)
- **shouldShowBanner**: Tests banner visibility logic (4 tests)
- **Edge Cases**: Tests state transitions and edge cases (2 tests)

**Total: 37 tests, all passing**

## Running Tests

```bash
# Run unit tests
npx tsx components/subscription/__tests__/TrialBannerLogic.spec.ts
```

## Test Coverage

The tests cover:

✅ All type guard functions with various subscription states
✅ Banner type determination for all user states
✅ Edge cases (null values, missing properties)
✅ State transitions (free trial → subscribed trial → active paid)
✅ Helper functions (getDaysRemaining, shouldShowBanner)

## Requirements Covered

- **3.1**: TrialBannerLogic module with determineBannerType function
- **3.2**: Type guard functions (isFreeTrialUser, isSubscribedTrialUser, isActivePaidUser)
- **3.3**: TypeScript interfaces for subscription state
- **3.4**: JSDoc documentation for all exports

## Implementation Notes

### Fixed Issues

During test implementation, the following issues were identified and fixed in TrialBannerLogic.ts:

1. **Enum Comparison**: Changed from string literals with type casting to proper enum comparisons
   - Before: `subscription?.status === 'ACTIVE' as SubscriptionStatus`
   - After: `subscription?.status === SubscriptionStatus.ACTIVE`

2. **Import Statement**: Separated type imports from value imports
   - Added: `import { SubscriptionStatus } from '../../types/subscription';`

3. **isActivePaidUser Logic**: Updated to handle null trialProgress
   - Before: `state.trialProgress?.isActive === false`
   - After: `(state.trialProgress?.isActive === false || state.trialProgress === null)`

4. **Trial Expired Logic**: Added null check to prevent false positives
   - Before: `!trialProgress?.isActive && !subscription?.stripeSubscriptionId`
   - After: `trialProgress && !trialProgress.isActive && !subscription?.stripeSubscriptionId`

### Test Framework

The tests use a custom lightweight test framework built with TypeScript that provides:
- `describe()` for test suites
- `it()` for individual tests
- `expect().toBe()` for assertions
- Test summary with pass/fail counts

This approach was chosen because:
- The project uses Playwright for E2E tests, not Jest
- Unit tests for pure logic don't require a full test framework
- Tests can be run directly with `tsx` without additional configuration

## Related Files

- **Implementation**: `../TrialBannerLogic.ts`
- **Types**: `../../../types/subscription.ts`
- **Component**: `../SubscribedTrialBanner.tsx`
- **Visual Tests**: `../../../tests/subscribed-trial-banner-visual.spec.ts`
