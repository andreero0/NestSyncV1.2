# Stripe Payment Testing Guide

This guide provides comprehensive testing scenarios for the NestSync Stripe integration using Stripe test cards.

## Prerequisites

1. **Backend Setup**: Ensure backend endpoints are implemented:
   - `POST /api/stripe/setup-intent`
   - `POST /api/stripe/payment-intent`

2. **Environment Configuration**:
   ```bash
   # .env.local
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51H...
   ```

3. **StripeProvider Configuration**: Verify in `app/_layout.tsx`:
   ```tsx
   <StripeProvider
     publishableKey={stripePublishableKey}
     merchantIdentifier="merchant.com.nestsync"
     urlScheme="nestsync"
   >
   ```

## Test Card Numbers

### 1. Success Card (No Authentication)
**Card Number**: `4242 4242 4242 4242`
**Expiry**: Any future date (e.g., 12/25)
**CVC**: Any 3 digits (e.g., 123)
**ZIP/Postal Code**: Any valid code

**Expected Behavior**:
- Setup intent succeeds immediately
- Payment method saved successfully
- No 3D Secure challenge

**Test Scenarios**:
- [x] Add new payment method
- [x] Save as default payment method
- [x] Immediate charge (subscription payment)

---

### 2. 3D Secure Card (Authentication Required)
**Card Number**: `4000 0027 6000 3184`
**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP/Postal Code**: Any valid code

**Expected Behavior**:
- Triggers 3D Secure authentication flow
- Shows authentication modal/browser
- Completes after successful authentication
- Frontend handles redirect seamlessly

**Test Scenarios**:
- [x] Setup intent with 3D Secure
- [x] Payment intent with 3D Secure
- [x] Authentication success → payment method saved
- [x] Authentication cancel → graceful error handling

---

### 3. Decline Card (Generic Decline)
**Card Number**: `4000 0000 0000 0002`
**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP/Postal Code**: Any valid code

**Expected Behavior**:
- Card declined error
- User-friendly error message: "Your card was declined. Please try a different payment method."
- No charge processed
- Error logged for debugging

**Test Scenarios**:
- [x] Setup intent decline
- [x] Payment intent decline
- [x] Error message clarity
- [x] Retry functionality

---

### 4. Insufficient Funds Card
**Card Number**: `4000 0000 0000 9995`
**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP/Postal Code**: Any valid code

**Expected Error**:
- Error Code: `insufficient_funds`
- User Message: "Your card has insufficient funds. Please try a different card."

---

### 5. Expired Card
**Card Number**: `4000 0000 0000 0069`
**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP/Postal Code**: Any valid code

**Expected Error**:
- Error Code: `expired_card`
- User Message: "Your card has expired. Please use a different card."

---

### 6. Incorrect CVC
**Card Number**: `4000 0000 0000 0127`
**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP/Postal Code**: Any valid code

**Expected Error**:
- Error Code: `incorrect_cvc`
- User Message: "The security code (CVC) is incorrect. Please check and try again."

---

## Testing Workflows

### Workflow 1: Save Payment Method (Setup Intent)

**Steps**:
1. Navigate to Payment Methods screen (`/payment-methods`)
2. Click "Add Payment Method"
3. Enter card details using CardField
4. Enter cardholder name
5. Submit form

**Expected Flow**:
```
1. Frontend: stripeService.createSetupIntent()
   → Backend: POST /api/stripe/setup-intent
   → Returns: { clientSecret: "seti_123..." }

2. Frontend: stripeService.confirmCardSetup(clientSecret, billingDetails, confirmSetupIntentFn)
   → Stripe SDK: confirmSetupIntent()
   → 3D Secure auth if required
   → Returns: { setupIntent: { paymentMethodId: "pm_123..." } }

3. Frontend: GraphQL mutation addPaymentMethod(paymentMethodId)
   → Backend: Store payment method in database
   → Returns: { success: true, paymentMethod: {...} }

4. UI: Show success alert, refresh payment methods list
```

**Success Criteria**:
- Payment method appears in saved cards list
- Card last 4 digits displayed correctly
- Card brand icon shown (Visa, Mastercard, etc.)
- Set as default if first card

---

### Workflow 2: Immediate Payment (Payment Intent)

**Steps**:
1. Navigate to subscription upgrade flow
2. Select subscription plan
3. Choose saved payment method OR enter new card
4. Confirm payment

**Expected Flow**:
```
1. Frontend: stripeService.createPaymentIntent(amount, 'CAD')
   → Backend: POST /api/stripe/payment-intent
   → Backend: Calculate Canadian taxes
   → Returns: { clientSecret: "pi_123...", amount: 3449 } // $29.99 + $4.50 HST

2. Frontend: stripeService.confirmPayment(clientSecret, confirmPaymentFn, paymentMethodId)
   → Stripe SDK: confirmPayment()
   → 3D Secure auth if required
   → Returns: { paymentIntent: { id: "pi_123...", status: "Succeeded" } }

3. Frontend: GraphQL mutation subscribe(paymentIntentId)
   → Backend: Activate subscription
   → Returns: { success: true, subscription: {...} }

4. UI: Show success, navigate to subscription dashboard
```

**Success Criteria**:
- Payment processed successfully
- Subscription activated
- Canadian taxes calculated correctly
- Receipt/invoice generated

---

## Error Handling Test Cases

### Test Case 1: Network Timeout
**Scenario**: Backend endpoint unreachable

**Steps**:
1. Stop backend server
2. Attempt to add payment method
3. Observe error handling

**Expected**:
- Error: "Network connection issue. Please check your internet and try again."
- No crash
- Graceful retry option

---

### Test Case 2: Invalid Client Secret
**Scenario**: Backend returns malformed response

**Steps**:
1. Mock backend to return `{ clientSecret: null }`
2. Attempt payment
3. Observe error

**Expected**:
- Error: "Failed to prepare payment method setup"
- Logged for debugging
- User-friendly message

---

### Test Case 3: 3D Secure Cancellation
**Scenario**: User cancels 3D Secure authentication

**Steps**:
1. Use 3D Secure test card (`4000 0027 6000 3184`)
2. Start setup/payment flow
3. Cancel authentication modal
4. Observe behavior

**Expected**:
- Error: "Authentication was not completed"
- Payment method NOT saved
- User returned to form
- Can retry with different card

---

## Platform-Specific Testing

### iOS Testing
**Requirements**:
- Physical device or simulator
- Apple Pay merchant identifier configured
- 3D Secure redirects work via SFSafariViewController

**Test Checklist**:
- [x] CardField renders correctly
- [x] Keyboard dismissal works
- [x] 3D Secure authentication modal appears
- [x] Camera autofill works (iOS 17+)
- [x] Face ID/Touch ID for payment confirmation (if enabled)

---

### Android Testing
**Requirements**:
- Physical device or emulator
- Google Pay configured (optional)
- 3D Secure redirects work via Chrome Custom Tabs

**Test Checklist**:
- [x] CardField renders correctly
- [x] Keyboard dismissal works
- [x] 3D Secure authentication browser appears
- [x] Autofill works with saved cards
- [x] Back button handling during authentication

---

### Web Testing (Fallback)
**Expected Behavior**:
- Payment method management disabled
- Shows platform notice: "Payment method management is only available on iOS and Android devices."
- No crashes when accessing `/payment-methods`

---

## Canadian Tax Testing

Test tax calculations for all provinces:

| Province | Base Amount | Tax Rate | Tax Amount | Total |
|----------|-------------|----------|------------|-------|
| ON (HST) | $29.99 | 13% | $3.90 | $33.89 |
| QC (GST+QST) | $29.99 | 14.975% | $4.49 | $34.48 |
| BC (GST+PST) | $29.99 | 12% | $3.60 | $33.59 |
| AB (GST) | $29.99 | 5% | $1.50 | $31.49 |

**Verify**:
- Correct tax calculated by province
- Tax breakdown shown in UI
- Payment intent includes tax in metadata

---

## Performance Testing

### Metrics to Monitor
1. **Setup Intent Creation**: < 500ms
2. **Payment Intent Creation**: < 500ms
3. **Card Confirmation**: < 2s (without 3D Secure)
4. **3D Secure Flow**: < 10s (user dependent)

**Tools**:
```typescript
// Add performance logging
const startTime = Date.now();
const result = await stripeService.createSetupIntent();
console.log(`Setup intent created in ${Date.now() - startTime}ms`);
```

---

## Security Testing

### Test Case: Validate Input Sanitization
```typescript
// Test card number validation
stripeService.validateCardNumber('4242 4242 4242 4242'); // true
stripeService.validateCardNumber('1234 5678 9012 3456'); // false (Luhn check)

// Test postal code validation
stripeService.validateCanadianPostalCode('K1A 0B1'); // true
stripeService.validateCanadianPostalCode('12345'); // false
```

### Test Case: Prevent Duplicate Submissions
- [x] Disable submit button during processing
- [x] Show loading indicator
- [x] Prevent multiple API calls
- [x] Handle race conditions

---

## Debugging Tools

### Enable Stripe Debug Logs
```typescript
// In development, add to stripeService.ts
if (__DEV__) {
  console.log('[Stripe Debug] Setup intent response:', setupIntent);
  console.log('[Stripe Debug] Payment method:', paymentMethod);
}
```

### Monitor Network Requests
```bash
# In Chrome DevTools (web)
Network tab → Filter: /api/stripe

# In React Native Debugger
Network Inspect → Filter: stripe
```

### Check Stripe Dashboard
1. Go to https://dashboard.stripe.com/test/payments
2. View payment intents
3. Check setup intents
4. Verify customer records

---

## Integration Test Checklist

### Setup Intent Flow
- [x] Create setup intent from backend
- [x] Receive client secret
- [x] Confirm with card details
- [x] Handle 3D Secure
- [x] Receive payment method ID
- [x] Save to database via GraphQL
- [x] Display in UI

### Payment Intent Flow
- [x] Create payment intent with amount
- [x] Include Canadian taxes
- [x] Confirm with saved payment method
- [x] Handle 3D Secure
- [x] Receive payment intent ID
- [x] Update subscription via GraphQL
- [x] Show success confirmation

### Error Scenarios
- [x] Card declined
- [x] Insufficient funds
- [x] Expired card
- [x] Network timeout
- [x] Invalid client secret
- [x] 3D Secure cancellation
- [x] Backend error (500)

---

## Automated Testing (Future)

### Jest Unit Tests
```typescript
describe('StripeService', () => {
  it('should validate card numbers correctly', () => {
    expect(stripeService.validateCardNumber('4242424242424242')).toBe(true);
    expect(stripeService.validateCardNumber('1234567890123456')).toBe(false);
  });

  it('should detect card brands', () => {
    expect(stripeService.getCardBrand('4242424242424242')).toBe('VISA');
    expect(stripeService.getCardBrand('5555555555554444')).toBe('MASTERCARD');
  });
});
```

### E2E Tests (Playwright)
```typescript
test('Add payment method flow', async ({ page }) => {
  await page.goto('/payment-methods');
  await page.click('text=Add Payment Method');

  // Fill card details
  await page.fill('[data-testid="card-number"]', '4242424242424242');
  await page.fill('[data-testid="expiry"]', '12/25');
  await page.fill('[data-testid="cvc"]', '123');

  await page.click('text=Add Card');

  // Verify success
  await expect(page.locator('text=•••• 4242')).toBeVisible();
});
```

---

## Troubleshooting

### Issue: "Stripe React Native not available"
**Solution**: Ensure `@stripe/stripe-react-native` is installed:
```bash
npm install @stripe/stripe-react-native --legacy-peer-deps
cd ios && pod install
```

### Issue: 3D Secure not working
**Solution**: Verify `urlScheme` in StripeProvider:
```tsx
<StripeProvider urlScheme="nestsync" />
```

### Issue: Payment method not saving
**Solution**: Check GraphQL mutation response:
```graphql
mutation {
  addPaymentMethod(input: { paymentMethodId: "pm_123" }) {
    success
    message
    errors
  }
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Replace test publishable key with live key
- [ ] Update backend to use live Stripe secret key
- [ ] Test with real cards (small amounts)
- [ ] Verify Canadian tax calculations
- [ ] Enable Stripe webhooks
- [ ] Set up payment failure notifications
- [ ] Add comprehensive error logging
- [ ] PIPEDA compliance audit
- [ ] Test on multiple devices/platforms

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs/payments/accept-a-payment
- **Stripe React Native**: https://github.com/stripe/stripe-react-native
- **NestSync Stripe Service**: `/lib/services/stripeService.ts`
- **Backend Endpoints**: `/docs/STRIPE_BACKEND_ENDPOINTS.md`
