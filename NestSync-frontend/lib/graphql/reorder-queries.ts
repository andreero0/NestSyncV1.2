/**
 * GraphQL Queries and Mutations for Reorder Flow
 * ML-powered reorder suggestions, retailer comparison, and order management
 * Following Canadian PIPEDA compliance and NestSync architecture patterns
 */

import { gql } from '@apollo/client';

// Get ML-powered reorder suggestions for a child
export const GET_REORDER_SUGGESTIONS = gql`
  query GetReorderSuggestions($childId: ID!, $limit: Int = 10) {
    getReorderSuggestions(childId: $childId, limit: $limit) {
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
        description
        features
      }
      predictedRunOutDate
      confidence
      priority
      suggestedQuantity
      currentInventoryLevel
      usagePattern {
        averageDailyUsage
        weeklyTrend
        seasonalFactors
      }
      estimatedCostSavings {
        amount
        currency
        comparedToRegularPrice
        comparedToLastPurchase
      }
      availableRetailers {
        id
        name
        logo
        price {
          amount
          currency
          originalPrice
          discountPercentage
          taxes {
            gst
            pst
            hst
            total
          }
          finalAmount
        }
        deliveryTime
        inStock
        rating
        freeShipping
        affiliateDisclosure
      }
      createdAt
      updatedAt
      mlProcessingConsent
      dataRetentionDays
    }
  }
`;

// Get detailed retailer comparison for a specific product
export const GET_RETAILER_COMPARISON = gql`
  query GetRetailerComparison($productId: ID!, $quantity: Int = 1) {
    getRetailerComparison(productId: $productId, quantity: $quantity) {
      productId
      product {
        id
        name
        brand
        size
        category
        image
        specifications
      }
      retailers {
        id
        name
        logo
        trustScore
        verificationStatus
        price {
          amount
          currency
          originalPrice
          discountPercentage
          bulkDiscounts {
            quantity
            discountPercentage
            savings {
              amount
              currency
            }
          }
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
          lastUpdated
        }
        delivery {
          estimatedDays
          minDeliveryDays
          maxDeliveryDays
          freeShippingThreshold
          shippingCost {
            amount
            currency
          }
          deliveryOptions {
            type
            estimatedDays
            cost {
              amount
              currency
            }
          }
        }
        customerReviews {
          averageRating
          totalReviews
          recentReviews {
            rating
            comment
            date
            verified
          }
        }
        affiliateInfo {
          isAffiliate
          disclosureText
          commissionRate
        }
        lastPriceUpdate
      }
      priceComparison {
        lowestPrice {
          retailerId
          amount
          currency
          savings {
            amount
            currency
            percentage
          }
        }
        averagePrice {
          amount
          currency
        }
        priceSpread {
          min
          max
          average
        }
      }
      priceDataConsent
      lastUpdated
    }
  }
`;

// Get current subscription status and features
export const GET_SUBSCRIPTION_STATUS = gql`
  query GetSubscriptionStatus {
    getSubscriptionStatus {
      id
      status
      currentPlan {
        id
        name
        displayName
        description
        features
        price {
          amount
          currency
          billingInterval
          canadianTaxes {
            gst
            pst
            hst
            total
          }
        }
        limits {
          reorderSuggestions
          familyMembers
          priceAlerts
          autoOrdering
        }
      }
      nextBillingDate
      paymentMethod {
        id
        type
        brand
        last4
        expiryMonth
        expiryYear
        isDefault
      }
      usage {
        currentPeriod {
          reordersSuggested
          ordersPlaced
          savingsGenerated {
            amount
            currency
          }
          priceAlertsReceived
        }
        lifetime {
          totalOrders
          totalSavings {
            amount
            currency
          }
          memberSince
        }
      }
      availableUpgrades {
        planId
        name
        monthlyPricing {
          amount
          currency
        }
        yearlyPricing {
          amount
          currency
          savingsPerMonth {
            amount
            currency
          }
        }
        newFeatures
        valueProposition
      }
      billingDataConsent
      updatedAt
    }
  }
`;

// Create a new order from reorder suggestion
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      success
      order {
        id
        status
        orderNumber
        retailer {
          id
          name
          logo
        }
        items {
          id
          productId
          product {
            name
            brand
            size
            image
          }
          quantity
          unitPrice {
            amount
            currency
          }
          totalPrice {
            amount
            currency
          }
        }
        pricing {
          subtotal {
            amount
            currency
          }
          taxes {
            gst
            pst
            hst
            total
          }
          shipping {
            amount
            currency
            method
          }
          total {
            amount
            currency
          }
        }
        delivery {
          estimatedDelivery
          shippingAddress {
            name
            line1
            line2
            city
            province
            postalCode
            country
          }
        }
        paymentMethod {
          type
          last4
        }
        tracking {
          trackingNumber
          carrier
          status
        }
        createdAt
        orderDataConsent
      }
      redirectUrl # For external retailer checkout
      error
    }
  }
`;

// Update subscription plan
export const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($planId: ID!, $billingInterval: BillingInterval!) {
    updateSubscription(planId: $planId, billingInterval: $billingInterval) {
      success
      subscription {
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
        prorationAmount {
          amount
          currency
          description
        }
      }
      paymentIntent {
        clientSecret
        status
      }
      error
    }
  }
`;

// Cancel subscription
export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($reason: String, $feedback: String) {
    cancelSubscription(reason: $reason, feedback: $feedback) {
      success
      subscription {
        id
        status
        cancelledAt
        activeUntil
        refundAmount {
          amount
          currency
        }
      }
      error
    }
  }
`;

// Set up automatic reordering
export const SETUP_AUTO_REORDER = gql`
  mutation SetupAutoReorder($input: AutoReorderInput!) {
    setupAutoReorder(input: $input) {
      success
      autoReorder {
        id
        childId
        productId
        product {
          name
          brand
          size
        }
        preferredRetailer {
          id
          name
        }
        trigger {
          type
          threshold
          scheduleInterval
        }
        quantity
        priceThreshold {
          amount
          currency
        }
        isActive
        nextOrderDate
      }
      error
    }
  }
`;

// Get order history with details
export const GET_ORDER_HISTORY = gql`
  query GetOrderHistory($limit: Int = 20, $offset: Int = 0) {
    getOrderHistory(limit: $limit, offset: $offset) {
      orders {
        id
        orderNumber
        status
        retailer {
          id
          name
          logo
        }
        items {
          id
          productId
          product {
            name
            brand
            size
            image
          }
          quantity
          unitPrice {
            amount
            currency
          }
        }
        total {
          amount
          currency
        }
        placedAt
        deliveredAt
        tracking {
          trackingNumber
          carrier
          status
          estimatedDelivery
        }
        canReorder
        satisfaction {
          rating
          feedback
        }
      }
      pagination {
        total
        hasMore
        nextOffset
      }
    }
  }
`;

// Share reorder suggestion with family
export const SHARE_REORDER_SUGGESTION = gql`
  mutation ShareReorderSuggestion($input: ShareSuggestionInput!) {
    shareReorderSuggestion(input: $input) {
      success
      sharedSuggestion {
        id
        suggestionId
        familyId
        sharedBy {
          id
          name
        }
        recipients {
          id
          name
          notificationSent
        }
        message
        urgency
        sharedAt
      }
      error
    }
  }
`;

// Report price discrepancy
export const REPORT_PRICE_DISCREPANCY = gql`
  mutation ReportPriceDiscrepancy($input: PriceDiscrepancyInput!) {
    reportPriceDiscrepancy(input: $input) {
      success
      reportId
      estimatedResolutionTime
      error
    }
  }
`;

// Input types for mutations
export interface CreateOrderInput {
  suggestionId?: string;
  retailerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddressId: string;
  paymentMethodId?: string;
  useStoredPayment?: boolean;
  deliveryPreference?: 'STANDARD' | 'EXPRESS' | 'PRIORITY';
  specialInstructions?: string;
  // Canadian compliance
  dataProcessingConsent: boolean;
  marketingConsent?: boolean;
}

export interface AutoReorderInput {
  childId: string;
  productId: string;
  preferredRetailerId: string;
  trigger: {
    type: 'INVENTORY_LOW' | 'SCHEDULE' | 'PREDICTION';
    threshold?: number; // For inventory-based triggers
    scheduleInterval?: number; // For schedule-based triggers (days)
  };
  quantity: number;
  priceThreshold?: {
    amount: number;
    currency: string;
  };
  // Canadian compliance
  autoOrderConsent: boolean;
}

export interface ShareSuggestionInput {
  suggestionId: string;
  familyId: string;
  recipientIds: string[];
  message?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  // Canadian compliance
  dataSharingConsent: boolean;
}

export interface PriceDiscrepancyInput {
  productId: string;
  retailerId: string;
  reportedPrice: {
    amount: number;
    currency: string;
  };
  actualPrice: {
    amount: number;
    currency: string;
  };
  evidence?: string; // URL to screenshot or description
  // Canadian compliance
  reportingConsent: boolean;
}

// Enums
export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}