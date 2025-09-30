/**
 * Reorder Flow Store (Zustand)
 * State management for ML-powered reorder suggestions, premium features, and order tracking
 * Following NestSync architecture patterns and Canadian PIPEDA compliance
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { apolloClient } from '../lib/graphql/client';
import {
  GET_REORDER_SUGGESTIONS,
  GET_REORDER_SUGGESTIONS_SIMPLE,
  GET_RETAILER_COMPARISON,
  GET_SUBSCRIPTION_STATUS,
  GET_SUBSCRIPTION_STATUS_SIMPLE,
  CREATE_ORDER,
  UPDATE_SUBSCRIPTION,
  SETUP_AUTO_REORDER,
  SHARE_REORDER_SUGGESTION,
  type CreateOrderInput,
  type AutoReorderInput,
  type ShareSuggestionInput,
  type BillingInterval,
} from '../lib/graphql/reorder-queries';
import {
  ORDER_STATUS_SUBSCRIPTION,
  REORDER_SUGGESTIONS_SUBSCRIPTION,
  RETAILER_PRICES_SUBSCRIPTION,
  SUBSCRIPTION_STATUS_SUBSCRIPTION,
  EMERGENCY_REORDER_SUBSCRIPTION,
  type OrderStatusUpdate,
  type ReorderSuggestionUpdate,
  type RetailerPriceUpdate,
  type EmergencyReorderAlert,
} from '../lib/graphql/reorder-subscriptions';
import { StorageHelpers } from '../hooks/useUniversalStorage';
import { cacheUtils } from '../lib/graphql/cacheUtils';

// Core interfaces
export interface ReorderSuggestion {
  id: string;
  childId: string;
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    size: string;
    category: string;
    image: string;
    description: string;
    features: string[];
  };
  predictedRunOutDate: string;
  confidence: number;
  priority: number;
  suggestedQuantity: number;
  currentInventoryLevel: number;
  usagePattern: {
    averageDailyUsage: number;
    weeklyTrend: number;
    seasonalFactors: number[];
  };
  estimatedCostSavings: {
    amount: number;
    currency: string;
    comparedToRegularPrice: number;
    comparedToLastPurchase: number;
  };
  availableRetailers: RetailerOption[];
  createdAt: string;
  updatedAt: string;
  mlProcessingConsent: boolean;
  dataRetentionDays: number;
}

export interface RetailerOption {
  id: string;
  name: string;
  logo: string;
  price: {
    amount: number;
    currency: string;
    originalPrice: number;
    discountPercentage: number;
    taxes: {
      gst: number;
      pst: number;
      hst: number;
      total: number;
    };
    finalAmount: number;
  };
  deliveryTime: number;
  inStock: boolean;
  rating: number;
  freeShipping: boolean;
  affiliateDisclosure: string;
}

export interface RetailerComparison {
  productId: string;
  product: {
    id: string;
    name: string;
    brand: string;
    size: string;
    category: string;
    image: string;
    specifications: Record<string, any>;
  };
  retailers: Array<{
    id: string;
    name: string;
    logo: string;
    trustScore: number;
    verificationStatus: string;
    price: {
      amount: number;
      currency: string;
      originalPrice: number;
      discountPercentage: number;
      bulkDiscounts: Array<{
        quantity: number;
        discountPercentage: number;
        savings: {
          amount: number;
          currency: string;
        };
      }>;
      taxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
      finalAmount: number;
    };
    availability: {
      inStock: boolean;
      quantity: number;
      estimatedRestockDate?: string;
      lastUpdated: string;
    };
    delivery: {
      estimatedDays: number;
      minDeliveryDays: number;
      maxDeliveryDays: number;
      freeShippingThreshold: number;
      shippingCost: {
        amount: number;
        currency: string;
      };
      deliveryOptions: Array<{
        type: string;
        estimatedDays: number;
        cost: {
          amount: number;
          currency: string;
        };
      }>;
    };
    customerReviews: {
      averageRating: number;
      totalReviews: number;
      recentReviews: Array<{
        rating: number;
        comment: string;
        date: string;
        verified: boolean;
      }>;
    };
    affiliateInfo: {
      isAffiliate: boolean;
      disclosureText: string;
      commissionRate: number;
    };
    lastPriceUpdate: string;
  }>;
  priceComparison: {
    lowestPrice: {
      retailerId: string;
      amount: number;
      currency: string;
      savings: {
        amount: number;
        currency: string;
        percentage: number;
      };
    };
    averagePrice: {
      amount: number;
      currency: string;
    };
    priceSpread: {
      min: number;
      max: number;
      average: number;
    };
  };
  priceDataConsent: boolean;
  lastUpdated: string;
}

export interface SubscriptionStatus {
  id: string;
  status: string;
  currentPlan: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    features: string[];
    price: {
      amount: number;
      currency: string;
      billingInterval: string;
      canadianTaxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
    };
    limits: {
      reorderSuggestions: number;
      familyMembers: number;
      priceAlerts: number;
      autoOrdering: boolean;
    };
  };
  nextBillingDate: string;
  paymentMethod: {
    id: string;
    type: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  };
  usage: {
    currentPeriod: {
      reordersSuggested: number;
      ordersPlaced: number;
      savingsGenerated: {
        amount: number;
        currency: string;
      };
      priceAlertsReceived: number;
    };
    lifetime: {
      totalOrders: number;
      totalSavings: {
        amount: number;
        currency: string;
      };
      memberSince: string;
    };
  };
  availableUpgrades: Array<{
    planId: string;
    name: string;
    monthlyPricing: {
      amount: number;
      currency: string;
    };
    yearlyPricing: {
      amount: number;
      currency: string;
      savingsPerMonth: {
        amount: number;
        currency: string;
      };
    };
    newFeatures: string[];
    valueProposition: string;
  }>;
  billingDataConsent: boolean;
  updatedAt: string;
}

export interface Order {
  id: string;
  status: string;
  orderNumber: string;
  retailer: {
    id: string;
    name: string;
    logo: string;
  };
  items: Array<{
    id: string;
    productId: string;
    product: {
      name: string;
      brand: string;
      size: string;
      image: string;
    };
    quantity: number;
    unitPrice: {
      amount: number;
      currency: string;
    };
    totalPrice: {
      amount: number;
      currency: string;
    };
  }>;
  pricing: {
    subtotal: {
      amount: number;
      currency: string;
    };
    taxes: {
      gst: number;
      pst: number;
      hst: number;
      total: number;
    };
    shipping: {
      amount: number;
      currency: string;
      method: string;
    };
    total: {
      amount: number;
      currency: string;
    };
  };
  delivery: {
    estimatedDelivery: string;
    shippingAddress: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
  };
  tracking?: {
    trackingNumber: string;
    carrier: string;
    status: string;
  };
  createdAt: string;
  orderDataConsent: boolean;
}

// Reorder store state interface
interface ReorderState {
  // Current suggestions and data
  suggestions: ReorderSuggestion[];
  currentComparison: RetailerComparison | null;
  selectedRetailer: RetailerOption | null;
  activeOrder: Order | null;

  // Premium subscription state
  subscriptionStatus: SubscriptionStatus | null;
  isUpgradeModalVisible: boolean;
  isPremiumUser: boolean;

  // UI state
  isLoadingSuggestions: boolean;
  isLoadingComparison: boolean;
  isLoadingSubscription: boolean;
  isCreatingOrder: boolean;
  error: string | null;

  // Real-time subscription state
  activeSubscriptions: Set<string>;
  orderUpdates: Map<string, OrderStatusUpdate>;
  priceUpdates: Map<string, RetailerPriceUpdate[]>;
  emergencyAlerts: EmergencyReorderAlert[];

  // Offline queue
  offlineActions: Array<{
    id: string;
    type: 'CREATE_ORDER' | 'UPDATE_SUBSCRIPTION' | 'SHARE_SUGGESTION';
    data: any;
    timestamp: number;
    retryCount: number;
  }>;

  // Preferences
  reorderPreferences: {
    autoSuggestEnabled: boolean;
    priceAlertsEnabled: boolean;
    emergencyAlertsEnabled: boolean;
    preferredRetailers: string[];
    maxPriceThreshold: {
      amount: number;
      currency: string;
    };
    deliveryPreference: 'STANDARD' | 'EXPRESS' | 'PRIORITY';
  };

  // Actions
  loadReorderSuggestions: (childId: string) => Promise<void>;
  loadRetailerComparison: (productId: string, quantity?: number) => Promise<void>;
  loadSubscriptionStatus: () => Promise<void>;

  createOrder: (input: CreateOrderInput) => Promise<{ success: boolean; order?: Order; redirectUrl?: string; error?: string }>;
  upgradeSubscription: (planId: string, billingInterval: BillingInterval) => Promise<{ success: boolean; error?: string }>;
  setupAutoReorder: (input: AutoReorderInput) => Promise<{ success: boolean; error?: string }>;
  shareReorderSuggestion: (input: ShareSuggestionInput) => Promise<{ success: boolean; error?: string }>;

  // Real-time subscriptions
  subscribeToOrderUpdates: (orderId: string) => () => void;
  subscribeToSuggestionUpdates: (childId: string) => () => void;
  subscribeToRetailerPrices: (productId: string) => () => void;
  subscribeToEmergencyAlerts: (childId: string) => () => void;

  // UI actions
  setSelectedRetailer: (retailer: RetailerOption | null) => void;
  setUpgradeModalVisible: (visible: boolean) => void;
  clearError: () => void;

  // Offline queue management
  processOfflineQueue: () => Promise<void>;
  addToOfflineQueue: (action: any) => void;

  // Preferences
  updateReorderPreferences: (preferences: Partial<typeof this.reorderPreferences>) => Promise<void>;

  // Cleanup
  cleanup: () => void;
}

// Create the reorder store
export const useReorderStore = create<ReorderState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    suggestions: [],
    currentComparison: null,
    selectedRetailer: null,
    activeOrder: null,
    subscriptionStatus: null,
    isUpgradeModalVisible: false,
    isPremiumUser: false,
    isLoadingSuggestions: false,
    isLoadingComparison: false,
    isLoadingSubscription: false,
    isCreatingOrder: false,
    error: null,
    activeSubscriptions: new Set(),
    orderUpdates: new Map(),
    priceUpdates: new Map(),
    emergencyAlerts: [],
    offlineActions: [],
    reorderPreferences: {
      autoSuggestEnabled: true,
      priceAlertsEnabled: true,
      emergencyAlertsEnabled: true,
      preferredRetailers: [],
      maxPriceThreshold: {
        amount: 100,
        currency: 'CAD',
      },
      deliveryPreference: 'STANDARD',
    },

    // Load ML-powered reorder suggestions with enhanced error handling
    loadReorderSuggestions: async (childId: string) => {
      set({ isLoadingSuggestions: true, error: null });

      // Create a timeout promise to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 8000); // 8 second timeout
      });

      try {
        // Try simplified query first to prevent Apollo Client invariant violations
        let result: any;
        try {
          const simpleQueryPromise = apolloClient.query({
            query: GET_REORDER_SUGGESTIONS_SIMPLE,
            variables: { childId, limit: 10 },
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
          });

          result = await Promise.race([simpleQueryPromise, timeoutPromise]);
          console.log('Successfully used simplified reorder suggestions query');
        } catch (simpleError) {
          console.warn('Simplified query failed, trying complex query:', simpleError);

          // Fallback to complex query if simple query fails
          const complexQueryPromise = apolloClient.query({
            query: GET_REORDER_SUGGESTIONS,
            variables: { childId, limit: 10 },
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
          });

          result = await Promise.race([complexQueryPromise, timeoutPromise]);
        }

        const { data, errors } = result as any;

        // Log any GraphQL errors but don't fail completely
        if (errors && errors.length > 0) {
          console.warn('GraphQL errors in reorder suggestions:', errors);
        }

        // Handle successful response with data
        if (data?.getReorderSuggestions) {
          // Ensure the data is an array and has valid structure
          const suggestions = Array.isArray(data.getReorderSuggestions)
            ? data.getReorderSuggestions
            : [];

          // Cache the suggestions for offline use
          try {
            await StorageHelpers.setItem(
              `reorder_suggestions_${childId}`,
              JSON.stringify({
                suggestions,
                timestamp: Date.now()
              }),
              false
            );
          } catch (cacheError) {
            console.warn('Failed to cache suggestions:', cacheError);
          }

          set({
            suggestions,
            isLoadingSuggestions: false,
            error: null,
          });
        } else {
          // Handle null/undefined response (no suggestions available)
          set({
            suggestions: [],
            isLoadingSuggestions: false,
            error: null,
          });
        }
      } catch (error: any) {
        console.error('Failed to load reorder suggestions:', error);

        // Provide specific error messages based on error type
        let userMessage = 'Failed to load reorder suggestions. Please try again.';

        if (error.message === 'Request timeout') {
          userMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.networkError) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('Invariant Violation')) {
          userMessage = 'Data loading issue. Please refresh the app and try again.';
        }

        set({
          error: userMessage,
          isLoadingSuggestions: false,
          suggestions: [], // Ensure we always have an empty array instead of undefined
        });

        // Try to use cached data if available
        try {
          const cachedSuggestions = await StorageHelpers.getItem(`reorder_suggestions_${childId}`, false);
          if (cachedSuggestions) {
            const parsed = JSON.parse(cachedSuggestions);
            const isExpired = Date.now() - parsed.timestamp > 30 * 60 * 1000; // 30 minutes
            if (!isExpired && parsed.suggestions) {
              set({ suggestions: parsed.suggestions, error: null });
              console.log('Using cached reorder suggestions');
            }
          }
        } catch (cacheError) {
          console.warn('Failed to load cached suggestions:', cacheError);
        }
      }
    },

    // Load detailed retailer comparison
    loadRetailerComparison: async (productId: string, quantity = 1) => {
      set({ isLoadingComparison: true, error: null });

      // Create timeout for retailer comparison
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Retailer comparison timeout')), 6000);
      });

      try {
        const queryPromise = apolloClient.query({
          query: GET_RETAILER_COMPARISON,
          variables: { productId, quantity },
          fetchPolicy: 'cache-first',
          errorPolicy: 'all',
        });

        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data } = result;

        if (data?.getRetailerComparison) {
          set({
            currentComparison: data.getRetailerComparison,
            isLoadingComparison: false,
          });
        } else {
          set({
            error: 'Failed to load retailer comparison data.',
            isLoadingComparison: false,
          });
        }
      } catch (error) {
        console.error('Failed to load retailer comparison:', error);
        set({
          error: 'Failed to load retailer comparison. Please try again.',
          isLoadingComparison: false,
        });
      }
    },

    // Load subscription status - using simplified query to prevent Apollo Client invariant violations
    loadSubscriptionStatus: async () => {
      set({ isLoadingSubscription: true, error: null });

      // Create a timeout promise to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription request timeout')), 6000); // 6 second timeout
      });

      try {
        // Try simplified query first to prevent invariant violations
        const queryPromise = apolloClient.query({
          query: GET_SUBSCRIPTION_STATUS_SIMPLE,
          fetchPolicy: 'network-only',
          errorPolicy: 'all', // Allow all responses including null/undefined
        }).catch((apolloError) => {
          console.warn('Simplified subscription query failed:', apolloError.message);
          // Return mock response for users without subscriptions
          return {
            data: {
              getSubscriptionStatus: {
                id: null,
                status: 'inactive'
              }
            }
          };
        });

        // Race between query and timeout
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data } = result;

        if (data?.getSubscriptionStatus) {
          const subscription = data.getSubscriptionStatus;

          // Create minimal subscription object to prevent UI crashes
          const minimalSubscription = {
            id: subscription.id,
            status: subscription.status || 'inactive',
            // Set default values for missing nested fields
            currentPlan: null,
            nextBillingDate: null,
            paymentMethod: null,
            usage: null,
            availableUpgrades: [],
            billingDataConsent: false,
            updatedAt: new Date().toISOString()
          };

          set({
            subscriptionStatus: minimalSubscription,
            isPremiumUser: subscription.status === 'ACTIVE' || subscription.status === 'active',
            isLoadingSubscription: false,
            error: null,
          });
        } else {
          // Handle null/undefined subscription response (user has no subscription)
          set({
            subscriptionStatus: {
              id: null,
              status: 'inactive',
              currentPlan: null,
              nextBillingDate: null,
              paymentMethod: null,
              usage: null,
              availableUpgrades: [],
              billingDataConsent: false,
              updatedAt: new Date().toISOString()
            },
            isPremiumUser: false,
            isLoadingSubscription: false,
            error: null,
          });
        }
      } catch (error: any) {
        console.error('Failed to load subscription status:', error);

        // Handle timeout specifically without blocking UI
        if (error.message?.includes('timeout')) {
          console.warn('Subscription status request timed out, using default state');
        }

        // Set safe default state instead of error to allow page to load
        set({
          subscriptionStatus: {
            id: null,
            status: 'inactive',
            currentPlan: null,
            nextBillingDate: null,
            paymentMethod: null,
            usage: null,
            availableUpgrades: [],
            billingDataConsent: false,
            updatedAt: new Date().toISOString()
          },
          isPremiumUser: false,
          isLoadingSubscription: false,
          error: null, // Don't set error to prevent blocking UI
        });
      }
    },

    // Create order from suggestion
    createOrder: async (input: CreateOrderInput) => {
      set({ isCreatingOrder: true, error: null });

      try {
        const { data } = await apolloClient.mutate({
          mutation: CREATE_ORDER,
          variables: { input },
          context: { timeout: 12000 }, // 12 second timeout for order creation
        });

        if (data?.createOrder?.success) {
          const result = data.createOrder;
          if (result.order) {
            set({ activeOrder: result.order });
            // Invalidate relevant caches after successful order
            await cacheUtils.smartCacheRefresh('CREATE_ORDER', input);
          }
          set({ isCreatingOrder: false });
          return {
            success: true,
            order: result.order,
            redirectUrl: result.redirectUrl,
          };
        } else {
          set({
            error: data?.createOrder?.error || 'Failed to create order.',
            isCreatingOrder: false,
          });
          return {
            success: false,
            error: data?.createOrder?.error || 'Failed to create order.',
          };
        }
      } catch (error) {
        console.error('Failed to create order:', error);
        const errorMessage = 'Failed to create order. Please try again.';

        // Add to offline queue for retry
        get().addToOfflineQueue({
          id: `order_${Date.now()}`,
          type: 'CREATE_ORDER',
          data: input,
          timestamp: Date.now(),
          retryCount: 0,
        });

        set({
          error: errorMessage,
          isCreatingOrder: false,
        });

        return { success: false, error: errorMessage };
      }
    },

    // Upgrade subscription
    upgradeSubscription: async (planId: string, billingInterval: BillingInterval) => {
      set({ isLoadingSubscription: true, error: null });

      try {
        const { data } = await apolloClient.mutate({
          mutation: UPDATE_SUBSCRIPTION,
          variables: { planId, billingInterval },
        });

        if (data?.updateSubscription?.success) {
          // Reload subscription status
          await get().loadSubscriptionStatus();
          return { success: true };
        } else {
          const error = data?.updateSubscription?.error || 'Failed to upgrade subscription.';
          set({ error, isLoadingSubscription: false });
          return { success: false, error };
        }
      } catch (error) {
        console.error('Failed to upgrade subscription:', error);
        const errorMessage = 'Failed to upgrade subscription. Please try again.';
        set({
          error: errorMessage,
          isLoadingSubscription: false,
        });
        return { success: false, error: errorMessage };
      }
    },

    // Setup automatic reordering
    setupAutoReorder: async (input: AutoReorderInput) => {
      try {
        const { data } = await apolloClient.mutate({
          mutation: SETUP_AUTO_REORDER,
          variables: { input },
        });

        if (data?.setupAutoReorder?.success) {
          return { success: true };
        } else {
          const error = data?.setupAutoReorder?.error || 'Failed to setup auto-reorder.';
          return { success: false, error };
        }
      } catch (error) {
        console.error('Failed to setup auto-reorder:', error);
        return { success: false, error: 'Failed to setup auto-reorder. Please try again.' };
      }
    },

    // Share reorder suggestion with family
    shareReorderSuggestion: async (input: ShareSuggestionInput) => {
      try {
        const { data } = await apolloClient.mutate({
          mutation: SHARE_REORDER_SUGGESTION,
          variables: { input },
        });

        if (data?.shareReorderSuggestion?.success) {
          return { success: true };
        } else {
          const error = data?.shareReorderSuggestion?.error || 'Failed to share suggestion.';
          return { success: false, error };
        }
      } catch (error) {
        console.error('Failed to share suggestion:', error);

        // Add to offline queue for retry
        get().addToOfflineQueue({
          id: `share_${Date.now()}`,
          type: 'SHARE_SUGGESTION',
          data: input,
          timestamp: Date.now(),
          retryCount: 0,
        });

        return { success: false, error: 'Failed to share suggestion. Will retry when connection is restored.' };
      }
    },

    // Real-time subscription management
    subscribeToOrderUpdates: (orderId: string) => {
      const subscriptionId = `order_${orderId}`;
      const subscriptions = get().activeSubscriptions;

      if (subscriptions.has(subscriptionId)) {
        return () => {}; // Already subscribed
      }

      const subscription = apolloClient.subscribe({
        query: ORDER_STATUS_SUBSCRIPTION,
        variables: { orderId },
      }).subscribe({
        next: ({ data }) => {
          if (data?.orderStatusUpdates) {
            const updates = get().orderUpdates;
            updates.set(orderId, data.orderStatusUpdates);
            set({ orderUpdates: new Map(updates) });
          }
        },
        error: (error) => {
          console.error('Order status subscription error:', error);
        },
      });

      subscriptions.add(subscriptionId);
      set({ activeSubscriptions: new Set(subscriptions) });

      return () => {
        subscription.unsubscribe();
        const currentSubscriptions = get().activeSubscriptions;
        currentSubscriptions.delete(subscriptionId);
        set({ activeSubscriptions: new Set(currentSubscriptions) });
      };
    },

    subscribeToSuggestionUpdates: (childId: string) => {
      const subscriptionId = `suggestions_${childId}`;
      const subscriptions = get().activeSubscriptions;

      if (subscriptions.has(subscriptionId)) {
        return () => {}; // Already subscribed
      }

      const subscription = apolloClient.subscribe({
        query: REORDER_SUGGESTIONS_SUBSCRIPTION,
        variables: { childId },
      }).subscribe({
        next: ({ data }) => {
          if (data?.reorderSuggestionsUpdates) {
            // Update suggestions list with new data
            const currentSuggestions = get().suggestions;
            const updatedSuggestion = data.reorderSuggestionsUpdates;
            const updatedSuggestions = currentSuggestions.map(suggestion =>
              suggestion.id === updatedSuggestion.id ? updatedSuggestion : suggestion
            );

            // Add new suggestion if not found
            if (!currentSuggestions.find(s => s.id === updatedSuggestion.id)) {
              updatedSuggestions.push(updatedSuggestion);
            }

            set({ suggestions: updatedSuggestions });
          }
        },
        error: (error) => {
          console.error('Suggestions subscription error:', error);
        },
      });

      subscriptions.add(subscriptionId);
      set({ activeSubscriptions: new Set(subscriptions) });

      return () => {
        subscription.unsubscribe();
        const currentSubscriptions = get().activeSubscriptions;
        currentSubscriptions.delete(subscriptionId);
        set({ activeSubscriptions: new Set(currentSubscriptions) });
      };
    },

    subscribeToRetailerPrices: (productId: string) => {
      const subscriptionId = `prices_${productId}`;
      const subscriptions = get().activeSubscriptions;

      if (subscriptions.has(subscriptionId)) {
        return () => {}; // Already subscribed
      }

      const subscription = apolloClient.subscribe({
        query: RETAILER_PRICES_SUBSCRIPTION,
        variables: { productId },
      }).subscribe({
        next: ({ data }) => {
          if (data?.retailerPriceUpdates) {
            const updates = get().priceUpdates;
            const currentUpdates = updates.get(productId) || [];
            currentUpdates.push(data.retailerPriceUpdates);
            updates.set(productId, currentUpdates);
            set({ priceUpdates: new Map(updates) });
          }
        },
        error: (error) => {
          console.error('Price updates subscription error:', error);
        },
      });

      subscriptions.add(subscriptionId);
      set({ activeSubscriptions: new Set(subscriptions) });

      return () => {
        subscription.unsubscribe();
        const currentSubscriptions = get().activeSubscriptions;
        currentSubscriptions.delete(subscriptionId);
        set({ activeSubscriptions: new Set(currentSubscriptions) });
      };
    },

    subscribeToEmergencyAlerts: (childId: string) => {
      const subscriptionId = `emergency_${childId}`;
      const subscriptions = get().activeSubscriptions;

      if (subscriptions.has(subscriptionId)) {
        return () => {}; // Already subscribed
      }

      const subscription = apolloClient.subscribe({
        query: EMERGENCY_REORDER_SUBSCRIPTION,
        variables: { childId },
      }).subscribe({
        next: ({ data }) => {
          if (data?.emergencyReorderAlerts) {
            const currentAlerts = get().emergencyAlerts;
            const newAlert = data.emergencyReorderAlerts;

            // Add new alert if not already present
            if (!currentAlerts.find(alert => alert.id === newAlert.id)) {
              set({ emergencyAlerts: [...currentAlerts, newAlert] });
            }
          }
        },
        error: (error) => {
          console.error('Emergency alerts subscription error:', error);
        },
      });

      subscriptions.add(subscriptionId);
      set({ activeSubscriptions: new Set(subscriptions) });

      return () => {
        subscription.unsubscribe();
        const currentSubscriptions = get().activeSubscriptions;
        currentSubscriptions.delete(subscriptionId);
        set({ activeSubscriptions: new Set(currentSubscriptions) });
      };
    },

    // UI actions
    setSelectedRetailer: (retailer: RetailerOption | null) => {
      set({ selectedRetailer: retailer });
    },

    setUpgradeModalVisible: (visible: boolean) => {
      set({ isUpgradeModalVisible: visible });
    },

    clearError: () => {
      set({ error: null });
    },

    // Offline queue management
    processOfflineQueue: async () => {
      const queue = get().offlineActions;
      if (queue.length === 0) return;

      const processedIds: string[] = [];

      for (const action of queue) {
        try {
          switch (action.type) {
            case 'CREATE_ORDER':
              await get().createOrder(action.data);
              processedIds.push(action.id);
              break;
            case 'SHARE_SUGGESTION':
              await get().shareReorderSuggestion(action.data);
              processedIds.push(action.id);
              break;
            // Add other action types as needed
          }
        } catch (error) {
          console.error('Failed to process offline action:', action.id, error);
          // Increment retry count
          action.retryCount++;
          if (action.retryCount >= 3) {
            // Remove after 3 failed attempts
            processedIds.push(action.id);
          }
        }
      }

      // Remove processed actions
      if (processedIds.length > 0) {
        const remainingActions = queue.filter(action => !processedIds.includes(action.id));
        set({ offlineActions: remainingActions });

        // Persist updated queue
        await StorageHelpers.setReorderPreferences({
          ...get().reorderPreferences,
          offlineQueue: remainingActions,
        });
      }
    },

    addToOfflineQueue: (action: any) => {
      const currentQueue = get().offlineActions;
      const updatedQueue = [...currentQueue, action];
      set({ offlineActions: updatedQueue });

      // Persist to storage
      StorageHelpers.setReorderPreferences({
        ...get().reorderPreferences,
        offlineQueue: updatedQueue,
      });
    },

    // Update preferences
    updateReorderPreferences: async (preferences: Partial<ReorderState['reorderPreferences']>) => {
      const currentPreferences = get().reorderPreferences;
      const updatedPreferences = { ...currentPreferences, ...preferences };

      set({ reorderPreferences: updatedPreferences });

      // Persist to storage
      await StorageHelpers.setReorderPreferences(updatedPreferences);
    },

    // Cleanup subscriptions
    cleanup: () => {
      const subscriptions = get().activeSubscriptions;
      subscriptions.clear();
      set({
        activeSubscriptions: new Set(),
        orderUpdates: new Map(),
        priceUpdates: new Map(),
        emergencyAlerts: [],
      });
    },
  }))
);

// Selectors for common state combinations
export const useReorderSuggestions = () => {
  const store = useReorderStore();
  return {
    suggestions: store.suggestions,
    isLoading: store.isLoadingSuggestions,
    error: store.error,
    loadSuggestions: store.loadReorderSuggestions,
  };
};

export const useRetailerComparison = () => {
  const store = useReorderStore();
  return {
    comparison: store.currentComparison,
    selectedRetailer: store.selectedRetailer,
    isLoading: store.isLoadingComparison,
    loadComparison: store.loadRetailerComparison,
    setSelectedRetailer: store.setSelectedRetailer,
  };
};

export const usePremiumSubscription = () => {
  const store = useReorderStore();
  return {
    subscription: store.subscriptionStatus,
    isPremium: store.isPremiumUser,
    isUpgradeModalVisible: store.isUpgradeModalVisible,
    isLoading: store.isLoadingSubscription,
    loadStatus: store.loadSubscriptionStatus,
    upgrade: store.upgradeSubscription,
    setUpgradeModalVisible: store.setUpgradeModalVisible,
  };
};

export const useOrderTracking = () => {
  const store = useReorderStore();
  return {
    activeOrder: store.activeOrder,
    orderUpdates: store.orderUpdates,
    isCreating: store.isCreatingOrder,
    createOrder: store.createOrder,
    subscribeToUpdates: store.subscribeToOrderUpdates,
  };
};

export const useReorderPreferences = () => {
  const store = useReorderStore();
  return {
    preferences: store.reorderPreferences,
    updatePreferences: store.updateReorderPreferences,
  };
};

export default useReorderStore;