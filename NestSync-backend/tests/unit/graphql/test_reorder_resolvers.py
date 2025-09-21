"""
Unit Tests for Reorder GraphQL Resolvers
Tests for subscription management and ML prediction GraphQL endpoints
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone
from decimal import Decimal

from app.graphql.reorder_resolvers import ReorderQueries, ReorderMutations
from app.graphql.reorder_types import (
    CreateSubscriptionInput, SubscriptionTierType,
    CreateReorderPreferencesInput, RetailerTypeEnum
)
from app.models import SubscriptionTier, RetailerType


@pytest.mark.unit
@pytest.mark.graphql
@pytest.mark.subscription
class TestReorderQueries:
    """Test suite for reorder GraphQL queries"""

    async def test_get_subscription_dashboard(
        self,
        test_session,
        test_user,
        test_subscription,
        test_child
    ):
        """Test subscription dashboard query"""

        queries = ReorderQueries()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock dashboard data
            mock_dashboard = MagicMock()
            mock_dashboard.current_subscription = test_subscription
            mock_dashboard.active_preferences = []
            mock_dashboard.recent_predictions = []
            mock_dashboard.recent_orders = []
            mock_dashboard.analytics = MagicMock()
            mock_dashboard.next_billing_date = datetime.now(timezone.utc)
            mock_dashboard.usage_this_period = {}

            mock_service.get_subscription_dashboard.return_value = mock_dashboard

            # Execute query
            result = await queries.get_subscription_dashboard(mock_info)

            # Assertions
            assert result is not None
            assert result.current_subscription == test_subscription
            mock_service.get_subscription_dashboard.assert_called_once_with(test_user)

    async def test_get_consumption_predictions(
        self,
        test_session,
        test_user,
        test_child
    ):
        """Test consumption predictions query"""

        queries = ReorderQueries()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock predictions
            mock_predictions = MagicMock()
            mock_predictions.items = []
            mock_predictions.total_count = 0
            mock_predictions.has_next_page = False
            mock_predictions.has_previous_page = False

            mock_service.get_consumption_predictions.return_value = mock_predictions

            # Execute query
            result = await queries.get_consumption_predictions(
                info=mock_info,
                child_id=test_child.id,
                limit=10,
                offset=0
            )

            # Assertions
            assert result is not None
            assert result.total_count == 0
            mock_service.get_consumption_predictions.assert_called_once_with(
                user=test_user,
                child_id=test_child.id,
                limit=10,
                offset=0
            )


@pytest.mark.unit
@pytest.mark.graphql
@pytest.mark.subscription
class TestReorderMutations:
    """Test suite for reorder GraphQL mutations"""

    async def test_create_subscription_mutation(
        self,
        test_session,
        test_user,
        mock_stripe
    ):
        """Test create subscription mutation"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        # Create input
        subscription_input = CreateSubscriptionInput(
            tier=SubscriptionTierType.PREMIUM,
            stripe_payment_method_id="pm_test_123",
            billing_address={
                "line1": "123 Test St",
                "city": "Toronto",
                "state": "ON",
                "postal_code": "M5V 3L9",
                "country": "CA"
            },
            province_code="ON"
        )

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock subscription creation
            mock_subscription = MagicMock()
            mock_subscription.id = "sub_test_123"
            mock_subscription.tier = SubscriptionTier.PREMIUM
            mock_subscription.is_active = True

            mock_service.create_subscription.return_value = (mock_subscription, "pi_secret_123")

            # Execute mutation
            result = await mutations.create_subscription(mock_info, subscription_input)

            # Assertions
            assert result.success is True
            assert result.subscription == mock_subscription
            assert result.client_secret == "pi_secret_123"

            mock_service.create_subscription.assert_called_once_with(
                user=test_user,
                tier=SubscriptionTier.PREMIUM,
                stripe_payment_method_id="pm_test_123",
                billing_address=subscription_input.billing_address,
                province_code="ON"
            )

    async def test_create_reorder_preferences_mutation(
        self,
        test_session,
        test_user,
        test_child,
        test_subscription
    ):
        """Test create reorder preferences mutation"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        # Create input
        preferences_input = CreateReorderPreferencesInput(
            child_id=test_child.id,
            auto_reorder_enabled=True,
            reorder_threshold_days=7,
            max_order_amount_cad=Decimal("150.00"),
            preferred_retailers=[RetailerTypeEnum.AMAZON_CA, RetailerTypeEnum.WALMART_CA],
            preferred_brands=["Huggies", "Pampers"],
            preferred_delivery_days=[1, 2, 3],  # Mon, Tue, Wed
            notification_advance_hours=24
        )

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock preferences creation
            mock_preferences = MagicMock()
            mock_preferences.id = "pref_test_123"
            mock_preferences.child_id = test_child.id
            mock_preferences.auto_reorder_enabled = True

            mock_service.create_reorder_preferences.return_value = mock_preferences

            # Execute mutation
            result = await mutations.create_reorder_preferences(mock_info, preferences_input)

            # Assertions
            assert result.success is True
            assert result.preferences == mock_preferences

            mock_service.create_reorder_preferences.assert_called_once()

    async def test_trigger_prediction_update_mutation(
        self,
        test_session,
        test_user,
        test_child
    ):
        """Test trigger prediction update mutation"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock prediction generation
            mock_prediction = MagicMock()
            mock_prediction.id = "pred_test_123"
            mock_prediction.child_id = test_child.id
            mock_prediction.confidence_level = "high"

            mock_service.generate_consumption_prediction.return_value = mock_prediction

            # Execute mutation
            result = await mutations.trigger_prediction_update(
                info=mock_info,
                child_id=test_child.id
            )

            # Assertions
            assert result.success is True
            assert result.prediction == mock_prediction

            mock_service.generate_consumption_prediction.assert_called_once()

    async def test_create_manual_order_mutation(
        self,
        test_session,
        test_user,
        test_child,
        test_retailer_config
    ):
        """Test create manual order mutation"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        # Create order input
        order_input = MagicMock()
        order_input.child_id = test_child.id
        order_input.retailer_type = RetailerType.AMAZON_CA
        order_input.products = [{
            "product_id": "B123456789",
            "name": "Huggies Size 2 Diapers",
            "price": 29.99,
            "quantity": 1
        }]
        order_input.delivery_address = {
            "line1": "123 Test St",
            "city": "Toronto",
            "state": "ON",
            "postal_code": "M5V 3L9",
            "country": "CA"
        }
        order_input.payment_method_id = "pm_test_123"

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock order creation
            mock_order = MagicMock()
            mock_order.id = "order_test_123"
            mock_order.order_number = "MANUAL-20231201-ABC123"
            mock_order.status = "confirmed"

            mock_service.create_manual_order.return_value = mock_order

            # Execute mutation
            result = await mutations.create_manual_order(mock_info, order_input)

            # Assertions
            assert result.success is True
            assert result.transaction == mock_order

            mock_service.create_manual_order.assert_called_once_with(
                user=test_user,
                child_id=test_child.id,
                retailer_type=RetailerType.AMAZON_CA,
                products=order_input.products,
                delivery_address=order_input.delivery_address,
                payment_method_id="pm_test_123"
            )


@pytest.mark.unit
@pytest.mark.graphql
@pytest.mark.websocket
class TestReorderSubscriptions:
    """Test suite for reorder WebSocket subscriptions"""

    async def test_order_status_subscription(
        self,
        test_session,
        test_user
    ):
        """Test order status WebSocket subscription"""

        queries = ReorderQueries()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        with patch('app.services.websocket_service.websocket_service') as mock_ws:
            # Mock WebSocket subscription
            async def mock_subscription_generator():
                yield {
                    "order_id": "order_test_123",
                    "status": "shipped",
                    "tracking_number": "TRK123456789",
                    "estimated_delivery": "2023-12-03T10:00:00Z"
                }

            mock_ws.subscribe_to_order_updates.return_value = mock_subscription_generator()

            # Execute subscription
            subscription_gen = queries.order_status_subscription(
                info=mock_info,
                user_id=test_user.id
            )

            # Get first update
            first_update = await subscription_gen.__anext__()

            # Assertions
            assert first_update["order_id"] == "order_test_123"
            assert first_update["status"] == "shipped"

    async def test_prediction_updates_subscription(
        self,
        test_session,
        test_user
    ):
        """Test prediction updates WebSocket subscription"""

        queries = ReorderQueries()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        with patch('app.services.websocket_service.websocket_service') as mock_ws:
            # Mock WebSocket subscription
            async def mock_prediction_generator():
                yield {
                    "child_id": "child_test_123",
                    "prediction_id": "pred_test_123",
                    "confidence_level": "high",
                    "predicted_runout_date": "2023-12-01T00:00:00Z",
                    "recommended_reorder_date": "2023-11-24T00:00:00Z"
                }

            mock_ws.subscribe_to_prediction_updates.return_value = mock_prediction_generator()

            # Execute subscription
            subscription_gen = queries.prediction_updates_subscription(
                info=mock_info,
                user_id=test_user.id
            )

            # Get first update
            first_update = await subscription_gen.__anext__()

            # Assertions
            assert first_update["child_id"] == "child_test_123"
            assert first_update["confidence_level"] == "high"


@pytest.mark.unit
@pytest.mark.graphql
@pytest.mark.canadian
class TestCanadianComplianceResolvers:
    """Test suite for Canadian compliance in GraphQL resolvers"""

    async def test_canadian_tax_validation_in_subscription(
        self,
        test_session,
        test_user
    ):
        """Test Canadian tax validation in subscription creation"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        # Test with invalid province
        invalid_input = CreateSubscriptionInput(
            tier=SubscriptionTierType.BASIC,
            stripe_payment_method_id="pm_test_123",
            billing_address={},
            province_code="XX"  # Invalid province
        )

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            # Mock service to raise validation error
            mock_service.create_subscription.side_effect = ValueError(
                "Invalid Canadian province code: XX"
            )

            # Execute mutation - should handle error gracefully
            result = await mutations.create_subscription(mock_info, invalid_input)

            # Assertions
            assert result.success is False
            assert "Invalid Canadian province code" in result.message

    async def test_canadian_currency_handling(
        self,
        test_session,
        test_user,
        test_child
    ):
        """Test Canadian currency precision in preferences"""

        mutations = ReorderMutations()

        # Mock info context
        mock_info = MagicMock()
        mock_info.context = {"user": test_user, "session": test_session}

        # Test with CAD amount
        preferences_input = CreateReorderPreferencesInput(
            child_id=test_child.id,
            max_order_amount_cad=Decimal("149.99")  # CAD with proper precision
        )

        with patch('app.services.ReorderService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service

            mock_preferences = MagicMock()
            mock_preferences.max_order_amount_cad = Decimal("149.99")
            mock_service.create_reorder_preferences.return_value = mock_preferences

            # Execute mutation
            result = await mutations.create_reorder_preferences(mock_info, preferences_input)

            # Verify CAD precision is maintained
            assert result.preferences.max_order_amount_cad == Decimal("149.99")
            assert isinstance(result.preferences.max_order_amount_cad, Decimal)