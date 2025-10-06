/**
 * Stripe Payment Service
 * Production-ready integration with Stripe React Native SDK
 *
 * FEATURES:
 * - Setup Intent flow for saving payment methods without charging
 * - Payment Intent flow for immediate charges (trial conversion, etc.)
 * - 3D Secure (SCA) authentication support
 * - Platform-specific implementation (native vs web)
 * - Comprehensive error handling with user-friendly messages
 * - Canadian payment compliance (PIPEDA)
 *
 * BACKEND REQUIREMENTS:
 * - POST /api/stripe/setup-intent → { clientSecret: string }
 * - POST /api/stripe/payment-intent → { clientSecret: string, amount: number, currency: string }
 *
 * USAGE:
 * - Platform detection handled automatically
 * - Use confirmCardSetup for saving payment methods
 * - Use confirmPayment for immediate charges
 * - All methods return consistent error formats
 */

import { Platform } from 'react-native';
import { CanadianProvince } from '../../types/subscription';

// Platform-specific Stripe imports
let useConfirmSetupIntent: any = null;
let useConfirmPayment: any = null;
let useStripe: any = null;

if (Platform.OS !== 'web') {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    useConfirmSetupIntent = StripeModule.useConfirmSetupIntent;
    useConfirmPayment = StripeModule.useConfirmPayment;
    useStripe = StripeModule.useStripe;
  } catch (error) {
    console.warn('[Stripe] React Native SDK not available:', error);
  }
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface CardDetails {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
}

export interface BillingDetails {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  province: CanadianProvince;
  postalCode: string;
  country: 'CA';
}

export interface PaymentMethodResult {
  success: boolean;
  paymentMethodId?: string;
  error?: string;
  errorCode?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status?: string;
  error?: string;
  errorCode?: string;
}

export interface SetupIntentResult {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  error?: string;
}

export interface ThreeDSecureResult {
  success: boolean;
  error?: string;
}

// =============================================================================
// STRIPE SERVICE CLASS
// =============================================================================

class StripeService {
  private initialized: boolean = false;
  private publishableKey: string | null = null;
  private apiBaseUrl: string;

  constructor() {
    // Use environment variable or default to backend URL
    this.apiBaseUrl = __DEV__
      ? process.env.EXPO_PUBLIC_GRAPHQL_URL?.replace('/graphql', '') || 'http://localhost:8001'
      : 'https://nestsync-api.railway.app';
  }

  /**
   * Initialize Stripe service (optional - StripeProvider handles this)
   */
  async initialize(publishableKey?: string): Promise<boolean> {
    try {
      this.publishableKey = publishableKey || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;

      if (!this.publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }

      this.initialized = true;
      console.log('[Stripe] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[Stripe] Initialization failed:', error);
      this.initialized = false;
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // ===========================================================================
  // SETUP INTENT FLOW (Save payment method without charging)
  // ===========================================================================

  /**
   * Create a Setup Intent client secret from backend
   * Used when saving a payment method for future use
   *
   * @param accessToken - User's authentication token (required)
   */
  async createSetupIntent(accessToken: string): Promise<SetupIntentResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        clientSecret: data.clientSecret,
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to create setup intent:', error);
      return {
        success: false,
        error: this.getUserFriendlyError(error.message || 'Failed to prepare payment method setup'),
      };
    }
  }

  /**
   * Confirm card setup with Setup Intent
   * Returns payment method ID on success
   *
   * NOTE: This method MUST be called from a component that uses the
   * useConfirmSetupIntent hook. See payment-methods.tsx for example.
   */
  async confirmCardSetup(
    clientSecret: string,
    billingDetails: BillingDetails,
    confirmSetupIntentFn: any
  ): Promise<PaymentMethodResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'Payment setup is only available on mobile devices',
          errorCode: 'PLATFORM_NOT_SUPPORTED',
        };
      }

      if (!confirmSetupIntentFn) {
        throw new Error('confirmSetupIntent function not available');
      }

      // Confirm setup intent with card details
      const { setupIntent, error } = await confirmSetupIntentFn(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails,
        },
      });

      if (error) {
        return {
          success: false,
          error: this.getUserFriendlyError(error.message),
          errorCode: error.code,
        };
      }

      if (setupIntent?.status === 'Succeeded') {
        return {
          success: true,
          paymentMethodId: setupIntent.paymentMethodId,
        };
      }

      return {
        success: false,
        error: 'Payment method setup was not completed',
        errorCode: 'SETUP_INCOMPLETE',
      };
    } catch (error: any) {
      console.error('[Stripe] Card setup confirmation failed:', error);
      return {
        success: false,
        error: this.getUserFriendlyError(error.message || 'Failed to save payment method'),
        errorCode: 'SETUP_FAILED',
      };
    }
  }

  // ===========================================================================
  // PAYMENT INTENT FLOW (Immediate charges)
  // ===========================================================================

  /**
   * Create a Payment Intent client secret from backend
   * Used for immediate charges (e.g., trial→paid conversion)
   *
   * @param amount - Amount in dollars (will be converted to cents)
   * @param currency - Currency code (default: CAD)
   * @param accessToken - User's authentication token (required)
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'CAD',
    accessToken: string
  ): Promise<PaymentIntentResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/stripe/payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        clientSecret: data.clientSecret,
      };
    } catch (error: any) {
      console.error('[Stripe] Failed to create payment intent:', error);
      return {
        success: false,
        error: this.getUserFriendlyError(error.message || 'Failed to prepare payment'),
      };
    }
  }

  /**
   * Confirm payment with Payment Intent
   * Can use existing payment method or collect new card details
   *
   * NOTE: This method MUST be called from a component that uses the
   * useConfirmPayment hook. See payment flow screens for example.
   */
  async confirmPayment(
    clientSecret: string,
    confirmPaymentFn: any,
    paymentMethodId?: string,
    billingDetails?: BillingDetails
  ): Promise<PaymentResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: 'Payment processing is only available on mobile devices',
          errorCode: 'PLATFORM_NOT_SUPPORTED',
        };
      }

      if (!confirmPaymentFn) {
        throw new Error('confirmPayment function not available');
      }

      // Build payment method data
      const paymentMethodData: any = {
        paymentMethodType: 'Card',
      };

      if (paymentMethodId) {
        paymentMethodData.paymentMethodData = {
          paymentMethodId,
        };
      } else if (billingDetails) {
        paymentMethodData.paymentMethodData = {
          billingDetails,
        };
      }

      // Confirm payment intent
      const { paymentIntent, error } = await confirmPaymentFn(clientSecret, paymentMethodData);

      if (error) {
        return {
          success: false,
          error: this.getUserFriendlyError(error.message),
          errorCode: error.code,
        };
      }

      if (paymentIntent?.status === 'Succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        };
      }

      return {
        success: false,
        error: 'Payment was not completed',
        errorCode: 'PAYMENT_INCOMPLETE',
        status: paymentIntent?.status,
      };
    } catch (error: any) {
      console.error('[Stripe] Payment confirmation failed:', error);
      return {
        success: false,
        error: this.getUserFriendlyError(error.message || 'Failed to process payment'),
        errorCode: 'PAYMENT_FAILED',
      };
    }
  }

  // ===========================================================================
  // 3D SECURE AUTHENTICATION
  // ===========================================================================

  /**
   * Handle 3D Secure authentication
   * Stripe SDK handles this automatically during confirm flows
   * This method is provided for completeness and custom flows
   */
  async handle3DSecure(clientSecret: string, handleNextActionFn: any): Promise<ThreeDSecureResult> {
    try {
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: '3D Secure authentication is only available on mobile devices',
        };
      }

      if (!handleNextActionFn) {
        throw new Error('handleNextAction function not available');
      }

      const { paymentIntent, error } = await handleNextActionFn(clientSecret);

      if (error) {
        return {
          success: false,
          error: this.getUserFriendlyError(error.message),
        };
      }

      return {
        success: paymentIntent?.status === 'Succeeded',
        error: paymentIntent?.status !== 'Succeeded'
          ? 'Authentication was not completed'
          : undefined,
      };
    } catch (error: any) {
      console.error('[Stripe] 3D Secure authentication failed:', error);
      return {
        success: false,
        error: this.getUserFriendlyError(error.message || '3D Secure authentication failed'),
      };
    }
  }

  // ===========================================================================
  // VALIDATION UTILITIES
  // ===========================================================================

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  /**
   * Validate Canadian postal code format
   */
  validateCanadianPostalCode(postalCode: string): boolean {
    const pattern = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return pattern.test(postalCode);
  }

  /**
   * Detect card brand from card number
   */
  getCardBrand(cardNumber: string): 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'UNKNOWN' {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    if (/^4/.test(cleaned)) return 'VISA';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'MASTERCARD';
    if (/^3[47]/.test(cleaned)) return 'AMEX';
    if (/^6(?:011|5)/.test(cleaned)) return 'DISCOVER';
    return 'UNKNOWN';
  }

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  /**
   * Convert Stripe error codes to user-friendly messages
   */
  private getUserFriendlyError(errorMessage: string): string {
    const errorMap: { [key: string]: string } = {
      // Card errors
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'expired_card': 'Your card has expired. Please use a different card.',
      'incorrect_cvc': 'The security code (CVC) is incorrect. Please check and try again.',
      'insufficient_funds': 'Your card has insufficient funds. Please try a different card.',
      'invalid_card_number': 'The card number is invalid. Please check and try again.',
      'invalid_expiry_year': 'The expiration year is invalid. Please check and try again.',
      'invalid_expiry_month': 'The expiration month is invalid. Please check and try again.',

      // Processing errors
      'processing_error': 'An error occurred while processing your card. Please try again.',
      'rate_limit': 'Too many requests. Please wait a moment and try again.',

      // Authentication errors
      'authentication_required': 'Additional authentication is required. Please follow the prompts.',
      'payment_intent_authentication_failure': 'Authentication failed. Please try again.',

      // Network errors
      'network_error': 'Network connection failed. Please check your connection and try again.',
      'timeout': 'The request timed out. Please try again.',
    };

    // Check if error message contains known error codes
    for (const [code, message] of Object.entries(errorMap)) {
      if (errorMessage.toLowerCase().includes(code.toLowerCase())) {
        return message;
      }
    }

    // Generic user-friendly message
    if (errorMessage.toLowerCase().includes('network')) {
      return 'Network connection issue. Please check your internet and try again.';
    }

    if (errorMessage.toLowerCase().includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    // Return sanitized error message
    return errorMessage || 'An unexpected error occurred. Please try again.';
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const stripeService = new StripeService();
export default StripeService;

// =============================================================================
// STRIPE REACT NATIVE HOOKS (Re-export for convenience)
// =============================================================================

export { useConfirmSetupIntent, useConfirmPayment, useStripe };
