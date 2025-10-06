# Stripe Integration Setup Guide

**Date Created**: October 4, 2025
**Status**: Required for Payment Features

---

## Overview

NestSync uses Stripe for Canadian payment processing with GST/PST/HST tax support. This guide covers obtaining and configuring Stripe API keys for development and testing.

---

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- NestSync backend `.env.local` file access

---

## Step 1: Get Stripe Test API Keys

### 1.1 Access Stripe Dashboard

1. Go to https://dashboard.stripe.com/login
2. Sign in with your Stripe account credentials
3. Ensure you're in **Test Mode** (toggle switch in top-right corner)

### 1.2 Navigate to API Keys

1. Click **Developers** in the left sidebar
2. Click **API keys**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 1.3 Copy Secret Key

1. Under "Secret key", click **Reveal test key**
2. Copy the full key (starts with `sk_test_`)
   - Example format: `sk_test_51Ab2Cd3Ef4Gh5Ij6Kl7Mn8Op9Qr0St1Uv2Wx3Yz4`
3. **IMPORTANT**: Never commit this key to version control

---

## Step 2: Configure Backend Environment

### 2.1 Update `.env.local`

1. Navigate to `NestSync-backend/` directory
2. Open (or create) `.env.local` file
3. Add or update the following line:

```bash
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

**Example:**
```bash
STRIPE_SECRET_KEY=sk_test_51Ab2Cd3Ef4Gh5Ij6Kl7Mn8Op9Qr0St1Uv2Wx3Yz4
```

### 2.2 Restart Backend Server

After updating `.env.local`, restart the backend:

```bash
cd NestSync-backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 2.3 Verify Configuration

Check backend logs for successful Stripe initialization:

```
✅ Look for: Stripe SDK configured for Canadian billing
❌ Avoid:    Stripe health check failed: Invalid API Key
```

---

## Step 3: Test Stripe Integration

### 3.1 Stripe Test Cards

Use these test card numbers in the iOS simulator or web app:

| Card Type | Number | CVC | Expiry | Result |
|-----------|--------|-----|--------|--------|
| **Success** | `4242 4242 4242 4242` | Any 3 digits | Any future date | Payment succeeds |
| **Decline** | `4000 0000 0000 0002` | Any 3 digits | Any future date | Card declined |
| **Auth Required** | `4000 0027 6000 3184` | Any 3 digits | Any future date | Requires 3D Secure |

### 3.2 Test Payment Flow

1. Navigate to Settings → Payment Methods
2. Click "Add Payment Method"
3. Enter test card: `4242 4242 4242 4242`
4. Enter any future expiry date (e.g., `12/28`)
5. Enter any 3-digit CVC (e.g., `123`)
6. Click "Add Card"

**Expected Result**: ✅ "Payment method added successfully"

---

## Step 4: Canadian Tax Configuration

### 4.1 Verify Tax Rates

Stripe integration automatically handles Canadian taxes:

- **GST** (5%): Federal goods and services tax
- **PST** (varies by province): Provincial sales tax
- **HST** (13-15%): Harmonized sales tax (ON, NS, NB, PE, NL)
- **QST** (9.975%): Quebec sales tax

### 4.2 Test Tax Calculation

Use the GraphQL query:

```graphql
query CalculateTax {
  calculateTax(amount: 9.99, province: BC) {
    subtotal
    taxBreakdown {
      gst
      pst
    }
    totalTax
    totalAmount
  }
}
```

**Expected for BC ($9.99):**
- GST: $0.50 (5%)
- PST: $0.70 (7%)
- Total Tax: $1.20
- Total: $11.19

---

## Troubleshooting

### Error: "Invalid API Key provided"

**Cause**: Incorrect or missing Stripe secret key

**Solution**:
1. Verify key starts with `sk_test_`
2. Check for extra spaces or quotes in `.env.local`
3. Ensure no newlines at end of key
4. Restart backend server after changes

### Error: "Stripe SDK not initialized"

**Cause**: Environment variable not loaded

**Solution**:
1. Confirm `.env.local` is in `NestSync-backend/` directory
2. Check file is named exactly `.env.local` (not `.env` or `env.local`)
3. Restart backend with `uvicorn main:app --reload`

### Error: "Payment method setup failed"

**Cause**: Stripe webhooks not configured or network issues

**Solution**:
1. Check internet connectivity
2. Verify Stripe dashboard shows test mode enabled
3. Check backend logs for detailed error messages
4. Ensure iOS simulator has network access

---

## Production Deployment

### ⚠️ BEFORE GOING LIVE

1. **Switch to Live Mode** in Stripe Dashboard
2. **Get Live API Keys** (`sk_live_...`)
3. **Update Production Environment** with live keys
4. **Configure Webhooks** for production endpoints
5. **Enable PCI Compliance** features
6. **Set up Radar Rules** for fraud prevention

### Production Environment Variables

```bash
# Production .env (Railway/deployment)
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Security Best Practices

### ✅ DO

- Keep `.env.local` in `.gitignore`
- Use test keys for development
- Rotate keys if compromised
- Use webhook signature verification
- Enable Stripe Radar for fraud detection

### ❌ DON'T

- Commit API keys to version control
- Share secret keys via email/Slack
- Use test keys in production
- Store keys in client-side code
- Disable webhook verification

---

## Additional Resources

- **Stripe Docs**: https://stripe.com/docs
- **Test Cards**: https://stripe.com/docs/testing
- **Canadian Taxes**: https://stripe.com/docs/tax/canada
- **API Reference**: https://stripe.com/docs/api

---

## Status Checklist

- [ ] Stripe account created
- [ ] Test API keys obtained
- [ ] Backend `.env.local` configured
- [ ] Backend server restarted
- [ ] Stripe health check passing
- [ ] Test card payment successful
- [ ] Canadian tax calculation verified

---

**Last Updated**: October 4, 2025
**Next Review**: Before production deployment
