/**
 * Unit Tests for Trial Banner Logic Module
 * 
 * Tests all type guard functions and banner determination logic
 * to ensure correct banner display based on subscription state.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * Run with: npx tsx NestSync-frontend/components/subscription/__tests__/TrialBannerLogic.spec.ts
 */

import {
  determineBannerType,
  isFreeTrialUser,
  isSubscribedTrialUser,
  isActivePaidUser,
  isTrialExpired,
  getDaysRemaining,
  shouldShowBanner,
  type UserSubscriptionState,
  type BannerType,
} from '../TrialBannerLogic';
import { SubscriptionStatus, SubscriptionTier } from '../../../types/subscription';

// Simple test framework
class TestRunner {
  private passed = 0;
  private failed = 0;
  private currentSuite = '';

  describe(name: string, fn: () => void) {
    console.log(`\n${name}`);
    this.currentSuite = name;
    fn();
  }

  it(description: string, fn: () => void) {
    try {
      fn();
      this.passed++;
      console.log(`  ✓ ${description}`);
    } catch (error) {
      this.failed++;
      console.log(`  ✗ ${description}`);
      console.log(`    ${error}`);
    }
  }

  expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
    };
  }

  summary() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`${'='.repeat(50)}\n`);
    return this.failed === 0;
  }
}

const test = new TestRunner();

// =============================================================================
// Test Data Fixtures
// =============================================================================

const createFreeTrialState = (): UserSubscriptionState => ({
  subscription: null,
  trialProgress: {
    id: 'trial_1',
    userId: 'user_1',
    isActive: true,
    trialTier: SubscriptionTier.PREMIUM,
    trialStartedAt: '2025-01-01T00:00:00Z',
    trialEndsAt: '2025-01-15T00:00:00Z',
    daysRemaining: 7,
    convertedToPaid: false,
    canceled: false,
    featuresUsedCount: 5,
    usageDays: 7,
    familySharingUsed: true,
    reorderSuggestionsUsed: true,
    analyticsViewed: true,
    priceAlertsUsed: false,
    automationUsed: false,
    softPromptsShown: 2,
    upgradePromptClicked: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
});

const createSubscribedTrialState = (): UserSubscriptionState => ({
  subscription: {
    id: 'sub_1',
    userId: 'user_1',
    planId: 'plan_premium',
    tier: SubscriptionTier.PREMIUM,
    status: SubscriptionStatus.TRIALING,
    billingInterval: 'monthly' as any,
    amount: 4.99,
    currency: 'CAD',
    province: 'ON' as any,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_stripe_123',
    trialStart: '2025-01-01T00:00:00Z',
    trialEnd: '2025-01-15T00:00:00Z',
    isOnTrial: true,
    isInCoolingOffPeriod: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
  trialProgress: {
    id: 'trial_1',
    userId: 'user_1',
    subscriptionId: 'sub_1',
    isActive: true,
    trialTier: SubscriptionTier.PREMIUM,
    trialStartedAt: '2025-01-01T00:00:00Z',
    trialEndsAt: '2025-01-15T00:00:00Z',
    daysRemaining: 7,
    convertedToPaid: false,
    canceled: false,
    featuresUsedCount: 5,
    usageDays: 7,
    familySharingUsed: true,
    reorderSuggestionsUsed: true,
    analyticsViewed: true,
    priceAlertsUsed: false,
    automationUsed: false,
    softPromptsShown: 2,
    upgradePromptClicked: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
});

const createActivePaidState = (): UserSubscriptionState => ({
  subscription: {
    id: 'sub_1',
    userId: 'user_1',
    planId: 'plan_premium',
    tier: SubscriptionTier.PREMIUM,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: 'monthly' as any,
    amount: 4.99,
    currency: 'CAD',
    province: 'ON' as any,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_stripe_123',
    isOnTrial: false,
    isInCoolingOffPeriod: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
  trialProgress: {
    id: 'trial_1',
    userId: 'user_1',
    subscriptionId: 'sub_1',
    isActive: false,
    trialTier: SubscriptionTier.PREMIUM,
    trialStartedAt: '2025-01-01T00:00:00Z',
    trialEndsAt: '2025-01-15T00:00:00Z',
    daysRemaining: 0,
    convertedToPaid: true,
    convertedAt: '2025-01-15T00:00:00Z',
    conversionPlanId: 'plan_premium',
    canceled: false,
    featuresUsedCount: 15,
    usageDays: 14,
    familySharingUsed: true,
    reorderSuggestionsUsed: true,
    analyticsViewed: true,
    priceAlertsUsed: true,
    automationUsed: true,
    softPromptsShown: 3,
    upgradePromptClicked: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
});

const createExpiredTrialState = (): UserSubscriptionState => ({
  subscription: null,
  trialProgress: {
    id: 'trial_1',
    userId: 'user_1',
    isActive: false,
    trialTier: SubscriptionTier.PREMIUM,
    trialStartedAt: '2025-01-01T00:00:00Z',
    trialEndsAt: '2025-01-15T00:00:00Z',
    daysRemaining: 0,
    convertedToPaid: false,
    canceled: false,
    featuresUsedCount: 10,
    usageDays: 14,
    familySharingUsed: true,
    reorderSuggestionsUsed: true,
    analyticsViewed: true,
    priceAlertsUsed: false,
    automationUsed: false,
    softPromptsShown: 5,
    upgradePromptClicked: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
  },
});

// =============================================================================
// Run Tests
// =============================================================================

console.log('\n' + '='.repeat(50));
console.log('Trial Banner Logic Unit Tests');
console.log('='.repeat(50));

// isFreeTrialUser Tests
test.describe('isFreeTrialUser', () => {
  test.it('returns true for active trial without subscription', () => {
    const state = createFreeTrialState();
    test.expect(isFreeTrialUser(state)).toBe(true);
  });

  test.it('returns false for active trial with subscription', () => {
    const state = createSubscribedTrialState();
    test.expect(isFreeTrialUser(state)).toBe(false);
  });

  test.it('returns false for expired trial without subscription', () => {
    const state = createExpiredTrialState();
    test.expect(isFreeTrialUser(state)).toBe(false);
  });

  test.it('returns false for active paid user', () => {
    const state = createActivePaidState();
    test.expect(isFreeTrialUser(state)).toBe(false);
  });

  test.it('returns false when trialProgress is null', () => {
    const state: UserSubscriptionState = {
      subscription: null,
      trialProgress: null,
    };
    test.expect(isFreeTrialUser(state)).toBe(false);
  });

  test.it('returns false when trialProgress.isActive is false', () => {
    const state = createFreeTrialState();
    state.trialProgress!.isActive = false;
    test.expect(isFreeTrialUser(state)).toBe(false);
  });
});

// isSubscribedTrialUser Tests
test.describe('isSubscribedTrialUser', () => {
  test.it('returns true for trialing subscription with active trial', () => {
    const state = createSubscribedTrialState();
    test.expect(isSubscribedTrialUser(state)).toBe(true);
  });

  test.it('returns false for free trial user', () => {
    const state = createFreeTrialState();
    test.expect(isSubscribedTrialUser(state)).toBe(false);
  });

  test.it('returns false for active paid subscription', () => {
    const state = createActivePaidState();
    test.expect(isSubscribedTrialUser(state)).toBe(false);
  });

  test.it('returns false when subscription is null', () => {
    const state: UserSubscriptionState = {
      subscription: null,
      trialProgress: {
        id: 'trial_1',
        userId: 'user_1',
        isActive: true,
        trialTier: SubscriptionTier.PREMIUM,
        trialStartedAt: '2025-01-01T00:00:00Z',
        trialEndsAt: '2025-01-15T00:00:00Z',
        daysRemaining: 7,
        convertedToPaid: false,
        canceled: false,
        featuresUsedCount: 5,
        usageDays: 7,
        familySharingUsed: true,
        reorderSuggestionsUsed: true,
        analyticsViewed: true,
        priceAlertsUsed: false,
        automationUsed: false,
        softPromptsShown: 2,
        upgradePromptClicked: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-08T00:00:00Z',
      },
    };
    test.expect(isSubscribedTrialUser(state)).toBe(false);
  });

  test.it('returns false when stripeSubscriptionId is missing', () => {
    const state = createSubscribedTrialState();
    state.subscription!.stripeSubscriptionId = undefined;
    test.expect(isSubscribedTrialUser(state)).toBe(false);
  });

  test.it('returns false when status is not TRIALING', () => {
    const state = createSubscribedTrialState();
    state.subscription!.status = SubscriptionStatus.ACTIVE;
    test.expect(isSubscribedTrialUser(state)).toBe(false);
  });
});

// isActivePaidUser Tests
test.describe('isActivePaidUser', () => {
  test.it('returns true for active subscription with expired trial', () => {
    const state = createActivePaidState();
    test.expect(isActivePaidUser(state)).toBe(true);
  });

  test.it('returns false for free trial user', () => {
    const state = createFreeTrialState();
    test.expect(isActivePaidUser(state)).toBe(false);
  });

  test.it('returns false for subscribed trial user', () => {
    const state = createSubscribedTrialState();
    test.expect(isActivePaidUser(state)).toBe(false);
  });

  test.it('returns false when subscription is null', () => {
    const state: UserSubscriptionState = {
      subscription: null,
      trialProgress: null,
    };
    test.expect(isActivePaidUser(state)).toBe(false);
  });

  test.it('returns true when trialProgress is null but subscription is active', () => {
    const state = createActivePaidState();
    state.trialProgress = null;
    test.expect(isActivePaidUser(state)).toBe(true);
  });
});

// isTrialExpired Tests
test.describe('isTrialExpired', () => {
  test.it('returns true for expired trial without subscription', () => {
    const state = createExpiredTrialState();
    test.expect(isTrialExpired(state)).toBe(true);
  });

  test.it('returns false for active trial without subscription', () => {
    const state = createFreeTrialState();
    test.expect(isTrialExpired(state)).toBe(false);
  });

  test.it('returns false for expired trial with subscription', () => {
    const state = createActivePaidState();
    test.expect(isTrialExpired(state)).toBe(false);
  });

  test.it('returns false when trialProgress is null', () => {
    const state: UserSubscriptionState = {
      subscription: null,
      trialProgress: null,
    };
    test.expect(isTrialExpired(state)).toBe(false);
  });
});

// determineBannerType Tests
test.describe('determineBannerType', () => {
  test.it('returns "free-trial-upgrade" for free trial user', () => {
    const state = createFreeTrialState();
    test.expect(determineBannerType(state)).toBe('free-trial-upgrade');
  });

  test.it('returns "subscribed-trial-activation" for subscribed trial user', () => {
    const state = createSubscribedTrialState();
    test.expect(determineBannerType(state)).toBe('subscribed-trial-activation');
  });

  test.it('returns "none" for active paid user', () => {
    const state = createActivePaidState();
    test.expect(determineBannerType(state)).toBe('none');
  });

  test.it('returns "trial-expired" for expired trial without subscription', () => {
    const state = createExpiredTrialState();
    test.expect(determineBannerType(state)).toBe('trial-expired');
  });

  test.it('returns "none" when both subscription and trialProgress are null', () => {
    const state: UserSubscriptionState = {
      subscription: null,
      trialProgress: null,
    };
    test.expect(determineBannerType(state)).toBe('none');
  });

  test.it('returns "none" for canceled subscription', () => {
    const state = createActivePaidState();
    state.subscription!.status = SubscriptionStatus.CANCELED;
    test.expect(determineBannerType(state)).toBe('none');
  });

  test.it('prioritizes subscribed trial over free trial', () => {
    const state = createSubscribedTrialState();
    test.expect(determineBannerType(state)).toBe('subscribed-trial-activation');
  });
});

// getDaysRemaining Tests
test.describe('getDaysRemaining', () => {
  test.it('returns daysRemaining from trialProgress', () => {
    const trialProgress = createFreeTrialState().trialProgress;
    test.expect(getDaysRemaining(trialProgress)).toBe(7);
  });

  test.it('returns 0 when trialProgress is null', () => {
    test.expect(getDaysRemaining(null)).toBe(0);
  });

  test.it('returns 0 when daysRemaining is 0', () => {
    const trialProgress = createExpiredTrialState().trialProgress;
    test.expect(getDaysRemaining(trialProgress)).toBe(0);
  });
});

// shouldShowBanner Tests
test.describe('shouldShowBanner', () => {
  test.it('returns true when not loading and not dismissed', () => {
    test.expect(shouldShowBanner(false, false)).toBe(true);
  });

  test.it('returns false when loading', () => {
    test.expect(shouldShowBanner(true, false)).toBe(false);
  });

  test.it('returns false when dismissed', () => {
    test.expect(shouldShowBanner(false, true)).toBe(false);
  });

  test.it('returns false when both loading and dismissed', () => {
    test.expect(shouldShowBanner(true, true)).toBe(false);
  });
});

// Edge Cases
test.describe('Edge Cases', () => {
  test.it('handles transition from free trial to subscribed trial', () => {
    const state = createFreeTrialState();
    
    // Initially free trial
    test.expect(determineBannerType(state)).toBe('free-trial-upgrade');
    
    // User subscribes
    state.subscription = {
      id: 'sub_1',
      userId: 'user_1',
      planId: 'plan_premium',
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.TRIALING,
      billingInterval: 'monthly' as any,
      amount: 4.99,
      currency: 'CAD',
      province: 'ON' as any,
      stripeSubscriptionId: 'sub_stripe_123',
      trialStart: '2025-01-01T00:00:00Z',
      trialEnd: '2025-01-15T00:00:00Z',
      isOnTrial: true,
      isInCoolingOffPeriod: false,
      createdAt: '2025-01-08T00:00:00Z',
      updatedAt: '2025-01-08T00:00:00Z',
    };
    
    // Now subscribed trial
    test.expect(determineBannerType(state)).toBe('subscribed-trial-activation');
  });

  test.it('handles transition from subscribed trial to active paid', () => {
    const state = createSubscribedTrialState();
    
    // Initially subscribed trial
    test.expect(determineBannerType(state)).toBe('subscribed-trial-activation');
    
    // Trial ends, subscription activates
    state.subscription!.status = SubscriptionStatus.ACTIVE;
    state.trialProgress!.isActive = false;
    state.trialProgress!.daysRemaining = 0;
    state.trialProgress!.convertedToPaid = true;
    
    // Now active paid
    test.expect(determineBannerType(state)).toBe('none');
    test.expect(isActivePaidUser(state)).toBe(true);
  });
});

// Print summary
const success = test.summary();
process.exit(success ? 0 : 1);
