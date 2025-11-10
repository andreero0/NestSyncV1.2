/**
 * Trial Banner Logic Module
 * 
 * Extracted banner display logic for determining which trial banner to show
 * based on user subscription state and trial progress.
 * 
 * Key Distinctions:
 * - Free Trial User: Exploring features without payment commitment
 * - Subscribed Trial User: Already committed to paid plan, waiting for activation
 * - Active Paid User: Trial ended, actively paying for subscription
 * - Trial Expired User: Trial ended without subscription commitment
 * 
 * Requirements: 1.1, 2.1, 3.1
 */

import type { 
  Subscription, 
  TrialProgress,
} from '../../types/subscription';
import { SubscriptionStatus } from '../../types/subscription';

/**
 * Banner type enumeration
 * Defines which banner variant should be displayed to the user
 */
export type BannerType = 
  | 'none'                          // No banner shown
  | 'free-trial-upgrade'            // Show upgrade CTA for free trial users
  | 'subscribed-trial-activation'   // Show activation countdown for subscribed trial users
  | 'trial-expired';                // Show trial expired message

/**
 * User subscription state interface
 * Consolidates all data needed for banner display logic
 */
export interface UserSubscriptionState {
  subscription: Subscription | null;
  trialProgress: TrialProgress | null;
}

/**
 * Determine which banner type to display based on user subscription state
 * 
 * Logic Flow:
 * 1. Active paid subscribers → no banner
 * 2. Subscribed trial users (has stripeSubscriptionId + TRIALING status) → activation banner
 * 3. Free trial users (no stripeSubscriptionId + active trial) → upgrade banner
 * 4. Expired trial without subscription → trial expired message
 * 5. All other cases → no banner
 * 
 * @param state - User subscription state containing subscription and trial progress
 * @returns BannerType indicating which banner to display
 * 
 * @example
 * ```typescript
 * const state = {
 *   subscription: { stripeSubscriptionId: null, status: 'FREE' },
 *   trialProgress: { isActive: true, daysRemaining: 7 }
 * };
 * const bannerType = determineBannerType(state);
 * // Returns: 'free-trial-upgrade'
 * ```
 */
export function determineBannerType(state: UserSubscriptionState): BannerType {
  const { subscription, trialProgress } = state;

  // No banner for active paid subscribers (trial ended, actively paying)
  if (subscription?.status === SubscriptionStatus.ACTIVE) {
    return 'none';
  }

  // Subscribed trial users see activation countdown
  // These users have already committed to a paid plan (have stripeSubscriptionId)
  // but are still in their trial period (status = TRIALING)
  if (
    trialProgress?.isActive && 
    subscription?.stripeSubscriptionId && 
    subscription?.status === SubscriptionStatus.TRIALING
  ) {
    return 'subscribed-trial-activation';
  }

  // Free trial users see upgrade CTA
  // These users are exploring features but haven't committed to a paid plan yet
  // (no stripeSubscriptionId)
  if (
    trialProgress?.isActive && 
    !subscription?.stripeSubscriptionId
  ) {
    return 'free-trial-upgrade';
  }

  // Expired trial without subscription commitment
  if (
    trialProgress && 
    !trialProgress.isActive && 
    !subscription?.stripeSubscriptionId
  ) {
    return 'trial-expired';
  }

  // Default: no banner for all other cases
  return 'none';
}

/**
 * Type guard: Check if user is a free trial user
 * 
 * Free trial users are exploring premium features without payment commitment.
 * They have active trial progress but no Stripe subscription ID.
 * 
 * @param state - User subscription state
 * @returns true if user is on free trial (no payment commitment)
 * 
 * @example
 * ```typescript
 * if (isFreeTrialUser(state)) {
 *   // Show upgrade CTA
 * }
 * ```
 */
export function isFreeTrialUser(state: UserSubscriptionState): boolean {
  return (
    state.trialProgress?.isActive === true &&
    !state.subscription?.stripeSubscriptionId
  );
}

/**
 * Type guard: Check if user is a subscribed trial user
 * 
 * Subscribed trial users have already committed to a paid plan (have Stripe subscription)
 * but are still in their trial period before billing begins.
 * 
 * @param state - User subscription state
 * @returns true if user has subscribed but is still in trial period
 * 
 * @example
 * ```typescript
 * if (isSubscribedTrialUser(state)) {
 *   // Show activation countdown
 * }
 * ```
 */
export function isSubscribedTrialUser(state: UserSubscriptionState): boolean {
  return (
    state.trialProgress?.isActive === true &&
    !!state.subscription?.stripeSubscriptionId &&
    state.subscription?.status === SubscriptionStatus.TRIALING
  );
}

/**
 * Type guard: Check if user is an active paid subscriber
 * 
 * Active paid users have completed their trial and are actively paying for their subscription.
 * They should not see any trial-related banners.
 * 
 * @param state - User subscription state
 * @returns true if user is actively paying for subscription (trial ended)
 * 
 * @example
 * ```typescript
 * if (isActivePaidUser(state)) {
 *   // Hide all trial banners
 * }
 * ```
 */
export function isActivePaidUser(state: UserSubscriptionState): boolean {
  return (
    state.subscription?.status === SubscriptionStatus.ACTIVE &&
    (state.trialProgress?.isActive === false || state.trialProgress === null)
  );
}

/**
 * Type guard: Check if user's trial has expired without subscription
 * 
 * These users completed their trial period but did not commit to a paid plan.
 * They should see a trial expired message.
 * 
 * @param state - User subscription state
 * @returns true if trial expired without subscription commitment
 * 
 * @example
 * ```typescript
 * if (isTrialExpired(state)) {
 *   // Show trial expired message
 * }
 * ```
 */
export function isTrialExpired(state: UserSubscriptionState): boolean {
  return (
    state.trialProgress?.isActive === false &&
    !state.subscription?.stripeSubscriptionId
  );
}

/**
 * Get days remaining in trial
 * 
 * @param trialProgress - Trial progress data
 * @returns Number of days remaining, or 0 if no active trial
 */
export function getDaysRemaining(trialProgress: TrialProgress | null): number {
  return trialProgress?.daysRemaining ?? 0;
}

/**
 * Check if banner should be visible based on loading states
 * 
 * Banner should be hidden while data is loading to prevent flashing incorrect information.
 * 
 * @param isLoading - Whether subscription/trial data is still loading
 * @param isDismissed - Whether user has manually dismissed the banner
 * @returns true if banner should be visible
 */
export function shouldShowBanner(isLoading: boolean, isDismissed: boolean): boolean {
  return !isLoading && !isDismissed;
}
