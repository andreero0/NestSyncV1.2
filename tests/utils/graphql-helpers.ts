import { Page, expect } from '@playwright/test';

/**
 * GraphQL Testing Utilities for NestSync
 * Handles GraphQL queries, subscriptions, and real-time testing
 */

export interface GraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: any;
  }>;
}

export interface GraphQLSubscriptionEvent {
  type: 'connection_init' | 'connection_ack' | 'start' | 'data' | 'error' | 'complete';
  id?: string;
  payload?: any;
}

/**
 * GraphQL test helper class
 */
export class GraphQLHelper {
  private baseURL: string;

  constructor(private page: Page, baseURL = 'http://localhost:8001') {
    this.baseURL = baseURL;
  }

  /**
   * Execute a GraphQL query via HTTP
   */
  async query(
    query: string,
    variables?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<GraphQLResponse> {
    const authToken = await this.page.evaluate(() => localStorage.getItem('authToken'));

    const response = await this.page.request.post(`${this.baseURL}/graphql`, {
      data: {
        query,
        variables,
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken ? `Bearer ${authToken}` : '',
        'X-Test-Mode': 'true',
        'X-Compliance-Region': 'CA',
        ...headers,
      },
    });

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate(
    mutation: string,
    variables?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<GraphQLResponse> {
    return this.query(mutation, variables, headers);
  }

  /**
   * Test GraphQL subscription via WebSocket
   */
  async testSubscription(
    subscription: string,
    variables?: Record<string, any>,
    options?: {
      timeout?: number;
      expectedEvents?: number;
      onEvent?: (event: GraphQLSubscriptionEvent) => void;
    }
  ): Promise<GraphQLSubscriptionEvent[]> {
    const {
      timeout = 30000,
      expectedEvents = 1,
      onEvent,
    } = options || {};

    const events: GraphQLSubscriptionEvent[] = [];

    // Set up WebSocket connection monitoring
    const wsPromise = new Promise<GraphQLSubscriptionEvent[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Subscription timeout after ${timeout}ms`));
      }, timeout);

      this.page.on('websocket', (ws) => {
        ws.on('framereceived', (payload) => {
          try {
            const event = JSON.parse(payload.toString());
            events.push(event);

            if (onEvent) {
              onEvent(event);
            }

            // Resolve when we have enough events
            if (events.length >= expectedEvents) {
              clearTimeout(timer);
              resolve(events);
            }
          } catch (error) {
            console.log('Failed to parse WebSocket frame:', error);
          }
        });

        ws.on('framesent', (payload) => {
          console.log('WebSocket frame sent:', payload.toString());
        });
      });
    });

    // Initialize subscription from the frontend
    await this.page.evaluate(
      ({ subscription, variables }) => {
        // This would trigger the subscription in the actual app
        window.dispatchEvent(new CustomEvent('test-subscription', {
          detail: { subscription, variables }
        }));
      },
      { subscription, variables }
    );

    return wsPromise;
  }

  /**
   * Validate GraphQL schema compliance
   */
  async validateSchema(): Promise<void> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type { ...TypeRef }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.query(introspectionQuery);
    expect(result.errors).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.__schema).toBeDefined();
  }

  /**
   * Test reorder flow specific queries
   */
  async getReorderSubscription(): Promise<any> {
    const query = `
      query GetReorderSubscription {
        getSubscription {
          id
          tier
          isActive
          billingAmountCad
          features
          currentPeriodEnd
        }
      }
    `;

    const result = await this.query(query);
    expect(result.errors).toBeUndefined();
    return result.data?.getSubscription;
  }

  async getConsumptionPredictions(childId?: string): Promise<any[]> {
    const query = `
      query GetConsumptionPredictions($childId: String) {
        getConsumptionPredictions(childId: $childId) {
          id
          childId
          confidenceLevel
          predictedRunoutDate
          recommendedReorderDate
          sizeChangeProbability
        }
      }
    `;

    const result = await this.query(query, { childId });
    expect(result.errors).toBeUndefined();
    return result.data?.getConsumptionPredictions || [];
  }

  async searchProducts(filters: {
    brand?: string;
    diaperSize?: string;
    minPriceCad?: number;
    maxPriceCad?: number;
    retailerType?: string;
  }): Promise<any> {
    const query = `
      query SearchProducts(
        $brand: String
        $diaperSize: String
        $minPriceCad: Decimal
        $maxPriceCad: Decimal
        $retailerType: RetailerTypeEnum
      ) {
        searchProducts(
          brand: $brand
          diaperSize: $diaperSize
          minPriceCad: $minPriceCad
          maxPriceCad: $maxPriceCad
          retailerType: $retailerType
        ) {
          success
          products {
            id
            brand
            productName
            diaperSize
            currentPriceCad
            finalPriceCad
            isAvailable
          }
          totalCount
          message
        }
      }
    `;

    const result = await this.query(query, filters);
    expect(result.errors).toBeUndefined();
    return result.data?.searchProducts;
  }

  async createSubscription(input: {
    tier: string;
    provinceCode: string;
  }): Promise<any> {
    const mutation = `
      mutation CreateSubscription($input: CreateSubscriptionInput!) {
        createSubscription(input: $input) {
          success
          subscription {
            id
            tier
            billingAmountCad
            gstRate
            pstHstRate
            totalTaxRate
          }
          message
          clientSecret
        }
      }
    `;

    const result = await this.mutate(mutation, { input });
    expect(result.errors).toBeUndefined();
    return result.data?.createSubscription;
  }

  async createReorderPreferences(input: {
    childId: string;
    autoReorderEnabled: boolean;
    reorderThresholdDays: number;
    maxOrderAmountCad: number;
    preferredRetailers: string[];
    preferredBrands: string[];
  }): Promise<any> {
    const mutation = `
      mutation CreateReorderPreferences($input: CreateReorderPreferencesInput!) {
        createReorderPreferences(input: $input) {
          success
          preferences {
            id
            childId
            autoReorderEnabled
            reorderThresholdDays
            maxOrderAmountCad
            preferredRetailers
            preferredBrands
          }
          message
        }
      }
    `;

    const result = await this.mutate(mutation, { input });
    expect(result.errors).toBeUndefined();
    return result.data?.createReorderPreferences;
  }

  /**
   * Test order tracking subscription
   */
  async subscribeToOrderUpdates(orderId: string): Promise<GraphQLSubscriptionEvent[]> {
    const subscription = `
      subscription OrderStatusUpdates($orderId: String!) {
        orderStatusUpdates(orderId: $orderId) {
          id
          status
          trackingNumber
          estimatedDeliveryDate
          actualDeliveryDate
          updatedAt
        }
      }
    `;

    return this.testSubscription(subscription, { orderId }, {
      expectedEvents: 1,
      timeout: 15000,
    });
  }

  /**
   * Test ML prediction updates subscription
   */
  async subscribeToPredictionUpdates(childId: string): Promise<GraphQLSubscriptionEvent[]> {
    const subscription = `
      subscription PredictionUpdates($childId: String!) {
        predictionUpdates(childId: $childId) {
          id
          childId
          confidenceLevel
          predictedRunoutDate
          recommendedReorderDate
          updatedAt
        }
      }
    `;

    return this.testSubscription(subscription, { childId }, {
      expectedEvents: 1,
      timeout: 10000,
    });
  }

  /**
   * Measure GraphQL query performance
   */
  async measureQueryPerformance(
    query: string,
    variables?: Record<string, any>,
    iterations = 5
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    times: number[];
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.query(query, variables);
      const endTime = Date.now();
      times.push(endTime - startTime);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      averageTime,
      minTime,
      maxTime,
      times,
    };
  }

  /**
   * Test GraphQL query complexity limits
   */
  async testQueryComplexity(): Promise<void> {
    // Test a complex nested query that should be allowed
    const allowedQuery = `
      query ComplexAllowedQuery {
        getSubscription {
          id
          tier
          activePreferences {
            id
            childId
            autoReorderEnabled
            preferredRetailers
            preferredBrands
          }
          recentOrders {
            id
            orderNumber
            status
            products
            totalAmountCad
          }
        }
      }
    `;

    const allowedResult = await this.query(allowedQuery);
    expect(allowedResult.errors).toBeUndefined();

    // Test a query that should exceed complexity limits
    const complexQuery = `
      query ExcessivelyComplexQuery {
        getSubscription {
          id
          activePreferences {
            id
            subscription {
              id
              activePreferences {
                id
                subscription {
                  id
                  activePreferences {
                    id
                    subscription {
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const complexResult = await this.query(complexQuery);
    expect(complexResult.errors).toBeDefined();
    expect(complexResult.errors?.[0]?.message).toContain('complexity');
  }

  /**
   * Test Canadian compliance in GraphQL responses
   */
  async validateCanadianCompliance(response: GraphQLResponse): Promise<void> {
    // Check for required Canadian compliance fields
    if (response.data?.getSubscription) {
      const subscription = response.data.getSubscription;

      // Validate Canadian tax fields are present
      expect(subscription.gstRate).toBeDefined();
      expect(subscription.pstHstRate).toBeDefined();
      expect(subscription.totalTaxRate).toBeDefined();

      // Validate billing amount is in CAD
      expect(subscription.billingAmountCad).toBeDefined();
      expect(typeof subscription.billingAmountCad).toBe('number');
    }

    // Check for PIPEDA compliance in data fields
    if (response.data?.getConsumptionPredictions) {
      const predictions = response.data.getConsumptionPredictions;
      predictions.forEach((prediction: any) => {
        // Ensure data retention information is available
        expect(prediction.createdAt).toBeDefined();

        // Validate ML processing consent indicators
        if (prediction.mlProcessingConsent !== undefined) {
          expect(typeof prediction.mlProcessingConsent).toBe('boolean');
        }
      });
    }
  }
}

/**
 * Common GraphQL queries for testing
 */
export const REORDER_QUERIES = {
  GET_SUBSCRIPTION: `
    query GetSubscription {
      getSubscription {
        id
        tier
        isActive
        billingAmountCad
        gstRate
        pstHstRate
        totalTaxRate
        features
        currentPeriodEnd
      }
    }
  `,

  GET_CONSUMPTION_PREDICTIONS: `
    query GetConsumptionPredictions($childId: String) {
      getConsumptionPredictions(childId: $childId) {
        id
        childId
        confidenceLevel
        predictedRunoutDate
        recommendedReorderDate
        sizeChangeProbability
        predictedNewSize
        currentConsumptionRate
        createdAt
      }
    }
  `,

  SEARCH_PRODUCTS: `
    query SearchProducts($filters: ProductSearchInput!) {
      searchProducts(filters: $filters) {
        success
        products {
          id
          brand
          productName
          diaperSize
          currentPriceCad
          pricePerDiaperCad
          isAvailable
          estimatedDeliveryDays
          retailerType
        }
        totalCount
        message
      }
    }
  `,

  GET_ORDER_HISTORY: `
    query GetOrderHistory($childId: String, $limit: Int) {
      getOrderHistory(childId: $childId, limit: $limit) {
        id
        orderNumber
        status
        totalAmountCad
        taxAmountCad
        estimatedDeliveryDate
        trackingNumber
        orderedAt
        deliveredAt
      }
    }
  `,

  GET_SUBSCRIPTION_DASHBOARD: `
    query GetSubscriptionDashboard {
      getSubscriptionDashboard {
        currentSubscription {
          id
          tier
          isActive
          billingAmountCad
          nextBillingDate
        }
        activePreferences {
          id
          childId
          autoReorderEnabled
          reorderThresholdDays
        }
        recentPredictions {
          id
          confidenceLevel
          predictedRunoutDate
        }
        recentOrders {
          id
          status
          totalAmountCad
          orderedAt
        }
        analytics {
          totalOrders
          totalAmountCad
          averageOrderValueCad
          successfulOrders
          failedOrders
        }
      }
    }
  `,
};

/**
 * Common GraphQL mutations for testing
 */
export const REORDER_MUTATIONS = {
  CREATE_SUBSCRIPTION: `
    mutation CreateSubscription($input: CreateSubscriptionInput!) {
      createSubscription(input: $input) {
        success
        subscription {
          id
          tier
          billingAmountCad
          gstRate
          pstHstRate
          totalTaxRate
        }
        message
        clientSecret
      }
    }
  `,

  CREATE_REORDER_PREFERENCES: `
    mutation CreateReorderPreferences($input: CreateReorderPreferencesInput!) {
      createReorderPreferences(input: $input) {
        success
        preferences {
          id
          childId
          autoReorderEnabled
          reorderThresholdDays
          maxOrderAmountCad
          preferredRetailers
          preferredBrands
        }
        message
      }
    }
  `,

  UPDATE_REORDER_PREFERENCES: `
    mutation UpdateReorderPreferences($id: String!, $input: UpdateReorderPreferencesInput!) {
      updateReorderPreferences(id: $id, input: $input) {
        success
        preferences {
          id
          autoReorderEnabled
          reorderThresholdDays
          maxOrderAmountCad
          preferredRetailers
          preferredBrands
          updatedAt
        }
        message
      }
    }
  `,

  CREATE_MANUAL_ORDER: `
    mutation CreateManualOrder($input: ManualOrderInput!) {
      createManualOrder(input: $input) {
        success
        order {
          id
          orderNumber
          status
          totalAmountCad
          estimatedDeliveryDate
        }
        message
      }
    }
  `,
};

/**
 * GraphQL subscriptions for real-time testing
 */
export const REORDER_SUBSCRIPTIONS = {
  ORDER_STATUS_UPDATES: `
    subscription OrderStatusUpdates($orderId: String!) {
      orderStatusUpdates(orderId: $orderId) {
        id
        status
        trackingNumber
        trackingUrl
        estimatedDeliveryDate
        actualDeliveryDate
        updatedAt
      }
    }
  `,

  PREDICTION_UPDATES: `
    subscription PredictionUpdates($childId: String!) {
      predictionUpdates(childId: $childId) {
        id
        childId
        confidenceLevel
        predictedRunoutDate
        recommendedReorderDate
        sizeChangeProbability
        updatedAt
      }
    }
  `,

  SUBSCRIPTION_UPDATES: `
    subscription SubscriptionUpdates($userId: String!) {
      subscriptionUpdates(userId: $userId) {
        id
        tier
        status
        billingAmountCad
        currentPeriodEnd
        updatedAt
      }
    }
  `,
};