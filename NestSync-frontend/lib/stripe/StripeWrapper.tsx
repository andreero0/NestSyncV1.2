/**
 * Stripe Wrapper - Platform-aware Stripe integration
 * For development purposes, we'll focus on native implementation
 * Web support can be added later with proper Metro configuration
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';

// Web fallback implementation
const WebStripeContext = createContext<any>(null);

const WebStripeProvider = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
  const webStripeValue = {
    initPaymentSheet: async () => {
      console.warn('PaymentSheet not available on web - use native app for payments');
      return { error: { message: 'Payments only available on mobile app. Please download the NestSync mobile app.' } };
    },
    presentPaymentSheet: async () => {
      console.warn('PaymentSheet not available on web - use native app for payments');
      return { error: { message: 'Payments only available on mobile app. Please download the NestSync mobile app.' } };
    },
  };

  return (
    <WebStripeContext.Provider value={webStripeValue}>
      {children}
    </WebStripeContext.Provider>
  );
};

const useWebStripe = () => {
  const context = useContext(WebStripeContext);
  if (!context) {
    throw new Error('useWebStripe must be used within WebStripeProvider');
  }
  return context;
};

// For web, always use web fallback
export const PlatformStripeProvider = WebStripeProvider;
export const usePlatformStripe = useWebStripe;

// Type definitions for consistency
export interface StripeError {
  code?: string;
  message?: string;
  localizedMessage?: string;
}

export interface PaymentSheetResult {
  error?: StripeError;
}

export interface PaymentSheetInitParams {
  merchantDisplayName: string;
  paymentIntentClientSecret: string;
  defaultBillingDetails?: any;
  appearance?: any;
  allowsDelayedPaymentMethods?: boolean;
  paymentMethodConfiguration?: any;
}