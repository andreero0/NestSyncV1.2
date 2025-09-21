"""
Integration Tests for Stripe Webhooks API
Tests for Canadian subscription billing webhook handling
"""

import pytest
import json
import hmac
import hashlib
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.api
@pytest.mark.payments
class TestStripeWebhooksAPI:
    """Test suite for Stripe webhook API integration"""

    def test_webhook_signature_verification(
        self,
        test_client: TestClient,
        test_settings
    ):
        """Test Stripe webhook signature verification"""

        # Create test webhook payload
        webhook_payload = {
            "id": "evt_test_webhook",
            "object": "event",
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_test_123",
                    "customer": "cus_test_123",
                    "status": "active",
                    "current_period_start": 1640995200,
                    "current_period_end": 1643673600
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service
            mock_service.handle_webhook_event.return_value = {
                "status": "processed",
                "subscription_id": "sub_test_123"
            }

            # Send webhook request
            response = test_client.post(
                "/webhooks/stripe/subscription-events",
                data=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"

    def test_webhook_invalid_signature(
        self,
        test_client: TestClient
    ):
        """Test webhook with invalid signature"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "customer.subscription.created",
            "data": {"object": {}}
        }

        headers = {
            "stripe-signature": "invalid_signature",
            "content-type": "application/json"
        }

        # Send webhook request with invalid signature
        response = test_client.post(
            "/webhooks/stripe/subscription-events",
            json=webhook_payload,
            headers=headers
        )

        # Should reject with 400
        assert response.status_code == 400
        result = response.json()
        assert "signature" in result["detail"].lower()

    def test_webhook_missing_signature(
        self,
        test_client: TestClient
    ):
        """Test webhook with missing signature header"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "customer.subscription.created",
            "data": {"object": {}}
        }

        # Send webhook request without signature header
        response = test_client.post(
            "/webhooks/stripe/subscription-events",
            json=webhook_payload
        )

        # Should reject with 400
        assert response.status_code == 400
        result = response.json()
        assert "signature" in result["detail"].lower()

    async def test_subscription_created_webhook(
        self,
        async_client: AsyncClient,
        test_user,
        test_subscription,
        test_settings
    ):
        """Test subscription created webhook processing"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": test_subscription.stripe_subscription_id,
                    "customer": test_subscription.stripe_customer_id,
                    "status": "active",
                    "current_period_start": 1640995200,
                    "current_period_end": 1643673600,
                    "cancel_at_period_end": False
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            mock_handler.return_value = {
                "status": "processed",
                "subscription_id": test_subscription.id
            }

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            assert result["result"]["subscription_id"] == test_subscription.id

    async def test_invoice_payment_succeeded_webhook(
        self,
        async_client: AsyncClient,
        test_subscription,
        test_settings
    ):
        """Test invoice payment succeeded webhook"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "in_test_123",
                    "subscription": test_subscription.stripe_subscription_id,
                    "amount_paid": 2999,  # $29.99 in cents
                    "currency": "cad",
                    "status": "paid",
                    "lines": {
                        "data": [{
                            "period": {
                                "start": 1640995200,
                                "end": 1643673600
                            }
                        }]
                    }
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            mock_handler.return_value = {
                "status": "processed",
                "subscription_id": test_subscription.id
            }

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"

    def test_webhook_health_check(
        self,
        test_client: TestClient
    ):
        """Test webhook health check endpoint"""

        response = test_client.get("/webhooks/stripe/health")

        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "healthy"
        assert result["service"] == "stripe_webhooks"
        assert "endpoints" in result

    async def test_webhook_error_handling(
        self,
        async_client: AsyncClient,
        test_settings
    ):
        """Test webhook error handling for processing failures"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "customer.subscription.created",
            "data": {
                "object": {
                    "id": "sub_nonexistent",
                    "customer": "cus_nonexistent"
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            # Simulate processing error
            mock_handler.side_effect = Exception("Database connection failed")

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Should return 500 for processing errors
            assert response.status_code == 500
            result = response.json()
            assert "Internal server error" in result["detail"]


@pytest.mark.integration
@pytest.mark.payments
@pytest.mark.canadian
class TestCanadianBillingWebhooks:
    """Test suite for Canadian-specific billing webhook scenarios"""

    async def test_canadian_tax_webhook_processing(
        self,
        async_client: AsyncClient,
        test_subscription,
        test_settings
    ):
        """Test webhook processing with Canadian tax information"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "id": "in_test_123",
                    "subscription": test_subscription.stripe_subscription_id,
                    "amount_paid": 3387,  # $29.99 + 13% HST = $33.87
                    "tax": 388,  # 13% HST on $29.99
                    "currency": "cad",
                    "customer_tax_location": {
                        "country": "CA",
                        "state": "ON"
                    },
                    "lines": {
                        "data": [{
                            "amount": 2999,  # Base amount
                            "period": {
                                "start": 1640995200,
                                "end": 1643673600
                            }
                        }]
                    }
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            mock_handler.return_value = {
                "status": "processed",
                "subscription_id": test_subscription.id,
                "tax_amount_cad": 3.88,
                "total_amount_cad": 33.87
            }

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"

            # Verify Canadian tax handling
            result_data = result["result"]
            assert result_data["tax_amount_cad"] == 3.88
            assert result_data["total_amount_cad"] == 33.87

    async def test_subscription_cancellation_webhook(
        self,
        async_client: AsyncClient,
        test_subscription,
        test_settings
    ):
        """Test subscription cancellation webhook"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": test_subscription.stripe_subscription_id,
                    "customer": test_subscription.stripe_customer_id,
                    "status": "canceled",
                    "canceled_at": int(datetime.now().timestamp()),
                    "cancel_at_period_end": False
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            mock_handler.return_value = {
                "status": "processed",
                "subscription_id": test_subscription.id,
                "action": "cancelled"
            }

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            assert result["result"]["action"] == "cancelled"

    async def test_payment_failed_webhook(
        self,
        async_client: AsyncClient,
        test_subscription,
        test_settings
    ):
        """Test payment failed webhook for dunning management"""

        webhook_payload = {
            "id": "evt_test_webhook",
            "type": "invoice.payment_failed",
            "data": {
                "object": {
                    "id": "in_test_123",
                    "subscription": test_subscription.stripe_subscription_id,
                    "amount_due": 3387,
                    "currency": "cad",
                    "attempt_count": 1,
                    "last_payment_error": {
                        "message": "Your card was declined.",
                        "code": "card_declined",
                        "decline_code": "insufficient_funds"
                    }
                }
            }
        }

        payload_json = json.dumps(webhook_payload, separators=(',', ':'))

        # Create valid signature
        signature = hmac.new(
            test_settings.stripe_webhook_secret.encode(),
            payload_json.encode(),
            hashlib.sha256
        ).hexdigest()

        headers = {
            "stripe-signature": f"t={int(datetime.now().timestamp())},v1={signature}",
            "content-type": "application/json"
        }

        with patch('app.services.StripeWebhookService.handle_webhook_event') as mock_handler:
            mock_handler.return_value = {
                "status": "processed",
                "subscription_id": test_subscription.id,
                "action": "payment_failed",
                "retry_required": True
            }

            # Send webhook request
            response = await async_client.post(
                "/webhooks/stripe/subscription-events",
                content=payload_json,
                headers=headers
            )

            # Assertions
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            assert result["result"]["action"] == "payment_failed"
            assert result["result"]["retry_required"] is True