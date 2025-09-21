"""
Stripe Webhook Service for NestSync
Handles Stripe webhook events for Canadian subscription billing
"""

import logging
import json
import uuid
import stripe
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models import (
    User, ReorderSubscription, OrderStatusUpdate,
    ReorderTransaction, OrderStatus
)
from app.config.settings import settings

logger = logging.getLogger(__name__)


class StripeWebhookService:
    """
    Service for handling Stripe webhook events with Canadian billing compliance
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.stripe_client = stripe
        self.stripe_client.api_key = settings.stripe_secret_key

    async def handle_webhook_event(self, event_data: bytes, signature: str) -> Dict[str, Any]:
        """
        Handle incoming Stripe webhook event with signature verification
        """
        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                event_data,
                signature,
                settings.stripe_webhook_secret
            )

            logger.info(f"Received Stripe webhook event: {event['type']}")

            # Route event to appropriate handler
            event_type = event['type']
            event_data = event['data']

            if event_type.startswith('customer.subscription.'):
                return await self._handle_subscription_event(event_type, event_data)
            elif event_type.startswith('invoice.'):
                return await self._handle_invoice_event(event_type, event_data)
            elif event_type.startswith('payment_intent.'):
                return await self._handle_payment_event(event_type, event_data)
            elif event_type.startswith('payment_method.'):
                return await self._handle_payment_method_event(event_type, event_data)
            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
                return {"status": "ignored", "event_type": event_type}

        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise ValueError("Invalid webhook signature")
        except Exception as e:
            logger.error(f"Error handling webhook event: {e}")
            raise

    async def _handle_subscription_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle subscription lifecycle events
        """
        subscription_data = event_data['object']
        stripe_subscription_id = subscription_data['id']

        # Find local subscription record
        result = await self.session.execute(
            select(ReorderSubscription).where(
                ReorderSubscription.stripe_subscription_id == stripe_subscription_id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            logger.warning(f"Subscription not found for Stripe ID: {stripe_subscription_id}")
            return {"status": "not_found", "stripe_subscription_id": stripe_subscription_id}

        try:
            if event_type == 'customer.subscription.created':
                await self._handle_subscription_created(subscription, subscription_data)
            elif event_type == 'customer.subscription.updated':
                await self._handle_subscription_updated(subscription, subscription_data)
            elif event_type == 'customer.subscription.deleted':
                await self._handle_subscription_deleted(subscription, subscription_data)
            elif event_type == 'customer.subscription.trial_will_end':
                await self._handle_trial_ending(subscription, subscription_data)

            await self.session.commit()
            return {"status": "processed", "subscription_id": subscription.id}

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error processing subscription event {event_type}: {e}")
            raise

    async def _handle_invoice_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle invoice and billing events
        """
        invoice_data = event_data['object']
        subscription_id = invoice_data.get('subscription')

        if not subscription_id:
            return {"status": "ignored", "reason": "no_subscription"}

        # Find local subscription
        result = await self.session.execute(
            select(ReorderSubscription).where(
                ReorderSubscription.stripe_subscription_id == subscription_id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            logger.warning(f"Subscription not found for invoice: {subscription_id}")
            return {"status": "not_found", "subscription_id": subscription_id}

        try:
            if event_type == 'invoice.payment_succeeded':
                await self._handle_payment_succeeded(subscription, invoice_data)
            elif event_type == 'invoice.payment_failed':
                await self._handle_payment_failed(subscription, invoice_data)
            elif event_type == 'invoice.upcoming':
                await self._handle_upcoming_invoice(subscription, invoice_data)

            await self.session.commit()
            return {"status": "processed", "subscription_id": subscription.id}

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error processing invoice event {event_type}: {e}")
            raise

    async def _handle_payment_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle payment intent events for orders
        """
        payment_intent_data = event_data['object']
        payment_intent_id = payment_intent_data['id']

        # Find associated order
        result = await self.session.execute(
            select(ReorderTransaction).where(
                ReorderTransaction.stripe_payment_intent_id == payment_intent_id
            )
        )
        order = result.scalar_one_or_none()

        if not order:
            logger.info(f"No order found for payment intent: {payment_intent_id}")
            return {"status": "not_found", "payment_intent_id": payment_intent_id}

        try:
            if event_type == 'payment_intent.succeeded':
                await self._handle_order_payment_succeeded(order, payment_intent_data)
            elif event_type == 'payment_intent.payment_failed':
                await self._handle_order_payment_failed(order, payment_intent_data)
            elif event_type == 'payment_intent.requires_action':
                await self._handle_payment_requires_action(order, payment_intent_data)

            await self.session.commit()
            return {"status": "processed", "order_id": order.id}

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error processing payment event {event_type}: {e}")
            raise

    async def _handle_payment_method_event(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle payment method events
        """
        payment_method_data = event_data['object']

        if event_type == 'payment_method.attached':
            await self._handle_payment_method_attached(payment_method_data)
        elif event_type == 'payment_method.detached':
            await self._handle_payment_method_detached(payment_method_data)

        return {"status": "processed", "event_type": event_type}

    # =============================================================================
    # Subscription Event Handlers
    # =============================================================================

    async def _handle_subscription_created(self, subscription: ReorderSubscription, stripe_data: Dict[str, Any]):
        """Handle subscription creation confirmation"""
        logger.info(f"Subscription created: {subscription.id}")
        # Subscription already created locally, just confirm it's active
        subscription.is_active = True
        subscription.updated_at = datetime.now(timezone.utc)

    async def _handle_subscription_updated(self, subscription: ReorderSubscription, stripe_data: Dict[str, Any]):
        """Handle subscription updates from Stripe"""
        # Update local subscription with Stripe data
        subscription.current_period_start = datetime.fromtimestamp(
            stripe_data['current_period_start'], tz=timezone.utc
        )
        subscription.current_period_end = datetime.fromtimestamp(
            stripe_data['current_period_end'], tz=timezone.utc
        )
        subscription.cancel_at_period_end = stripe_data.get('cancel_at_period_end', False)

        if stripe_data.get('canceled_at'):
            subscription.cancelled_at = datetime.fromtimestamp(
                stripe_data['canceled_at'], tz=timezone.utc
            )

        subscription.updated_at = datetime.now(timezone.utc)
        logger.info(f"Updated subscription {subscription.id}")

    async def _handle_subscription_deleted(self, subscription: ReorderSubscription, stripe_data: Dict[str, Any]):
        """Handle subscription cancellation"""
        subscription.is_active = False
        subscription.cancelled_at = datetime.now(timezone.utc)
        subscription.updated_at = datetime.now(timezone.utc)
        logger.info(f"Cancelled subscription {subscription.id}")

    async def _handle_trial_ending(self, subscription: ReorderSubscription, stripe_data: Dict[str, Any]):
        """Handle trial period ending notification"""
        # Send notification to user about trial ending
        logger.info(f"Trial ending for subscription {subscription.id}")
        # TODO: Implement notification service integration

    # =============================================================================
    # Invoice Event Handlers
    # =============================================================================

    async def _handle_payment_succeeded(self, subscription: ReorderSubscription, invoice_data: Dict[str, Any]):
        """Handle successful payment"""
        amount_paid = invoice_data['amount_paid'] / 100  # Convert from cents
        logger.info(f"Payment succeeded for subscription {subscription.id}: ${amount_paid:.2f} CAD")

        # Update subscription period
        if invoice_data.get('lines', {}).get('data'):
            period_start = invoice_data['lines']['data'][0].get('period', {}).get('start')
            period_end = invoice_data['lines']['data'][0].get('period', {}).get('end')

            if period_start and period_end:
                subscription.current_period_start = datetime.fromtimestamp(period_start, tz=timezone.utc)
                subscription.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

        subscription.updated_at = datetime.now(timezone.utc)

    async def _handle_payment_failed(self, subscription: ReorderSubscription, invoice_data: Dict[str, Any]):
        """Handle failed payment"""
        logger.error(f"Payment failed for subscription {subscription.id}")

        # TODO: Implement dunning management
        # For now, mark subscription as potentially at risk
        subscription.updated_at = datetime.now(timezone.utc)

    async def _handle_upcoming_invoice(self, subscription: ReorderSubscription, invoice_data: Dict[str, Any]):
        """Handle upcoming invoice notification"""
        amount_due = invoice_data['amount_due'] / 100  # Convert from cents
        logger.info(f"Upcoming invoice for subscription {subscription.id}: ${amount_due:.2f} CAD")

        # TODO: Send notification to user about upcoming charge

    # =============================================================================
    # Payment Event Handlers
    # =============================================================================

    async def _handle_order_payment_succeeded(self, order: ReorderTransaction, payment_data: Dict[str, Any]):
        """Handle successful order payment"""
        order.status = OrderStatus.AUTHORIZED
        order.payment_authorized_at = datetime.now(timezone.utc)
        order.payment_captured_at = datetime.now(timezone.utc)
        order.updated_at = datetime.now(timezone.utc)

        # Create status update record
        status_update = OrderStatusUpdate(
            id=str(uuid.uuid4()),
            transaction_id=order.id,
            previous_status=None,
            new_status=OrderStatus.AUTHORIZED,
            status_message="Payment successfully processed",
            update_source="stripe_webhook",
            external_reference=payment_data['id'],
            user_notified=False,
            created_at=datetime.now(timezone.utc)
        )

        self.session.add(status_update)
        logger.info(f"Order payment succeeded: {order.id}")

    async def _handle_order_payment_failed(self, order: ReorderTransaction, payment_data: Dict[str, Any]):
        """Handle failed order payment"""
        order.status = OrderStatus.FAILED
        order.failure_reason = payment_data.get('last_payment_error', {}).get('message', 'Payment failed')
        order.updated_at = datetime.now(timezone.utc)

        # Create status update record
        status_update = OrderStatusUpdate(
            id=str(uuid.uuid4()),
            transaction_id=order.id,
            previous_status=OrderStatus.PENDING,
            new_status=OrderStatus.FAILED,
            status_message=f"Payment failed: {order.failure_reason}",
            update_source="stripe_webhook",
            external_reference=payment_data['id'],
            user_notified=False,
            created_at=datetime.now(timezone.utc)
        )

        self.session.add(status_update)
        logger.error(f"Order payment failed: {order.id} - {order.failure_reason}")

    async def _handle_payment_requires_action(self, order: ReorderTransaction, payment_data: Dict[str, Any]):
        """Handle payment requiring additional action (3D Secure, etc.)"""
        logger.info(f"Order payment requires action: {order.id}")

        # Update order status but don't fail it yet
        status_update = OrderStatusUpdate(
            id=str(uuid.uuid4()),
            transaction_id=order.id,
            previous_status=order.status,
            new_status=order.status,  # Keep same status
            status_message="Payment requires additional authentication",
            update_source="stripe_webhook",
            external_reference=payment_data['id'],
            user_notified=False,
            created_at=datetime.now(timezone.utc)
        )

        self.session.add(status_update)

    # =============================================================================
    # Payment Method Event Handlers
    # =============================================================================

    async def _handle_payment_method_attached(self, payment_method_data: Dict[str, Any]):
        """Handle payment method attachment"""
        logger.info(f"Payment method attached: {payment_method_data['id']}")
        # TODO: Update user payment methods if needed

    async def _handle_payment_method_detached(self, payment_method_data: Dict[str, Any]):
        """Handle payment method detachment"""
        logger.info(f"Payment method detached: {payment_method_data['id']}")
        # TODO: Update user payment methods if needed

    # =============================================================================
    # Utility Methods
    # =============================================================================

    async def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify webhook signature for security
        """
        try:
            stripe.Webhook.construct_event(
                payload,
                signature,
                settings.stripe_webhook_secret
            )
            return True
        except stripe.error.SignatureVerificationError:
            return False

    async def get_subscription_by_stripe_id(self, stripe_subscription_id: str) -> Optional[ReorderSubscription]:
        """
        Get local subscription by Stripe subscription ID
        """
        result = await self.session.execute(
            select(ReorderSubscription).where(
                ReorderSubscription.stripe_subscription_id == stripe_subscription_id
            )
        )
        return result.scalar_one_or_none()

    async def create_webhook_log(self, event_type: str, event_id: str, status: str, error_message: Optional[str] = None):
        """
        Log webhook events for debugging and compliance
        """
        # TODO: Implement webhook event logging table if needed for audit trail
        logger.info(f"Webhook event logged: {event_type} - {event_id} - {status}")
        if error_message:
            logger.error(f"Webhook error: {error_message}")