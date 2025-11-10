/**
 * SubscribedTrialBanner Usage Examples
 * 
 * This file demonstrates how to use the SubscribedTrialBanner component
 * in different scenarios.
 */

import React from 'react';
import { View } from 'react-native';
import { SubscribedTrialBanner } from './SubscribedTrialBanner';
import { CanadianProvince } from '../../types/subscription';

/**
 * Example 1: Standard Plan subscriber in Ontario with 7 days remaining
 */
export function Example1_StandardPlanOntario() {
  return (
    <View>
      <SubscribedTrialBanner
        daysRemaining={7}
        planName="Standard Plan"
        price={4.99}
        currency="CAD"
        province={CanadianProvince.ON}
        onManagePress={() => {
          console.log('Navigate to subscription management');
        }}
        onDismiss={() => {
          console.log('Banner dismissed');
        }}
      />
    </View>
  );
}

/**
 * Example 2: Premium Plan subscriber in Quebec with 3 days remaining
 */
export function Example2_PremiumPlanQuebec() {
  return (
    <View>
      <SubscribedTrialBanner
        daysRemaining={3}
        planName="Premium Plan"
        price={9.99}
        currency="CAD"
        province={CanadianProvince.QC}
        onManagePress={() => {
          console.log('Navigate to subscription management');
        }}
      />
    </View>
  );
}

/**
 * Example 3: Standard Plan subscriber in British Columbia with 1 day remaining
 */
export function Example3_StandardPlanBC_LastDay() {
  return (
    <View>
      <SubscribedTrialBanner
        daysRemaining={1}
        planName="Standard Plan"
        price={4.99}
        currency="CAD"
        province={CanadianProvince.BC}
        onManagePress={() => {
          console.log('Navigate to subscription management');
        }}
        onDismiss={() => {
          console.log('Banner dismissed');
        }}
      />
    </View>
  );
}

/**
 * Example 4: Integration with real subscription data
 */
export function Example4_RealDataIntegration() {
  // This would typically come from useMySubscription() and useTrialProgress() hooks
  const subscription = {
    plan: {
      displayName: 'Standard Plan',
      price: 4.99,
    },
    province: CanadianProvince.ON,
  };
  
  const trialProgress = {
    daysRemaining: 5,
  };

  return (
    <View>
      <SubscribedTrialBanner
        daysRemaining={trialProgress.daysRemaining}
        planName={subscription.plan.displayName}
        price={subscription.plan.price}
        currency="CAD"
        province={subscription.province}
        onManagePress={() => {
          // Navigate to subscription management screen
          console.log('Navigate to subscription management');
        }}
        onDismiss={() => {
          // Save dismissal state
          console.log('Save banner dismissal state');
        }}
      />
    </View>
  );
}

/**
 * Tax Calculation Examples
 * 
 * Ontario (HST 13%):
 * - $4.99 + $0.65 = $5.64 CAD/month
 * 
 * Quebec (GST 5% + QST 9.975%):
 * - $4.99 + $0.75 = $5.74 CAD/month
 * 
 * British Columbia (GST 5% + PST 7%):
 * - $4.99 + $0.60 = $5.59 CAD/month
 * 
 * Alberta (GST 5%):
 * - $4.99 + $0.25 = $5.24 CAD/month
 */
