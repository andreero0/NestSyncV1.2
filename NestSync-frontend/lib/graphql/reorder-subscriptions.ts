/**
 * GraphQL Subscriptions for Reorder Flow
 * Real-time subscriptions for order tracking and status updates
 * Following Canadian PIPEDA compliance and NestSync architecture patterns
 */

import { gql } from '@apollo/client';

// Order status update subscription for real-time tracking
export const ORDER_STATUS_SUBSCRIPTION = gql`
  subscription OrderStatusUpdates($orderId: ID!) {
    orderStatusUpdates(orderId: $orderId) {
      id
      status
      tracking {
        trackingNumber
        carrier
        estimatedDelivery
        currentLocation
        statusHistory {
          status
          timestamp
          location
          message
        }
      }
      retailer {
        id
        name
        logo
      }
      items {
        id
        productId
        quantity
        price {
          amount
          currency
          # Canadian tax breakdown
          taxes {
            gst
            pst
            hst
            total
          }
        }
      }
      updatedAt
      # Canadian compliance
      dataProcessingConsent
    }
  }
`;

// Real-time reorder suggestions subscription for ML prediction updates
export const REORDER_SUGGESTIONS_SUBSCRIPTION = gql`
  subscription ReorderSuggestionsUpdates($childId: ID!) {
    reorderSuggestionsUpdates(childId: $childId) {
      id
      childId
      productId
      product {
        id
        name
        brand
        size
        category
        image
      }
      predictedRunOutDate
      confidence
      priority
      suggestedQuantity
      estimatedCostSavings {
        amount
        currency
        comparedToRegularPrice
      }
      availableRetailers {
        id
        name
        price {
          amount
          currency
          taxes {
            gst
            pst
            hst
            total
          }
        }
        deliveryTime
        inStock
        rating
      }
      createdAt
      updatedAt
      # Canadian compliance
      mlProcessingConsent
    }
  }
`;

// Retailer price updates subscription for real-time comparison
export const RETAILER_PRICES_SUBSCRIPTION = gql`
  subscription RetailerPriceUpdates($productId: ID!) {
    retailerPriceUpdates(productId: $productId) {
      productId
      retailer {
        id
        name
        logo
        trustScore
      }
      price {
        amount
        currency
        originalPrice
        discountPercentage
        # Canadian tax calculation
        taxes {
          gst
          pst
          hst
          total
        }
        finalAmount
      }
      availability {
        inStock
        quantity
        estimatedRestockDate
      }
      delivery {
        estimatedDays
        freeShippingThreshold
        shippingCost {
          amount
          currency
        }
      }
      updatedAt
      # Canadian compliance
      priceDataConsent
    }
  }
`;

// Premium subscription status updates
export const SUBSCRIPTION_STATUS_SUBSCRIPTION = gql`
  subscription SubscriptionStatusUpdates($userId: ID!) {
    subscriptionStatusUpdates(userId: $userId) {
      id
      status
      currentPlan {
        id
        name
        features
        price {
          amount
          currency
          billingInterval
        }
      }
      nextBillingDate
      paymentMethod {
        id
        type
        last4
        expiryMonth
        expiryYear
      }
      usage {
        reordersSuggested
        ordersPlaced
        savingsGenerated {
          amount
          currency
        }
      }
      updatedAt
      # Canadian compliance
      billingDataConsent
    }
  }
`;

// Family collaboration updates for shared reorders
export const FAMILY_REORDER_SUBSCRIPTION = gql`
  subscription FamilyReorderUpdates($familyId: ID!) {
    familyReorderUpdates(familyId: $familyId) {
      id
      familyId
      initiatedBy {
        id
        name
        avatar
      }
      type
      orderId
      order {
        id
        status
        items {
          id
          productId
          product {
            name
            brand
            size
          }
          quantity
        }
        totalAmount {
          amount
          currency
        }
      }
      sharedSuggestion {
        id
        productId
        product {
          name
          brand
          size
        }
        note
        urgency
      }
      message
      timestamp
      # Canadian compliance
      familySharingConsent
    }
  }
`;

// Emergency reorder alerts subscription
export const EMERGENCY_REORDER_SUBSCRIPTION = gql`
  subscription EmergencyReorderAlerts($childId: ID!) {
    emergencyReorderAlerts(childId: $childId) {
      id
      childId
      child {
        id
        name
        currentDiaperSize
      }
      severity
      estimatedRunOut
      currentInventory
      suggestedOrder {
        productId
        product {
          name
          brand
          size
        }
        quantity
        retailer {
          id
          name
          estimatedDelivery
        }
        price {
          amount
          currency
        }
      }
      quickOrderOptions {
        retailerId
        retailer {
          name
          logo
        }
        deliveryTime
        price {
          amount
          currency
        }
        oneClickAvailable
      }
      timestamp
      # Canadian compliance
      emergencyDataConsent
    }
  }
`;

// Subscription operation names for easy reference
export const SUBSCRIPTION_NAMES = {
  ORDER_STATUS: 'OrderStatusUpdates',
  REORDER_SUGGESTIONS: 'ReorderSuggestionsUpdates',
  RETAILER_PRICES: 'RetailerPriceUpdates',
  SUBSCRIPTION_STATUS: 'SubscriptionStatusUpdates',
  FAMILY_REORDER: 'FamilyReorderUpdates',
  EMERGENCY_REORDER: 'EmergencyReorderAlerts',
} as const;

// Type definitions for subscription data
export interface OrderStatusUpdate {
  id: string;
  status: string;
  tracking: {
    trackingNumber: string;
    carrier: string;
    estimatedDelivery: string;
    currentLocation: string;
    statusHistory: Array<{
      status: string;
      timestamp: string;
      location: string;
      message: string;
    }>;
  };
  retailer: {
    id: string;
    name: string;
    logo: string;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: {
      amount: number;
      currency: string;
      taxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
    };
  }>;
  updatedAt: string;
  dataProcessingConsent: boolean;
}

export interface ReorderSuggestionUpdate {
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
  };
  predictedRunOutDate: string;
  confidence: number;
  priority: number;
  suggestedQuantity: number;
  estimatedCostSavings: {
    amount: number;
    currency: string;
    comparedToRegularPrice: number;
  };
  availableRetailers: Array<{
    id: string;
    name: string;
    price: {
      amount: number;
      currency: string;
      taxes: {
        gst: number;
        pst: number;
        hst: number;
        total: number;
      };
    };
    deliveryTime: number;
    inStock: boolean;
    rating: number;
  }>;
  createdAt: string;
  updatedAt: string;
  mlProcessingConsent: boolean;
}

export interface RetailerPriceUpdate {
  productId: string;
  retailer: {
    id: string;
    name: string;
    logo: string;
    trustScore: number;
  };
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
  availability: {
    inStock: boolean;
    quantity: number;
    estimatedRestockDate?: string;
  };
  delivery: {
    estimatedDays: number;
    freeShippingThreshold: number;
    shippingCost: {
      amount: number;
      currency: string;
    };
  };
  updatedAt: string;
  priceDataConsent: boolean;
}

export interface EmergencyReorderAlert {
  id: string;
  childId: string;
  child: {
    id: string;
    name: string;
    currentDiaperSize: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedRunOut: string;
  currentInventory: number;
  suggestedOrder: {
    productId: string;
    product: {
      name: string;
      brand: string;
      size: string;
    };
    quantity: number;
    retailer: {
      id: string;
      name: string;
      estimatedDelivery: string;
    };
    price: {
      amount: number;
      currency: string;
    };
  };
  quickOrderOptions: Array<{
    retailerId: string;
    retailer: {
      name: string;
      logo: string;
    };
    deliveryTime: number;
    price: {
      amount: number;
      currency: string;
    };
    oneClickAvailable: boolean;
  }>;
  timestamp: string;
  emergencyDataConsent: boolean;
}