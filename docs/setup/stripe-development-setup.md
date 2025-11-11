---
title: "Stripe Development Setup Guide"
date: 2025-11-10
category: "setup"
type: "guide"
status: "active"
platforms: ["ios", "android", "web"]
related_docs:
  - "../../NestSync-backend/app/config/stripe.py"
  - "../../NestSync-frontend/lib/stripe/config.ts"
tags: ["stripe", "payments", "development", "webhooks"]
---

# Stripe Development Setup Guide

This guide explains how to configure Stripe for local development, including webhook setup for testing payment flows.

**Requirements**: 10.1, 10.2, 10.3, 10.4

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Webhook Setup](#webhook-setup)
4. [Testing Payment Flows](#testing-payment-flows)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up Stripe for development, ensure you have:

- A Stripe account (sign up at https://stripe.com)
- Stripe test mode API keys
- Node.js and npm installed
- Backend and frontend services running locally

---

## Environment Configuration

### Backend Configuration

Add the following environment variables to `NestSync-backend/.env.local`:

```bash
# Stripe Test Mode Keys
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Price IDs (from Stripe Dashboard)
STRIPE_BASIC_PRICE_ID=price_YOUR_BASIC_PRICE_ID
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID
STRIPE_FAMILY_PRICE_ID=price_YOUR_FAMILY_PRICE_ID

# Environment
ENVIRONMENT=development
```

**How to get your test keys:**

1. Log in to your Stripe Dashboard
2. Navigate to **Developers** → **API keys**
3. Toggle to **Test mode** (top right)
4. Copy your **Publishable key** and **Secret key**

### Frontend Configuration

Add the following to `NestSync-frontend/.env.local`:

```bash
# Stripe Frontend Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY

# Development mode
EXPO_PUBLIC_DEV_MODE=true
```

**Note**: The frontend only needs the publishable key. Never expose the secret key in frontend code.

---

## Webhook Setup

Stripe webhooks allow your backend to receive real-time notifications about payment events. For local development, you need to forward webhook events from Stripe to your local server.

### Option 1: Stripe CLI (Recommended)

The Stripe CLI is the easiest way to test webhooks locally.

#### Installation

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download the latest release
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz

# Extract and move to PATH
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Windows:**
```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

#### Setup and Usage

1. **Login to Stripe:**
   ```bash
   stripe login
   ```
   This will open a browser window to authenticate with your Stripe account.

2. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:8001/api/stripe/webhook
   ```

3. **Copy the webhook signing secret:**
   The CLI will output a webhook signing secret like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```
   
   Add this to your `NestSync-backend/.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

4. **Keep the CLI running:**
   Leave the `stripe listen` command running in a terminal while you test. You'll see webhook events logged in real-time.

#### Testing Webhook Events

You can trigger test webhook events using the CLI:

```bash
# Test subscription created event
stripe trigger customer.subscription.created

# Test payment succeeded event
stripe trigger invoice.payment_succeeded

# Test payment failed event
stripe trigger invoice.payment_failed
```

### Option 2: ngrok (Alternative)

If you prefer not to use the Stripe CLI, you can use ngrok to create a public URL for your local server.

#### Installation

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Other platforms:**
Download from https://ngrok.com/download

#### Setup and Usage

1. **Start ngrok:**
   ```bash
   ngrok http 8001
   ```

2. **Copy the HTTPS URL:**
   ngrok will output a URL like:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:8001
   ```

3. **Configure webhook in Stripe Dashboard:**
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Enter your ngrok URL: `https://abc123.ngrok.io/api/stripe/webhook`
   - Select events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_method.attached`
   - Click **Add endpoint**

4. **Copy the webhook signing secret:**
   - Click on your newly created endpoint
   - Click **Reveal** under **Signing secret**
   - Add to `NestSync-backend/.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

**Note**: ngrok URLs change each time you restart ngrok (unless you have a paid plan). You'll need to update the webhook endpoint in Stripe Dashboard each time.

---

## Testing Payment Flows

### Test Card Numbers

Stripe provides test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |

**For all test cards:**
- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any postal code (e.g., M5H 2N2)

### Testing Subscription Flow

1. **Start your services:**
   ```bash
   # Terminal 1: Backend
   cd NestSync-backend
   python main.py

   # Terminal 2: Frontend
   cd NestSync-frontend
   npm start

   # Terminal 3: Stripe CLI (if using)
   stripe listen --forward-to localhost:8001/api/stripe/webhook
   ```

2. **Test payment method addition:**
   - Navigate to subscription settings in the app
   - Click "Add Payment Method"
   - Enter test card: `4242 4242 4242 4242`
   - Complete the form
   - Verify payment method is saved

3. **Test subscription creation:**
   - Select a subscription plan
   - Click "Subscribe"
   - Verify subscription is created
   - Check webhook logs for `customer.subscription.created` event

4. **Test subscription update:**
   - Change subscription plan
   - Verify proration is calculated correctly
   - Check webhook logs for `customer.subscription.updated` event

5. **Test subscription cancellation:**
   - Cancel subscription
   - Verify cancellation is processed
   - Check webhook logs for `customer.subscription.deleted` event

### Verifying Webhook Delivery

**Using Stripe CLI:**
```bash
# Webhooks are logged in the terminal where stripe listen is running
# You'll see output like:
2025-11-10 10:30:45   --> customer.subscription.created [evt_xxx]
2025-11-10 10:30:45   <-- [200] POST http://localhost:8001/api/stripe/webhook
```

**Using Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. View **Recent deliveries** to see webhook attempts and responses

---

## Troubleshooting

### Common Issues

#### 1. Webhook signature verification fails

**Error:**
```
Invalid webhook signature
```

**Solution:**
- Ensure `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the secret from Stripe CLI or Dashboard
- Restart your backend server after updating the secret
- Verify the webhook endpoint URL is correct

#### 2. Console warnings about HTTP/HTTPS in development

**Warning:**
```
Stripe: Using HTTP in development mode
```

**Solution:**
This is expected in development. The frontend configuration suppresses these warnings:
```typescript
// NestSync-frontend/lib/stripe/config.ts
if (isDevelopment) {
  config.suppressWarnings = true;
  config.testMode = true;
}
```

#### 3. Payment method not attaching to customer

**Error:**
```
No such customer: cus_xxx
```

**Solution:**
- Ensure customer is created before attaching payment method
- Verify customer ID is stored correctly in database
- Check backend logs for customer creation errors

#### 4. Webhooks not being received

**Checklist:**
- [ ] Stripe CLI is running (`stripe listen`)
- [ ] Backend server is running on port 8001
- [ ] Webhook endpoint is accessible: `curl http://localhost:8001/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` is set correctly
- [ ] Firewall is not blocking connections

#### 5. Test card declined

**Error:**
```
Your card was declined
```

**Solution:**
- Verify you're using a valid test card number
- Ensure you're in test mode (check Stripe Dashboard toggle)
- Try a different test card number
- Check if you've exceeded test mode rate limits

### Debug Logging

Enable debug logging to troubleshoot issues:

**Backend:**
```bash
# In .env.local
LOG_LEVEL=DEBUG
ENVIRONMENT=development
```

**Stripe CLI:**
```bash
# Verbose output
stripe listen --forward-to localhost:8001/api/stripe/webhook --log-level debug
```

### Useful Stripe CLI Commands

```bash
# View recent events
stripe events list

# View specific event details
stripe events retrieve evt_xxx

# Test specific webhook event
stripe trigger customer.subscription.created

# View webhook endpoint status
stripe webhook-endpoints list

# View logs
stripe logs tail
```

---

## Additional Resources

- [Stripe Testing Documentation](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Canadian Payment Methods](https://stripe.com/docs/payments/payment-methods/integration-options#canadian-payment-methods)

---

## Next Steps

After setting up Stripe for development:

1. Test all payment flows (add payment method, subscribe, update, cancel)
2. Verify webhook events are received and processed correctly
3. Check that subscription status is updated in the database
4. Test error scenarios (declined cards, expired cards, etc.)
5. Review logs for any warnings or errors

For production deployment, see [Stripe Production Setup Guide](./stripe-production-setup.md).

---

**Last Updated**: 2025-11-10  
**Maintained By**: NestSync Development Team  
**Related Documentation**:
- [Backend Stripe Configuration](../../NestSync-backend/app/config/stripe.py)
- [Frontend Stripe Configuration](../../NestSync-frontend/lib/stripe/config.ts)
- [Stripe API Endpoints](../../NestSync-backend/app/api/stripe_endpoints.py)
