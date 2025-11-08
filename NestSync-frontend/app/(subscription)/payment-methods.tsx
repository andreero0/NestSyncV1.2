/**
 * Payment Methods Management Screen
 * Add, remove, and manage payment methods with Stripe integration
 *
 * Features:
 * - List saved payment methods
 * - Add new payment method using CardField
 * - Set default payment method
 * - Remove payment methods
 * - PIPEDA compliant payment data handling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Platform-specific Stripe imports
let CardField: any = null;
let useConfirmSetupIntent: any = null;
let loadStripe: any = null;
let Elements: any = null;
let CardElement: any = null;
let useStripe: any = null;
let useElements: any = null;

if (Platform.OS !== 'web') {
  try {
    const StripeModule = require('@stripe/stripe-react-native');
    CardField = StripeModule.CardField;
    useConfirmSetupIntent = StripeModule.useConfirmSetupIntent;
  } catch (error) {
    console.warn('Stripe React Native not available:', error);
  }
} else {
  try {
    const StripeJS = require('@stripe/stripe-js');
    const StripeReact = require('@stripe/react-stripe-js');
    loadStripe = StripeJS.loadStripe;
    Elements = StripeReact.Elements;
    CardElement = StripeReact.CardElement;
    useStripe = StripeReact.useStripe;
    useElements = StripeReact.useElements;
  } catch (error) {
    console.warn('Stripe.js not available:', error);
  }
}

import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import {
  useMyPaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from '@/lib/hooks/useSubscription';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { stripeService } from '@/lib/services/stripeService';
import { useAccessToken } from '@/hooks/useUniversalStorage';

// Initialize Stripe for web platform
const stripePromise = Platform.OS === 'web' && loadStripe
  ? loadStripe(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  : null;

// Web Card Input Component
function WebCardInputForm({
  onCardChange,
  onCardholderNameChange,
  cardholderName,
  theme,
  colors,
  onSubmit,
  isSubmitting,
  cardComplete,
}: any) {
  const stripe = useStripe ? useStripe() : null;
  const elements = useElements ? useElements() : null;

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(stripe, elements);
    }
  };

  return (
    <View>
      <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
        {CardElement && (
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: colors.text,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                  '::placeholder': {
                    color: colors.textSecondary,
                  },
                },
                invalid: {
                  color: colors.error || '#EF4444',
                },
              },
            }}
            onChange={(event) => {
              onCardChange(event.complete, event.error);
            }}
          />
        )}
      </View>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Cardholder Name"
        placeholderTextColor={colors.textSecondary}
        value={cardholderName}
        onChangeText={onCardholderNameChange}
        autoCapitalize="words"
        autoCorrect={false}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!cardComplete || !cardholderName.trim() || isSubmitting}
        style={({ pressed }) => [
          styles.submitButton,
          {
            backgroundColor: colors.tint,
            opacity: pressed
              ? 0.8
              : !cardComplete || !cardholderName.trim() || isSubmitting
              ? 0.5
              : 1,
          },
        ]}
        accessibilityLabel="Add payment method"
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Add Card</Text>
        )}
      </Pressable>
    </View>
  );
}

export default function PaymentMethodsScreen() {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const { paymentMethods, loading: methodsLoading, refetch: refetchMethods } = useMyPaymentMethods();
  const { addPaymentMethod, loading: addingMethod } = useAddPaymentMethod();
  const { removePaymentMethod, loading: removingMethod } = useRemovePaymentMethod();
  const { setDefaultPaymentMethod, loading: settingDefault } = useSetDefaultPaymentMethod();

  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  // Get authentication token for backend API calls
  const [accessToken] = useAccessToken();

  // Stripe hooks (only on native platforms)
  const confirmSetupIntent = Platform.OS !== 'web' && useConfirmSetupIntent ? useConfirmSetupIntent() : null;

  const handleAddPaymentMethod = async (stripe?: any, elements?: any) => {
    // Validation
    if (!cardComplete || !cardholderName.trim()) {
      Alert.alert('Incomplete', 'Please fill in all card details and cardholder name.');
      return;
    }

    // Check for authentication token
    if (!accessToken) {
      Alert.alert(
        'Authentication Required',
        'Please log in to add payment methods.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    try {
      // Step 1: Create setup intent from backend
      const setupIntentResult = await stripeService.createSetupIntent(accessToken);

      if (!setupIntentResult.success || !setupIntentResult.clientSecret) {
        Alert.alert('Error', setupIntentResult.error || 'Failed to prepare payment method setup');
        return;
      }

      const billingDetails = {
        name: cardholderName.trim(),
      };

      let paymentMethodId: string;

      // Step 2: Platform-specific card confirmation
      if (Platform.OS === 'web') {
        // Web platform - use Stripe.js
        if (!stripe || !elements) {
          Alert.alert('Error', 'Stripe not initialized. Please refresh the page.');
          return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          Alert.alert('Error', 'Card element not found. Please try again.');
          return;
        }

        const { setupIntent, error } = await stripe.confirmCardSetup(
          setupIntentResult.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: billingDetails,
            },
          }
        );

        if (error) {
          Alert.alert('Error', error.message || 'Failed to save payment method');
          return;
        }

        if (!setupIntent?.payment_method) {
          Alert.alert('Error', 'No payment method returned from Stripe');
          return;
        }

        paymentMethodId = setupIntent.payment_method;
      } else {
        // Native platforms - use Stripe React Native
        if (!confirmSetupIntent?.confirmSetupIntent) {
          Alert.alert('Error', 'Stripe setup not initialized. Please try again.');
          return;
        }

        const confirmResult = await stripeService.confirmCardSetup(
          setupIntentResult.clientSecret,
          billingDetails,
          confirmSetupIntent.confirmSetupIntent
        );

        if (!confirmResult.success || !confirmResult.paymentMethodId) {
          Alert.alert('Error', confirmResult.error || 'Failed to save payment method');
          return;
        }

        paymentMethodId = confirmResult.paymentMethodId;
      }

      // Step 3: Save payment method to backend via GraphQL
      const result = await addPaymentMethod({
        paymentMethodId,
        paymentMethodType: 'Card',
        isDefault: paymentMethods?.length === 0, // Make first card default
      });

      if (result.success) {
        Alert.alert(
          'Payment Method Added',
          'Your payment method has been added successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddCard(false);
                setCardholderName('');
                setCardComplete(false);
                setCardError(null);
                refetchMethods();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to save payment method to your account');
      }
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      Alert.alert('Error', error.message || 'Failed to add payment method. Please try again.');
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removePaymentMethod(paymentMethodId);
              if (result.success) {
                refetchMethods();
              }
            } catch (error) {
              console.error('Failed to remove payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const result = await setDefaultPaymentMethod(paymentMethodId);
      if (result.success) {
        refetchMethods();
      }
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', 'Failed to set default payment method. Please try again.');
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandIcons: { [key: string]: string } = {
      visa: 'creditcard.fill',
      mastercard: 'creditcard.fill',
      amex: 'creditcard.fill',
      discover: 'creditcard.fill',
    };
    return brandIcons[brand.toLowerCase()] || 'creditcard';
  };

  if (methodsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading payment methods...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Payment Methods
          </Text>
        </View>

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: colors.surface }]}>
          <IconSymbol name="lock.shield.fill" size={24} color={colors.tint} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and securely stored.
            We never store your full card number.
          </Text>
        </View>

        {/* Saved Payment Methods */}
        {paymentMethods && paymentMethods.length > 0 && (
          <View style={styles.methodsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Saved Cards
            </Text>

            {paymentMethods.map((method) => (
              <View
                key={method.id}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: method.isDefault ? colors.tint + '10' : colors.surface,
                    borderColor: method.isDefault ? colors.tint : colors.border,
                    borderWidth: method.isDefault ? 2 : 1,
                  },
                ]}
              >
                {method.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: colors.tint }]}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}

                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
                    <IconSymbol
                      name={getCardBrandIcon(method.cardBrand || 'unknown')}
                      size={32}
                      color={colors.tint}
                    />
                    <View style={styles.cardDetails}>
                      <Text style={[styles.cardBrand, { color: colors.text }]}>
                        {method.cardBrand?.toUpperCase() || 'CARD'}
                      </Text>
                      <Text style={[styles.cardNumber, { color: colors.textSecondary }]}>
                        •••• {method.cardLast4}
                      </Text>
                      <Text style={[styles.cardExpiry, { color: colors.textSecondary }]}>
                        Expires {method.cardExpMonth}/{method.cardExpYear}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.methodActions}>
                    {!method.isDefault && (
                      <Pressable
                        onPress={() => handleSetDefault(method.id)}
                        disabled={settingDefault}
                        style={({ pressed }) => [
                          styles.actionButton,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.tint,
                            borderWidth: 1,
                            opacity: pressed ? 0.8 : settingDefault ? 0.6 : 1,
                          },
                        ]}
                        accessibilityLabel="Set as default payment method"
                        accessibilityRole="button"
                      >
                        <Text style={[styles.actionButtonText, { color: colors.tint }]}>
                          Set Default
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={() => handleRemovePaymentMethod(method.id)}
                      disabled={removingMethod}
                      style={({ pressed }) => [
                        styles.removeButton,
                        { opacity: pressed ? 0.8 : removingMethod ? 0.6 : 1 },
                      ]}
                      accessibilityLabel="Remove payment method"
                      accessibilityRole="button"
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add Card Section - Universal (Web + Native) */}
        <View style={styles.addCardSection}>
          {!showAddCard ? (
            <Pressable
              onPress={() => setShowAddCard(true)}
              style={({ pressed }) => [
                styles.addCardButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.tint,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityLabel="Add new payment method"
              accessibilityRole="button"
            >
              <IconSymbol name="plus.circle.fill" size={32} color={colors.tint} />
              <Text style={[styles.addCardText, { color: colors.tint }]}>
                Add Payment Method
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.addCardForm, { backgroundColor: colors.surface }]}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  Add New Card
                </Text>
                <Pressable
                  onPress={() => {
                    setShowAddCard(false);
                    setCardholderName('');
                    setCardComplete(false);
                    setCardError(null);
                  }}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>

              {Platform.OS === 'web' ? (
                // Web platform - Stripe Elements
                Elements && stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <WebCardInputForm
                      onCardChange={(complete: boolean, error: any) => {
                        setCardComplete(complete);
                        setCardError(error?.message || null);
                      }}
                      onCardholderNameChange={setCardholderName}
                      cardholderName={cardholderName}
                      theme={theme}
                      colors={colors}
                      onSubmit={handleAddPaymentMethod}
                      isSubmitting={addingMethod}
                      cardComplete={cardComplete}
                    />
                  </Elements>
                ) : (
                  <View style={styles.webFallback}>
                    <Text style={[styles.webFallbackText, { color: colors.textSecondary }]}>
                      Stripe is not available. Please check your configuration.
                    </Text>
                  </View>
                )
              ) : (
                // Native platforms - CardField
                CardField ? (
                  <>
                    <CardField
                      postalCodeEnabled={true}
                      placeholders={{
                        number: '4242 4242 4242 4242',
                      }}
                      cardStyle={{
                        backgroundColor: colors.background,
                        textColor: colors.text,
                        placeholderColor: colors.textSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                      }}
                      style={styles.cardField}
                      onCardChange={(cardDetails) => {
                        setCardComplete(cardDetails.complete);
                      }}
                    />

                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Cardholder Name"
                      placeholderTextColor={colors.textSecondary}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />

                    <Pressable
                      onPress={() => handleAddPaymentMethod()}
                      disabled={!cardComplete || !cardholderName.trim() || addingMethod}
                      style={({ pressed }) => [
                        styles.submitButton,
                        {
                          backgroundColor: colors.tint,
                          opacity: pressed
                            ? 0.8
                            : !cardComplete || !cardholderName.trim() || addingMethod
                            ? 0.5
                            : 1,
                        },
                      ]}
                      accessibilityLabel="Add payment method"
                      accessibilityRole="button"
                    >
                      {addingMethod ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitButtonText}>Add Card</Text>
                      )}
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.webFallback}>
                    <Text style={[styles.webFallbackText, { color: colors.textSecondary }]}>
                      Stripe React Native is not available. Please check your configuration.
                    </Text>
                  </View>
                )
              )}
            </View>
          )}
        </View>

        {/* Empty State */}
        {(!paymentMethods || paymentMethods.length === 0) && !showAddCard && (
          <View style={styles.emptyState}>
            <IconSymbol name="creditcard" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Payment Methods
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add a payment method to subscribe to premium features
            </Text>
          </View>
        )}

        {/* PIPEDA Notice */}
        <View style={[styles.pipedaNotice, { backgroundColor: colors.surface }]}>
          <IconSymbol name="shield.checkmark.fill" size={20} color={colors.tint} />
          <Text style={[styles.pipedaText, { color: colors.textSecondary }]}>
            Payment data is processed securely under PIPEDA regulations.
            All transactions are encrypted and stored in Canada.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  methodsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  methodCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
  },
  defaultBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  cardExpiry: {
    fontSize: 13,
    marginTop: 2,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  addCardSection: {
    marginBottom: 24,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 12,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addCardForm: {
    padding: 20,
    borderRadius: 12,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webFallback: {
    padding: 24,
    alignItems: 'center',
  },
  webFallbackText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  platformNoticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  pipedaNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pipedaText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
