# Stripe Backend Endpoint Requirements

This document outlines the backend REST endpoints required for the Stripe React Native integration in NestSync.

## Overview

The frontend Stripe service (`lib/services/stripeService.ts`) requires two REST endpoints to create Stripe intents. These endpoints should be implemented in the NestSync backend at `/api/stripe/*`.

## Authentication

All endpoints require authentication. Include the user's access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Create Setup Intent

**Purpose**: Create a Stripe Setup Intent for saving payment methods without charging.

**Endpoint**: `POST /api/stripe/setup-intent`

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**: None (or empty object)

**Success Response** (200 OK):
```json
{
  "clientSecret": "seti_1ABC123_secret_DEF456",
  "setupIntentId": "seti_1ABC123"
}
```

**Error Response** (400/500):
```json
{
  "error": "Human-readable error message",
  "code": "SETUP_INTENT_CREATION_FAILED"
}
```

**Backend Implementation Notes**:
```python
# FastAPI example
from stripe import SetupIntent
import stripe

@app.post("/api/stripe/setup-intent")
async def create_setup_intent(
    current_user: User = Depends(get_current_user)
):
    try:
        # Get or create Stripe customer for user
        customer_id = await get_or_create_stripe_customer(current_user)

        # Create setup intent
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=["card"],
            usage="off_session",  # For future charges
            metadata={
                "user_id": str(current_user.id),
                "nestsync_customer": "true"
            }
        )

        return {
            "clientSecret": setup_intent.client_secret,
            "setupIntentId": setup_intent.id
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

### 2. Create Payment Intent

**Purpose**: Create a Stripe Payment Intent for immediate charges (e.g., trial conversion, subscription payment).

**Endpoint**: `POST /api/stripe/payment-intent`

**Request Headers**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**:
```json
{
  "amount": 2999,
  "currency": "CAD",
  "paymentMethodId": "pm_1ABC123",
  "metadata": {
    "subscriptionPlanId": "plan_premium",
    "description": "Premium Subscription - Monthly"
  }
}
```

**Field Descriptions**:
- `amount` (integer, required): Amount in cents (2999 = $29.99 CAD)
- `currency` (string, required): ISO currency code, typically "CAD" for NestSync
- `paymentMethodId` (string, optional): Existing payment method ID. If not provided, requires card collection on frontend
- `metadata` (object, optional): Additional context for the payment

**Success Response** (200 OK):
```json
{
  "clientSecret": "pi_1ABC123_secret_DEF456",
  "paymentIntentId": "pi_1ABC123",
  "amount": 2999,
  "currency": "CAD"
}
```

**Error Response** (400/500):
```json
{
  "error": "Human-readable error message",
  "code": "PAYMENT_INTENT_CREATION_FAILED"
}
```

**Backend Implementation Notes**:
```python
# FastAPI example
from stripe import PaymentIntent
import stripe

@app.post("/api/stripe/payment-intent")
async def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        # Get or create Stripe customer for user
        customer_id = await get_or_create_stripe_customer(current_user)

        # Calculate Canadian taxes
        tax_amount = await calculate_canadian_tax(
            request.amount,
            current_user.province
        )
        total_amount = request.amount + tax_amount

        # Create payment intent
        payment_intent = stripe.PaymentIntent.create(
            customer=customer_id,
            amount=total_amount,
            currency=request.currency.lower(),
            payment_method=request.paymentMethodId,  # Optional
            confirmation_method="manual",  # Confirm on frontend
            metadata={
                "user_id": str(current_user.id),
                "plan_id": request.metadata.get("subscriptionPlanId"),
                "base_amount": request.amount,
                "tax_amount": tax_amount,
                "province": current_user.province
            }
        )

        return {
            "clientSecret": payment_intent.client_secret,
            "paymentIntentId": payment_intent.id,
            "amount": total_amount,
            "currency": request.currency
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## Integration with GraphQL Mutations

After successful payment on frontend, update subscription status via GraphQL:

### Flow 1: Setup Intent (Save Payment Method)

```
Frontend:
1. Create setup intent → GET client secret
2. Confirm with Stripe SDK → GET payment method ID
3. Call GraphQL mutation: addPaymentMethod(paymentMethodId)

Backend GraphQL:
mutation AddPaymentMethod($input: AddPaymentMethodInput!) {
  addPaymentMethod(input: $input) {
    success
    message
    paymentMethod {
      id
      cardBrand
      cardLast4
      isDefault
    }
  }
}
```

### Flow 2: Payment Intent (Immediate Charge)

```
Frontend:
1. Create payment intent → GET client secret
2. Confirm with Stripe SDK → GET payment intent ID
3. Call GraphQL mutation: subscribe(paymentIntentId)

Backend GraphQL:
mutation Subscribe($input: SubscribeInput!) {
  subscribe(input: $input) {
    success
    message
    subscription {
      id
      status
      currentPeriodEnd
    }
  }
}
```

---

## Canadian Tax Compliance

When creating payment intents, ensure Canadian taxes are calculated:

**GST/HST/PST Rates by Province**:
```python
CANADIAN_TAX_RATES = {
    "AB": {"GST": 0.05},  # 5% GST
    "BC": {"GST": 0.05, "PST": 0.07},  # 12% total
    "MB": {"GST": 0.05, "PST": 0.07},  # 12% total
    "NB": {"HST": 0.15},  # 15% HST
    "NL": {"HST": 0.15},  # 15% HST
    "NT": {"GST": 0.05},  # 5% GST
    "NS": {"HST": 0.15},  # 15% HST
    "NU": {"GST": 0.05},  # 5% GST
    "ON": {"HST": 0.13},  # 13% HST
    "PE": {"HST": 0.15},  # 15% HST
    "QC": {"GST": 0.05, "QST": 0.09975},  # 14.975% total
    "SK": {"GST": 0.05, "PST": 0.06},  # 11% total
    "YT": {"GST": 0.05},  # 5% GST
}
```

---

## Security Considerations

1. **API Key Management**:
   - Never expose Stripe secret key in frontend
   - Store in backend environment variables
   - Use separate test/live keys for development/production

2. **User Authentication**:
   - Verify user session before creating intents
   - Link Stripe customer to NestSync user ID

3. **PIPEDA Compliance**:
   - Store minimal payment data
   - Stripe handles PCI compliance
   - Audit all payment operations
   - Include Canadian data residency metadata

4. **Webhook Verification** (Future):
   - Verify Stripe webhook signatures
   - Handle async payment status updates
   - Update subscription status on successful charge

---

## Testing with Stripe Test Cards

Use these test cards in development:

**Success Card**:
```
Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**3D Secure Card** (requires authentication):
```
Number: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Decline Card**:
```
Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## Error Handling

Backend should return consistent error formats:

```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "stripeErrorType": "card_error",
    "stripeErrorCode": "card_declined",
    "declineCode": "insufficient_funds"
  }
}
```

Frontend will translate these to user-friendly messages via `stripeService.getUserFriendlyError()`.

---

## Future Enhancements

1. **Webhook Endpoints**:
   - `POST /api/stripe/webhook` - Handle Stripe events
   - Verify webhook signatures
   - Update subscription status asynchronously

2. **Invoice Generation**:
   - `GET /api/stripe/invoices/{id}` - Retrieve invoice details
   - Canadian GST/HST compliant invoices

3. **Payment Method Management**:
   - `DELETE /api/stripe/payment-methods/{id}` - Detach payment method
   - `PATCH /api/stripe/payment-methods/{id}/default` - Set default

4. **Subscription Management**:
   - `PATCH /api/stripe/subscriptions/{id}` - Update subscription
   - `POST /api/stripe/subscriptions/{id}/cancel` - Cancel subscription

---

## Implementation Checklist

- [ ] Create `/api/stripe/setup-intent` endpoint
- [ ] Create `/api/stripe/payment-intent` endpoint
- [ ] Implement Canadian tax calculation helper
- [ ] Add Stripe customer creation/retrieval logic
- [ ] Test with Stripe test cards
- [ ] Add GraphQL mutations for payment method storage
- [ ] Implement webhook handler (future)
- [ ] Add audit logging for PIPEDA compliance

---

## Contact

For Stripe integration questions:
- **Frontend Service**: `/lib/services/stripeService.ts`
- **Payment Screen**: `/app/(subscription)/payment-methods.tsx`
- **GraphQL Hooks**: `/lib/hooks/useSubscription.ts`
