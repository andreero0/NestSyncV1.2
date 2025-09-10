/**
 * Premium Store (Zustand)
 * Manages premium subscription state and feature gating for NestSync
 * Psychology-driven messaging for Canadian parents
 * PIPEDA-compliant subscription management
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Product types that require premium access
export type PremiumProductType = 'DIAPER_CREAM' | 'POWDER' | 'DIAPER_BAGS' | 'TRAINING_PANTS' | 'SWIMWEAR';

// Free product types (always accessible)
export type FreeProductType = 'DIAPER' | 'WIPES';

// All product types
export type ProductType = PremiumProductType | FreeProductType;

// Premium feature categories
export enum PremiumFeature {
  NON_DIAPER_PRODUCTS = 'non_diaper_products',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  EXPORT_DATA = 'export_data',
  UNLIMITED_CHILDREN = 'unlimited_children',
}

// Subscription tiers
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  FAMILY = 'family', // Future tier
}

// Subscription status
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
  NONE = 'none',
}

// Premium store state interface
interface PremiumState {
  // Subscription state
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  
  // Feature access tracking
  hasAccessToFeature: (feature: PremiumFeature) => boolean;
  hasAccessToProduct: (productType: ProductType) => boolean;
  
  // UI state
  showPremiumModal: boolean;
  lastPromptedFeature: PremiumFeature | null;
  
  // Actions
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setShowPremiumModal: (show: boolean) => void;
  setLastPromptedFeature: (feature: PremiumFeature | null) => void;
  checkTrialStatus: () => void;
  
  // Premium discovery actions
  trackFeatureDiscovery: (feature: PremiumFeature) => void;
  shouldShowPremiumHint: (feature: PremiumFeature) => boolean;
}

// Premium product types that require subscription
const PREMIUM_PRODUCTS: Set<ProductType> = new Set([
  'DIAPER_CREAM', 
  'POWDER',
  'DIAPER_BAGS',
  'TRAINING_PANTS',
  'SWIMWEAR',
]);

// Free product types (core diaper tracking)
const FREE_PRODUCTS: Set<ProductType> = new Set([
  'DIAPER',
  'WIPES',
]);

export const usePremiumStore = create<PremiumState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state - free tier
    subscriptionTier: SubscriptionTier.FREE,
    subscriptionStatus: SubscriptionStatus.NONE,
    subscriptionExpiresAt: null,
    trialEndsAt: null,
    isTrialActive: false,
    
    // UI state
    showPremiumModal: false,
    lastPromptedFeature: null,
    
    // Feature access checks
    hasAccessToFeature: (feature: PremiumFeature): boolean => {
      const state = get();
      
      // Always allow during active trial
      if (state.isTrialActive) {
        return true;
      }
      
      // Check subscription status
      if (state.subscriptionStatus === SubscriptionStatus.ACTIVE) {
        switch (state.subscriptionTier) {
          case SubscriptionTier.PREMIUM:
          case SubscriptionTier.FAMILY:
            return true;
          default:
            return false;
        }
      }
      
      return false;
    },
    
    hasAccessToProduct: (productType: ProductType): boolean => {
      // Diapers are always free (core feature)
      if (FREE_PRODUCTS.has(productType)) {
        return true;
      }
      
      // Premium products require subscription or trial
      if (PREMIUM_PRODUCTS.has(productType)) {
        return get().hasAccessToFeature(PremiumFeature.NON_DIAPER_PRODUCTS);
      }
      
      return false;
    },
    
    // Actions
    setSubscriptionTier: (tier: SubscriptionTier) => {
      set({ subscriptionTier: tier });
    },
    
    setSubscriptionStatus: (status: SubscriptionStatus) => {
      set({ subscriptionStatus: status });
    },
    
    setShowPremiumModal: (show: boolean) => {
      set({ showPremiumModal: show });
    },
    
    setLastPromptedFeature: (feature: PremiumFeature | null) => {
      set({ lastPromptedFeature: feature });
    },
    
    checkTrialStatus: () => {
      const state = get();
      
      if (!state.trialEndsAt) {
        set({ isTrialActive: false });
        return;
      }
      
      const trialEnd = new Date(state.trialEndsAt);
      const now = new Date();
      
      set({ isTrialActive: now < trialEnd });
    },
    
    // Premium discovery tracking
    trackFeatureDiscovery: (feature: PremiumFeature) => {
      // Track feature discovery for analytics (future implementation)
      console.log(`Premium feature discovered: ${feature}`);
    },
    
    shouldShowPremiumHint: (feature: PremiumFeature): boolean => {
      const state = get();
      
      // Don't show hints if user already has access
      if (state.hasAccessToFeature(feature)) {
        return false;
      }
      
      // Don't show the same hint too frequently
      return state.lastPromptedFeature !== feature;
    },
  }))
);

// Helper function to get premium messaging based on Canadian psychology-driven UX
export const getPremiumMessaging = (productType?: PremiumProductType) => {
  const baseMessages = {
    title: "Track everything your family needs",
    subtitle: "Keep your whole baby care routine organized in one place",
    description: "Manage all your baby essentials alongside diaper tracking. From wipes to creams, never run out of what matters most.",
    ctaText: "Help me stay organized",
    trustIndicator: "🇨🇦 Data stored securely in Canada",
    supportiveNote: "Join Canadian parents who love having everything tracked in one place",
  };
  
  // Product-specific messaging
  const productMessages: Record<PremiumProductType, Partial<typeof baseMessages>> = {
    'WIPES': {
      title: "Never run out of wipes again",
      description: "Track your wipes inventory alongside diapers. Get low-stock alerts and keep your changing routine smooth.",
    },
    'DIAPER_CREAM': {
      title: "Keep rashes away with smart tracking",
      description: "Monitor your diaper cream supply and get reminders when it's time to restock your rash prevention essentials.",
    },
    'POWDER': {
      title: "Stay ahead with powder tracking",
      description: "Track your baby powder supply and never worry about running out during those important changing moments.",
    },
    'DIAPER_BAGS': {
      title: "Organized diaper bag management",
      description: "Track your disposable diaper bag supply and ensure you're always prepared for outings and travel.",
    },
    'TRAINING_PANTS': {
      title: "Smooth potty training journey",
      description: "Track training pants as your little one grows, making the transition from diapers stress-free.",
    },
    'SWIMWEAR': {
      title: "Summer-ready swim diaper tracking",
      description: "Never forget swim diapers for pool days and beach trips. Keep your water activities worry-free.",
    },
  };
  
  if (productType && productMessages[productType]) {
    return { ...baseMessages, ...productMessages[productType] };
  }
  
  return baseMessages;
};

// Helper to determine if a product type is premium
export const isPremiumProduct = (productType: ProductType): productType is PremiumProductType => {
  return PREMIUM_PRODUCTS.has(productType);
};

// Helper to determine if a product type is free
export const isFreeProduct = (productType: ProductType): productType is FreeProductType => {
  return FREE_PRODUCTS.has(productType);
};