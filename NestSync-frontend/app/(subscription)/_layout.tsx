/**
 * Subscription Screens Layout
 * Stack navigator for all premium subscription screens
 */

import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Custom headers in each screen for design consistency
        animation: 'slide_from_right', // Smooth transitions
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="trial-activation"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="subscription-management"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="billing-history"
        options={{
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
