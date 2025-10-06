/**
 * Subscription Utility Functions
 * Handles feature name mapping, plan grouping, and subscription-related calculations
 */

export type SubscriptionTier = 'FREE' | 'STANDARD' | 'PREMIUM';
export type BillingInterval = 'MONTHLY' | 'YEARLY';

export interface SubscriptionPlan {
  id: string;
  displayName: string;
  tier: SubscriptionTier;
  price: number;
  billingInterval: BillingInterval;
  features: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GroupedPlans {
  FREE: SubscriptionPlan[];
  STANDARD: SubscriptionPlan[];
  PREMIUM: SubscriptionPlan[];
}

/**
 * Feature display name mapping
 * Converts database enum values to human-readable text
 */
export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  // Core features
  family_sharing: 'Family Sharing',
  reorder_suggestions: 'Reorder Suggestions',
  basic_analytics: 'Basic Analytics',
  advanced_analytics: 'Advanced Analytics',
  unlimited_reorder_suggestions: 'Unlimited Reorder Suggestions',
  price_alerts: 'Price Alerts',
  automation: 'Automated Reordering',

  // Free tier features
  basic_inventory_tracking: 'Basic Inventory Tracking',
  diaper_change_logging: 'Diaper Change Logging',
  size_change_notifications: 'Size Change Notifications',

  // Standard tier features
  up_to_2_caregivers: 'Up to 2 caregivers',
  canadian_data_storage: 'Canadian data storage (PIPEDA compliant)',

  // Premium tier features
  unlimited_family_members: 'Unlimited family members',
  priority_support: 'Priority support',
  export_to_csv: 'Export data to CSV',
  predictive_analytics: 'Predictive analytics',
  custom_reports: 'Custom reports',
};

/**
 * Format feature enum to display name
 */
export function formatFeatureName(featureEnum: string): string {
  return FEATURE_DISPLAY_NAMES[featureEnum] || featureEnum;
}

/**
 * Calculate annual savings percentage
 */
export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  const savingsPercentage = (savings / monthlyTotal) * 100;
  return Math.round(savingsPercentage);
}

/**
 * Calculate annual savings amount in CAD
 */
export function calculateAnnualSavingsAmount(monthlyPrice: number, annualPrice: number): number {
  const monthlyTotal = monthlyPrice * 12;
  return monthlyTotal - annualPrice;
}

/**
 * Group plans by tier
 * Returns organized structure for tier-based UI
 */
export function groupPlansByTier(plans: SubscriptionPlan[]): GroupedPlans {
  const grouped: GroupedPlans = {
    FREE: [],
    STANDARD: [],
    PREMIUM: [],
  };

  plans.forEach((plan) => {
    if (plan.tier in grouped) {
      grouped[plan.tier].push(plan);
    }
  });

  // Sort plans within each tier by billing interval (monthly first, then yearly)
  Object.keys(grouped).forEach((tier) => {
    grouped[tier as SubscriptionTier].sort((a, b) => {
      if (a.billingInterval === 'MONTHLY' && b.billingInterval === 'YEARLY') return -1;
      if (a.billingInterval === 'YEARLY' && b.billingInterval === 'MONTHLY') return 1;
      return 0;
    });
  });

  return grouped;
}

/**
 * Get tier display information
 */
export function getTierInfo(tier: SubscriptionTier): {
  name: string;
  description: string;
  color: string;
} {
  const tierInfo = {
    FREE: {
      name: 'Free',
      description: 'Basic features for getting started',
      color: '#6B7280', // gray-500
    },
    STANDARD: {
      name: 'Standard',
      description: 'Essential features for busy parents',
      color: '#0891B2', // cyan-600
    },
    PREMIUM: {
      name: 'Premium',
      description: 'Advanced features with unlimited access',
      color: '#7C3AED', // violet-600
    },
  };

  return tierInfo[tier];
}

/**
 * Format billing interval for display
 */
export function formatBillingInterval(interval: BillingInterval): string {
  return interval === 'MONTHLY' ? 'month' : 'year';
}

/**
 * Check if plan is yearly
 */
export function isAnnualPlan(plan: SubscriptionPlan): boolean {
  return plan.billingInterval === 'YEARLY';
}

/**
 * Find matching monthly plan for a yearly plan (or vice versa)
 */
export function findAlternateBillingPlan(
  plan: SubscriptionPlan,
  allPlans: SubscriptionPlan[]
): SubscriptionPlan | undefined {
  const targetInterval = plan.billingInterval === 'MONTHLY' ? 'YEARLY' : 'MONTHLY';

  return allPlans.find(
    (p) => p.tier === plan.tier && p.billingInterval === targetInterval
  );
}

/**
 * Get plans for a specific tier with both billing intervals
 */
export function getPlansForTier(
  tier: SubscriptionTier,
  allPlans: SubscriptionPlan[]
): {
  monthly?: SubscriptionPlan;
  annual?: SubscriptionPlan;
} {
  const tierPlans = allPlans.filter((p) => p.tier === tier);

  return {
    monthly: tierPlans.find((p) => p.billingInterval === 'MONTHLY'),
    annual: tierPlans.find((p) => p.billingInterval === 'YEARLY'),
  };
}
