"""
Stripe Configuration for Premium Subscription System
PIPEDA-compliant Canadian billing integration

This module configures Stripe SDK for Canadian subscription management:
- Payment processing with CAD currency
- Canadian tax compliance (GST/PST/HST/QST)
- Subscription lifecycle management
- Webhook event handling
"""

import stripe
from typing import Optional, Dict, Any, List
from decimal import Decimal
import logging

from .settings import get_settings

logger = logging.getLogger(__name__)


class StripeConfig:
    """
    Stripe SDK configuration and helper methods
    
    Supports both development and production modes:
    - Development: Test mode with debug logging
    - Production: Live mode with standard logging
    
    Requirements: 10.1, 10.2
    """

    def __init__(self):
        """Initialize Stripe configuration"""
        settings = get_settings()

        # Determine if we're in development mode
        self.is_development = settings.environment == "development"

        # Configure Stripe API with appropriate key
        if self.is_development:
            # Use test key in development
            stripe.api_key = settings.stripe_secret_key
            logger.info("Stripe configured in TEST MODE for development")
        else:
            # Use live key in production
            stripe.api_key = settings.stripe_secret_key
            logger.info("Stripe configured in LIVE MODE for production")

        # Set API version
        stripe.api_version = "2024-10-28.acacia"  # Latest API version

        # Enable debug logging in development
        if self.is_development:
            stripe.log = "debug"
            logger.setLevel(logging.DEBUG)
            logger.debug("Stripe debug logging enabled")

        # Store configuration
        self.publishable_key = settings.stripe_publishable_key
        self.webhook_secret = settings.stripe_webhook_secret

        # Canadian-specific configuration
        self.default_currency = "CAD"
        self.default_country = "CA"

        # Trial configuration (14 days no credit card required)
        self.trial_period_days = 14

        # Cooling-off period (14 days for annual subscriptions)
        self.cooling_off_period_days = 14

        # Log configuration summary
        logger.info(
            "Stripe SDK configured for Canadian billing",
            extra={
                "environment": settings.environment,
                "test_mode": self.is_development,
                "currency": self.default_currency,
                "country": self.default_country,
            }
        )

    def get_publishable_key(self) -> str:
        """Get Stripe publishable key for frontend"""
        return self.publishable_key

    def verify_webhook_signature(
        self, payload: bytes, signature: str
    ) -> Optional[stripe.Event]:
        """
        Verify Stripe webhook signature

        Args:
            payload: Raw webhook payload
            signature: Stripe signature header

        Returns:
            Verified Stripe event or None
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            logger.info(f"Webhook verified: {event.type}")
            return event
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            return None
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            return None

    async def create_customer(
        self,
        user_id: str,
        email: str,
        name: Optional[str] = None,
        province: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> stripe.Customer:
        """
        Create Stripe customer for Canadian user

        Args:
            user_id: NestSync user ID
            email: Customer email
            name: Customer name
            province: Canadian province code
            metadata: Additional customer metadata

        Returns:
            Stripe Customer object
        """
        customer_metadata = {
            "nestsync_user_id": user_id,
            "country": "CA",
            **(metadata or {})
        }

        if province:
            customer_metadata["province"] = province

        customer = stripe.Customer.create(
            email=email,
            name=name,
            metadata=customer_metadata,
            preferred_locales=["en-CA"],  # Canadian English
        )

        logger.info(f"Created Stripe customer for user {user_id}: {customer.id}")
        return customer

    async def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        trial_end: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> stripe.Subscription:
        """
        Create Stripe subscription

        Args:
            customer_id: Stripe Customer ID
            price_id: Stripe Price ID
            trial_end: Unix timestamp for trial end (if applicable)
            metadata: Additional subscription metadata

        Returns:
            Stripe Subscription object
        """
        subscription_params = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "currency": self.default_currency,
            "metadata": metadata or {},
        }

        if trial_end:
            subscription_params["trial_end"] = trial_end

        subscription = stripe.Subscription.create(**subscription_params)

        logger.info(
            f"Created subscription {subscription.id} for customer {customer_id}"
        )
        return subscription

    async def update_subscription(
        self,
        subscription_id: str,
        price_id: str,
        proration_behavior: str = "create_prorations",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> stripe.Subscription:
        """
        Update Stripe subscription with new price

        Args:
            subscription_id: Stripe Subscription ID
            price_id: New Stripe Price ID
            proration_behavior: Proration behavior (create_prorations, none, always_invoice)
            metadata: Additional subscription metadata

        Returns:
            Updated Stripe Subscription object
        """
        # Get current subscription to find the subscription item
        subscription = stripe.Subscription.retrieve(subscription_id)

        update_params = {
            "items": [
                {
                    "id": subscription["items"]["data"][0]["id"],
                    "price": price_id,
                }
            ],
            "proration_behavior": proration_behavior,
        }

        if metadata:
            update_params["metadata"] = metadata

        updated_subscription = stripe.Subscription.modify(
            subscription_id, **update_params
        )

        logger.info(
            f"Updated subscription {subscription_id} with new price {price_id}"
        )
        return updated_subscription

    async def attach_payment_method(
        self, payment_method_id: str, customer_id: str
    ) -> stripe.PaymentMethod:
        """
        Attach payment method to customer

        Args:
            payment_method_id: Stripe PaymentMethod ID
            customer_id: Stripe Customer ID

        Returns:
            Stripe PaymentMethod object
        """
        payment_method = stripe.PaymentMethod.attach(
            payment_method_id, customer=customer_id
        )

        logger.info(
            f"Attached payment method {payment_method_id} to customer {customer_id}"
        )
        return payment_method

    async def set_default_payment_method(
        self, customer_id: str, payment_method_id: str
    ) -> stripe.Customer:
        """
        Set default payment method for customer

        Args:
            customer_id: Stripe Customer ID
            payment_method_id: Stripe PaymentMethod ID

        Returns:
            Updated Stripe Customer object
        """
        customer = stripe.Customer.modify(
            customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )

        logger.info(
            f"Set default payment method {payment_method_id} for customer {customer_id}"
        )
        return customer

    async def cancel_subscription(
        self,
        subscription_id: str,
        prorate: bool = True,
        invoice_now: bool = True,
    ) -> stripe.Subscription:
        """
        Cancel Stripe subscription

        Args:
            subscription_id: Stripe Subscription ID
            prorate: Whether to prorate cancellation
            invoice_now: Whether to invoice immediately

        Returns:
            Canceled Stripe Subscription object
        """
        subscription = stripe.Subscription.cancel(
            subscription_id, prorate=prorate, invoice_now=invoice_now
        )

        logger.info(f"Canceled subscription {subscription_id}")
        return subscription

    async def create_refund(
        self,
        charge_id: str,
        amount: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> stripe.Refund:
        """
        Create refund for charge (cooling-off period)

        Args:
            charge_id: Stripe Charge ID
            amount: Refund amount in cents (None = full refund)
            reason: Refund reason

        Returns:
            Stripe Refund object
        """
        refund_params = {"charge": charge_id}

        if amount:
            refund_params["amount"] = amount

        if reason:
            refund_params["reason"] = reason

        refund = stripe.Refund.create(**refund_params)

        logger.info(f"Created refund for charge {charge_id}: {refund.id}")
        return refund

    async def retrieve_invoice(self, invoice_id: str) -> stripe.Invoice:
        """
        Retrieve Stripe invoice

        Args:
            invoice_id: Stripe Invoice ID

        Returns:
            Stripe Invoice object
        """
        invoice = stripe.Invoice.retrieve(invoice_id)
        return invoice

    async def list_payment_methods(
        self, customer_id: str, type: str = "card"
    ) -> List[stripe.PaymentMethod]:
        """
        List customer payment methods

        Args:
            customer_id: Stripe Customer ID
            type: Payment method type

        Returns:
            List of Stripe PaymentMethod objects
        """
        payment_methods = stripe.PaymentMethod.list(
            customer=customer_id, type=type
        )
        return payment_methods.data

    async def detach_payment_method(
        self, payment_method_id: str
    ) -> stripe.PaymentMethod:
        """
        Detach payment method from customer

        Args:
            payment_method_id: Stripe PaymentMethod ID

        Returns:
            Detached Stripe PaymentMethod object
        """
        payment_method = stripe.PaymentMethod.detach(payment_method_id)

        logger.info(f"Detached payment method {payment_method_id}")
        return payment_method

    def calculate_stripe_amount(self, amount_cad: Decimal) -> int:
        """
        Convert CAD decimal to Stripe amount (cents)

        Args:
            amount_cad: Amount in CAD (e.g., 4.99)

        Returns:
            Amount in cents (e.g., 499)
        """
        return int(amount_cad * 100)

    def format_stripe_amount(self, stripe_amount: int) -> Decimal:
        """
        Convert Stripe amount (cents) to CAD decimal

        Args:
            stripe_amount: Amount in cents (e.g., 499)

        Returns:
            Amount in CAD (e.g., 4.99)
        """
        return Decimal(stripe_amount) / 100


# =============================================================================
# Singleton Instance
# =============================================================================

_stripe_config: Optional[StripeConfig] = None


def get_stripe_config() -> StripeConfig:
    """
    Get Stripe configuration singleton

    Returns:
        StripeConfig instance
    """
    global _stripe_config
    if _stripe_config is None:
        _stripe_config = StripeConfig()
    return _stripe_config


# =============================================================================
# Stripe Event Types (for webhook handling)
# =============================================================================

class StripeWebhookEvents:
    """Stripe webhook event type constants"""

    # Subscription events
    SUBSCRIPTION_CREATED = "customer.subscription.created"
    SUBSCRIPTION_UPDATED = "customer.subscription.updated"
    SUBSCRIPTION_DELETED = "customer.subscription.deleted"
    SUBSCRIPTION_TRIAL_ENDING = "customer.subscription.trial_will_end"

    # Payment events
    PAYMENT_SUCCEEDED = "invoice.payment_succeeded"
    PAYMENT_FAILED = "invoice.payment_failed"
    PAYMENT_ACTION_REQUIRED = "invoice.payment_action_required"

    # Invoice events
    INVOICE_CREATED = "invoice.created"
    INVOICE_FINALIZED = "invoice.finalized"
    INVOICE_PAID = "invoice.paid"
    INVOICE_PAYMENT_FAILED = "invoice.payment_failed"

    # Payment method events
    PAYMENT_METHOD_ATTACHED = "payment_method.attached"
    PAYMENT_METHOD_DETACHED = "payment_method.detached"
    PAYMENT_METHOD_UPDATED = "payment_method.updated"

    # Charge events
    CHARGE_SUCCEEDED = "charge.succeeded"
    CHARGE_FAILED = "charge.failed"
    CHARGE_REFUNDED = "charge.refunded"

    # Customer events
    CUSTOMER_CREATED = "customer.created"
    CUSTOMER_UPDATED = "customer.updated"
    CUSTOMER_DELETED = "customer.deleted"


# =============================================================================
# Export
# =============================================================================

__all__ = [
    "StripeConfig",
    "get_stripe_config",
    "StripeWebhookEvents",
]
